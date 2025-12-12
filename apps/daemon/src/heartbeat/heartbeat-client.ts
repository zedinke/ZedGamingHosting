import { BackendClient } from '../backend/backend-client';
import * as si from 'systeminformation';

/**
 * Heartbeat Client - sends periodic heartbeats to backend
 * Heartbeat interval: 30 seconds
 */
export class HeartbeatClient {
  private readonly interval: number;


  constructor(private readonly backendClient: BackendClient) {
    this.interval = parseInt(process.env.HEARTBEAT_INTERVAL || '30000');
  }

  /**
   * Starts heartbeat
   */
  start(): void {
    setInterval(() => {
      this.sendHeartbeat().catch((error) => {
        console.error('Heartbeat error:', error);
      });
    }, this.interval);
  }

  /**
   * Sends heartbeat to backend
   */
  private async sendHeartbeat(): Promise<void> {
    const nodeId = process.env.NODE_ID || '';

    // Collect minimal system info
    const [cpu, mem] = await Promise.all([si.currentLoad(), si.mem()]);

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
        disk: [],
        network: { in: 0, out: 0 },
        containerCount: 0,
      },
    });
  }
}


