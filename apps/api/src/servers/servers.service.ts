import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';
import { TasksService } from '../tasks/tasks.service';
import { PortManagerService } from '../networking/port-manager.service';
import { EmailService } from '../email/email.service';
import { UpdateServerDto } from './dto/update-server.dto';
import { randomUUID } from 'crypto';
import { Protocol } from '@zed-hosting/shared-types';
import { getGamePreset } from '@zed-hosting/shared-types';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly tasksService: TasksService,
    private readonly portManager: PortManagerService,
    private readonly emailService: EmailService,
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

    // 3. Preset (image + defaults)
    const preset = getGamePreset(createServerDto.gameType as any);

    // 4. Generate server UUID
    const serverUuid = randomUUID();

    // 5. Merge resources (fallback to preset defaults if not provided)
    const resources = createServerDto.resources || preset?.defaultResources || {
      cpuLimit: 2,
      ramLimit: 4096,
      diskLimit: 20,
    };

    // 6. Merge env vars (preset defaults + user provided)
    const mergedEnv = {
      ...(preset?.env || {}),
      ...(createServerDto.envVars || {}),
    };

    // 7. Build volumes (always server data; optional cluster share)
    const volumes: Array<{ source: string; target: string }> = [
      {
        source: `/var/lib/zedhosting/servers/${serverUuid}`,
        target: '/server',
      },
    ];

    if (preset?.requiresClusterVolume && createServerDto.clusterId) {
      volumes.push({
        source: `/var/lib/zedhosting/clusters/${createServerDto.clusterId}`,
        target: '/arkcluster',
      });
    }

    // 8. Create server record in database FIRST
    const server = await this.prisma.gameServer.create({
      data: {
        uuid: serverUuid,
        gameType: createServerDto.gameType as any,
        status: 'INSTALLING',
        nodeId: createServerDto.nodeId,
        ownerId: userId,
        startupPriority: createServerDto.startupPriority || 10,
        resources,
        envVars: mergedEnv,
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
      },
    });

    // 9. NOW allocate ports (after server exists in DB)
    const portAllocations = await this.portManager.allocatePortBlock({
      nodeId: createServerDto.nodeId,
      gameType: createServerDto.gameType as any,
      protocol: Protocol.BOTH, // Most games need both UDP and TCP
      serverUuid,
    });

    // 10. Re-fetch server with port allocations
    const serverWithPorts = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
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

    // 11. Create provisioning task for daemon
    await this.tasksService.createTask(
      createServerDto.nodeId,
      'PROVISION',
      {
        serverUuid,
        gameType: createServerDto.gameType,
        image: preset?.image,
        resources,
        envVars: mergedEnv,
        ports: portAllocations.map((a: any) => ({
          port: a.port,
          protocol: a.protocol,
          type: a.type,
        })),
        volumes,
      },
    );

    return {
      id: serverWithPorts!.id,
      uuid: serverWithPorts!.uuid,
      gameType: serverWithPorts!.gameType,
      status: serverWithPorts!.status,
      nodeId: serverWithPorts!.nodeId,
      ownerId: serverWithPorts!.ownerId,
      startupPriority: serverWithPorts!.startupPriority,
      resources: serverWithPorts!.resources,
      envVars: serverWithPorts!.envVars,
      clusterId: serverWithPorts!.clusterId,
      createdAt: serverWithPorts!.createdAt,
      updatedAt: serverWithPorts!.updatedAt,
      node: serverWithPorts!.node,
      ports: serverWithPorts!.networkAllocations,
    };
  }

  /**
   * Update server
   */
  async update(uuid: string, updateServerDto: UpdateServerDto, userId: string) {
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

    // Build update data
    const updateData: any = {};

    if (updateServerDto.gameType !== undefined) {
      updateData.gameType = updateServerDto.gameType;
    }

    if (updateServerDto.name !== undefined) {
      updateData.name = updateServerDto.name;
    }

    if (updateServerDto.resources !== undefined) {
      // Merge with existing resources
      const existingResources = (server.resources as any) || {};
      updateData.resources = {
        ...existingResources,
        ...updateServerDto.resources,
      };
    }

    if (updateServerDto.envVars !== undefined) {
      updateData.envVars = updateServerDto.envVars;
    }

    if (updateServerDto.startupPriority !== undefined) {
      updateData.startupPriority = updateServerDto.startupPriority;
    }

    // Update server in database
    const updatedServer = await this.prisma.gameServer.update({
      where: { uuid },
      data: updateData,
      include: {
        node: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            publicFqdn: true,
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
        },
      },
    });

    // If resources changed, create UPDATE task for daemon to restart container with new limits
    if (updateServerDto.resources !== undefined) {
      await this.tasksService.createTask(
        server.nodeId,
        'UPDATE',
        {
          serverUuid: uuid,
          resources: updateData.resources,
          restart: true, // Restart container to apply new resource limits
        },
      );
    }

    return updatedServer;
  }

  /**
   * Update server settings (resources, priority)
   */
  async updateSettings(
    uuid: string,
    settings: { cpuLimit?: number; ramLimit?: number; diskLimit?: number; startupPriority?: number },
    userId: string,
  ) {
    const server = await this.prisma.gameServer.findUnique({ where: { uuid } });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    const mergedResources = {
      ...(server.resources as any),
      ...(settings.cpuLimit !== undefined ? { cpuLimit: settings.cpuLimit } : {}),
      ...(settings.ramLimit !== undefined ? { ramLimit: settings.ramLimit } : {}),
      ...(settings.diskLimit !== undefined ? { diskLimit: settings.diskLimit } : {}),
    };

    const updated = await this.prisma.gameServer.update({
      where: { uuid },
      data: {
        resources: mergedResources,
        ...(settings.startupPriority !== undefined && { startupPriority: settings.startupPriority }),
      },
    });

    // Ask daemon to apply new limits (restart container to apply cgroup changes)
    await this.tasksService.createTask(server.nodeId, 'UPDATE', {
      serverUuid: uuid,
      resources: mergedResources,
      envVars: server.envVars || {},
      restart: true,
    });

    return updated;
  }

  /**
   * Update server environment variables
   */
  async updateEnvironment(uuid: string, envVars: Record<string, string>, userId: string) {
    const server = await this.prisma.gameServer.findUnique({ where: { uuid } });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    const updated = await this.prisma.gameServer.update({
      where: { uuid },
      data: { envVars },
    });

    await this.tasksService.createTask(server.nodeId, 'UPDATE', {
      serverUuid: uuid,
      envVars,
      resources: server.resources,
      restart: true,
    });

    return updated;
  }

  /**
   * Get server metrics
   */
  async getMetrics(
    uuid: string,
    userId: string,
    from?: Date,
    to?: Date,
    limit: number = 100,
  ) {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('SERVER_ACCESS_DENIED'));
    }

    // Build where clause
    const where: any = {
      serverUuid: uuid,
    };

    if (from || to) {
      where.timestamp = {};
      if (from) {
        where.timestamp.gte = from;
      }
      if (to) {
        where.timestamp.lte = to;
      }
    }

    // Get metrics
    const metrics = await this.prisma.metric.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    // Reverse to get chronological order
    return metrics.reverse();
  }

  /**
   * Delete server
   */
  async remove(uuid: string, userId: string) {
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

    // 1. Create DELETE task for daemon to stop container and clean up volumes
    await this.tasksService.createTask(
      server.nodeId,
      'DELETE',
      {
        serverUuid: uuid,
        volumes: [
          {
            source: `/var/lib/zedhosting/servers/${uuid}`,
            target: '/server',
          },
        ],
      },
    );

    // 2. Deallocate ports (this will cascade delete network allocations)
    await this.portManager.deallocatePorts(uuid);

    // 3. Delete server record from database (cascades to subdomains, metrics, etc.)
    await this.prisma.gameServer.delete({
      where: { uuid },
    });

    return {
      success: true,
      message: this.i18n.translate('SERVER_DELETED_SUCCESSFULLY'),
    };
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
    const updatedServer = await this.prisma.gameServer.update({
      where: { uuid },
      data: { status: 'STOPPING' },
      include: { owner: true },
    });

    // Send email notification
    if (updatedServer.owner?.email) {
      this.emailService.sendServerStatusNotification(
        updatedServer.owner.email,
        updatedServer.uuid,
        'STOPPING',
      ).catch((err) => console.error('Failed to send email:', err));
    }

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
    const updatedServer = await this.prisma.gameServer.update({
      where: { uuid },
      data: { status: 'STARTING' },
      include: { owner: true },
    });

    // Send email notification
    if (updatedServer.owner?.email) {
      this.emailService.sendServerStatusNotification(
        updatedServer.owner.email,
        updatedServer.uuid,
        'STARTING',
      ).catch((err) => console.error('Failed to send email:', err));
    }

    return { message: this.i18n.translate('SERVER_STARTED_SUCCESSFULLY') };
  }

  async createBackup(serverUuid: string, name: string | undefined, userId: string): Promise<{ id: string; name: string; createdAt: Date }> {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('FORBIDDEN'));
    }

    // TODO: Trigger backup via daemon API
    // For now, return a mock backup response
    // In production, this should create a backup record and trigger the daemon
    const backup = {
      id: `backup-${Date.now()}`,
      name: name || `Backup ${new Date().toISOString()}`,
      createdAt: new Date(),
    };

    // Send email notification
    const serverWithOwner = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
      include: { owner: true },
    });
    if (serverWithOwner?.owner?.email) {
      this.emailService.sendBackupNotification(
        serverWithOwner.owner.email,
        serverWithOwner.uuid,
        'created',
      ).catch((err) => console.error('Failed to send email:', err));
    }

    return backup;
  }

  async getBackups(serverUuid: string, userId: string): Promise<any[]> {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('FORBIDDEN'));
    }

    // TODO: Fetch backups from database or daemon API
    // For now, return empty array
    return [];
  }

  async restoreBackup(serverUuid: string, backupId: string, userId: string): Promise<void> {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
      include: { owner: true },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('FORBIDDEN'));
    }

    // TODO: Trigger restore via daemon API
    // For now, just validate the backup exists
    if (!backupId) {
      throw new NotFoundException('Backup not found');
    }

    // Send email notification
    if (server.owner?.email) {
      this.emailService.sendBackupNotification(
        server.owner.email,
        server.uuid,
        'restored',
      ).catch((err) => console.error('Failed to send email:', err));
    }
  }

  async deleteBackup(serverUuid: string, backupId: string, userId: string): Promise<void> {
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.translate('SERVER_NOT_FOUND'));
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException(this.i18n.translate('FORBIDDEN'));
    }

    // TODO: Delete backup files via daemon API
    // For now, just validate
    if (!backupId) {
      throw new NotFoundException('Backup not found');
    }
  }
}

