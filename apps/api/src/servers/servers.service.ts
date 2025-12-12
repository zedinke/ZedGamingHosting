import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Get all servers for the current user
   */
  async findAll(userId: string) {
    const servers = await this.prisma.gameServer.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        node: {
          select: {
            id: true,
            publicFqdn: true,
            ipAddress: true,
          },
        },
        networkAllocations: {
          select: {
            port: true,
            protocol: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return servers.map((server) => ({
      id: server.id,
      uuid: server.uuid,
      gameType: server.gameType,
      status: server.status,
      nodeId: server.nodeId,
      ownerId: server.ownerId,
      startupPriority: server.startupPriority,
      resources: server.resources as any,
      envVars: server.envVars as any,
      clusterId: server.clusterId,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
      node: server.node,
      ports: server.networkAllocations,
    }));
  }

  /**
   * Get a single server by UUID
   */
  async findOne(uuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
      include: {
        node: {
          select: {
            id: true,
            publicFqdn: true,
            ipAddress: true,
          },
        },
        networkAllocations: {
          select: {
            port: true,
            protocol: true,
            type: true,
          },
        },
        metrics: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
          select: {
            cpuUsage: true,
            ramUsage: true,
            ramUsagePercent: true,
            diskUsage: true,
            diskUsagePercent: true,
          },
        },
      },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    const latestMetrics = server.metrics[0] || null;

    return {
      id: server.id,
      uuid: server.uuid,
      gameType: server.gameType,
      status: server.status,
      nodeId: server.nodeId,
      ownerId: server.ownerId,
      startupPriority: server.startupPriority,
      resources: server.resources as any,
      envVars: server.envVars as any,
      clusterId: server.clusterId,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
      node: server.node,
      ports: server.networkAllocations,
      metrics: latestMetrics,
    };
  }

  /**
   * Create a new server
   */
  async create(_createServerDto: any, _userId: string) {
    // TODO: Implement server creation logic with provisioning
    // For now, return a placeholder
    throw new Error('Server creation not yet implemented');
  }

  /**
   * Update server
   */
  async update(uuid: string, _updateServerDto: any, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // TODO: Implement update logic
    throw new Error('Server update not yet implemented');
  }

  /**
   * Delete server
   */
  async remove(uuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // TODO: Implement deletion logic
    throw new Error('Server deletion not yet implemented');
  }

  /**
   * Start server
   */
  async start(uuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // TODO: Create task to start server via daemon
    throw new Error('Server start not yet implemented');
  }

  /**
   * Stop server
   */
  async stop(uuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // TODO: Create task to stop server via daemon
    throw new Error('Server stop not yet implemented');
  }

  /**
   * Restart server
   */
  async restart(uuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // TODO: Create task to restart server via daemon
    throw new Error('Server restart not yet implemented');
  }
}

