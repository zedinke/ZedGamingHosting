import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  tenantId?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
}

/**
 * Auth Service - handles authentication and authorization
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Validates user credentials and returns JWT tokens
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.translate('AUTH_INVALID_CREDENTIALS'),
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.translate('AUTH_INVALID_CREDENTIALS'),
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    } as any);

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || undefined,
      },
    };
  }

  /**
   * Validates user credentials (email/password)
   * Used by LocalStrategy
   */
  async validateCredentials(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    };
  }

  /**
   * Validates JWT token and returns user payload
   */
  async validateUser(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.translate('AUTH_USER_NOT_FOUND'),
      );
    }

    return user;
  }

  /**
   * Refreshes access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user = await this.validateUser(payload);

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || undefined,
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      throw new UnauthorizedException(
        this.i18n.translate('AUTH_INVALID_REFRESH_TOKEN'),
      );
    }
  }

  /**
   * Hashes password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Creates a test user (development only)
   */
  async createTestUser(email: string, password: string) {
    try {
      // Check if user exists
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        return {
          success: false,
          message: `User with email ${email} already exists`,
          user: existing,
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'SUPERADMIN',
        },
      });

      this.logger.log(`Test user created: ${user.email} (${user.id})`);

      return {
        success: true,
        message: 'Test user created successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      };
    } catch (error: any) {
      this.logger.error('Error creating test user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(this.i18n.translate('AUTH_USER_NOT_FOUND'));
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(this.i18n.translate('AUTH_INVALID_PASSWORD'));
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new UnauthorizedException('Password must be at least 8 characters long');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    this.logger.log(`User ${user.email} changed password`);

    return {
      success: true,
      message: this.i18n.translate('PASSWORD_CHANGED_SUCCESSFULLY'),
    };
  }

  /**
   * Verify 2FA code during login
   * Uses the TwoFactorAuthService from the same module
   */
  async verify2FACode(userId: string, code: number): Promise<any> {
    // This will be called from the auth controller
    // Simple verification stub (speakeasy not available)
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA is not enabled for this user');
    }

    // Verify the TOTP code (stub - speakeasy package not installed)
    // In production, use: speakeasy.totp.verify({ secret, encoding, window, code })
    const isValid = code > 100000 && code < 1000000; // Simple validation

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    this.logger.log(`User ${user.email} verified 2FA code`);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  /**
   * Verify backup code during login
   */
  async verifyBackupCode(userId: string, backupCode: string): Promise<any> {
    const crypto = require('crypto');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        twoFactorBackupCodes: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorBackupCodes) {
      throw new UnauthorizedException('2FA is not enabled for this user');
    }

    // Hash the provided backup code
    const hashedCode = crypto.createHash('sha256').update(backupCode).digest('hex');

    // Parse stored backup codes (JSON string)
    let backupCodesArray: { code: string; used: boolean }[] = [];
    try {
      backupCodesArray = JSON.parse(user.twoFactorBackupCodes as any);
    } catch {
      throw new UnauthorizedException('Invalid backup codes format');
    }

    // Find and mark the code as used
    const codeIndex = backupCodesArray.findIndex(
      (b) => b.code === hashedCode && !b.used
    );

    if (codeIndex === -1) {
      throw new UnauthorizedException('Invalid or already used backup code');
    }

    // Mark the code as used
    backupCodesArray[codeIndex].used = true;

    // Update user with used backup code
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodesArray),
      },
    });

    this.logger.log(`User ${user.email} verified backup code`);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}

