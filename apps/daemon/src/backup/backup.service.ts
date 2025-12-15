import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

export interface BackupOptions {
  sourcePath: string;
  backupId: string;
  exclude?: string[];
  tags?: Record<string, string>;
}

export interface BackupResult {
  backupId: string;
  success: boolean;
  snapshotId?: string;
  size?: number;
  duration?: number;
  error?: string;
}

export interface RestoreOptions {
  backupId: string;
  snapshotId: string;
  targetPath: string;
}

/**
 * BackupService - Wrapper around Restic for backup management
 * Handles backup creation, restoration, and cleanup
 */
export class BackupService {
  private readonly resticRepo: string;
  private readonly resticPassword: string;
  private readonly resticPath: string;

  constructor(
    resticRepo?: string,
    resticPassword?: string,
    resticPath?: string
  ) {
    this.resticRepo = resticRepo || process.env.RESTIC_REPOSITORY || '';
    this.resticPassword = resticPassword || process.env.RESTIC_PASSWORD || '';
    this.resticPath = resticPath || process.env.RESTIC_PATH || 'restic';
  }

  /**
   * Initializes backup service
   */
  async initialize(): Promise<void> {
    // Check if Restic is available
    const resticAvailable = await this.isResticAvailable();
    if (!resticAvailable) {
      console.warn('[BackupService] Restic not available, backups will not work');
      return;
    }

    // Check if repository is configured
    if (!this.resticRepo || !this.resticPassword) {
      console.warn('[BackupService] Restic repository not configured, backups disabled');
      return;
    }

    // Initialize repository if it doesn't exist
    await this.initRepository();

    console.log('[BackupService] Backup service initialized');
  }

  /**
   * Creates a backup
   */
  async createBackup(options: BackupOptions): Promise<BackupResult> {
    const { sourcePath, backupId, exclude = [], tags = {} } = options;
    const startTime = Date.now();

    // Verify source path exists
    try {
      await stat(sourcePath);
    } catch {
      return {
        backupId,
        success: false,
        error: `Source path does not exist: ${sourcePath}`,
      };
    }

    // Build restic backup command
    const excludeFlags = exclude.map((pattern) => `--exclude ${pattern}`).join(' ');
    const tagFlags = Object.entries(tags)
      .map(([key, value]) => `--tag ${key}=${value}`)
      .join(' ');

    const command = [
      this.resticPath,
      'backup',
      sourcePath,
      `--repo=${this.resticRepo}`,
      `--password=${this.resticPassword}`,
      `--tag backup-id=${backupId}`,
      tagFlags,
      excludeFlags,
      '--json',
    ]
      .filter((part) => part.trim() !== '')
      .join(' ');

    console.log(`[BackupService] Creating backup: ${backupId} from ${sourcePath}`);

    try {
      const { stdout } = await execAsync(command);
      const output = JSON.parse(stdout);

      const duration = Date.now() - startTime;
      const snapshotId = output.new_file ? output.new_file.id : undefined;

      console.log(`[BackupService] Backup completed: ${backupId} (${snapshotId})`);

      return {
        backupId,
        success: true,
        snapshotId,
        size: output.new_file ? output.new_file.size : undefined,
        duration,
      };
    } catch (error: any) {
      console.error(`[BackupService] Backup failed: ${backupId}`, error);

      return {
        backupId,
        success: false,
        duration: Date.now() - startTime,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Restores a backup
   */
  async restoreBackup(options: RestoreOptions): Promise<{ success: boolean; error?: string }> {
    const { backupId, snapshotId, targetPath } = options;

    // Ensure target path exists
    try {
      await mkdir(targetPath, { recursive: true });
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create target path: ${error.message}`,
      };
    }

    const command = [
      this.resticPath,
      'restore',
      snapshotId,
      `--repo=${this.resticRepo}`,
      `--password=${this.resticPassword}`,
      `--target=${targetPath}`,
    ].join(' ');

    console.log(`[BackupService] Restoring backup: ${backupId} (${snapshotId}) to ${targetPath}`);

    try {
      await execAsync(command);
      console.log(`[BackupService] Restore completed: ${backupId}`);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error(`[BackupService] Restore failed: ${backupId}`, error);

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Lists snapshots for a backup
   */
  async listSnapshots(backupId?: string): Promise<Array<{ id: string; time: string; tags: string[] }>> {
    const command = [
      this.resticPath,
      'snapshots',
      `--repo=${this.resticRepo}`,
      `--password=${this.resticPassword}`,
      backupId ? `--tag backup-id=${backupId}` : '',
      '--json',
    ]
      .filter((part) => part.trim() !== '')
      .join(' ');

    try {
      const { stdout } = await execAsync(command);
      const snapshots = JSON.parse(stdout);

      return snapshots.map((snapshot: any) => ({
        id: snapshot.id,
        time: snapshot.time,
        tags: snapshot.tags || [],
      }));
    } catch (error: any) {
      console.error('[BackupService] Failed to list snapshots:', error);
      return [];
    }
  }

  /**
   * Deletes old snapshots (cleanup)
   */
  async pruneSnapshots(keepLast: number = 10): Promise<{ success: boolean; deleted: number; error?: string }> {
    // Get all snapshots
    const snapshots = await this.listSnapshots();

    if (snapshots.length <= keepLast) {
      return { success: true, deleted: 0 };
    }

    // Sort by time (oldest first)
    const sorted = snapshots.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    // Delete old snapshots
    const toDelete = sorted.slice(0, sorted.length - keepLast);
    let deleted = 0;

    for (const snapshot of toDelete) {
      try {
        const command = [
          this.resticPath,
          'forget',
          snapshot.id,
          `--repo=${this.resticRepo}`,
          `--password=${this.resticPassword}`,
          '--prune',
        ].join(' ');

        await execAsync(command);
        deleted++;
        console.log(`[BackupService] Deleted snapshot: ${snapshot.id}`);
      } catch (error) {
        console.error(`[BackupService] Failed to delete snapshot ${snapshot.id}:`, error);
      }
    }

    return {
      success: true,
      deleted,
    };
  }

  /**
   * Checks if Restic is available
   */
  private async isResticAvailable(): Promise<boolean> {
    try {
      await execAsync(`which ${this.resticPath}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initializes Restic repository if it doesn't exist
   */
  private async initRepository(): Promise<void> {
    try {
      // Check if repository exists
      const checkCommand = [
        this.resticPath,
        'snapshots',
        `--repo=${this.resticRepo}`,
        `--password=${this.resticPassword}`,
      ].join(' ');

      await execAsync(checkCommand);
      // Repository exists
    } catch {
      // Repository doesn't exist, initialize it
      console.log(`[BackupService] Initializing Restic repository: ${this.resticRepo}`);

      const initCommand = [
        this.resticPath,
        'init',
        `--repo=${this.resticRepo}`,
        `--password=${this.resticPassword}`,
      ].join(' ');

      try {
        await execAsync(initCommand);
        console.log('[BackupService] Restic repository initialized');
      } catch (error: any) {
        console.error('[BackupService] Failed to initialize repository:', error.message);
        throw error;
      }
    }
  }

  /**
   * Gets repository statistics
   */
  async getStats(): Promise<{ size: number; snapshotCount: number }> {
    try {
      const statsCommand = [
        this.resticPath,
        'stats',
        `--repo=${this.resticRepo}`,
        `--password=${this.resticPassword}`,
        '--json',
      ].join(' ');

      const { stdout } = await execAsync(statsCommand);
      const stats = JSON.parse(stdout);

      const snapshots = await this.listSnapshots();

      return {
        size: stats.total_size || 0,
        snapshotCount: snapshots.length,
      };
    } catch (error) {
      console.error('[BackupService] Failed to get stats:', error);
      return {
        size: 0,
        snapshotCount: 0,
      };
    }
  }
}

