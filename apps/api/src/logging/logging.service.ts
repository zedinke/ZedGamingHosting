import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

interface ErrorLogEntry {
  message: string;
  stack?: string;
  context?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  userId?: string;
  userAgent: string;
  timestamp: string;
  url: string;
  source: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

interface AlertConfig {
  level: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Logging Service
 * Handles error logging, metrics collection, and alerting
 */
@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly errorThresholds = {
    critical: 1,
    error: 5,
    warning: 10,
  };
  private readonly timeWindow = 3600000; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.startMonitoring();
  }

  /**
   * Log an error
   */
  async logError(error: ErrorLogEntry): Promise<void> {
    try {
      // Store error log in database
      await this.prisma.errorLog.create({
        data: {
          message: error.message,
          stack: error.stack,
          context: error.context,
          severity: error.severity,
          userId: error.userId,
          userAgent: error.userAgent,
          url: error.url,
          source: error.source,
          ipAddress: error.ipAddress,
          metadata: error.metadata,
          timestamp: new Date(error.timestamp),
        },
      });

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`[${error.severity}] ${error.message}`, error.stack);
      }

      // Check if we need to trigger an alert
      await this.checkAlertThresholds(error.context || 'unknown', error.severity);
    } catch (err) {
      this.logger.error('Failed to log error', err);
    }
  }

  /**
   * Send alert for critical issues
   */
  async sendAlert(alert: AlertConfig): Promise<void> {
    try {
      this.logger.error(`[ALERT] ${alert.title}: ${alert.message}`, alert.details);

      // Store alert in database
      await this.prisma.systemAlert.create({
        data: {
          level: alert.level,
          title: alert.title,
          message: alert.message,
          details: alert.details,
          resolved: false,
          timestamp: new Date(),
        },
      });

      // Send email alert for critical issues
      if (alert.level === 'critical') {
        // TODO: Implement email notification to admins
        this.logger.warn('TODO: Send email alert to admin', {
          title: alert.title,
          message: alert.message,
        });
      }
    } catch (err) {
      this.logger.error('Failed to send alert', err);
    }
  }

  /**
   * Search error logs
   */
  async searchErrors(query: {
    severity?: string;
    context?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const where: any = {};

    if (query.severity) {
      where.severity = query.severity;
    }
    if (query.context) {
      where.context = query.context;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.timestamp.lte = new Date(query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.errorLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.errorLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get logging statistics
   */
  async getStats() {
    const oneHourAgo = new Date(Date.now() - this.timeWindow);

    const [
      totalErrors,
      recentErrors,
      bySeverity,
      byContext,
      topUsers,
    ] = await Promise.all([
      this.prisma.errorLog.count(),
      this.prisma.errorLog.count({
        where: { timestamp: { gte: oneHourAgo } },
      }),
      this.prisma.errorLog.groupBy({
        by: ['severity'],
        where: { timestamp: { gte: oneHourAgo } },
        _count: true,
      }),
      this.prisma.errorLog.groupBy({
        by: ['context'],
        where: { timestamp: { gte: oneHourAgo } },
        _count: true,
        take: 10,
      }),
      this.prisma.errorLog.groupBy({
        by: ['userId'],
        where: { 
          timestamp: { gte: oneHourAgo },
          userId: { not: null },
        },
        _count: true,
        take: 5,
      }),
    ]);

    return {
      totalErrors,
      recentErrors,
      oneHourWindow: this.timeWindow / 60000 + ' minutes',
      bySeverity: bySeverity.map(s => ({
        severity: s.severity,
        count: s._count,
      })),
      byContext: byContext.map(c => ({
        context: c.context,
        count: c._count,
      })),
      topUsers: topUsers.map(u => ({
        userId: u.userId,
        errorCount: u._count,
      })),
    };
  }

  /**
   * Check if error threshold is exceeded
   */
  private async checkAlertThresholds(context: string, severity: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - this.timeWindow);

    const count = await this.prisma.errorLog.count({
      where: {
        context,
        severity,
        timestamp: { gte: oneHourAgo },
      },
    });

    const threshold = this.errorThresholds[severity as keyof typeof this.errorThresholds];

    if (threshold && count >= threshold) {
      await this.sendAlert({
        level: severity as any,
        title: `High Error Rate: ${context}`,
        message: `${count} ${severity} errors in ${context} in the last hour`,
        details: {
          context,
          severity,
          count,
          threshold,
          timeWindow: `${this.timeWindow / 60000} minutes`,
        },
      });
    }
  }

  /**
   * Start monitoring service
   */
  private startMonitoring(): void {
    // Clean up old error logs every 24 hours
    setInterval(async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deleted = await this.prisma.errorLog.deleteMany({
          where: {
            timestamp: { lt: thirtyDaysAgo },
          },
        });

        if (deleted.count > 0) {
          this.logger.log(`Cleaned up ${deleted.count} old error logs`);
        }
      } catch (err) {
        this.logger.error('Failed to clean up old logs', err);
      }
    }, 24 * 60 * 60 * 1000);
  }
}
