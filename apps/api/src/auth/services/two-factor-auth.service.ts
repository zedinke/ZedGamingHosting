import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@zed-hosting/db';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import {
  Setup2FADto,
  Enable2FADto,
  Verify2FADto,
  VerifyBackupCodeDto,
  Disable2FADto,
  TwoFASetupResponseDto,
  TwoFAStatusDto,
} from './dto/two-fa.dto';

/**
 * Two-Factor Authentication Service
 * Handles TOTP setup, verification, and backup codes
 */
@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Setup 2FA - Generate TOTP secret and QR code
   */
  async setup2FA(userId: string, dto: Setup2FADto): Promise<TwoFASetupResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if 2FA is already enabled
    if (user.twoFactorSecret) {
      throw new BadRequestException('2FA already enabled for this account');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Zed Gaming Hosting (${user.email})`,
      issuer: 'Zed Gaming Hosting',
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCode,
      manualEntryKey: secret.base32,
      backupCodes,
    };
  }

  /**
   * Enable 2FA - Save secret and backup codes after verification
   */
  async enable2FA(userId: string, dto: Enable2FADto): Promise<TwoFAStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify the code with the provided secret
    const isValid = speakeasy.totp.verify({
      secret: dto.secret,
      encoding: 'base32',
      window: 2, // Allow 2 time windows (±30 seconds)
      digits: 6,
      code: dto.code.toString().padStart(6, '0'),
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Save the secret and backup codes
    const backupCodes = this.generateBackupCodes();
    const backupCodesHash = backupCodes.map(code =>
      this.hashBackupCode(code),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: dto.secret,
        // Store backup codes as JSON (in production, encrypt these)
        twoFactorBackupCodes: JSON.stringify(backupCodesHash),
        twoFactorEnabled: true,
        twoFactorMethod: 'TOTP',
      },
    });

    this.logger.log(`2FA enabled for user ${userId}`);

    return {
      enabled: true,
      method: 'totp',
      backupCodesCount: backupCodes.length,
      createdAt: new Date(),
    };
  }

  /**
   * Verify 2FA code during login
   */
  async verify2FACode(userId: string, dto: Verify2FADto): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not enabled for this user');
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      window: 2,
      digits: 6,
      code: dto.code.toString().padStart(6, '0'),
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    return true;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, dto: VerifyBackupCodeDto): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorBackupCodes) {
      throw new UnauthorizedException('No backup codes found');
    }

    const backupCodesHash: string[] = JSON.parse(user.twoFactorBackupCodes || '[]');
    const codeHash = this.hashBackupCode(dto.code);

    // Find and remove the used backup code
    const index = backupCodesHash.indexOf(codeHash);
    if (index === -1) {
      throw new BadRequestException('Invalid backup code');
    }

    // Remove the used backup code
    backupCodesHash.splice(index, 1);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodesHash),
      },
    });

    this.logger.log(`Backup code used for user ${userId}. Remaining: ${backupCodesHash.length}`);

    return true;
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, dto: Disable2FADto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    // Verify current code before disabling
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      window: 2,
      digits: 6,
      code: dto.code.toString().padStart(6, '0'),
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code. Cannot disable 2FA.');
    }

    // Clear 2FA data
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        twoFactorEnabled: false,
        twoFactorMethod: null,
      },
    });

    this.logger.log(`2FA disabled for user ${userId}`);
  }

  /**
   * Get 2FA status for user
   */
  async get2FAStatus(userId: string): Promise<TwoFAStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const backupCodes: string[] = user.twoFactorBackupCodes
      ? JSON.parse(user.twoFactorBackupCodes)
      : [];

    return {
      enabled: !!user.twoFactorSecret,
      method: user.twoFactorSecret ? 'totp' : null,
      backupCodesCount: backupCodes.length,
    };
  }

  /**
   * Check if user has 2FA enabled
   */
  async has2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    return !!user?.twoFactorSecret;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const randomBytes = crypto.randomBytes(this.BACKUP_CODE_LENGTH / 2);
      const code = randomBytes.toString('hex').toUpperCase();
      // Format as XXXX-XXXX-XXXX
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
      codes.push(formattedCode);
    }

    return codes;
  }

  /**
   * Hash backup code for storage
   */
  private hashBackupCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
  }
}
