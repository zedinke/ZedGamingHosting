import { GameType, ServerStatus } from './server.dto';

/**
 * Server resources
 */
export interface ServerResources {
  cpuLimit: number; // Cores
  ramLimit: number; // MB
  diskLimit: number; // GB
}

/**
 * Game server interface (matches Prisma model)
 */
export interface GameServer {
  id: string;
  uuid: string;
  gameType: GameType;
  status: ServerStatus;
  nodeId: string;
  ownerId: string;
  startupPriority: number;
  resources: ServerResources;
  envVars: Record<string, string>;
  clusterId?: string;
  createdAt: Date;
  updatedAt: Date;
}


