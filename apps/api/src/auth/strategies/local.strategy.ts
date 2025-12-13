import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { I18nService } from '../../i18n/i18n.service';

/**
 * Local Strategy - validates email/password credentials
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.translate('AUTH_INVALID_CREDENTIALS'),
      );
    }
    return user;
  }
}

