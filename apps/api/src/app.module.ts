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
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

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
    NetworkingModule,
    NetworkingModule,
    NodesModule,
    ProvisioningModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
