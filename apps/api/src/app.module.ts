import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from '@zed-hosting/utils';
import { DatabaseModule } from './database/database.module';
import { LicensingModule } from './licensing/licensing.module';
import { I18nModule } from './i18n/i18n.module';
import { AuditModule } from './audit/audit.module';
import { NetworkingModule } from './networking/networking.module';
import { NodesModule } from './nodes/nodes.module';
import { ProvisioningModule } from './provisioning/provisioning.module';
import { AuthModule } from './auth/auth.module';
import { RateLimitingModule } from './rate-limiting/rate-limiting.module';
import { SubdomainsModule } from './subdomains/subdomains.module';
import { ServersModule } from './servers/servers.module';
import { TasksModule } from './tasks/tasks.module';
import { FilesModule } from './files/files.module';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

/**
 * Root application module
 * All modules must be imported here
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),

    // Scheduling (for cron jobs)
    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,
    I18nModule,
    AuditModule,
    LicensingModule, // KRITIKUS - Must be loaded first!
    AuthModule,
    RateLimitingModule,
    SubdomainsModule,
    ServersModule,
    TasksModule,
    FilesModule,
    NetworkingModule,
    NodesModule,
    ProvisioningModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
