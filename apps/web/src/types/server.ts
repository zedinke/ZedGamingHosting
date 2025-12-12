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
  uuid: string;
  name: string;
  gameType: string;
  status: 'ONLINE' | 'OFFLINE' | 'STARTING' | 'STOPPING' | 'RESTARTING';
  nodeId: string;
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
}

