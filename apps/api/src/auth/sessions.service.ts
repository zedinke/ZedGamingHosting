import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface SessionInfo {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionInfo[]> {
    this.logger.log(`Fetching sessions for user ${userId}`);

    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: {
        lastActive: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastActive: session.lastActive.toISOString(),
      isCurrent: session.token === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    this.logger.log(`Revoking session ${sessionId} for user ${userId}`);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only revoke your own sessions');
    }

    if (session.revokedAt) {
      this.logger.warn(`Session ${sessionId} already revoked`);
      return;
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Session ${sessionId} revoked successfully`);
  }

  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<{ revokedCount: number }> {
    this.logger.log(`Revoking all other sessions for user ${userId}`);

    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        token: {
          not: currentSessionId,
        },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(
      `Revoked ${result.count} sessions for user ${userId}`,
    );

    return { revokedCount: result.count };
  }

  async createSession(
    userId: string,
    token: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    this.logger.log(`Creating new session for user ${userId}`);

    await this.prisma.session.create({
      data: {
        userId,
        token,
        ip,
        userAgent,
        lastActive: new Date(),
      },
    });

    this.logger.log(`Session created successfully for user ${userId}`);
  }

  async updateSessionActivity(token: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        token,
        revokedAt: null,
      },
      data: {
        lastActive: new Date(),
      },
    });
  }

  async validateSession(token: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: {
        token,
        revokedAt: null,
      },
    });

    return !!session;
  }
}
