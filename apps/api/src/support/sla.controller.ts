import {
  Controller,
  Get,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SlaService } from './sla.service';

/**
 * SLA Monitoring Controller
 * API endpoints for SLA metrics and tracking
 */
@Controller('support')
@UseGuards(JwtAuthGuard)
export class SlaController {
  private readonly logger = new Logger(SlaController.name);

  constructor(private readonly slaService: SlaService) {}

  /**
   * Get SLA compliance metrics
   * GET /support/sla/metrics
   */
  @Get('sla/metrics')
  async getSlaMetrics() {
    this.logger.log('Fetching SLA metrics');
    return this.slaService.getSlaMetrics();
  }

  /**
   * Get SLA breaches for display on dashboard
   * GET /support/sla/breaches
   */
  @Get('sla/breaches')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'SUPPORT')
  async getBreaches(@Query('limit') limit: string = '10') {
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    return this.slaService.getRecentBreaches(limitNum);
  }

  /**
   * Get SLA warnings (approaching deadlines)
   * GET /support/sla/warnings
   */
  @Get('sla/warnings')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'SUPPORT')
  async getWarnings(@Query('limit') limit: string = '10') {
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    return this.slaService.getApproachingDeadlines(limitNum);
  }
}
