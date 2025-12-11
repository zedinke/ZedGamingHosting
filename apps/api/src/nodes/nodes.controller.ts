import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { CreateNodeDto } from '@zed-hosting/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Nodes Controller - handles node management endpoints
 */
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  /**
   * Creates a new node
   * POST /api/nodes
   */
  @Post()
  async createNode(@Body() dto: CreateNodeDto) {
    return await this.nodesService.createNode(dto);
  }

  /**
   * Gets all nodes
   * GET /api/nodes
   */
  @Get()
  async getAllNodes() {
    return await this.nodesService.getAllNodes();
  }

  /**
   * Gets a node by ID
   * GET /api/nodes/:id
   */
  @Get(':id')
  async getNodeById(@Param('id') id: string) {
    return await this.nodesService.getNodeById(id);
  }

  /**
   * Registers a node (called by daemon)
   * POST /api/nodes/register
   */
  @Public()
  @Post('register')
  async registerNode(@Body() data: {
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
    return await this.nodesService.registerNode(data);
  }

  /**
   * Updates node heartbeat (called by daemon)
   * POST /api/nodes/:id/heartbeat
   */
  @Public()
  @Post(':id/heartbeat')
  async updateHeartbeat(@Param('id') id: string) {
    await this.nodesService.updateHeartbeat(id);
    return { success: true };
  }
}

