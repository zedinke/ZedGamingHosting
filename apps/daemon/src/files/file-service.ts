import Docker from 'dockerode';

/**
 * File Service - handles file operations on Docker containers
 */
export class FileService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  /**
   * Executes a command in a container and returns the output
   */
  private async execCommand(
    containerName: string,
    command: string[],
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const container = this.docker.getContainer(containerName);

    // Create exec instance
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
    });

    // Execute and stream output
    const stream = await exec.start({ hijack: true, stdin: false });

    let stdout = '';
    let stderr = '';

    return new Promise((resolve, reject) => {
      container.modem.demuxStream(stream, {
        write: (chunk: Buffer) => {
          stdout += chunk.toString();
        },
      }, {
        write: (chunk: Buffer) => {
          stderr += chunk.toString();
        },
      });

      stream.on('end', async () => {
        const inspect = await exec.inspect();
        resolve({
          stdout,
          stderr,
          exitCode: inspect.ExitCode || 0,
        });
      });

      stream.on('error', reject);
    });
  }

  /**
   * Lists files in a directory
   */
  async listFiles(serverUuid: string, path: string): Promise<Array<{
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    modified?: string;
  }>> {
    const containerName = `zedhosting-${serverUuid}`;
    
    // Use find command with JSON-like output (stat)
    const command = ['sh', '-c', `find "${path}" -maxdepth 1 -type f -o -type d | while read f; do stat -c '%n|%s|%Y|%F' "$f" 2>/dev/null || echo "$f|0|0|unknown"; done`];
    
    try {
      const result = await this.execCommand(containerName, command);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to list files: ${result.stderr}`);
      }

      const files: Array<{
        name: string;
        path: string;
        type: 'file' | 'directory';
        size?: number;
        modified?: string;
      }> = [];

      const lines = result.stdout.split('\n').filter((line) => line.trim());
      
      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 4) {
          const fullPath = parts[0].trim();
          const name = fullPath.split('/').pop() || fullPath;
          const size = parseInt(parts[1]) || 0;
          const timestamp = parseInt(parts[2]) || 0;
          const type = parts[3].includes('directory') ? 'directory' : 'file';

          // Skip the path itself if it's a directory
          if (fullPath === path) {
            continue;
          }

          files.push({
            name,
            path: fullPath,
            type,
            size: type === 'file' ? size : undefined,
            modified: timestamp ? new Date(timestamp * 1000).toISOString() : undefined,
          });
        }
      }

      return files;
    } catch (error) {
      console.error(`Error listing files for ${serverUuid}:`, error);
      throw error;
    }
  }

  /**
   * Gets file content
   */
  async getFileContent(serverUuid: string, path: string): Promise<string> {
    const containerName = `zedhosting-${serverUuid}`;
    
    try {
      const result = await this.execCommand(containerName, ['cat', path]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to read file: ${result.stderr}`);
      }

      return result.stdout;
    } catch (error) {
      console.error(`Error reading file ${path} for ${serverUuid}:`, error);
      throw error;
    }
  }

  /**
   * Writes file content
   */
  async writeFileContent(serverUuid: string, path: string, content: string): Promise<void> {
    const containerName = `zedhosting-${serverUuid}`;
    
    // Use echo or printf to write content, handling special characters
    const escapedContent = content.replace(/'/g, "'\\''");
    const command = ['sh', '-c', `printf '%s' '${escapedContent}' > "${path}"`];
    
    try {
      const result = await this.execCommand(containerName, command);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to write file: ${result.stderr}`);
      }
    } catch (error) {
      console.error(`Error writing file ${path} for ${serverUuid}:`, error);
      throw error;
    }
  }

  /**
   * Creates a file or directory
   */
  async createFile(serverUuid: string, path: string, type: 'file' | 'directory'): Promise<void> {
    const containerName = `zedhosting-${serverUuid}`;
    
    const command = type === 'directory' ? ['mkdir', '-p', path] : ['touch', path];
    
    try {
      const result = await this.execCommand(containerName, command);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to create ${type}: ${result.stderr}`);
      }
    } catch (error) {
      console.error(`Error creating ${type} ${path} for ${serverUuid}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a file or directory
   */
  async deleteFile(serverUuid: string, path: string): Promise<void> {
    const containerName = `zedhosting-${serverUuid}`;
    
    // Use rm -rf for both files and directories
    const command = ['rm', '-rf', path];
    
    try {
      const result = await this.execCommand(containerName, command);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to delete: ${result.stderr}`);
      }
    } catch (error) {
      console.error(`Error deleting ${path} for ${serverUuid}:`, error);
      throw error;
    }
  }
}

