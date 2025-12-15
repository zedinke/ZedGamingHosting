import { Controller, Post, Get, Patch, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Agent Controller - REST endpoints for daemon communication
 * These endpoints are called by daemon instances on game server nodes
 */
@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * POST /agent/register
   * Registers a daemon instance with the backend
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register daemon instance' })
  @ApiResponse({ status: 200, description: 'Daemon registered successfully' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async register(
    @Body()
    body: {
      nodeId: string;
      daemonVersion: string;
      systemInfo: {
        cpu: number;
        memory: { used: number; total: number; percent: number };
        disk: Array<{ mount: string; used: number; total: number; percent: number }>;
        network: { in: number; out: number };
        containerCount: number;
      };
    }
  ) {
    return this.agentService.registerDaemon(body);
  }

  /**
   * POST /agent/heartbeat
   * Sends heartbeat from daemon to backend
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat received' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async heartbeat(
    @Body()
    body: {
      nodeId: string;
      timestamp: number;
      systemInfo: {
        cpu: number;
        memory: { used: number; total: number; percent: number };
        disk: Array<{ mount: string; used: number; total: number; percent: number }>;
        network: { in: number; out: number };
        containerCount: number;
      };
    }
  ) {
    return this.agentService.processHeartbeat(body);
  }

  /**
   * GET /agent/tasks?nodeId={nodeId}
   * Gets pending tasks for a daemon instance
   */
  @Get('tasks')
  @ApiOperation({ summary: 'Get pending tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async getTasks(@Query('nodeId') nodeId: string) {
    return this.agentService.getPendingTasks(nodeId);
  }

  /**
   * PATCH /agent/tasks/:id
   * Updates task status and result
   */
  @Patch('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTask(
    @Param('id') id: string,
    @Body() body: { status: 'COMPLETED' | 'FAILED'; result?: any; error?: string }
  ) {
    return this.agentService.updateTaskStatus(id, body);
  }
}
