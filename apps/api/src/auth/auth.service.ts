import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';
import { TwoFactorAuthService } from './services/two-factor-auth.service';
import { SessionsService } from './sessions.service';

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
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly sessionsService: SessionsService,
  ) {}

  /**
   * Validates user credentials and returns JWT tokens
   */
  async login(
    email: string,
    password: string,
    ip: string,
    userAgent: string,
  ): Promise<AuthResult> {
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

    // Create session record
    await this.sessionsService.createSession(
      user.id,
      accessToken,
      ip,
      userAgent,
    );

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
    // Delegate to TwoFactorAuthService for verification
    await this.twoFactorAuthService.verify2FACode(userId, { code });
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Verify backup code during login
   */
  async verifyBackupCode(userId: string, backupCode: string): Promise<any> {
    // Delegate to TwoFactorAuthService for verification
    await this.twoFactorAuthService.verifyBackupCode(userId, { code: backupCode });
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Request password reset - generates reset token and sends email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token (random 32 byte hex string)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpires,
      },
    });

    // TODO: Send password reset email
    // For now, log the reset token (only for development)
    this.logger.log(`Password reset token for ${email}: ${resetToken}`);
    this.logger.log(`Reset URL: ${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`);

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Find user with valid reset token
    const users = await this.prisma.user.findMany({
      where: {
        resetTokenExpires: {
          gte: new Date(), // Token not expired
        },
      },
    });

    // Verify token against all users with unexpired tokens
    let matchedUser = null;
    for (const user of users) {
      if (user.resetToken) {
        const isTokenValid = await bcrypt.compare(token, user.resetToken);
        if (isTokenValid) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    this.logger.log(`User ${matchedUser.email} reset their password`);

    return {
      success: true,
      message: this.i18n.translate('PASSWORD_RESET_SUCCESSFULLY'),
    };
  }
}

