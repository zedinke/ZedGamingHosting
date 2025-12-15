import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

export interface NFSMountOptions {
  server: string;
  exportPath: string;
  localPath: string;
  options?: string;
}

export interface NFSMountInfo {
  server: string;
  exportPath: string;
  localPath: string;
  mounted: boolean;
  mountedAt?: Date;
}

/**
 * NFSManager - Manages NFS mounts for cross-node shared storage
 * Enables game servers to be moved between nodes while preserving data
 */
export class NFSManager {
  private readonly mountBasePath: string;
  private readonly mounts: Map<string, NFSMountInfo> = new Map();

  constructor(mountBasePath?: string) {
    this.mountBasePath = mountBasePath || process.env.NFS_MOUNT_BASE_PATH || '/mnt/nfs';
  }

  /**
   * Initializes NFS manager
   */
  async initialize(): Promise<void> {
    // Ensure mount base directory exists
    try {
      await mkdir(this.mountBasePath, { recursive: true });
      console.log(`[NFSManager] Mount base directory initialized: ${this.mountBasePath}`);
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to initialize NFS mount directory: ${error.message}`);
      }
    }

    // Check if NFS client tools are available
    const nfsAvailable = await this.isNfsClientAvailable();
    if (!nfsAvailable) {
      console.warn('[NFSManager] NFS client tools not available, NFS features will be disabled');
    } else {
      console.log('[NFSManager] NFS client tools available');
    }

    // Restore existing mounts on startup
    await this.restoreMounts();
  }

  /**
   * Mounts an NFS export
   */
  async mount(options: NFSMountOptions): Promise<void> {
    const { server, exportPath, localPath, options: mountOptions } = options;

    // Ensure local mount point exists
    try {
      await mkdir(localPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create mount point: ${error.message}`);
      }
    }

    // Check if already mounted
    if (await this.isMounted(localPath)) {
      console.log(`[NFSManager] ${localPath} is already mounted`);
      this.mounts.set(localPath, {
        server,
        exportPath,
        localPath,
        mounted: true,
      });
      return;
    }

    // Build mount command
    const nfsPath = `${server}:${exportPath}`;
    const mountOpts = mountOptions || 'rw,sync,hard,intr,noatime';
    const mountCommand = `mount -t nfs -o ${mountOpts} ${nfsPath} ${localPath}`;

    console.log(`[NFSManager] Mounting NFS: ${nfsPath} -> ${localPath}`);

    try {
      await execAsync(mountCommand);
      
      this.mounts.set(localPath, {
        server,
        exportPath,
        localPath,
        mounted: true,
        mountedAt: new Date(),
      });

      console.log(`[NFSManager] Successfully mounted ${localPath}`);
    } catch (error: any) {
      console.error(`[NFSManager] Failed to mount ${localPath}:`, error.message);
      throw new Error(`NFS mount failed: ${error.message}`);
    }
  }

  /**
   * Unmounts an NFS mount
   */
  async unmount(localPath: string, force?: boolean): Promise<void> {
    if (!(await this.isMounted(localPath))) {
      console.log(`[NFSManager] ${localPath} is not mounted`);
      return;
    }

    const command = force ? `umount -f ${localPath}` : `umount ${localPath}`;

    console.log(`[NFSManager] Unmounting ${localPath}`);

    try {
      await execAsync(command);
      
      const mountInfo = this.mounts.get(localPath);
      if (mountInfo) {
        mountInfo.mounted = false;
      }

      console.log(`[NFSManager] Successfully unmounted ${localPath}`);
    } catch (error: any) {
      console.error(`[NFSManager] Failed to unmount ${localPath}:`, error.message);
      throw new Error(`NFS unmount failed: ${error.message}`);
    }
  }

  /**
   * Checks if a path is mounted
   */
  async isMounted(localPath: string): Promise<boolean> {
    try {
      await execAsync(`mountpoint -q ${localPath}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets mount information for a path
   */
  getMountInfo(localPath: string): NFSMountInfo | null {
    return this.mounts.get(localPath) || null;
  }

  /**
   * Lists all NFS mounts
   */
  async listMounts(): Promise<NFSMountInfo[]> {
    const mounts: NFSMountInfo[] = [];

    try {
      // Parse /proc/mounts to find NFS mounts
      const mountsContent = await fs.promises.readFile('/proc/mounts', 'utf-8');
      const lines = mountsContent.split('\n');

      for (const line of lines) {
        if (line.includes(' nfs ') || line.includes(' nfs4 ')) {
          const parts = line.split(' ');
          if (parts.length >= 3) {
            const serverAndExport = parts[0];
            const localPath = parts[1];

            if (serverAndExport.includes(':')) {
              const [server, exportPath] = serverAndExport.split(':');
              
              mounts.push({
                server,
                exportPath,
                localPath,
                mounted: true,
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('[NFSManager] Failed to list mounts:', error);
    }

    return mounts;
  }

  /**
   * Gets the NFS path for a server UUID
   * Used for game server data that needs to be shared across nodes
   */
  getServerNfsPath(serverUuid: string): string {
    return path.join(this.mountBasePath, 'servers', serverUuid);
  }

  /**
   * Ensures NFS path exists for a server
   */
  async ensureServerPath(serverUuid: string): Promise<string> {
    const serverPath = this.getServerNfsPath(serverUuid);
    
    try {
      await mkdir(serverPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create server NFS path: ${error.message}`);
      }
    }

    return serverPath;
  }

  /**
   * Checks if NFS client tools are available
   */
  private async isNfsClientAvailable(): Promise<boolean> {
    try {
      await execAsync('which mount.nfs');
      await execAsync('which umount');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restores mounts on startup
   * Reads mount configuration and remounts if needed
   */
  private async restoreMounts(): Promise<void> {
    // In a real implementation, this would read mount configuration from a file
    // or from the backend API. For now, we just check existing mounts.
    
    const existingMounts = await this.listMounts();
    
    for (const mount of existingMounts) {
      if (mount.localPath.startsWith(this.mountBasePath)) {
        this.mounts.set(mount.localPath, mount);
      }
    }

    console.log(`[NFSManager] Restored ${existingMounts.length} existing mounts`);
  }

  /**
   * Health check for NFS mounts
   */
  async healthCheck(): Promise<{ healthy: boolean; mounts: Array<{ path: string; healthy: boolean }> }> {
    const mounts = Array.from(this.mounts.values());
    const results: Array<{ path: string; healthy: boolean }> = [];

    for (const mount of mounts) {
      if (mount.mounted) {
        try {
          // Try to access the mount point
          await stat(mount.localPath);
          // Try to list directory
          await readdir(mount.localPath);
          results.push({ path: mount.localPath, healthy: true });
        } catch {
          results.push({ path: mount.localPath, healthy: false });
        }
      }
    }

    const healthy = results.every((r) => r.healthy);
    
    return {
      healthy,
      mounts: results,
    };
  }
}

