import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { SteamService, SteamUpdateOptions, SteamUpdateProgress } from './steam.service';

export interface UpdateJobData {
  serverUuid: string;
  appId: string;
  installDir: string;
  beta?: string;
  validate?: boolean;
}

export interface UpdateJobResult {
  success: boolean;
  error?: string;
  version?: string;
}

/**
 * UpdateQueueService - Manages Steam update queue using BullMQ
 * Limits concurrent updates to prevent resource exhaustion
 */
export class UpdateQueueService {
  private readonly queue: Queue<UpdateJobData, UpdateJobResult>;
  private readonly worker: Worker<UpdateJobData, UpdateJobResult>;
  private readonly steamService: SteamService;
  private readonly maxConcurrent: number;

  constructor(redisConnection: IORedis, maxConcurrent?: number) {
    this.maxConcurrent = maxConcurrent || parseInt(process.env.MAX_CONCURRENT_UPDATES || '2');
    this.steamService = new SteamService();

    // Create queue
    this.queue = new Queue<UpdateJobData, UpdateJobResult>('steam-updates', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // 30 seconds
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    });

    // Create worker with concurrency limit
    this.worker = new Worker<UpdateJobData, UpdateJobResult>(
      'steam-updates',
      async (job: Job<UpdateJobData, UpdateJobResult>) => {
        return await this.processUpdate(job);
      },
      {
        connection: redisConnection,
        concurrency: this.maxConcurrent, // Process max 2 updates concurrently
        limiter: {
          max: this.maxConcurrent,
          duration: 1000,
        },
      }
    );

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Adds an update job to the queue
   */
  async queueUpdate(data: UpdateJobData, priority?: number): Promise<Job<UpdateJobData, UpdateJobResult>> {
    return await this.queue.add('update', data, {
      priority: priority || 0, // Lower number = higher priority
      jobId: `update-${data.serverUuid}-${data.appId}`,
    });
  }

  /**
   * Gets update job status
   */
  async getJobStatus(jobId: string): Promise<Job<UpdateJobData, UpdateJobResult> | null> {
    return await this.queue.getJob(jobId);
  }

  /**
   * Gets queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Processes a single update job
   */
  private async processUpdate(job: Job<UpdateJobData, UpdateJobResult>): Promise<UpdateJobResult> {
    const { serverUuid, appId, installDir, beta, validate } = job.data;

    console.log(`[UpdateQueue] Processing update for server ${serverUuid}, app ${appId}`);

    try {
      // Track progress
      job.updateProgress(0);

      await this.steamService.updateServer(
        { appId, installDir, beta, validate },
        (progress: SteamUpdateProgress) => {
          // Update job progress
          job.updateProgress(progress.progress);
          job.updateData({
            ...job.data,
            progress: progress.progress,
            status: progress.status,
          } as any);
        }
      );

      // Get updated version
      const version = await this.steamService.getAppVersion(appId, installDir);

      console.log(`[UpdateQueue] Update completed for server ${serverUuid}, version: ${version}`);

      return {
        success: true,
        version: version || undefined,
      };
    } catch (error: any) {
      console.error(`[UpdateQueue] Update failed for server ${serverUuid}:`, error);

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Sets up event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.worker.on('completed', (job: Job<UpdateJobData, UpdateJobResult>) => {
      console.log(`[UpdateQueue] Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job: Job<UpdateJobData, UpdateJobResult> | undefined, error: Error) => {
      if (job) {
        console.error(`[UpdateQueue] Job ${job.id} failed:`, error);
      } else {
        console.error(`[UpdateQueue] Job failed:`, error);
      }
    });

    this.worker.on('error', (error: Error) => {
      console.error(`[UpdateQueue] Worker error:`, error);
    });

    this.queue.on('error', (error: Error) => {
      console.error(`[UpdateQueue] Queue error:`, error);
    });
  }

  /**
   * Closes queue and worker
   */
  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}

