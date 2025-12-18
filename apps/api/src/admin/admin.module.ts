import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

/**
 * Admin Module - handles admin-only endpoints
 */
@Module({
  imports: [AuthModule, DatabaseModule, AuditModule, EmailModule],
  controllers: [AdminController, AdminStatsController, AdminUsersController, AdminSettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

