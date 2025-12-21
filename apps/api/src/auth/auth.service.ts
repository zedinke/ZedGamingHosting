import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@zed-hosting/db';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
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
    private readonly emailService: EmailService,
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

    // Require email verification prior to login
    if (!user.emailVerified && user.emailVerificationToken) {
      throw new UnauthorizedException(
        this.i18n.translate('AUTH_EMAIL_NOT_VERIFIED') || 'Email not verified',
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

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    displayName?: string,
    billing?: {
      type?: 'INDIVIDUAL' | 'COMPANY';
      fullName?: string;
      companyName?: string;
      taxNumber?: string;
      country?: string;
      city?: string;
      postalCode?: string;
      street?: string;
      phone?: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException(
        this.i18n.translate('AUTH_USER_ALREADY_EXISTS') || 'User already exists',
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    // Create new user with USER role
    const newUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER',
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    if (displayName) {
      // Future: store displayName in user profile once profile model is added
      this.logger.log(`User registered with display name: ${displayName}`);
    }

    this.logger.log(`New user registered: ${newUser.email}`);

    // Persist billing profile if provided
    if (billing && billing.country && billing.city && billing.postalCode && billing.street) {
      await this.prisma.billingProfile.create({
        data: {
          userId: newUser.id,
          type: (billing.type as any) || 'INDIVIDUAL',
          fullName: billing.fullName || undefined,
          companyName: billing.companyName || undefined,
          taxNumber: billing.taxNumber || undefined,
          country: billing.country,
          city: billing.city,
          postalCode: billing.postalCode,
          street: billing.street,
          phone: billing.phone || undefined,
        },
      });
    }

    // Send email verification message
    try {
      const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'https://zedgaminghosting.hu';
      const verifyUrl = `${frontendUrl}/hu/verify-email?token=${verificationToken}`;
      await this.emailService.sendEmail({
        to: newUser.email,
        subject: 'Email megerősítés',
        html: `
          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
            <h2 style=\"color: #3b82f6;\">Email megerősítés</h2>
            <p>Kedves felhasználó!</p>
            <p>A regisztráció befejezéséhez kérjük, erősítsd meg az email címed az alábbi gombbal:</p>
            <p style=\"margin: 20px 0;\">
              <a href=\"${verifyUrl}\" style=\"background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;\">Email megerősítése</a>
            </p>
            <p>Ez a link 24 óráig érvényes.</p>
            <p>Üdvözlettel,<br>ZedGamingHosting Csapat</p>
          </div>
        `,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to send verification email: ${err?.message || err}`);
    }

    return {
      success: true,
      message: this.i18n.translate('AUTH_VERIFY_EMAIL_SENT') || 'Please verify your email to activate your account.',
    };
  }}

  /** Verify email token and activate account */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    this.logger.log(`Email verified for user ${user.email}`);

    return {
      success: true,
      message: this.i18n.translate('AUTH_EMAIL_VERIFIED') || 'Email verified successfully.',
    };
  }