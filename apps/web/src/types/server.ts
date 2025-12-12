export interface ServerNode {
  id: string;
  publicFqdn?: string;
  ipAddress?: string;
}

export interface ServerPort {
  port: number;
  protocol: string;
  type: string;
}

export interface GameServer {
  id: string;
  uuid: string;
  gameType: string;
  status: 'INSTALLING' | 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'CRASHED' | 'UPDATING';
  nodeId: string;
  ownerId: string;
  startupPriority?: number;
  resources?: {
    cpuLimit?: number;
    ramLimit?: number;
    diskLimit?: number;
  };
  envVars?: Record<string, string>;
  clusterId?: string;
  createdAt: Date;
  updatedAt: Date;
  node?: ServerNode;
  ports?: ServerPort[];
  metrics?: {
    cpuUsage?: number;
    ramUsage?: number;
    ramUsagePercent?: number;
    diskUsage?: number;
    diskUsagePercent?: number;
  };
}
