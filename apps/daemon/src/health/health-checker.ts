import { ContainerManager } from '../container/container-manager';
import { BackendClient } from '../backend/backend-client';

/**
 * Health Checker - monitors container health
 * Checks containers every 30 seconds
 */
export class HealthChecker {
  private readonly interval: number;


  constructor(
    private readonly containerManager: ContainerManager,
    _backendClient: BackendClient
  ) {
    this.interval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');
  }

  /**
   * Starts health checking
   */
  start(): void {
    setInterval(() => {
      this.checkAllContainers().catch((error) => {
        console.error('Health check error:', error);
      });
    }, this.interval);
  }

  /**
   * Checks all containers
   */
  private async checkAllContainers(): Promise<void> {
    const containers = await this.containerManager.getManagedContainers();

    for (const containerInfo of containers) {
      if (containerInfo.State === 'running') {
        // Simple health check - just verify container is still running
        // In production, would use game query protocol
        const container = this.containerManager['docker'].getContainer(containerInfo.Id);
        const inspect = await container.inspect();

        if (inspect.State.Status !== 'running') {
          console.warn(`Container ${containerInfo.Names[0]} is not running`);
          // Could trigger alert here
        }
      }
    }
  }
}

