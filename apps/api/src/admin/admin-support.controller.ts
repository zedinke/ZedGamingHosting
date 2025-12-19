import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Request,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SupportTicketService } from '../support/support-ticket.service';
import { UpdateTicketDto } from '../support/dto/support-ticket.dto';

/**
 * Admin Support Management Controller
 * API endpoints for support ticket administration
 */
@Controller('admin/support')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSupportController {
  private readonly logger = new Logger(AdminSupportController.name);

  constructor(private readonly supportTicketService: SupportTicketService) {}

  /**
   * Get all tickets
   * GET /admin/support/tickets?page=1&limit=10&status=OPEN&priority=HIGH
   */
  @Get('tickets')
  async getAllTickets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
  ) {
    this.logger.log('Admin fetching all support tickets');
    return this.supportTicketService.getAdminTickets(
      parseInt(page, 10),
      parseInt(limit, 10),
      { status, priority, category },
    );
  }

  /**
   * Get ticket statistics
   * GET /admin/support/stats
   */
  @Get('stats')
  async getStats() {
    this.logger.log('Admin fetching support ticket statistics');
    return this.supportTicketService.getTicketStats();
  }

  /**
   * Get specific ticket
   * GET /admin/support/tickets/:id
   */
  @Get('tickets/:id')
  async getTicket(@Param('id') ticketId: string) {
    return this.supportTicketService.getTicket(ticketId);
  }

  /**
   * Update ticket (status, priority, response)
   * PATCH /admin/support/tickets/:id
   */
  @Patch('tickets/:id')
  async updateTicket(@Param('id') ticketId: string, @Body() dto: UpdateTicketDto) {
    this.logger.log(`Admin updating support ticket ${ticketId}`);
    return this.supportTicketService.updateTicket(ticketId, dto);
  }

  /**
   * Close ticket
   * PATCH /admin/support/tickets/:id/close
   */
  @Patch('tickets/:id/close')
  async closeTicket(@Param('id') ticketId: string) {
    this.logger.log(`Admin closing support ticket ${ticketId}`);
    return this.supportTicketService.closeTicket(ticketId);
  }

  /**
   * Assign ticket to support staff
   * POST /admin/support/:id/assign
   */
  @Post(':id/assign')
  @HttpCode(200)
  async assignTicket(
    @Request() req: any,
    @Param('id') ticketId: string,
    @Body() body: { assignedToId: string },
  ) {
    this.logger.log(`Admin assigning ticket ${ticketId} to user ${body.assignedToId}`);
    return this.supportTicketService.assignTicket(ticketId, body.assignedToId, req.user.id);
  }

  /**
   * Auto-assign ticket to least loaded support staff
   * POST /admin/support/:id/auto-assign
   */
  @Post(':id/auto-assign')
  @HttpCode(200)
  async autoAssignTicket(@Param('id') ticketId: string) {
    this.logger.log(`Admin auto-assigning ticket ${ticketId}`);
    return this.supportTicketService.autoAssignTicket(ticketId);
  }

  /**
   * Get support staff workload
   * GET /admin/support/workload
   */
  @Get('workload')
  async getSupportStaffWorkload() {
    this.logger.log('Admin fetching support staff workload');
    return this.supportTicketService.getSupportStaffWorkload();
  }

  /**
   * Get overdue SLA tickets
   * GET /admin/support/overdue
   */
  @Get('overdue')
  async getOverdueSlaTickets() {
    this.logger.log('Admin fetching overdue SLA tickets');
    return this.supportTicketService.getOverdueSlaTickets();
  }
}
