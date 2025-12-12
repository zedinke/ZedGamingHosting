import { Controller, Get, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Tasks Controller - handles task endpoints (called by daemon)
 */
@Controller('nodes/:nodeId/tasks')
@Public() // Daemon uses API key authentication
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * Gets pending tasks for a node (called by daemon)
   * GET /api/nodes/:nodeId/tasks
   */
  @Get()
  async getPendingTasks(@Param('nodeId') nodeId: string) {
    return await this.tasksService.getPendingTasks(nodeId);
  }
}

