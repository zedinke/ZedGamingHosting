import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  create(@Body() createServerDto: CreateServerDto, @Request() req: any) {
    return this.serversService.create(createServerDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.serversService.findAll(req.user.id);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string, @Request() req: any) {
    return this.serversService.findOne(uuid, req.user.id);
  }

  @Get(':uuid/metrics')
  getMetrics(
    @Param('uuid') uuid: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    return this.serversService.getMetrics(
      uuid,
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      limit ? parseInt(limit) : 100,
    );
  }

  @Patch(':uuid')
  update(
    @Param('uuid') uuid: string,
    @Body() updateServerDto: UpdateServerDto,
    @Request() req: any,
  ) {
    return this.serversService.update(uuid, updateServerDto, req.user.id);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: string, @Request() req: any) {
    return this.serversService.remove(uuid, req.user.id);
  }

  @Post(':uuid/start')
  start(@Param('uuid') uuid: string, @Request() req: any) {
    return this.serversService.start(uuid, req.user.id);
  }

  @Post(':uuid/stop')
  stop(@Param('uuid') uuid: string, @Request() req: any) {
    return this.serversService.stop(uuid, req.user.id);
  }

  @Post(':uuid/restart')
  restart(@Param('uuid') uuid: string, @Request() req: any) {
    return this.serversService.restart(uuid, req.user.id);
  }

  /**
   * Update server settings
   * PUT /api/servers/:uuid/settings
   */
  @Put(':uuid/settings')
  updateSettings(
    @Param('uuid') uuid: string,
    @Body() settings: { cpuLimit?: number; ramLimit?: number; diskLimit?: number; startupPriority?: number },
    @Request() req: any,
  ) {
    return this.serversService.updateSettings(uuid, settings, req.user.id);
  }

  /**
   * Update server environment variables
   * PUT /api/servers/:uuid/environment
   */
  @Put(':uuid/environment')
  updateEnvironment(
    @Param('uuid') uuid: string,
    @Body() body: { envVars: Record<string, string> },
    @Request() req: any,
  ) {
    return this.serversService.updateEnvironment(uuid, body.envVars, req.user.id);
  }

  @Post(':uuid/backups')
  async createBackup(
    @Param('uuid') uuid: string,
    @Body() dto: { name?: string },
    @Request() req: any,
  ) {
    return this.serversService.createBackup(uuid, dto.name, req.user.id);
  }

  @Get(':uuid/backups')
  async getBackups(@Param('uuid') uuid: string, @Request() req: any) {
    return this.serversService.getBackups(uuid, req.user.id);
  }

  @Post(':uuid/backups/:backupId/restore')
  async restoreBackup(
    @Param('uuid') uuid: string,
    @Param('backupId') backupId: string,
    @Request() req: any,
  ) {
    await this.serversService.restoreBackup(uuid, backupId, req.user.id);
    return { message: 'Backup restore initiated' };
  }

  @Delete(':uuid/backups/:backupId')
  async deleteBackup(
    @Param('uuid') uuid: string,
    @Param('backupId') backupId: string,
    @Request() req: any,
  ) {
    await this.serversService.deleteBackup(uuid, backupId, req.user.id);
    return { message: 'Backup deleted' };
  }
}
