import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Rate Limiting Module - DDoS protection
 * Limits:
 * - Public API: 100 req/min
 * - Authenticated: 500 req/min (configured per endpoint)
 * - Admin: 1000 req/min (configured per endpoint)
 */
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (_config: ConfigService) => [
        {
          name: 'default',
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute (public)
        },
        {
          name: 'authenticated',
          ttl: 60000,
          limit: 500, // 500 requests per minute (authenticated)
        },
        {
          name: 'admin',
          ttl: 60000,
          limit: 1000, // 1000 requests per minute (admin)
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class RateLimitingModule {}

