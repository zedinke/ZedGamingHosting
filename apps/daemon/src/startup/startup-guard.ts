import { ContainerManager } from '../container/container-manager';

interface StartupItem {
  serverUuid: string;
  priority: number;
  queuedAt: number;
}

/**
 * Startup Guard - prevents startup storm
 * Queues server starts and processes them sequentially with delays
 */
export class StartupGuard {
  private startupQueue: StartupItem[] = [];
  private isProcessing = false;
  private readonly delayBetweenStarts: number;

  constructor(private readonly containerManager: ContainerManager) {
    this.delayBetweenStarts = parseInt(process.env.STARTUP_DELAY || '5000');
  }

  /**
   * Queues a server start
   */
  async queueServerStart(serverUuid: string, priority: number): Promise<void> {
    this.startupQueue.push({
      serverUuid,
      priority,
      queuedAt: Date.now(),
    });

    // Sort by priority (lower number = higher priority)
    this.startupQueue.sort((a, b) => a.priority - b.priority);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processStartupQueue();
    }
  }

  /**
   * Processes startup queue sequentially
   */
  private async processStartupQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.startupQueue.length > 0) {
      const item = this.startupQueue.shift();
      if (!item) break;

      try {
        console.log(`Starting server ${item.serverUuid} (priority: ${item.priority})`);
        await this.containerManager.startContainer(item.serverUuid);

        // Wait before starting next server
        if (this.startupQueue.length > 0) {
          await this.sleep(this.delayBetweenStarts);
        }
      } catch (error) {
        console.error(`Failed to start server ${item.serverUuid}:`, error);
        // Continue with next server
      }
    }

    this.isProcessing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


