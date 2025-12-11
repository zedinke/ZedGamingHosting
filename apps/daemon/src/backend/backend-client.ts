import { validateEnv } from '@zed-hosting/utils';

/**
 * Backend Client - handles communication with backend API
 */
export class BackendClient {
  private readonly managerUrl: string;
  private readonly apiKey: string;
  private readonly nodeId: string;

  constructor() {
    const env = validateEnv();
    this.managerUrl = env.MANAGER_URL;
    this.apiKey = env.API_KEY;
    this.nodeId = env.NODE_ID;
  }

  /**
   * Registers daemon with backend
   */
  async register(): Promise<void> {
    const response = await fetch(`${this.managerUrl}/api/nodes/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        agentId: this.nodeId,
        agentIp: await this.getLocalIp(),
        machineId: this.nodeId,
        version: '1.0.0',
        provisioningToken: process.env.PROVISIONING_TOKEN || '',
        capabilities: {
          docker: true,
          zfs: true,
          nfs: false, // Will be detected
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register: ${response.statusText}`);
    }
  }

  /**
   * Sends heartbeat to backend
   */
  async sendHeartbeat(data: {
    nodeId: string;
    timestamp: number;
    systemInfo: {
      cpu: number;
      memory: { used: number; total: number; percent: number };
      disk: Array<{ mount: string; used: number; total: number; percent: number }>;
      network: { in: number; out: number };
      containerCount: number;
    };
  }): Promise<void> {
    await fetch(`${this.managerUrl}/api/nodes/${data.nodeId}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Gets pending tasks from backend
   */
  async getPendingTasks(nodeId: string): Promise<unknown[]> {
    const response = await fetch(`${this.managerUrl}/api/nodes/${nodeId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  /**
   * Gets expected servers from backend
   */
  async getExpectedServers(): Promise<unknown[]> {
    const nodeId = process.env.NODE_ID || '';
    const response = await fetch(`${this.managerUrl}/api/nodes/${nodeId}/servers`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  /**
   * Gets local IP address
   */
  private async getLocalIp(): Promise<string> {
    // Simple implementation - would use network interfaces in production
    return process.env.NODE_IP || '127.0.0.1';
  }
}
