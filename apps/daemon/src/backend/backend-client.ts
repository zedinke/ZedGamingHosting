import { validateEnv } from '@zed-hosting/utils';
import https from 'https';

/**
 * Backend Client - handles communication with backend API
 */
export class BackendClient {
  private readonly managerUrl: string;
  private readonly apiKey: string;
  private readonly nodeId: string;
  private readonly httpsAgent: https.Agent;

  constructor() {
    const env = validateEnv();
    // Use BACKEND_URL if available (docker), fall back to MANAGER_URL
    this.managerUrl = process.env.BACKEND_URL || env.MANAGER_URL;
    this.apiKey = env.API_KEY;
    this.nodeId = env.NODE_ID;
    
    // Create HTTPS agent that skips certificate verification (for self-signed certs in development)
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  /**
   * Helper method for fetch calls with HTTPS agent support
   */
  private async fetchWithAgent(url: string, options: any = {}) {
    return fetch(url, {
      ...options,
      ...(this.managerUrl.startsWith('https') && { dispatcher: this.httpsAgent as any }),
    });
  }

  /**
   * Registers daemon with backend
   */
  async register(): Promise<void> {
    const response = await this.fetchWithAgent(`${this.managerUrl}/api/agent/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        nodeId: this.nodeId,
        daemonVersion: '1.0.0',
        systemInfo: {
          cpu: 0,
          memory: { used: 0, total: 0, percent: 0 },
          disk: [],
          network: { in: 0, out: 0 },
          containerCount: 0,
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
    await this.fetchWithAgent(`${this.managerUrl}/api/agent/heartbeat`, {
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
    const response = await this.fetchWithAgent(`${this.managerUrl}/api/agent/tasks?nodeId=${nodeId}`, {
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
   * Reports task result to backend
   */
  async reportTaskResult(taskId: string, status: 'COMPLETED' | 'FAILED', result?: any, error?: string): Promise<void> {
    await this.fetchWithAgent(`${this.managerUrl}/api/agent/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ status, result, error }),
    });
  }

  /**
   * Gets expected servers from backend
   */
  async getExpectedServers(): Promise<unknown[]> {
    const nodeId = process.env.NODE_ID || '';
    const response = await this.fetchWithAgent(`${this.managerUrl}/api/nodes/${nodeId}/servers`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }


}
