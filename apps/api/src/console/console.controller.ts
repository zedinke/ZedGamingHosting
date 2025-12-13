import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConsoleService } from './console.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Console Controller - handles server console/logs endpoints
 */
@Controller('servers/:uuid/console')
@UseGuards(JwtAuthGuard)
export class ConsoleController {
  constructor(private readonly consoleService: ConsoleService) {}

  /**
   * Get console logs
   * GET /api/servers/:uuid/console
   */
  @Get()
  async getConsoleLogs(
    @Param('uuid') uuid: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return await this.consoleService.getConsoleLogs(uuid, req.user.id, limitNum);
  }

  /**
   * Send command to server console
   * POST /api/servers/:uuid/console/command
   */
  @Post('command')
  async sendCommand(
    @Param('uuid') uuid: string,
    @Body() body: { command: string },
    @Request() req: any,
  ) {
    if (!body.command) {
      throw new Error('Command is required');
    }
    return await this.consoleService.sendCommand(uuid, body.command, req.user.id);
  }
}

