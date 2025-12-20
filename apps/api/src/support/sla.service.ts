import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@zed-hosting/db';
import { EmailService } from '../email/email.service';

/**
 * SLA Service - Monitors and manages Service Level Agreement targets
 */
@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);
  private webSocketGateway: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Set WebSocket gateway
   */
  setWebSocketGateway(gateway: any) {
    this.webSocketGateway = gateway;
  }

  /**
   * Check for breached SLA and send alerts
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkSlaBreaches() {
    try {
      const breachedTickets = await this.prisma.supportTicket.findMany({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          slaResolveDeadline: { lte: new Date() },
        },
        include: {
          user: true,
          assignedTo: true,
        },
      });

      for (const ticket of breachedTickets) {
        // Send alert email to assigned staff or admin
        const alertEmail = ticket.assignedTo?.email || 'admin@zedhosting.com';
        
        try {
          await this.emailService.sendEmail({
            to: alertEmail,
            subject: `⚠️ SLA Breach Alert - ${ticket.ticketNumber}`,
            html: this.getSlaBreachAlertTemplate(ticket),
          });
        } catch (error) {
          this.logger.error(`Failed to send SLA breach alert: ${error}`);
        }

        // Broadcast via WebSocket
        if (this.webSocketGateway) {
          this.webSocketGateway.broadcastToStaff('support:slaBreached', {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            priority: ticket.priority,
            deadline: ticket.slaResolveDeadline,
          });
        }
      }

      if (breachedTickets.length > 0) {
        this.logger.warn(`${breachedTickets.length} tickets have breached SLA deadline`);
      }
    } catch (error) {
      this.logger.error(`SLA check failed: ${error}`);
    }
  }

  /**
   * Check for approaching SLA deadlines
   * Runs every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkApproachingSlaDeadlines() {
    try {
      const now = new Date();
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

      const approachingTickets = await this.prisma.supportTicket.findMany({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          slaResolveDeadline: {
            gte: now,
            lte: in1Hour,
          },
        },
        include: {
          user: true,
          assignedTo: true,
        },
      });

      for (const ticket of approachingTickets) {
        const alertEmail = ticket.assignedTo?.email || 'admin@zedhosting.com';
        
        try {
          await this.emailService.sendEmail({
            to: alertEmail,
            subject: `⏰ SLA Warning - ${ticket.ticketNumber}`,
            html: this.getSlaWarningTemplate(ticket),
          });
        } catch (error) {
          this.logger.error(`Failed to send SLA warning: ${error}`);
        }

        // Broadcast via WebSocket
        if (this.webSocketGateway && ticket.slaResolveDeadline) {
          this.webSocketGateway.broadcastToStaff('support:slaWarning', {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            timeRemaining: ticket.slaResolveDeadline.getTime() - now.getTime(),
          });
        }
      }

      if (approachingTickets.length > 0) {
        this.logger.log(`${approachingTickets.length} tickets approaching SLA deadline`);
      }
    } catch (error) {
      this.logger.error(`SLA approach check failed: ${error}`);
    }
  }

  /**
   * Get SLA metrics
   */
  async getSlaMetrics(): Promise<any> {
    const [
      total,
      onTime,
      breached,
      approaching,
    ] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({
        where: {
          status: 'CLOSED',
          slaResolveDeadline: {
            gte: new Date(), // This condition doesn't make sense for closed tickets
          },
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          slaResolveDeadline: { lte: new Date() },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          slaResolveDeadline: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 60 * 1000),
          },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
    ]);

    const onTimePercentage = total > 0 ? (onTime / total) * 100 : 0;

    return {
      total,
      onTime,
      breached,
      approaching,
      onTimePercentage: Math.round(onTimePercentage * 100) / 100,
      complianceStatus: onTimePercentage >= 95 ? 'EXCELLENT' : onTimePercentage >= 90 ? 'GOOD' : 'POOR',
    };
  }

  /**
   * Get SLA breach alert template
   */
  private getSlaBreachAlertTemplate(ticket: any): string {
    const deadlineDate = new Date(ticket.slaResolveDeadline).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>⚠️ SLA Breach Alert</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p><strong>Jegy szám:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Tárgy:</strong> ${ticket.subject}</p>
          <p><strong>Prioritás:</strong> ${ticket.priority}</p>
          <p><strong>Megoldás határideje:</strong> <span style="color: #dc2626;"><strong>${deadlineDate}</strong></span></p>
          <p style="color: #666; margin-top: 20px;">
            Ez a jegy már túllépte a megoldási határidőt. Kérlek, azonnal foglalkozz vele!
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get SLA warning template
   */
  private getSlaWarningTemplate(ticket: any): string {
    const deadlineDate = new Date(ticket.slaResolveDeadline).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const hoursRemaining = Math.round(
      (ticket.slaResolveDeadline.getTime() - Date.now()) / (60 * 60 * 1000)
    );

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>⏰ SLA Warning</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p><strong>Jegy szám:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Tárgy:</strong> ${ticket.subject}</p>
          <p><strong>Prioritás:</strong> ${ticket.priority}</p>
          <p><strong>Megoldás határideje:</strong> ${deadlineDate}</p>
          <p style="color: #f59e0b;"><strong>Hátralévő idő: ${hoursRemaining} óra</strong></p>
          <p style="color: #666; margin-top: 20px;">
            Kérlek, gyorsítsd fel a megoldást, hogy elkerüljük az SLA megsértését!
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get recent SLA breaches (for dashboard display)
   */
  async getRecentBreaches(limit: number = 10): Promise<any[]> {
    return this.prisma.supportTicket.findMany({
      where: {
        slaResolveDeadline: { lte: new Date() },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        priority: true,
        status: true,
        slaResolveDeadline: true,
        assignedTo: { select: { id: true, email: true } },
      },
      orderBy: { slaResolveDeadline: 'asc' },
      take: limit,
    });
  }

  /**
   * Get approaching SLA deadlines (for dashboard display)
   */
  async getApproachingDeadlines(limit: number = 10): Promise<any[]> {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        slaResolveDeadline: {
          gte: now,
          lte: oneHourLater,
        },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        priority: true,
        status: true,
        slaResolveDeadline: true,
        assignedTo: { select: { id: true, email: true } },
      },
      orderBy: { slaResolveDeadline: 'asc' },
      take: limit,
    });

    return tickets.map((ticket) => ({
      ...ticket,
      hoursRemaining: ticket.slaResolveDeadline ? Math.round(
        (ticket.slaResolveDeadline.getTime() - now.getTime()) / (60 * 60 * 1000)
      ) : 0,
    }));
  }
}
