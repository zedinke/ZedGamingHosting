import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Request } from '@nestjs/common';
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
}
