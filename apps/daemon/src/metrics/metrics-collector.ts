import * as si from 'systeminformation';
import { BackendClient } from '../backend/backend-client';
import { ContainerManager } from '../container/container-manager';

/**
 * Metrics Collector - collects system and container metrics
 * Sends metrics to backend every 15 seconds
 */
export class MetricsCollector {
  private readonly interval: number;


  constructor(private readonly backendClient: BackendClient) {
    this.interval = parseInt(process.env.METRICS_INTERVAL || '15000');
  }

  /**
   * Starts metrics collection
   */
  start(): void {
    setInterval(() => {
      this.collectAndSendMetrics().catch((error) => {
        console.error('Metrics collection error:', error);
      });
    }, this.interval);
  }

  /**
   * Collects and sends metrics
   */
  private async collectAndSendMetrics(): Promise<void> {
    const nodeId = process.env.NODE_ID || '';

    // Collect system metrics
    const [cpu, mem, fs, network] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
    ]);

    // Get container count
    const containerManager = new ContainerManager();
    await containerManager.initialize();
    const containers = await containerManager.getManagedContainers();

    // Send to backend
    await this.backendClient.sendHeartbeat({
      nodeId,
      timestamp: Date.now(),
      systemInfo: {
        cpu: cpu.currentLoad,
        memory: {
          used: mem.used,
          total: mem.total,
          percent: (mem.used / mem.total) * 100,
        },
        disk: fs.map((f) => ({
          mount: f.mount,
          used: f.used * 1024 * 1024 * 1024, // GB to bytes
          total: f.size * 1024 * 1024 * 1024,
          percent: (f.used / f.size) * 100,
        })),
        network: {
          in: network[0]?.rx_bytes || 0,
          out: network[0]?.tx_bytes || 0,
        },
        containerCount: containers.length,
      },
    });
  }
}


