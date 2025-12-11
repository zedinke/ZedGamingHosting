import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

/**
 * Audit Service - logs all data modifications
 * Immutable log entries - cannot be modified or deleted
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Creates an audit log entry
   * @param action - Action performed (e.g., "DELETE_SERVER", "CHANGE_RCON_PASS")
   * @param resourceId - Target resource UUID
   * @param userId - User who performed the action (optional)
   * @param ipAddress - IP address of the request
   * @param details - Additional details (oldValue, newValue, etc.)
   */
  async createLog(data: {
    action: string;
    resourceId: string;
    userId?: string;
    ipAddress: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          resourceId: data.resourceId,
          userId: data.userId || null,
          ipAddress: data.ipAddress,
          details: (data.details || {}) as any,
        },
      });

      this.logger.debug(`Audit log created: ${data.action} on ${data.resourceId}`);
    } catch (error) {
      // Don't throw - audit logging should not break the application
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Gets audit logs for a resource
   */
  async getLogsForResource(resourceId: string, limit = 100) {
    return await this.prisma.auditLog.findMany({
      where: { resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Gets audit logs for a user
   */
  async getLogsForUser(userId: string, limit = 100) {
    return await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

