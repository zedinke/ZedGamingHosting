import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

/**
 * Auth Controller - handles authentication endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Login endpoint
   * POST /api/auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  async login(@Request() req: any) {
    // After LocalStrategy validation, req.user contains the validated user
    
    // Check if user has 2FA enabled
    if (req.user.twoFactorEnabled) {
      // Generate temporary session token for 2FA verification
      const tempPayload = {
        sub: req.user.id,
        email: req.user.email,
        type: 'temp_2fa',
      };
      
      const tempToken = this.jwtService.sign(tempPayload, {
        expiresIn: '5m', // Expires in 5 minutes
        secret: this.config.get('JWT_SECRET') + '_2FA_TEMP',
      } as any);

      return {
        requiresTwoFactor: true,
        tempToken, // Used to verify 2FA code
        user: {
          id: req.user.id,
          email: req.user.email,
        },
      };
    }

    // Normal login without 2FA
    const payload: any = {
      sub: req.user.id,
      email: req.user.email,
      role: req.user.role,
      tenantId: req.user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    } as any);

    return {
      accessToken,
      refreshToken,
      user: req.user,
    };
  }

  /**
   * Verify 2FA code endpoint
   * POST /api/auth/verify-2fa
   */
  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @Request() req: any,
    @Body() body: { tempToken: string; code: number; rememberDevice?: boolean },
  ) {
    const { tempToken, code, rememberDevice } = body;

    try {
      // Verify temp token
      const decoded = this.jwtService.verify(tempToken, {
        secret: this.config.get('JWT_SECRET') + '_2FA_TEMP',
      });

      if (decoded.type !== 'temp_2fa') {
        throw new BadRequestException('Invalid temporary token');
      }

      // Verify 2FA code
      const user = await this.authService.verify2FACode(decoded.sub, code);

      if (!user) {
        throw new BadRequestException('Invalid 2FA code');
      }

      // Generate full access tokens
      const payload: any = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        deviceId: rememberDevice ? `device_${Date.now()}` : undefined,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      } as any);

      return {
        accessToken,
        refreshToken,
        user,
        deviceRemembered: rememberDevice || false,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to verify 2FA code');
    }
  }

  /**
   * Verify backup code endpoint
   * POST /api/auth/verify-backup-code
   */
  @Public()
  @Post('verify-backup-code')
  @HttpCode(HttpStatus.OK)
  async verifyBackupCode(
    @Request() req: any,
    @Body() body: { tempToken: string; backupCode: string },
  ) {
    const { tempToken, backupCode } = body;

    try {
      // Verify temp token
      const decoded = this.jwtService.verify(tempToken, {
        secret: this.config.get('JWT_SECRET') + '_2FA_TEMP',
      });

      if (decoded.type !== 'temp_2fa') {
        throw new BadRequestException('Invalid temporary token');
      }

      // Verify backup code
      const user = await this.authService.verifyBackupCode(decoded.sub, backupCode);

      if (!user) {
        throw new BadRequestException('Invalid backup code');
      }

      // Generate full access tokens
      const payload: any = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      } as any);

      return {
        accessToken,
        refreshToken,
        user,
        message: 'Backup code used. Please generate new backup codes.',
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to verify backup code');
    }
  }

  /**
   * Refresh token endpoint
   * POST /api/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }

  /**
   * Create test user (development only)
   * POST /api/auth/create-test-user
   */
  @Public()
  @Post('create-test-user')
  @HttpCode(HttpStatus.CREATED)
  async createTestUser(@Body() body: { email?: string; password?: string }) {
    return this.authService.createTestUser(
      body.email || 'admin@zedgaminghosting.hu',
      body.password || 'Admin123!',
    );
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
}
