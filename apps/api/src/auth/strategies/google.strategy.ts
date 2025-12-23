import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL:
        configService.get<string>('OAUTH_REDIRECT_URI_GOOGLE') ||
        'http://localhost:3000/api/auth/google/callback',
      scope: ['profile', 'email'],
      // state: true removed - breaks custom redirect param
      passReqToCallback: false,
    };

    super(options);
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    this.logger.debug(`Google auth callback for ${profile?.id}`);
    const email = profile.emails?.[0]?.value;
    const avatarUrl = profile.photos?.[0]?.value;

    return {
      provider: 'GOOGLE' as const,
      providerId: profile.id,
      email,
      displayName: profile.displayName,
      avatarUrl,
    };
  }
}
