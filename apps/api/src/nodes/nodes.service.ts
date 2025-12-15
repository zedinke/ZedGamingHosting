import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { CreateNodeDto, NodeStatus } from '@zed-hosting/shared-types';
import { LicensingService } from '../licensing/licensing.service';
import { randomBytes } from 'crypto';

/**
 * Nodes Service - handles node registration and management
 */
@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly licensingService: LicensingService
  ) {}

  /**
   * Creates a new node
   * Enforces license node limit
   */
  async createNode(data: CreateNodeDto) {
    // 1. Check license node limit
    const activeNodeCount = await this.prisma.node.count({
      where: {
        status: NodeStatus.ONLINE,
      },
    });

    const limitCheck = await this.licensingService.checkNodeLimit(activeNodeCount);
    if (!limitCheck.allowed) {
      throw new ForbiddenException({
        code: 'NODE_LIMIT_EXCEEDED',
        message: `Maximum ${limitCheck.maxNodes} nodes allowed. Current: ${limitCheck.current}`,
        maxNodes: limitCheck.maxNodes,
        currentNodes: limitCheck.current,
      });
    }

    // 2. Generate API key for daemon authentication
    const apiKey = this.generateApiKey();

    // 3. Create node
    const node = await this.prisma.node.create({
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        publicFqdn: data.publicFqdn,
        totalRam: data.totalRam,
        totalCpu: data.totalCpu,
        diskType: data.diskType,
        isClusterStorage: data.isClusterStorage || false,
        maxConcurrentUpdates: data.maxConcurrentUpdates || 2,
        apiKey,
        status: NodeStatus.PROVISIONING,
      },
    });

    this.logger.log(`Created node: ${node.id} (${node.name})`);

    return node;
  }

  /**
   * Generates a secure API key for node authentication
   */
  private generateApiKey(): string {
    return randomBytes(32).toString('base64');
  }

  /**
   * Registers a node from daemon
   */
  async registerNode(data: {
    agentId: string;
    agentIp: string;
    machineId: string;
    version: string;
    provisioningToken: string;
    capabilities: {
      docker: boolean;
      zfs: boolean;
      nfs: boolean;
    };
  }) {
    // Find node by machineId (UUID from database)
    const node = await this.prisma.node.findUnique({
      where: { id: data.machineId },
    });

    if (!node) {
      throw new Error(`Node not found: ${data.machineId}`);
    }

    // Update node status
    const updated = await this.prisma.node.update({
      where: { id: node.id },
      data: {
        status: NodeStatus.ONLINE,
        lastHeartbeat: new Date(),
      },
    });

    this.logger.log(`Node registered: ${updated.id} (${updated.name})`);

    return updated;
  }

  /**
   * Updates node heartbeat
   */
  async updateHeartbeat(nodeId: string): Promise<void> {
    await this.prisma.node.update({
      where: { id: nodeId },
      data: {
        lastHeartbeat: new Date(),
        status: NodeStatus.ONLINE,
      },
    });
  }

  /**
   * Gets all nodes
   */
  async getAllNodes() {
    return await this.prisma.node.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets a node by ID
   */
  async getNodeById(id: string) {
    return await this.prisma.node.findUnique({
      where: { id },
      include: {
        servers: {
          select: {
            id: true,
            uuid: true,
            gameType: true,
            status: true,
          },
        },
        networkAllocations: true,
      },
    });
  }

  /**
   * Updates a node
   */
  async updateNode(id: string, data: Partial<CreateNodeDto>) {
    const node = await this.prisma.node.findUnique({
      where: { id },
    });

    if (!node) {
      throw new ForbiddenException('Node not found');
    }

    const updated = await this.prisma.node.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.ipAddress && { ipAddress: data.ipAddress }),
        ...(data.publicFqdn !== undefined && { publicFqdn: data.publicFqdn }),
        ...(data.totalRam && { totalRam: data.totalRam }),
        ...(data.totalCpu && { totalCpu: data.totalCpu }),
        ...(data.diskType && { diskType: data.diskType }),
        ...(data.isClusterStorage !== undefined && { isClusterStorage: data.isClusterStorage }),
        ...(data.maxConcurrentUpdates && { maxConcurrentUpdates: data.maxConcurrentUpdates }),
      },
    });

    this.logger.log(`Updated node: ${updated.id} (${updated.name})`);

    return updated;
  }

  /**
   * Deletes a node
   */
  async deleteNode(id: string) {
    const node = await this.prisma.node.findUnique({
      where: { id },
      include: {
        servers: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!node) {
      throw new ForbiddenException('Node not found');
    }

    // Check if node has servers
    if (node.servers.length > 0) {
      throw new ForbiddenException('Cannot delete node with active servers');
    }

    await this.prisma.node.delete({
      where: { id },
    });

    this.logger.log(`Deleted node: ${id}`);

    return { success: true };
  }
}

