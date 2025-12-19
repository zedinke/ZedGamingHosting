import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminSupportController } from './admin-support.controller';
import { AdminService } from './admin.service';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { SupportModule } from '../support/support.module';

/**
 * Admin Module - handles admin-only endpoints
 */
@Module({
  imports: [AuthModule, DatabaseModule, AuditModule, EmailModule, SupportModule],
  controllers: [AdminController, AdminStatsController, AdminUsersController, AdminSupportController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

