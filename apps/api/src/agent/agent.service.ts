import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { Prisma } from '@prisma/client';

/**
 * Agent Service - business logic for daemon communication
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers or updates a daemon instance
   */
  async registerDaemon(data: {
    nodeId: string;
    daemonVersion: string;
    systemInfo: {
      cpu: number;
      memory: { used: number; total: number; percent: number };
      disk: Array<{ mount: string; used: number; total: number; percent: number }>;
      network: { in: number; out: number };
      containerCount: number;
    };
  }) {
    // Find node by ID
    const node = await this.prisma.node.findUnique({
      where: { id: data.nodeId },
    });

    if (!node) {
      throw new NotFoundException(`Node ${data.nodeId} not found`);
    }

    // Update node status to ONLINE
    await this.prisma.node.update({
      where: { id: data.nodeId },
      data: {
        status: 'ONLINE',
        lastHeartbeat: new Date(),
      },
    });

    this.logger.log(`Daemon registered: ${node.name} (${data.daemonVersion})`);

    return { success: true, nodeId: data.nodeId };
  }

  /**
   * Processes heartbeat from daemon
   */
  async processHeartbeat(data: {
    nodeId: string;
    timestamp: number;
    systemInfo: {
      cpu: number;
      memory: { used: number; total: number; percent: number };
      disk: Array<{ mount: string; used: number; total: number; percent: number }>;
      network: { in: number; out: number };
      containerCount: number;
    };
  }) {
    // Find node
    const node = await this.prisma.node.findUnique({
      where: { id: data.nodeId },
    });

    if (!node) {
      throw new NotFoundException(`Node ${data.nodeId} not found`);
    }

    // Update last heartbeat and status
    await this.prisma.node.update({
      where: { id: data.nodeId },
      data: {
        status: 'ONLINE',
        lastHeartbeat: new Date(),
      },
    });

    // Store metrics in database
    await this.prisma.metric.create({
      data: {
        nodeId: data.nodeId,
        timestamp: new Date(data.timestamp),
        metricType: 'SYSTEM',
        value: data.systemInfo.cpu,
        unit: 'PERCENT',
        metadata: data.systemInfo as unknown as Prisma.JsonObject,
      },
    });

    return { success: true };
  }

  /**
   * Gets pending tasks for a node
   */
  async getPendingTasks(nodeId: string) {
    // Verify node exists
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundException(`Node ${nodeId} not found`);
    }

    // Get pending tasks for this node
    const tasks = await this.prisma.task.findMany({
      where: {
        nodeId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10, // Return max 10 tasks at a time
    });

    // Mark tasks as IN_PROGRESS
    if (tasks.length > 0) {
      await this.prisma.task.updateMany({
        where: {
          id: { in: tasks.map((t) => t.id) },
        },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });
    }

    return tasks.map((task) => ({
      id: task.id,
      type: task.action,
      data: task.payload,
    }));
  }

  /**
   * Updates task status and result
   */
  async updateTaskStatus(taskId: string, data: { status: 'COMPLETED' | 'FAILED'; result?: any; error?: string }) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    // Update task status
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: data.status,
        completedAt: new Date(),
        result: data.result ? (data.result as unknown as Prisma.JsonObject) : task.result,
        error: data.error,
      },
    });

    // If this was a PROVISION task and it succeeded, update server status
    if (task.action === 'PROVISION' && data.status === 'COMPLETED') {
      const payload = task.payload as any;
      if (payload?.serverUuid) {
        await this.prisma.gameServer.update({
          where: { uuid: payload.serverUuid },
          data: { status: 'STOPPED' }, // Container created but not running
        });
      }
    }

    // If this was a START task and it succeeded, update server status
    if (task.action === 'START' && data.status === 'COMPLETED') {
      const payload = task.payload as any;
      if (payload?.serverUuid) {
        await this.prisma.gameServer.update({
          where: { uuid: payload.serverUuid },
          data: { status: 'RUNNING' },
        });
      }
    }

    // If this was a STOP task and it succeeded, update server status
    if (task.action === 'STOP' && data.status === 'COMPLETED') {
      const payload = task.payload as any;
      if (payload?.serverUuid) {
        await this.prisma.gameServer.update({
          where: { uuid: payload.serverUuid },
          data: { status: 'STOPPED' },
        });
      }
    }

    this.logger.log(`Task ${taskId} ${data.status}`);

    return { success: true };
  }
}
