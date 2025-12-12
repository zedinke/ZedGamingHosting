import { Injectable } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { TaskStatus, TaskType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new task for a node
   */
  async createTask(
    nodeId: string,
    type: TaskType,
    data: any,
  ) {
    return await this.prisma.task.create({
      data: {
        nodeId,
        type,
        status: TaskStatus.PENDING,
        data,
      },
    });
  }

  /**
   * Gets pending tasks for a node (called by daemon)
   */
  async getPendingTasks(nodeId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        nodeId,
        status: TaskStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10, // Limit to 10 tasks per poll
    });

    // Mark tasks as processing
    if (tasks.length > 0) {
      await this.prisma.task.updateMany({
        where: {
          id: {
            in: tasks.map((t) => t.id),
          },
        },
        data: {
          status: TaskStatus.PROCESSING,
        },
      });
    }

    return tasks.map((task) => ({
      id: task.id,
      type: task.type,
      data: task.data,
    }));
  }

  /**
   * Marks a task as completed
   */
  async markTaskCompleted(taskId: string) {
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Marks a task as failed
   */
  async markTaskFailed(taskId: string, error: string) {
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.FAILED,
        error,
        completedAt: new Date(),
      },
    });
  }
}

