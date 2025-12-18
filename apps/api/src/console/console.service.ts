import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadGatewayException,
} from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ConsoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly tasksService: TasksService,
  ) {}

  /**
   * Verifies user has access to the server
   */
  async verifyAccess(serverUuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    return server;
  }

  /**
   * Gets daemon URL for a server
   */
  private async getDaemonUrl(serverUuid: string): Promise<string> {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
      include: { node: true },
    });

    if (!server || !server.node) {
      throw new NotFoundException('Server or node not found');
    }

    // Use node IP or public FQDN if available
    const daemonHost = server.node.publicFqdn || server.node.ipAddress;
    const daemonPort = process.env.DAEMON_PORT || '3001';
    
    // Use HTTP for now (can be upgraded to HTTPS later)
    return `http://${daemonHost}:${daemonPort}`;
  }

  /**
   * Makes a request to the daemon
   */
  private async callDaemon<T>(
    serverUuid: string,
    endpoint: string,
    method: string = 'GET',
    body?: unknown,
  ): Promise<T> {
    const daemonUrl = await this.getDaemonUrl(serverUuid);
    const url = `${daemonUrl}/api/console/server/${serverUuid}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new BadGatewayException(error.error || `Daemon returned ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException(`Failed to connect to daemon: ${error.message}`);
    }
  }

  /**
   * Gets console logs for a server
   */
  async getConsoleLogs(serverUuid: string, userId: string, limit: number = 100) {
    await this.verifyAccess(serverUuid, userId);
    
    try {
      return await this.callDaemon<{ logs: string[] }>(
        serverUuid,
        `/logs?limit=${limit}`,
      );
    } catch (error) {
      // If daemon is not available, return empty logs
      return { logs: [] };
    }
  }

  /**
   * Sends a command to the server console
   */
  async sendCommand(serverUuid: string, command: string, userId: string) {
    await this.verifyAccess(serverUuid, userId);
    
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
      include: { node: true },
    });

    if (!server || !server.node) {
      throw new NotFoundException('Server or node not found');
    }

    // Queue EXECUTE_COMMAND task for the daemon. Daemon must handle this type idempotently.
    await this.tasksService.createTask(
      server.nodeId,
      'EXECUTE_COMMAND',
      {
        serverUuid: server.uuid,
        command,
      },
    );

    return {
      success: true,
      message: this.i18n.translate('COMMAND_SENT_SUCCESSFULLY'),
    };
  }
}

