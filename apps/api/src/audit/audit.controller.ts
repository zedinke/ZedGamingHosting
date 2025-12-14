import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Audit Controller - handles audit log endpoints
 */
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN', 'SUPER_ADMIN', 'RESELLER_ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs
   * GET /api/admin/audit-logs
   */
  @Get()
  async getAuditLogs(
    @Query('resourceId') resourceId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req: any,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return await this.auditService.getLogs({
      resourceId,
      userId,
      action,
      limit: limitNum,
      offset: offsetNum,
    });
  }
}

