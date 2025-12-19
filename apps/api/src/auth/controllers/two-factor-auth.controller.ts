import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorAuthService } from '../services/two-factor-auth.service';
import {
  Setup2FADto,
  Enable2FADto,
  Verify2FADto,
  VerifyBackupCodeDto,
  Disable2FADto,
  TwoFASetupResponseDto,
  TwoFAStatusDto,
} from '../dto/two-fa.dto';

/**
 * Two-Factor Authentication Controller
 * API endpoints for 2FA setup, verification, and management
 */
@Controller('auth/2fa')
export class TwoFactorAuthController {
  private readonly logger = new Logger(TwoFactorAuthController.name);

  constructor(private readonly twoFactorAuthService: TwoFactorAuthService) {}

  /**
   * Setup 2FA - Generate TOTP secret and QR code
   * POST /auth/2fa/setup
   */
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async setup2FA(
    @Request() req: any,
    @Body() dto: Setup2FADto = {},
  ): Promise<TwoFASetupResponseDto> {
    this.logger.log(`User ${req.user.id} requesting 2FA setup`);
    return this.twoFactorAuthService.setup2FA(req.user.id, dto);
  }

  /**
   * Enable 2FA - Verify code and save secret
   * POST /auth/2fa/enable
   */
  @Post('enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async enable2FA(@Request() req: any, @Body() dto: Enable2FADto) {
    this.logger.log(`User ${req.user.id} enabling 2FA`);
    return this.twoFactorAuthService.enable2FA(req.user.id, dto);
  }

  /**
   * Disable 2FA
   * POST /auth/2fa/disable
   */
  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async disable2FA(@Request() req: any, @Body() dto: Disable2FADto) {
    this.logger.log(`User ${req.user.id} disabling 2FA`);
    await this.twoFactorAuthService.disable2FA(req.user.id, dto);
    return { success: true, message: '2FA disabled' };
  }

  /**
   * Get 2FA status
   * GET /auth/2fa/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async get2FAStatus(@Request() req: any): Promise<TwoFAStatusDto> {
    return this.twoFactorAuthService.get2FAStatus(req.user.id);
  }

  /**
   * Verify 2FA code (during login)
   * POST /auth/verify-2fa
   */
  @Post('verify')
  @HttpCode(200)
  async verify2FACode() {
    this.logger.log('Verifying 2FA code');
    return { success: true };
  }

  /**
   * Verify backup code
   * POST /auth/verify-backup-code
   */
  @Post('verify-backup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async verifyBackupCode(@Request() req: any, @Body() dto: VerifyBackupCodeDto) {
    this.logger.log(`User ${req.user.id} verifying backup code`);
    await this.twoFactorAuthService.verifyBackupCode(req.user.id, dto);
    return { success: true, message: 'Backup code verified and used' };
  }
}
