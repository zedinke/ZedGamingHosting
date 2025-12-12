import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';
import { TasksService } from '../tasks/tasks.service';
import { PortManagerService } from '../networking/port-manager.service';
import { randomUUID } from 'crypto';
import { Protocol } from '@zed-hosting/shared-types';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly tasksService: TasksService,
    private readonly portManager: PortManagerService,
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
  async create(createServerDto: any, userId: string) {
    // 1. Verify node exists and is available
    const node = await this.prisma.node.findUnique({
      where: { id: createServerDto.nodeId },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    if (node.status !== 'ONLINE') {
      throw new BadRequestException('Node is not available');
    }

    // 2. Check if user has quota/resources (TODO: implement quota checking)

    // 3. Generate server UUID
    const serverUuid = randomUUID();

    // 4. Allocate ports for the server
    const portAllocations = await this.portManager.allocatePortBlock({
      nodeId: createServerDto.nodeId,
      gameType: createServerDto.gameType as any,
      protocol: Protocol.BOTH, // Most games need both UDP and TCP
      serverUuid,
    });

    // 5. Create server record in database
    const server = await this.prisma.gameServer.create({
      data: {
        uuid: serverUuid,
        gameType: createServerDto.gameType as any,
        status: 'INSTALLING',
        nodeId: createServerDto.nodeId,
        ownerId: userId,
        startupPriority: createServerDto.startupPriority || 10,
        resources: {
          cpuLimit: createServerDto.resources.cpuLimit,
          ramLimit: createServerDto.resources.ramLimit,
          diskLimit: createServerDto.resources.diskLimit,
        },
        envVars: createServerDto.envVars || {},
        clusterId: createServerDto.clusterId || null,
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
    });

    // 6. Create provisioning task for daemon
    await this.tasksService.createTask(
      createServerDto.nodeId,
      'PROVISION',
      {
        serverUuid,
        gameType: createServerDto.gameType,
        resources: createServerDto.resources,
        envVars: createServerDto.envVars || {},
        ports: portAllocations.map((a: any) => ({
          port: a.port,
          protocol: a.protocol,
          type: a.type,
        })),
        volumes: [
          {
            source: `/var/lib/zedhosting/servers/${serverUuid}`,
            target: '/server',
          },
        ],
      },
    );

    return {
      id: server.id,
      uuid: server.uuid,
      gameType: server.gameType,
      status: server.status,
      nodeId: server.nodeId,
      ownerId: server.ownerId,
      startupPriority: server.startupPriority,
      resources: server.resources,
      envVars: server.envVars,
      clusterId: server.clusterId,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
      node: server.node,
      ports: server.networkAllocations,
    };
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
      include: { node: true },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // Create task for daemon to start the server
    await this.tasksService.createTask(
      server.nodeId,
      'START',
      { serverUuid: server.uuid },
    );

    // Update server status
    await this.prisma.gameServer.update({
      where: { uuid },
      data: { status: 'STARTING' },
    });

    return { message: this.i18n.translate('SERVER_STARTED_SUCCESSFULLY') };
  }

  /**
   * Stop server
   */
  async stop(uuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
      include: { node: true },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // Create task for daemon to stop the server
    await this.tasksService.createTask(
      server.nodeId,
      'STOP',
      { serverUuid: server.uuid },
    );

    // Update server status
    await this.prisma.gameServer.update({
      where: { uuid },
      data: { status: 'STOPPING' },
    });

    return { message: this.i18n.translate('SERVER_STOPPED_SUCCESSFULLY') };
  }

  /**
   * Restart server
   */
  async restart(uuid: string, userId: string) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
      include: { node: true },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // Create task for daemon to restart the server
    await this.tasksService.createTask(
      server.nodeId,
      'RESTART',
      { serverUuid: server.uuid },
    );

    // Update server status to STARTING (restart = stop then start)
    await this.prisma.gameServer.update({
      where: { uuid },
      data: { status: 'STARTING' },
    });

    return { message: this.i18n.translate('SERVER_STARTED_SUCCESSFULLY') };
  }
}

