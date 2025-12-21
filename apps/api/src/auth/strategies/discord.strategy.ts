import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-discord';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  private readonly logger = new Logger(DiscordStrategy.name);

  constructor(configService: ConfigService) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('DISCORD_CLIENT_ID')!,
      clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET')!,
      callbackURL:
        configService.get<string>('OAUTH_REDIRECT_URI_DISCORD') ||
        'http://localhost:3000/api/auth/discord/callback',
      scope: ['identify', 'email'],
    };

    super(options);
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    this.logger.debug(`Discord auth callback for ${profile?.id}`);
    const email = profile.email;
    const avatarUrl = profile.avatar && profile.id
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : undefined;
    const displayName = `${profile.username}${profile.discriminator ? '#' + profile.discriminator : ''}`;

    return {
      provider: 'DISCORD' as const,
      providerId: profile.id,
      email,
      displayName,
      avatarUrl,
    };
  }
}
