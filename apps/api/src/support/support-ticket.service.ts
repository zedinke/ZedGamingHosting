import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority,
        category: dto.category,
        status: TicketStatus.OPEN,
        userId,
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

    return ticket;
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
}
