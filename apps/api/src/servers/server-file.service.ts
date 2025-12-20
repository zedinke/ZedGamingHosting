import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

interface UploadedFile {
  filename: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * Server File Service
 * Manages file operations on game servers via daemon
 */
@Injectable()
export class ServerFileService {
  private readonly logger = new Logger(ServerFileService.name);
  private webSocketGateway?: AppWebSocketGateway;

  constructor() {}

  /**
   * Set WebSocket gateway for real-time updates
   */
  setWebSocketGateway(gateway: AppWebSocketGateway) {
    this.webSocketGateway = gateway;
  }

  /**
   * List files in a directory
   */
  async listFiles(_serverId: string, _dirPath: string): Promise<FileEntry[]> {
    try {
      // TODO: Call daemon API to list files on server
      // This would communicate with the daemon running on the game server host
      // For now, return mock data
      
      const files: FileEntry[] = [
        {
          name: 'ServerFiles',
          path: '/home/gameserver/ServerFiles',
          type: 'directory',
        },
        {
          name: 'config.ini',
          path: '/home/gameserver/config.ini',
          type: 'file',
          size: 2048,
          modified: new Date().toISOString(),
        },
        {
          name: 'game.log',
          path: '/home/gameserver/game.log',
          type: 'file',
          size: 5242880,
          modified: new Date().toISOString(),
        },
      ];

      return files;
    } catch (error) {
      this.logger.error(`Failed to list files: ${error}`);
      throw error;
    }
  }

  /**
   * Download a file
   */
  async downloadFile(
    serverId: string,
    filePath: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    try {
      // TODO: Call daemon API to download file
      // This would retrieve the file from the game server via the daemon
      
      const filename = path.basename(filePath);
      const buffer = Buffer.from('File contents'); // Mock data

      this.logger.log(`Downloaded file ${filePath} from server ${serverId}`);

      return { buffer, filename };
    } catch (error) {
      this.logger.error(`Failed to download file: ${error}`);
      throw error;
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(
    serverId: string,
    file: UploadedFile,
    destinationPath: string,
  ) {
    try {
      // TODO: Call daemon API to upload file
      // This would send the file to the game server via the daemon
      
      this.logger.log(
        `Uploaded file ${file.filename} to ${destinationPath} on server ${serverId}`,
      );

      // Broadcast upload event via WebSocket
      if (this.webSocketGateway) {
        this.webSocketGateway.broadcastToStaff('server:fileUploaded', {
          serverId,
          filename: file.filename,
          path: destinationPath,
          size: file.size,
        });
      }

      return {
        filename: file.filename,
        path: destinationPath,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(serverId: string, filePath: string) {
    try {
      // Validate path safety (prevent directory traversal)
      if (filePath.includes('..') || filePath.startsWith('/')) {
        throw new BadRequestException('Invalid file path');
      }

      // TODO: Call daemon API to delete file
      
      this.logger.log(`Deleted file ${filePath} from server ${serverId}`);

      // Broadcast delete event
      if (this.webSocketGateway) {
        this.webSocketGateway.broadcastToStaff('server:fileDeleted', {
          serverId,
          path: filePath,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error}`);
      throw error;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(serverId: string, dirPath: string) {
    try {
      if (dirPath.includes('..') || dirPath.startsWith('/')) {
        throw new BadRequestException('Invalid directory path');
      }

      // TODO: Call daemon API to create directory
      
      this.logger.log(`Created directory ${dirPath} on server ${serverId}`);

      return { path: dirPath, created: true };
    } catch (error) {
      this.logger.error(`Failed to create directory: ${error}`);
      throw error;
    }
  }

  /**
   * Rename a file
   */
  async renameFile(
    serverId: string,
    oldPath: string,
    newPath: string,
  ) {
    try {
      if (
        oldPath.includes('..') ||
        newPath.includes('..') ||
        oldPath.startsWith('/') ||
        newPath.startsWith('/')
      ) {
        throw new BadRequestException('Invalid file paths');
      }

      // TODO: Call daemon API to rename file
      
      this.logger.log(`Renamed ${oldPath} to ${newPath} on server ${serverId}`);

      return { oldPath, newPath, renamed: true };
    } catch (error) {
      this.logger.error(`Failed to rename file: ${error}`);
      throw error;
    }
  }

  /**
   * Get file content (for text files)
   */
  async getFileContent(serverId: string, filePath: string) {
    try {
      // TODO: Call daemon API to read file content
      // Limit to text files (config, log files) and reasonable sizes
      
      const content = 'File content goes here'; // Mock data
      const lines = content.split('\n').length;

      this.logger.log(`Read file ${filePath} from server ${serverId}`);

      return {
        path: filePath,
        content,
        lines,
        size: content.length,
      };
    } catch (error) {
      this.logger.error(`Failed to read file: ${error}`);
      throw error;
    }
  }
}
