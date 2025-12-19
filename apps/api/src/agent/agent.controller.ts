import { Controller, Post, Get, Patch, Body, Param, Query, HttpCode, HttpStatus, OnModuleInit } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { AgentService } from './agent.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

/**
 * Agent Controller - REST endpoints for daemon communication
 * These endpoints are called by daemon instances on game server nodes
 */
@Controller('agent')
export class AgentController implements OnModuleInit {
  constructor(
    private readonly agentService: AgentService,
    private readonly webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * Inject WebSocket gateway into agent service on module initialization
   */
  onModuleInit() {
    this.agentService.setWebSocketGateway(this.webSocketGateway);
  }

  /**
   * POST /agent/register
   * Registers a daemon instance with the backend
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
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
  @Public()
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
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
  @Public()
  @Get('tasks')
  async getTasks(@Query('nodeId') nodeId: string) {
    return this.agentService.getPendingTasks(nodeId);
  }

  /**
   * PATCH /agent/tasks/:id
   * Updates task status and result
   */
  @Public()
  @Patch('tasks/:id')
  @HttpCode(HttpStatus.OK)
  async updateTask(
    @Param('id') id: string,
    @Body() body: { status: 'COMPLETED' | 'FAILED'; result?: any; error?: string }
  ) {
    return this.agentService.updateTaskStatus(id, body);
  }
}
