import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

/**
 * Provisions game servers for paid orders
 * Coordinates with daemon to create servers on available nodes
 */
@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Provision a game server for a paid order
   */
  async provisionServerForOrder(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { plan: true, user: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== 'PAID') {
      throw new Error(`Cannot provision server for non-PAID order (status: ${order.status})`);
    }

    if (order.serverId) {
      this.logger.warn(`Order ${orderId} already has server ${order.serverId}, skipping provisioning`);
      const server = await this.prisma.gameServer.findUnique({
        where: { uuid: order.serverId },
      });
      return server;
    }

    try {
      // Find available node for the game type
      const node = await this.findAvailableNode(order.plan.gameType);
      if (!node) {
        throw new Error(`No available nodes for game type ${order.plan.gameType}`);
      }

      // Generate unique server UUID (format: 8 random hex chars)
      const serverUuid = Math.random().toString(16).slice(2, 10);

      // Create game server
      const gameServer = await this.prisma.gameServer.create({
        data: {
          uuid: serverUuid,
          gameType: order.plan.gameType,
          nodeId: node.id,
          ownerId: order.userId,
          planId: order.planId,
          status: 'INSTALLING',
          resources: {
            cpuLimit: order.plan.cpuCores || 2,
            ramLimit: order.plan.ramMb || 2048,
            diskLimit: order.plan.diskGb || 20,
          },
          startupPriority: 10,
        },
      });

      // Link order to server
      await this.prisma.order.update({
        where: { id: orderId },
        data: { 
          serverId: gameServer.uuid,
          status: 'PROVISIONING',
        },
      });

      this.logger.log(`Provisioned server ${gameServer.uuid} for order ${orderId}`);

      return gameServer;
    } catch (error) {
      this.logger.error(`Failed to provision server for order ${orderId}: ${error}`);
      throw error;
    }
  }

  /**
   * Find an available node for the given game type
   * Considers node capacity and resource availability
   */
  private async findAvailableNode(gameType: string) {
    // Find nodes that are:
    // 1. Online
    // 2. Have the game type support
    // 3. Are not at capacity
    const nodes = await this.prisma.node.findMany({
      where: {
        status: 'ONLINE',
      },
      include: {
        servers: {
          where: { gameType: gameType as any },
        },
      },
    });

    if (nodes.length === 0) {
      return null;
    }

    // Sort by server count (ascending) to balance load
    nodes.sort((a, b) => a.servers.length - b.servers.length);

    // Return node with least servers
    return nodes[0];
  }
}
