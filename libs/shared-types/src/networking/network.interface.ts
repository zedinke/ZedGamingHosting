import { Protocol, PortType } from './port-allocation.dto';

/**
 * Network allocation interface (matches Prisma model)
 */
export interface NetworkAllocation {
  id: string;
  nodeId: string;
  port: number;
  protocol: Protocol;
  type: PortType;
  serverUuid?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Port statistics
 */
export interface PortStatistics {
  nodeId: string;
  totalPorts: number;
  usedPorts: number;
  availablePorts: number;
  utilizationPercent: number;
  largestFreeBlock: number;
  usageByType: Record<PortType, number>;
  allocations: Array<{
    port: number;
    protocol: Protocol;
    type: PortType;
    serverUuid?: string;
  }>;
}


