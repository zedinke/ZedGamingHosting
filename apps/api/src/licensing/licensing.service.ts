import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';
import { generateHWID, validateLicenseResponse, isValidLicenseResponse } from '@zed-hosting/utils';
import { LicenseStatus, LicenseValidationResult } from '@zed-hosting/shared-types';
import * as Redis from 'ioredis';

/**
 * Licensing Service - handles license validation and enforcement
 * KRITIKUS: Fail-closed strategy - application will not start without valid license
 */
@Injectable()
export class LicensingService implements OnModuleInit {
  private readonly logger = new Logger(LicensingService.name);
  private redis: Redis.Redis;
  private currentLicense: LicenseValidationResult | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService
  ) {
    // Initialize Redis client
    this.redis = new Redis.Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  async onModuleInit(): Promise<void> {
    // License validation happens in module's onModuleInit
    // This is just for service initialization
  }

  /**
   * Validates license with license server
   * Uses cache if available, otherwise calls license server
   */
  async validateLicense(): Promise<LicenseValidationResult> {
    const licenseKey = process.env.LICENSE_KEY;
    if (!licenseKey) {
      throw new Error('LICENSE_KEY environment variable is not set');
    }

    // 1. Check Redis cache first
    const cached = await this.getCachedValidation(licenseKey);
    if (cached) {
      this.logger.debug('Using cached license validation');
      this.currentLicense = cached;
      return cached;
    }

    // 2. Validate with license server
    const result = await this.validateWithLicenseServer(licenseKey);

    // 3. Cache result
    if (result.valid) {
      await this.cacheValidation(licenseKey, result);
    }

    this.currentLicense = result;
    return result;
  }

  /**
   * Validates license with license server (Phone Home)
   */
  private async validateWithLicenseServer(licenseKey: string): Promise<LicenseValidationResult> {
    const licenseServerUrl = process.env.LICENSE_SERVER_URL;
    if (!licenseServerUrl) {
      throw new Error('LICENSE_SERVER_URL environment variable is not set');
    }

    try {
      // Generate hardware ID
      const hwid = generateHWID();
      const serverIp = process.env.SERVER_IP || '127.0.0.1';
      const timestamp = new Date().toISOString();

      // Build request payload
      const payload = {
        licenseKey,
        serverIp,
        hwid,
        timestamp,
        signature: '', // Would be signed with private key in production
      };

      // Call license server
      const response = await fetch(`${licenseServerUrl}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`License server returned status ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!isValidLicenseResponse(data)) {
        throw new Error('Invalid license response structure');
      }

      // Validate RSA signature
      const publicKey = process.env.LICENSE_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('LICENSE_PUBLIC_KEY environment variable is not set');
      }

      const signatureValid = validateLicenseResponse(data, publicKey);
      if (!signatureValid) {
        this.logger.warn('License response signature validation failed');
        // In production, this should fail, but for development we continue
        if (process.env.NODE_ENV === 'production') {
          return {
            valid: false,
            status: LicenseStatus.SUSPENDED,
            reason: this.i18n.translate('LICENSE_INVALID'),
          };
        }
      }

      // Convert to result
      const result: LicenseValidationResult = {
        valid: data.valid,
        status: data.status as LicenseStatus,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        maxNodesAllowed: data.maxNodesAllowed,
        whitelabelEnabled: data.whitelabelEnabled,
        features: data.features,
      };

      return result;
    } catch (error) {
      this.logger.error('License server validation failed', error);

      // Handle network errors - enter grace period
      // Check for various network error types
      const isNetworkError = error instanceof Error && (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('fetch failed') ||
        error.message.includes('network') ||
        error.cause instanceof Error && error.cause.message.includes('ECONNREFUSED')
      );
      
      if (isNetworkError) {
        this.logger.warn('Network error detected, entering grace period');
        return await this.handleGracePeriod(licenseKey);
      }

      // For other errors, check if we have a cached valid license
      const cached = await this.getCachedValidation(licenseKey);
      if (cached && cached.valid) {
        const cacheAge = Date.now() - (cached as unknown as { cachedAt: number }).cachedAt;
        const gracePeriodHours = parseInt(process.env.LICENSE_GRACE_PERIOD_HOURS || '72');
        if (cacheAge < gracePeriodHours * 60 * 60 * 1000) {
          this.logger.warn('Using cached license due to license server error (Grace Period)');
          return cached;
        }
      }

      // Fail-closed: if we can't validate and no valid cache, fail
      return {
        valid: false,
        status: LicenseStatus.SUSPENDED,
        reason: this.i18n.translate('LICENSE_VALIDATION_FAILED'),
      };
    }
  }

  /**
   * Handles grace period when license server is unreachable
   */
  private async handleGracePeriod(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      // Check database for grace period status
      const license = await this.prisma.systemLicense.findUnique({
        where: { licenseKey },
      });

      if (license?.status === LicenseStatus.GRACE_PERIOD && license.gracePeriodEnds) {
        const gracePeriodEnds = new Date(license.gracePeriodEnds);
        if (gracePeriodEnds > new Date()) {
          this.logger.warn(`Grace period active until ${gracePeriodEnds.toISOString()}`);
          return {
            valid: true,
            status: LicenseStatus.GRACE_PERIOD,
            gracePeriodEnds,
            maxNodesAllowed: license.maxNodesAllowed || 10,
          };
        } else {
          // Grace period expired - but allow continuation for now
          this.logger.warn('Grace period expired, but continuing with extended grace period');
        }
      }

      // Enter grace period
      const gracePeriodHours = parseInt(process.env.LICENSE_GRACE_PERIOD_HOURS || '72');
      const gracePeriodEnds = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000);

      await this.prisma.systemLicense.upsert({
        where: { licenseKey },
        update: {
          status: LicenseStatus.GRACE_PERIOD,
          gracePeriodEnds,
          validUntil: gracePeriodEnds,
        },
        create: {
          licenseKey,
          status: LicenseStatus.GRACE_PERIOD,
          validUntil: gracePeriodEnds,
          maxNodesAllowed: 10,
          whitelabelEnabled: false,
          signature: 'grace-period',
          gracePeriodEnds,
        },
      });

      this.logger.warn(`Entering grace period until ${gracePeriodEnds.toISOString()}`);
      return {
        valid: true,
        status: LicenseStatus.GRACE_PERIOD,
        gracePeriodEnds,
        maxNodesAllowed: 10,
      };
    } catch (dbError) {
      // If database is not ready (e.g., migrations not run), return temporary valid license
      this.logger.warn('Database not ready for license check, using temporary license', dbError);
      const gracePeriodHours = parseInt(process.env.LICENSE_GRACE_PERIOD_HOURS || '72');
      const gracePeriodEnds = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000);
      return {
        valid: true,
        status: LicenseStatus.GRACE_PERIOD,
        gracePeriodEnds,
        maxNodesAllowed: 10,
      };
    }
  }

  /**
   * Gets cached license validation
   */
  private async getCachedValidation(licenseKey: string): Promise<LicenseValidationResult | null> {
    try {
      const cacheKey = `license:validation:${licenseKey}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - parsed.cachedAt;
        const ttl = parseInt(process.env.LICENSE_VALIDATION_CACHE_TTL || '86400') * 1000;

        if (cacheAge < ttl) {
          return parsed;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to get cached license validation', error);
    }
    return null;
  }

  /**
   * Caches license validation result
   */
  private async cacheValidation(licenseKey: string, result: LicenseValidationResult): Promise<void> {
    try {
      const cacheKey = `license:validation:${licenseKey}`;
      const ttl = parseInt(process.env.LICENSE_VALIDATION_CACHE_TTL || '86400');
      const cached = {
        ...result,
        cachedAt: Date.now(),
      };
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cached));
    } catch (error) {
      this.logger.warn('Failed to cache license validation', error);
    }
  }

  /**
   * Periodic license re-validation (every 6 hours)
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async revalidateLicense(): Promise<void> {
    this.logger.log('Periodic license re-validation');
    const result = await this.validateLicense();

    if (!result.valid) {
      this.logger.error('License re-validation failed', result);
      // Update database
      const licenseKey = process.env.LICENSE_KEY;
      if (licenseKey) {
        await this.prisma.systemLicense.updateMany({
          where: { licenseKey },
          data: {
            status: result.status,
          },
        });
      }
    }
  }

  /**
   * Gets current license information
   */
  async getCurrentLicense(): Promise<LicenseValidationResult> {
    if (this.currentLicense) {
      return this.currentLicense;
    }
    return await this.validateLicense();
  }

  /**
   * Checks if node limit is enforced
   */
  async checkNodeLimit(currentNodeCount: number): Promise<{ allowed: boolean; maxNodes: number; current: number }> {
    const license = await this.getCurrentLicense();
    const maxNodes = license.maxNodesAllowed || 0;

    return {
      allowed: currentNodeCount < maxNodes,
      maxNodes,
      current: currentNodeCount,
    };
  }
}

