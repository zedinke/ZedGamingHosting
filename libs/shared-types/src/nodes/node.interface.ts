import { DiskType, NodeStatus } from './node.dto';

/**
 * Node interface (matches Prisma model)
 */
export interface Node {
  id: string;
  apiKey: string;
  ipAddress: string;
  publicFqdn?: string;
  totalRam: number; // MB
  totalCpu: number; // Cores
  diskType: DiskType;
  isClusterStorage: boolean;
  maintenanceMode: boolean;
  maxConcurrentUpdates: number;
  status: NodeStatus;
  lastHeartbeat?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Node capabilities
 */
export interface NodeCapabilities {
  docker: boolean;
  zfs: boolean;
  nfs: boolean;
}

