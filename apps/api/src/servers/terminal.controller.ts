import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TerminalService } from './terminal.service';

interface ExecuteCommandDto {
  command: string;
}

/**
 * Terminal Controller
 * WebSocket and REST endpoints for server terminal access
 */
@Controller('servers/:serverId/terminal')
@UseGuards(JwtAuthGuard)
export class TerminalController {
  private readonly logger = new Logger(TerminalController.name);

  constructor(private readonly terminalService: TerminalService) {}

  /**
   * Create a new terminal session
   * POST /servers/:serverId/terminal/session
   */
  @Post('session')
  async createSession(
    @Request() req: any,
    @Param('serverId') serverId: string,
  ) {
    this.logger.log(`User ${req.user.id} creating terminal session for server ${serverId}`);
    return this.terminalService.createSession(serverId, req.user.id);
  }

  /**
   * Execute a command in a terminal session
   * POST /servers/:serverId/terminal/:sessionId/execute
   */
  @Post(':sessionId/execute')
  async executeCommand(
    @Param('serverId') serverId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: ExecuteCommandDto,
  ) {
    if (!dto.command) {
      throw new BadRequestException('Command is required');
    }

    this.logger.debug(`Executing command in session ${sessionId}: ${dto.command}`);
    return this.terminalService.executeCommand(serverId, sessionId, dto.command);
  }

  /**
   * List files in a directory
   * GET /servers/:serverId/terminal/:sessionId/files?path=/path
   */
  @Get(':sessionId/files')
  async listFiles(
    @Param('serverId') serverId: string,
    @Param('sessionId') sessionId: string,
    @Body('path') path: string = '.',
  ) {
    return this.terminalService.listFiles(serverId, sessionId, path);
  }

  /**
   * Read a file
   * GET /servers/:serverId/terminal/:sessionId/read-file?path=/path
   */
  @Get(':sessionId/read-file')
  async readFile(
    @Param('serverId') serverId: string,
    @Param('sessionId') sessionId: string,
    @Body('path') path: string,
  ) {
    if (!path) {
      throw new BadRequestException('File path is required');
    }

    return {
      content: await this.terminalService.readFile(serverId, sessionId, path),
    };
  }

  /**
   * Get docker stats
   * GET /servers/:serverId/terminal/:sessionId/docker-stats
   */
  @Get(':sessionId/docker-stats')
  async getDockerStats(
    @Param('serverId') serverId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return {
      stats: await this.terminalService.getDockerStats(serverId, sessionId),
    };
  }

  /**
   * Get active sessions (admin only)
   * GET /terminal/sessions
   */
  @Get('/admin/sessions')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  getActiveSessions() {
    return this.terminalService.getActiveSessions();
  }
}
