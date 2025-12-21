import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Request, BadRequestException, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import * as crypto from 'crypto';
import { Response } from 'express';

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

    const accessToken = this.jwtService.sign(payload, {
      jwtid: crypto.randomUUID(),
    } as any);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    } as any);

    // Extract IP and User-Agent for session tracking
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Create session record
    await this.authService['sessionsService'].createSession(
      req.user.id,
      accessToken,
      ip,
      userAgent,
    );

    return {
      accessToken,
      refreshToken,
      user: req.user,
    };
  }

  /**
   * Google OAuth entry
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport handles redirect
    return;
  }

  /**
   * Google OAuth callback
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req: any, @Res() res: Response) {
    const { successUrl, errorUrl } = this.getOauthRedirects(req);

    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const result = await this.authService.socialLogin(req.user, ip, userAgent);
      return this.handleSocialRedirect(res, successUrl, 'google', result);
    } catch (error: any) {
      const message = encodeURIComponent(error?.message || 'social_login_failed');
      return res.redirect(`${errorUrl}?provider=google&error=${message}`);
    }
  }

  /**
   * Discord OAuth entry
   */
  @Public()
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  async discordAuth() {
    return;
  }

  /**
   * Discord OAuth callback
   */
  @Public()
  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Request() req: any, @Res() res: Response) {
    const { successUrl, errorUrl } = this.getOauthRedirects(req);

    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const result = await this.authService.socialLogin(req.user, ip, userAgent);
      return this.handleSocialRedirect(res, successUrl, 'discord', result);
    } catch (error: any) {
      const message = encodeURIComponent(error?.message || 'social_login_failed');
      return res.redirect(`${errorUrl}?provider=discord&error=${message}`);
    }
  }

  /**
   * Build success/error redirect URLs (allow ?redirect override on the initial request)
   */
  private getOauthRedirects(req: any) {
    const frontendBase = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectParam = req.query?.redirect as string | undefined;
    const successUrl = redirectParam || this.config.get<string>('FRONTEND_OAUTH_SUCCESS_URL') || `${frontendBase}/hu/auth/callback`;
    const errorUrl = this.config.get<string>('FRONTEND_OAUTH_ERROR_URL') || `${frontendBase}/hu/login`;
    return { successUrl, errorUrl };
  }

  /**
   * Redirect user back to FE with tokens in hash fragment or temp 2FA token in query
   */
  private handleSocialRedirect(res: Response, successUrl: string, provider: 'google' | 'discord', result: any) {
    const target = new URL(successUrl);
    target.searchParams.set('provider', provider);

    if (result?.requiresTwoFactor && result?.tempToken) {
      target.searchParams.set('twoFactor', '1');
      target.searchParams.set('tempToken', result.tempToken);
      if (result.user?.email) {
        target.searchParams.set('email', result.user.email);
      }
      return res.redirect(target.toString());
    }

    const fragment = new URLSearchParams();
    if (result?.accessToken) fragment.set('accessToken', result.accessToken);
    if (result?.refreshToken) fragment.set('refreshToken', result.refreshToken);
    if (result?.user?.id) fragment.set('userId', result.user.id);
    if (result?.user?.email) fragment.set('email', result.user.email);
    if (result?.user?.role) fragment.set('role', result.user.role);
    if (result?.user?.tenantId) fragment.set('tenantId', result.user.tenantId);
    fragment.set('provider', provider);

    const redirectUrl = `${target.toString()}#${fragment.toString()}`;
    return res.redirect(redirectUrl);
  }

  /**
   * Verify 2FA code endpoint
   * POST /api/auth/verify-2fa
   */
  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @Body() body: { tempToken: string; code: number; rememberDevice?: boolean },
    @Request() req: any,
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

      const accessToken = this.jwtService.sign(payload, {
        jwtid: crypto.randomUUID(),
      } as any);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      } as any);

      // Extract IP and User-Agent for session tracking
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Create session record
      await this.authService['sessionsService'].createSession(
        user.id,
        accessToken,
        ip,
        userAgent,
      );

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
    @Body() body: { tempToken: string; backupCode: string },
    @Request() req: any,
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

      const accessToken = this.jwtService.sign(payload, {
        jwtid: crypto.randomUUID(),
      } as any);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      } as any);

      // Extract IP and User-Agent for session tracking
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Create session record
      await this.authService['sessionsService'].createSession(
        user.id,
        accessToken,
        ip,
        userAgent,
      );

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
   * Register a new user
   * POST /api/auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      displayName?: string;
      billing?: {
        type?: 'INDIVIDUAL' | 'COMPANY';
        fullName?: string;
        companyName?: string;
        taxNumber?: string;
        country: string;
        city: string;
        postalCode: string;
        street: string;
        phone?: string;
      };
    },
  ) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }

    // Basic password validation
    if (body.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    return this.authService.register(body.email, body.password, body.displayName, body.billing);
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

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  /**
   * Verify email with token
   * POST /api/auth/verify-email
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    if (!body.token) {
      throw new BadRequestException('Verification token is required');
    }
    return this.authService.verifyEmail(body.token);
  }
}
