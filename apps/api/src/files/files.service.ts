import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
   * Lists files in a directory
   */
  async listFiles(serverUuid: string, path: string, userId: string) {
    await this.verifyAccess(serverUuid, userId);

    // TODO: Connect to daemon and execute `ls -la` command via Docker exec
    // For now, return mock data
    return {
      path,
      files: [
        {
          name: 'server.cfg',
          path: `${path}server.cfg`,
          type: 'file',
          size: 1024,
          modified: new Date().toISOString(),
        },
        {
          name: 'logs',
          path: `${path}logs`,
          type: 'directory',
          modified: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Gets file content
   */
  async getFileContent(serverUuid: string, path: string, userId: string) {
    await this.verifyAccess(serverUuid, userId);

    // TODO: Connect to daemon and execute `cat` command via Docker exec
    // For now, return mock data
    return {
      path,
      content: `# Mock file content for ${path}\n# This will be replaced with actual file reading from daemon`,
      encoding: 'utf-8',
    };
  }

  /**
   * Saves file content
   */
  async saveFileContent(
    serverUuid: string,
    path: string,
    _content: string,
    userId: string,
  ) {
    await this.verifyAccess(serverUuid, userId);

    // TODO: Connect to daemon and write file via Docker exec
    // For now, return success
    return {
      success: true,
      path,
      message: 'File saved successfully',
    };
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

    // TODO: Connect to daemon and execute `touch` or `mkdir` via Docker exec
    // For now, return success
    return {
      success: true,
      path,
      type,
      message: `${type === 'file' ? 'File' : 'Directory'} created successfully`,
    };
  }

  /**
   * Deletes a file or directory
   */
  async deleteFile(serverUuid: string, path: string, userId: string) {
    await this.verifyAccess(serverUuid, userId);

    // TODO: Connect to daemon and execute `rm` or `rm -rf` via Docker exec
    // For now, return success
    return {
      success: true,
      path,
      message: 'File deleted successfully',
    };
  }

  /**
   * Uploads a file
   */
  async uploadFile(
    serverUuid: string,
    targetPath: string,
    filename: string,
    _content: string,
    userId: string,
  ) {
    await this.verifyAccess(serverUuid, userId);

    const fullPath = `${targetPath}/${filename}`.replace(/\/+/g, '/');

    // TODO: Connect to daemon and write file via Docker exec
    // For now, return success
    return {
      success: true,
      path: fullPath,
      message: 'File uploaded successfully',
    };
  }
}

