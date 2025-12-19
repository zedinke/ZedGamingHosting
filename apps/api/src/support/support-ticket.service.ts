import { Injectable, Logger, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { EmailService } from '../email/email.service';
import { CreateSupportTicketDto, UpdateTicketDto, AddCommentDto, TicketPriority, TicketStatus } from './dto/support-ticket.dto';

/**
 * Support Ticketing Service
 * Manages customer support tickets, comments, and resolutions
 */
@Injectable()
export class SupportTicketService {
  private readonly logger = new Logger(SupportTicketService.name);
  private webSocketGateway: any; // Lazy loaded to avoid circular dependency

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Set WebSocket gateway (injected after module initialization)
   */
  setWebSocketGateway(gateway: any) {
    this.webSocketGateway = gateway;
  }

  /**
   * Create a new support ticket
   */
  async createTicket(userId: string, dto: CreateSupportTicketDto): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate ticket number
    const ticketNumber = `ZGH-${Date.now().toString(36).toUpperCase()}`;

    // Calculate SLA deadlines based on priority
    const slaDeadlines = this.calculateSlaDeadlines(dto.priority);

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority,
        category: dto.category,
        status: TicketStatus.OPEN,
        userId,
        slaResponseDeadline: slaDeadlines.responseDeadline,
        slaResolveDeadline: slaDeadlines.resolveDeadline,
      },
      include: {
        user: true,
        comments: true,
      },
    });

    // Send ticket created email
    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: `Támogatási Jegy Létrehozva - ${ticketNumber}`,
        html: this.getTicketCreatedTemplate(ticketNumber, dto.subject, ticket.id),
      });
    } catch (error) {
      this.logger.warn(`Failed to send ticket creation email: ${error}`);
    }

    // Broadcast to admin staff via WebSocket
    if (this.webSocketGateway) {
      this.webSocketGateway.broadcastToStaff('support:newTicket', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        priority: ticket.priority,
        userId: user.id,
        userName: user.email,
        slaResponseDeadline: ticket.slaResponseDeadline,
        slaResolveDeadline: ticket.slaResolveDeadline,
      });
    }

    return ticket;
  }

  /**
   * Calculate SLA deadlines based on ticket priority
   */
  private calculateSlaDeadlines(priority: TicketPriority): {
    responseDeadline: Date;
    resolveDeadline: Date;
  } {
    const now = new Date();
    let responseHours: number;
    let resolveHours: number;

    // SLA targets by priority
    switch (priority) {
      case TicketPriority.CRITICAL:
        responseHours = 1; // 1 hour response
        resolveHours = 4;  // 4 hours resolution
        break;
      case TicketPriority.HIGH:
        responseHours = 2; // 2 hours response
        resolveHours = 8;  // 8 hours resolution
        break;
      case TicketPriority.MEDIUM:
        responseHours = 4;  // 4 hours response
        resolveHours = 24;  // 24 hours resolution
        break;
      case TicketPriority.LOW:
      default:
        responseHours = 8;  // 8 hours response
        resolveHours = 48;  // 48 hours resolution
        break;
    }

    return {
      responseDeadline: new Date(now.getTime() + responseHours * 60 * 60 * 1000),
      resolveDeadline: new Date(now.getTime() + resolveHours * 60 * 60 * 1000),
    };
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId },
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 3, // Last 3 comments
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where: { userId } }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get ticket details
   */
  async getTicket(ticketId: string, userId?: string): Promise<any> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check permission
    if (userId && ticket.userId !== userId) {
      throw new ForbiddenException('You cannot view this ticket');
    }

    return ticket;
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId: string, userId: string, dto: AddCommentDto): Promise<any> {
    const ticket = await this.getTicket(ticketId, userId);

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: userId,
        message: dto.message,
      },
      include: {
        author: true,
      },
    });

    // Broadcast new comment via WebSocket
    if (this.webSocketGateway) {
      this.webSocketGateway.broadcastTicketComment(ticketId, {
        id: comment.id,
        message: comment.message,
        authorId: comment.authorId,
        authorName: comment.author.email,
        createdAt: comment.createdAt,
      });
    }

    return comment;
  }

  /**
   * Update ticket status (admin only)
   */
  async updateTicket(ticketId: string, dto: UpdateTicketDto): Promise<any> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        priority: dto.priority,
      },
      include: {
        user: true,
        comments: true,
      },
    });

    // Send status change email to user
    if (dto.status && dto.status !== ticket.status) {
      try {
        await this.emailService.sendEmail({
          to: updated.user.email,
          subject: `Támogatási Jegy Státusza Frissítve - ${ticket.ticketNumber}`,
          html: this.getTicketStatusChangedTemplate(
            ticket.ticketNumber,
            ticket.subject,
            dto.status,
          ),
        });
      } catch (error) {
        this.logger.warn(`Failed to send status change email: ${error}`);
      }
    }

    // Broadcast status change via WebSocket
    if (this.webSocketGateway && dto.status && dto.status !== ticket.status) {
      this.webSocketGateway.broadcastTicketStatusChange(ticketId, dto.status, 'admin');
    }

    return updated;
  }

  /**
   * Close ticket
   */
  async closeTicket(ticketId: string): Promise<any> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
      },
      include: {
        user: true,
        comments: true,
      },
    });
  }

  /**
   * Get admin tickets (all)
   */
  async getAdminTickets(page: number = 1, limit: number = 10, filter?: any): Promise<any> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.priority) {
      where.priority = filter.priority;
    }
    if (filter?.category) {
      where.category = filter.category;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: true,
          comments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<any> {
    const [
      total,
      open,
      inProgress,
      resolved,
      avgResponseTime,
    ] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
      this.getAverageResponseTime(),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      avgResponseTime,
    };
  }

  /**
   * Calculate average response time
   */
  private async getAverageResponseTime(): Promise<number> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        comments: {
          some: {},
        },
      },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (tickets.length === 0) return 0;

    const times = tickets
      .filter(t => t.comments.length > 0 && t.createdAt)
      .map(t => {
        const createdAt = new Date(t.createdAt).getTime();
        const firstResponse = new Date(t.comments[0].createdAt).getTime();
        return (firstResponse - createdAt) / (1000 * 60); // minutes
      });

    if (times.length === 0) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  /**
   * Email template for ticket created
   */
  private getTicketCreatedTemplate(ticketNumber: string, subject: string, ticketId: string): string {
    const appUrl = process.env.FRONTEND_URL || 'https://zedgaminghosting.hu';
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>🎫 Támogatási Jegy Létrehozva</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Kedves ügyfél!</p>
          <p>A támogatási jegyed sikeresen létrehozásra került.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0;">
            <strong>Jegy szám:</strong> ${ticketNumber}<br>
            <strong>Tárgy:</strong> ${subject}<br>
            <strong>Státusz:</strong> Nyitott
          </div>
          <p>A csapatunk hamarosan átnézi a problémádat és értesítéseink érkeznek.</p>
          <p><a href="${appUrl}/dashboard/support/${ticketId}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Jegy Megtekintése</a></p>
        </div>
      </div>
    `;
  }

  /**
   * Email template for status change
   */
  private getTicketStatusChangedTemplate(ticketNumber: string, subject: string, newStatus: string): string {
    const statusMessages: Record<string, string> = {
      OPEN: 'Nyitott',
      IN_PROGRESS: 'Feldolgozás alatt',
      WAITING_CUSTOMER: 'Várakozás az ügyfelre',
      RESOLVED: 'Megoldva',
      CLOSED: 'Lezárva',
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>📝 Jegy Státusza Megváltozott</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Kedves ügyfél!</p>
          <p>A támogatási jegyed státusza megváltozott.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0;">
            <strong>Jegy szám:</strong> ${ticketNumber}<br>
            <strong>Tárgy:</strong> ${subject}<br>
            <strong>Új státusz:</strong> ${statusMessages[newStatus] || newStatus}
          </div>
          <p>Köszönjük a türelmedet!</p>
        </div>
      </div>
    `;
  }

  /**
   * Assign ticket to support staff
   */
  async assignTicket(ticketId: string, assignedToId: string, assignedBy: string): Promise<any> {
    // Validate ticket exists
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Validate assignee is support staff
    const assignee = await this.prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignee || (assignee.role !== 'ADMIN' && assignee.role !== 'SUPPORT')) {
      throw new ForbiddenException('Can only assign to support staff');
    }

    // Update ticket assignment
    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        assignedAt: new Date(),
        status: ticket.status === 'OPEN' ? TicketStatus.IN_PROGRESS : ticket.status,
      },
      include: {
        user: true,
        assignedTo: true,
        comments: true,
      },
    });

    // Send notification to assignee
    try {
      await this.emailService.sendEmail({
        to: assignee.email,
        subject: `Jegy Hozzárendelve - ${ticket.ticketNumber}`,
        html: this.getTicketAssignedTemplate(
          ticket.ticketNumber,
          ticket.subject,
          assignee.email,
          ticketId,
        ),
      });
    } catch (error) {
      this.logger.warn(`Failed to send assignment email: ${error}`);
    }

    // Broadcast assignment via WebSocket
    if (this.webSocketGateway) {
      this.webSocketGateway.broadcastToStaff('support:ticketAssigned', {
        ticketId: ticket.id,
        assignedToId,
        assignedTo: {
          id: assignee.id,
          email: assignee.email,
          firstName: assignee.firstName || '',
          lastName: assignee.lastName || '',
        },
        ticket: updatedTicket,
      });

      // Notify the assigned user directly
      this.webSocketGateway.sendUserNotification(assignedToId, {
        type: 'ticket_assigned',
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
      });
    }

    return updatedTicket;
  }

  /**
   * Get support staff workload for balancing
   */
  async getSupportStaffWorkload(): Promise<any[]> {
    const supportStaff = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPPORT'] },
      },
      include: {
        assignedTickets: {
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
        },
      },
    });

    return supportStaff.map((staff) => ({
      userId: staff.id,
      email: staff.email,
      role: staff.role,
      activeTickets: staff.assignedTickets.length,
    }));
  }

  /**
   * Auto-assign ticket to least loaded support staff
   */
  async autoAssignTicket(ticketId: string): Promise<any> {
    const workload = await this.getSupportStaffWorkload();
    
    if (workload.length === 0) {
      this.logger.warn('No support staff available for auto-assignment');
      return null;
    }

    // Find staff with least tickets
    const leastLoaded = workload.reduce((prev, current) => 
      prev.activeTickets < current.activeTickets ? prev : current
    );

    return this.assignTicket(ticketId, leastLoaded.userId, 'SYSTEM_AUTO_ASSIGN');
  }

  /**
   * Get tickets approaching SLA deadline
   */
  async getOverdueSlaTickets(): Promise<any[]> {
    const now = new Date();

    return this.prisma.supportTicket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        OR: [
          {
            slaResponseDeadline: { lte: now },
            firstResponseAt: null,
          },
          {
            slaResolveDeadline: { lte: now },
            status: { notIn: ['RESOLVED', 'CLOSED'] },
          },
        ],
      },
      include: {
        user: true,
        assignedTo: true,
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Get ticket assigned template
   */
  private getTicketAssignedTemplate(
    ticketNumber: string,
    subject: string,
    assigneeEmail: string,
    ticketId: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>🎯 Új Jegy Hozzárendelve</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Kedves ${assigneeEmail}!</p>
          <p>Egy új támogatási jegy lett hozzád rendelve.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0;">
            <strong>Jegy szám:</strong> ${ticketNumber}<br>
            <strong>Tárgy:</strong> ${subject}<br>
          </div>
          <p>Kérlek, foglalkozz vele a lehető leghamarabb!</p>
        </div>
      </div>
    `;
  }
}

