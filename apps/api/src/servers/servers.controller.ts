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
}

