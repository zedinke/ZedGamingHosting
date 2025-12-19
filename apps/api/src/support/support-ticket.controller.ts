import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SupportTicketService } from './support-ticket.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { CreateSupportTicketDto, UpdateTicketDto, AddCommentDto } from './dto/support-ticket.dto';

/**
 * Support Tickets Controller
 * API endpoints for support ticket management
 */
@Controller('support/tickets')
@UseGuards(JwtAuthGuard)
export class SupportTicketController implements OnModuleInit {
  private readonly logger = new Logger(SupportTicketController.name);

  constructor(
    private readonly supportTicketService: SupportTicketService,
    private readonly webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * Inject WebSocket gateway into support service on module initialization
   */
  onModuleInit() {
    this.supportTicketService.setWebSocketGateway(this.webSocketGateway);
  }

  /**
   * Create a new support ticket
   * POST /support/tickets
   */
  @Post()
  @HttpCode(201)
  async createTicket(@Request() req: any, @Body() dto: CreateSupportTicketDto) {
    this.logger.log(`User ${req.user.id} creating support ticket`);
    return this.supportTicketService.createTicket(req.user.id, dto);
  }

  /**
   * Get user's support tickets
   * GET /support/tickets?page=1&limit=10
   */
  @Get()
  async getUserTickets(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.supportTicketService.getUserTickets(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * Get specific ticket
   * GET /support/tickets/:id
   */
  @Get(':id')
  async getTicket(@Request() req: any, @Param('id') ticketId: string) {
    return this.supportTicketService.getTicket(ticketId, req.user.id);
  }

  /**
   * Add comment to ticket
   * POST /support/tickets/:id/comments
   */
  @Post(':id/comments')
  async addComment(
    @Request() req: any,
    @Param('id') ticketId: string,
    @Body() dto: AddCommentDto,
  ) {
    this.logger.log(`User ${req.user.id} adding comment to ticket ${ticketId}`);
    return this.supportTicketService.addComment(ticketId, req.user.id, dto);
  }

  /**
   * Update ticket (admin only)
   * PATCH /support/tickets/:id
   */
  @Patch(':id')
  @UseGuards(AdminGuard)
  async updateTicket(@Param('id') ticketId: string, @Body() dto: UpdateTicketDto) {
    this.logger.log(`Admin updating ticket ${ticketId}`);
    return this.supportTicketService.updateTicket(ticketId, dto);
  }

  /**
   * Close ticket (admin only)
   * PATCH /support/tickets/:id/close
   */
  @Patch(':id/close')
  @UseGuards(AdminGuard)
  async closeTicket(@Param('id') ticketId: string) {
    this.logger.log(`Admin closing ticket ${ticketId}`);
    return this.supportTicketService.closeTicket(ticketId);
  }

  /**
   * Get all tickets (admin only)
   * GET /support/tickets/admin/all?page=1&limit=10&status=OPEN&priority=HIGH
   */
  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAdminTickets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
  ) {
    return this.supportTicketService.getAdminTickets(
      parseInt(page, 10),
      parseInt(limit, 10),
      {
        status,
        priority,
        category,
      },
    );
  }

  /**
   * Get ticket statistics (admin only)
   * GET /support/tickets/admin/stats
   */
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getTicketStats() {
    return this.supportTicketService.getTicketStats();
  }

  /**
   * Assign ticket to support staff
   * POST /support/tickets/admin/:id/assign
   */
  @Post('admin/:id/assign')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async assignTicket(
    @Request() req: any,
    @Param('id') ticketId: string,
    @Body() body: { assignedToId: string },
  ) {
    return this.supportTicketService.assignTicket(ticketId, body.assignedToId, req.user.id);
  }

  /**
   * Auto-assign ticket to least loaded support staff
   * POST /support/tickets/admin/:id/auto-assign
   */
  @Post('admin/:id/auto-assign')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async autoAssignTicket(@Param('id') ticketId: string) {
    return this.supportTicketService.autoAssignTicket(ticketId);
  }

  /**
   * Get support staff workload
   * GET /support/tickets/admin/workload
   */
  @Get('admin/workload')
  @UseGuards(AdminGuard)
  async getSupportStaffWorkload() {
    return this.supportTicketService.getSupportStaffWorkload();
  }

  /**
   * Get overdue SLA tickets
   * GET /support/tickets/admin/overdue
   */
  @Get('admin/overdue')
  @UseGuards(AdminGuard)
  async getOverdueSlaTickets() {
    return this.supportTicketService.getOverdueSlaTickets();
  }
}
