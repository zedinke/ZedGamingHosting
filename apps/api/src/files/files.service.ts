import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadGatewayException,
} from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Verifies user has access to the server
   */
  private async verifyAccess(serverUuid: string, userId: string) {
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
    const url = `${daemonUrl}/api/files/server/${serverUuid}${endpoint}`;

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
   * Lists files in a directory
   */
  async listFiles(serverUuid: string, path: string, userId: string) {
    await this.verifyAccess(serverUuid, userId);
    return await this.callDaemon(serverUuid, `/list?path=${encodeURIComponent(path)}`);
  }

  /**
   * Gets file content
   */
  async getFileContent(serverUuid: string, path: string, userId: string) {
    await this.verifyAccess(serverUuid, userId);
    return await this.callDaemon(serverUuid, `/content?path=${encodeURIComponent(path)}`);
  }

  /**
   * Saves file content
   */
  async saveFileContent(
    serverUuid: string,
    path: string,
    content: string,
    userId: string,
  ) {
    await this.verifyAccess(serverUuid, userId);
    return await this.callDaemon(serverUuid, '/write', 'POST', { path, content });
  }

  /**
   * Creates a new file or directory
   */
  async createFile(
    serverUuid: string,
    path: string,
    type: 'file' | 'directory',
    userId: string,
  ) {
    await this.verifyAccess(serverUuid, userId);
    return await this.callDaemon(serverUuid, '/create', 'POST', { path, type });
  }

  /**
   * Deletes a file or directory
   */
  async deleteFile(serverUuid: string, path: string, userId: string) {
    await this.verifyAccess(serverUuid, userId);
    return await this.callDaemon(serverUuid, `/delete?path=${encodeURIComponent(path)}`, 'DELETE');
  }

  /**
   * Uploads a file
   */
  async uploadFile(
    serverUuid: string,
    targetPath: string,
    filename: string,
    content: string,
    userId: string,
  ) {
    await this.verifyAccess(serverUuid, userId);

    const fullPath = `${targetPath}/${filename}`.replace(/\/+/g, '/');
    return await this.callDaemon(serverUuid, '/write', 'POST', { path: fullPath, content });
  }
}

