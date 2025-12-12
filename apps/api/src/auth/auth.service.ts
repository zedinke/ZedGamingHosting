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
}

