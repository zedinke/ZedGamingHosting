import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
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
}
