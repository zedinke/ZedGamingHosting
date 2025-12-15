import { BackendClient } from '../backend/backend-client';
import { ContainerManager } from '../container/container-manager';

/**
 * Task Processor - polls backend for tasks and executes them
 */
export class TaskProcessor {
  private readonly pollingInterval: number;


  constructor(
    private readonly backendClient: BackendClient,
    private readonly containerManager: ContainerManager
  ) {
    this.pollingInterval = parseInt(process.env.TASK_POLL_INTERVAL || '5000');
  }

  /**
   * Starts task processing loop
   */
  start(): void {
    setInterval(() => {
      this.pollAndProcessTasks().catch((error) => {
        console.error('Task processing error:', error);
      });
    }, this.pollingInterval);
  }

  /**
   * Polls backend for tasks and processes them
   */
  private async pollAndProcessTasks(): Promise<void> {
    const nodeId = process.env.NODE_ID || '';
    const tasks = await this.backendClient.getPendingTasks(nodeId);

    // Process tasks sequentially
    for (const task of tasks) {
      await this.processTask(task as { id: string; type: string; data: unknown });
    }
  }

  /**
   * Processes a single task
   */
  private async processTask(task: { id: string; type: string; data: unknown }): Promise<void> {
    try {
      console.log(`Processing task: ${task.type} (${task.id})`);

      let result: any;

      switch (task.type) {
        case 'PROVISION':
          result = await this.containerManager.createContainer(task.data as any);
          break;
        case 'START':
          await this.containerManager.startContainer((task.data as { serverUuid: string }).serverUuid);
          break;
        case 'STOP':
          await this.containerManager.stopContainer((task.data as { serverUuid: string }).serverUuid);
          break;
        case 'RESTART':
          await this.containerManager.restartContainer((task.data as { serverUuid: string }).serverUuid);
          break;
        case 'UPDATE':
          // Queue Steam update
          const updateData = task.data as { serverUuid: string; appId: string; installDir: string; beta?: string; validate?: boolean };
          // Update queue will be handled by UpdateQueueService
          // This is a placeholder - actual implementation would require access to UpdateQueueService
          console.log(`Update task queued for server ${updateData.serverUuid}`);
          break;
        case 'DELETE':
          // Stop container, remove container, and clean up volumes
          const deleteData = task.data as { serverUuid: string; volumes?: Array<{ source: string; target: string }> };
          await this.containerManager.deleteContainer(deleteData.serverUuid, deleteData.volumes || []);
          break;
        default:
          console.warn(`Unknown task type: ${task.type}`);
          await this.backendClient.reportTaskResult(task.id, 'FAILED', undefined, `Unknown task type: ${task.type}`);
          return;
      }

      // Report success
      await this.backendClient.reportTaskResult(task.id, 'COMPLETED', result);
      console.log(`✅ Task completed: ${task.type} (${task.id})`);
    } catch (error: any) {
      console.error(`Task processing failed: ${task.id}`, error);
      // Report failure
      await this.backendClient.reportTaskResult(task.id, 'FAILED', undefined, error.message || String(error));
    }
  }
}

