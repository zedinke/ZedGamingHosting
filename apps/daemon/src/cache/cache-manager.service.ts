import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const mkdir = promisify(fs.mkdir);

export interface CacheEntry {
  appId: string;
  version: string;
  cachedAt: number;
  size: number; // bytes
  path: string;
}

export interface CacheStats {
  totalSize: number;
  entryCount: number;
  entries: CacheEntry[];
}

/**
 * CacheManager - Manages host-level Steam game cache
 * Uses hard links to share cache between multiple game server instances
 * Prevents duplicate downloads and saves bandwidth/disk space
 */
export class CacheManager {
  private readonly cacheBasePath: string;
  private readonly maxAgeDays: number;
  private readonly cleanupEnabled: boolean;

  constructor(
    cacheBasePath?: string,
    maxAgeDays?: number,
    cleanupEnabled?: boolean
  ) {
    this.cacheBasePath = cacheBasePath || process.env.CACHE_BASE_PATH || '/var/lib/zedhosting/steam_cache';
    this.maxAgeDays = maxAgeDays || parseInt(process.env.CACHE_MAX_AGE_DAYS || '30');
    this.cleanupEnabled = cleanupEnabled ?? (process.env.CACHE_CLEANUP_ENABLED !== 'false');
  }

  /**
   * Initializes cache directory structure
   */
  async initialize(): Promise<void> {
    try {
      await mkdir(this.cacheBasePath, { recursive: true });
      console.log(`[CacheManager] Cache directory initialized: ${this.cacheBasePath}`);
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to initialize cache directory: ${error.message}`);
      }
    }
  }

  /**
   * Gets cache path for a specific app and version
   */
  getCachePath(appId: string, version?: string): string {
    if (version) {
      return path.join(this.cacheBasePath, appId, version);
    }
    return path.join(this.cacheBasePath, appId);
  }

  /**
   * Checks if a cached version exists for an app
   */
  async isCached(appId: string, version?: string): Promise<boolean> {
    const cachePath = this.getCachePath(appId, version);
    try {
      const stats = await stat(cachePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Creates a hard-linked copy from cache to target directory
   * Uses hard links to save disk space (multiple containers can share the same files)
   */
  async linkFromCache(appId: string, targetDir: string, version?: string): Promise<void> {
    const cachePath = this.getCachePath(appId, version);

    if (!(await this.isCached(appId, version))) {
      throw new Error(`Cache not found for app ${appId}${version ? ` version ${version}` : ''}`);
    }

    // Ensure target directory exists
    await mkdir(targetDir, { recursive: true });

    // Copy directory structure with hard links
    await this.linkDirectoryRecursive(cachePath, targetDir);

    console.log(`[CacheManager] Linked cache for app ${appId} to ${targetDir}`);
  }

  /**
   * Updates cache with a new version
   * Called after Steam update completes
   */
  async updateCache(appId: string, sourceDir: string, version: string): Promise<void> {
    const cachePath = this.getCachePath(appId, version);

    // Remove old cache if exists
    try {
      await this.removeDirectory(cachePath);
    } catch {
      // Ignore if doesn't exist
    }

    // Create cache directory
    await mkdir(cachePath, { recursive: true });

    // Copy directory structure with hard links
    await this.linkDirectoryRecursive(sourceDir, cachePath);

    console.log(`[CacheManager] Cache updated for app ${appId} version ${version}`);
  }

  /**
   * Gets cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const entries: CacheEntry[] = [];
    let totalSize = 0;

    try {
      const appDirs = await readdir(this.cacheBasePath);
      
      for (const appId of appDirs) {
        const appPath = path.join(this.cacheBasePath, appId);
        const appStat = await stat(appPath);
        
        if (appStat.isDirectory()) {
          try {
            const versionDirs = await readdir(appPath);
            
            for (const version of versionDirs) {
              const versionPath = path.join(appPath, version);
              const versionStat = await stat(versionPath);
              
              if (versionStat.isDirectory()) {
                const size = await this.getDirectorySize(versionPath);
                const cachedAt = versionStat.mtimeMs;
                
                entries.push({
                  appId,
                  version,
                  cachedAt,
                  size,
                  path: versionPath,
                });
                
                totalSize += size;
              }
            }
          } catch {
            // Skip if can't read app directory
          }
        }
      }
    } catch {
      // Cache directory might not exist yet
    }

    return {
      totalSize,
      entryCount: entries.length,
      entries,
    };
  }

  /**
   * Cleans up old cache entries (older than maxAgeDays)
   */
  async cleanup(): Promise<number> {
    if (!this.cleanupEnabled) {
      console.log('[CacheManager] Cache cleanup disabled');
      return 0;
    }

    const stats = await this.getCacheStats();
    const now = Date.now();
    const maxAgeMs = this.maxAgeDays * 24 * 60 * 60 * 1000;
    let removedCount = 0;

    for (const entry of stats.entries) {
      const age = now - entry.cachedAt;
      
      if (age > maxAgeMs) {
        try {
          await this.removeDirectory(entry.path);
          removedCount++;
          console.log(`[CacheManager] Removed old cache: ${entry.appId} v${entry.version} (${Math.round(age / (24 * 60 * 60 * 1000))} days old)`);
        } catch (error) {
          console.error(`[CacheManager] Failed to remove cache ${entry.path}:`, error);
        }
      }
    }

    return removedCount;
  }

  /**
   * Recursively links directory contents using hard links
   */
  private async linkDirectoryRecursive(source: string, target: string): Promise<void> {
    const entries = await readdir(source);

    for (const entry of entries) {
      const sourcePath = path.join(source, entry);
      const targetPath = path.join(target, entry);
      
      const stats = await stat(sourcePath);

      if (stats.isDirectory()) {
        await mkdir(targetPath, { recursive: true });
        await this.linkDirectoryRecursive(sourcePath, targetPath);
      } else {
        // Create hard link for files
        try {
          await this.createHardLink(sourcePath, targetPath);
        } catch (error: any) {
          // If hard link fails (e.g., cross-filesystem), fallback to copy
          if (error.code === 'EXDEV' || error.code === 'EMLINK') {
            await this.copyFile(sourcePath, targetPath);
          } else {
            throw error;
          }
        }
      }
    }
  }

  /**
   * Creates a hard link (platform-independent)
   */
  private async createHardLink(source: string, target: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.link(source, target, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Copies a file (fallback when hard link is not possible)
   */
  private async copyFile(source: string, target: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(source);
      const writeStream = fs.createWriteStream(target);

      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('close', resolve);

      readStream.pipe(writeStream);
    });
  }

  /**
   * Calculates directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const stats = await stat(entryPath);

        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(entryPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch {
      // Ignore errors
    }

    return totalSize;
  }

  /**
   * Removes directory recursively
   */
  private async removeDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const stats = await stat(entryPath);

        if (stats.isDirectory()) {
          await this.removeDirectory(entryPath);
        } else {
          await unlink(entryPath);
        }
      }

      await rmdir(dirPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

