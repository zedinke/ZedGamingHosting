import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface SteamUpdateOptions {
  appId: string;
  installDir: string;
  beta?: string;
  validate?: boolean;
}

export interface SteamUpdateProgress {
  progress: number; // 0-100
  status: string;
  downloaded: number; // bytes
  total: number; // bytes
}

/**
 * SteamService - Wrapper around SteamCMD for game server updates
 * Handles SteamCMD execution and progress tracking
 */
export class SteamService {
  private readonly steamCmdPath: string;

  constructor(steamCmdPath?: string) {
    this.steamCmdPath = steamCmdPath || process.env.STEAMCMD_PATH || '/usr/bin/steamcmd';
  }

  /**
   * Updates a game server using SteamCMD
   * @param options - Update options
   * @param onProgress - Optional progress callback
   * @returns Promise that resolves when update completes
   */
  async updateServer(
    options: SteamUpdateOptions,
    onProgress?: (progress: SteamUpdateProgress) => void
  ): Promise<void> {
    const { appId, installDir, beta, validate = true } = options;

    // Ensure install directory exists
    const installPath = path.resolve(installDir);
    await this.ensureDirectoryExists(installPath);

    // Build SteamCMD script
    const scriptCommands = [
      `@ShutdownOnFailedCommand 1`,
      `@NoPromptForPassword 1`,
      `force_install_dir "${installPath}"`,
      `login anonymous`,
      `app_update ${appId}${beta ? ` -beta ${beta}` : ''}${validate ? ' validate' : ''}`,
      `quit`,
    ];

    const script = scriptCommands.join('\n');
    const scriptFile = `/tmp/steamcmd_${appId}_${Date.now()}.txt`;

    try {
      // Write script to temp file
      const fs = require('fs').promises;
      await fs.writeFile(scriptFile, script);

      // Execute SteamCMD with progress tracking
      const command = `${this.steamCmdPath} +runscript ${scriptFile}`;

      console.log(`[SteamService] Starting Steam update for app ${appId} to ${installPath}`);

      await this.executeWithProgress(command, onProgress);

      // Cleanup script file
      await fs.unlink(scriptFile).catch(() => {
        // Ignore cleanup errors
      });

      console.log(`[SteamService] Steam update completed for app ${appId}`);
    } catch (error) {
      console.error(`[SteamService] Steam update failed for app ${appId}:`, error);
      throw error;
    }
  }

  /**
   * Checks if SteamCMD is available
   */
  async isSteamCmdAvailable(): Promise<boolean> {
    try {
      await execAsync(`${this.steamCmdPath} +quit`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the version of an installed app
   */
  async getAppVersion(appId: string, installDir: string): Promise<string | null> {
    try {
      // Try to read appinfo.vdf or similar version file
      const fs = require('fs').promises;
      const versionFile = path.join(installDir, 'steamapps', `appmanifest_${appId}.acf`);

      try {
        const content = await fs.readFile(versionFile, 'utf-8');
        const versionMatch = content.match(/\"buildid\"\s+\"(\d+)\"/);
        return versionMatch ? versionMatch[1] : null;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Executes command and tracks progress
   */
  private async executeWithProgress(
    command: string,
    onProgress?: (progress: SteamUpdateProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = exec(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      let progress: SteamUpdateProgress = {
        progress: 0,
        status: 'Starting...',
        downloaded: 0,
        total: 0,
      };

      childProcess.stdout?.on('data', (data: string) => {
        const output = data.toString();
        // Log progress updates
        if (output.includes('%') || output.includes('Downloading') || output.includes('Validating')) {
          console.log(`[SteamCMD] ${output.trim()}`);
        }

        // Parse progress from SteamCMD output
        const progressMatch = output.match(/(\d+\.\d+)%|\s(\d+)\s\/\s(\d+)\s/);
        if (progressMatch) {
          if (progressMatch[1]) {
            progress.progress = parseFloat(progressMatch[1]);
          } else if (progressMatch[2] && progressMatch[3]) {
            progress.downloaded = parseInt(progressMatch[2]);
            progress.total = parseInt(progressMatch[3]);
            progress.progress = (progress.downloaded / progress.total) * 100;
          }

          if (onProgress) {
            onProgress({ ...progress });
          }
        }

        // Update status
        if (output.includes('Downloading')) {
          progress.status = 'Downloading...';
        } else if (output.includes('Validating')) {
          progress.status = 'Validating...';
        } else if (output.includes('Success')) {
          progress.status = 'Complete';
          progress.progress = 100;
        }
      });

      childProcess.stderr?.on('data', (data: string) => {
        const output = data.toString();
        console.warn(`[SteamCMD stderr] ${output.trim()}`);
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          if (onProgress) {
            onProgress({ ...progress, status: 'Complete', progress: 100 });
          }
          resolve();
        } else {
          reject(new Error(`SteamCMD exited with code ${code}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Ensures directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    const fs = require('fs').promises;
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

