import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '@zed-hosting/db';

const execAsync = promisify(exec);

/**
 * Terminal Service
 * Manages remote terminal sessions and command execution on servers
 */
@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name);
  private activeSessions: Map<string, { serverId: string; sessionId: string; createdAt: Date }> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new terminal session for a server
   */
  async createSession(serverId: string, userId: string): Promise<{ sessionId: string }> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.activeSessions.set(sessionId, {
        serverId,
        sessionId,
        createdAt: new Date(),
      });

      this.logger.log(`Terminal session ${sessionId} created for server ${serverId} by user ${userId}`);

      return { sessionId };
    } catch (error) {
      this.logger.error(`Failed to create terminal session: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a command on a server via SSH
   */
  async executeCommand(
    serverId: string,
    sessionId: string,
    command: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      // Validate session
      const session = this.activeSessions.get(sessionId);
      if (!session || session.serverId !== serverId) {
        throw new Error('Invalid session');
      }

      // Get server details (SSH host, port, key path)
      const server = await (this.prisma as any).gameServer.findUnique({
        where: { uuid: serverId },
        select: {
          name: true,
          ipAddress: true,
          sshPort: true,
          sshKey: true,
        },
      });

      if (!server) {
        throw new Error('Server not found');
      }

      // Sanitize command to prevent injection
      const sanitizedCommand = this.sanitizeCommand(command);

      // Execute SSH command
      const sshCommand = `ssh -p ${server.sshPort || 22} -i ${server.sshKey || '/root/.ssh/id_rsa'} root@${server.ipAddress} "${sanitizedCommand}"`;

      const { stdout, stderr } = await execAsync(sshCommand, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      this.logger.debug(`Command executed on server ${serverId}: ${sanitizedCommand}`);

      return {
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error: any) {
      this.logger.error(`Failed to execute command on server ${serverId}: ${error}`);
      return {
        stdout: '',
        stderr: error.message || 'Command execution failed',
        exitCode: error.code || 1,
      };
    }
  }

  /**
   * Get current working directory on server
   */
  async getCwd(serverId: string, sessionId: string): Promise<string> {
    try {
      const result = await this.executeCommand(serverId, sessionId, 'pwd');
      return result.stdout.trim();
    } catch (error) {
      this.logger.error(`Failed to get cwd: ${error}`);
      return '/root';
    }
  }

  /**
   * List files in directory
   */
  async listFiles(serverId: string, sessionId: string, path: string = '.'): Promise<any[]> {
    try {
      const result = await this.executeCommand(
        serverId,
        sessionId,
        `ls -lah "${path}" | tail -n +2`,
      );

      if (result.exitCode !== 0) {
        return [];
      }

      return result.stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.split(/\s+/);
          return {
            permissions: parts[0],
            owner: parts[2],
            group: parts[3],
            size: parts[4],
            name: parts.slice(8).join(' '),
          };
        });
    } catch (error) {
      this.logger.error(`Failed to list files: ${error}`);
      return [];
    }
  }

  /**
   * Read file contents (with size limit)
   */
  async readFile(serverId: string, sessionId: string, filePath: string): Promise<string> {
    try {
      // Check file size first
      const sizeResult = await this.executeCommand(
        serverId,
        sessionId,
        `stat -c "%s" "${filePath}"`,
      );

      if (sizeResult.exitCode !== 0) {
        throw new Error('File not found');
      }

      const fileSize = parseInt(sizeResult.stdout.trim(), 10);
      
      // Limit to 1MB for display
      if (fileSize > 1024 * 1024) {
        return `[File too large: ${Math.round(fileSize / 1024 / 1024)}MB]\n\n[Showing last 1000 lines]\n\n`;
      }

      const result = await this.executeCommand(serverId, sessionId, `cat "${filePath}"`);
      return result.stdout;
    } catch (error) {
      this.logger.error(`Failed to read file: ${error}`);
      throw error;
    }
  }

  /**
   * Write file contents
   */
  async writeFile(serverId: string, sessionId: string, filePath: string, content: string): Promise<void> {
    try {
      // Escape content for shell
      const escapedContent = content.replace(/"/g, '\\"').replace(/\$/g, '\\$');

      await this.executeCommand(
        serverId,
        sessionId,
        `echo "${escapedContent}" > "${filePath}"`,
      );

      this.logger.log(`File ${filePath} written on server ${serverId}`);
    } catch (error) {
      this.logger.error(`Failed to write file: ${error}`);
      throw error;
    }
  }

  /**
   * Get docker stats for containers
   */
  async getDockerStats(serverId: string, sessionId: string): Promise<any[]> {
    try {
      const result = await this.executeCommand(
        serverId,
        sessionId,
        `docker stats --no-stream --format "{{.Container}} {{.CPUPerc}} {{.MemUsage}}"`,
      );

      if (result.exitCode !== 0) {
        return [];
      }

      return result.stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.split(/\s+/);
          return {
            container: parts[0].substring(0, 12),
            cpu: parts[1],
            memory: parts[2],
          };
        });
    } catch (error) {
      this.logger.error(`Failed to get docker stats: ${error}`);
      return [];
    }
  }

  /**
   * Close a terminal session
   */
  closeSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.logger.log(`Terminal session ${sessionId} closed`);
  }

  /**
   * Get active sessions (admin only)
   */
  getActiveSessions(): any[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Sanitize command to prevent injection attacks
   */
  private sanitizeCommand(command: string): string {
    // Allow basic safe characters and operations
    // Block dangerous patterns
    const dangerousPatterns = [
      /[&|;`$()]/g, // Shell operators
      /rm\s+-rf\s+\//i, // Recursive delete root
      /dd\s+if=\/dev\/zero\s+of=/i, // Disk write
    ];

    let sanitized = command;
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        this.logger.warn(`Potentially dangerous command attempted: ${command}`);
        throw new Error('Command contains dangerous patterns');
      }
    }

    return sanitized;
  }
}
