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

