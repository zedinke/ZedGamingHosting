import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { DatabaseModule } from '../database/database.module';
import { I18nModule } from '../i18n/i18n.module';
import { TwoFactorAuthService } from './services/two-factor-auth.service';
import { TwoFactorAuthController } from './controllers/two-factor-auth.controller';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

/**
 * Auth Module - Authentication & Authorization
 * Handles login, JWT tokens, password hashing, 2FA
 */
@Module({
  imports: [
    DatabaseModule,
    I18nModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '15m',
        } as any,
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, TwoFactorAuthService, SessionsService],
  controllers: [AuthController, TwoFactorAuthController, SessionsController],
  exports: [AuthService, TwoFactorAuthService, SessionsService, JwtModule],
})
export class AuthModule {}


