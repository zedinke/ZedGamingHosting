import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ConsoleService } from './console.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Observable, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
   * Server-Sent Events endpoint for real-time console logs
   * GET /api/servers/:uuid/console/stream
   */
  @Sse('stream')
  streamConsoleLogs(
    @Param('uuid') uuid: string,
    @Request() req: any,
  ): Observable<MessageEvent> {
    // Verify access first (async, but we'll catch errors in the stream)
    const userId = req.user.id;

    // Poll every 2 seconds for new logs
    return interval(2000).pipe(
      switchMap(async () => {
        try {
          const data = await this.consoleService.getConsoleLogs(uuid, userId, 100);
          return {
            data: JSON.stringify(data),
          } as MessageEvent;
        } catch (error: any) {
          return {
            data: JSON.stringify({ error: error.message || 'Failed to fetch logs' }),
          } as MessageEvent;
        }
      }),
    );
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
