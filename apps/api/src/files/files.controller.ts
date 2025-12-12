import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('servers/:serverUuid/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async listFiles(
    @Param('serverUuid') serverUuid: string,
    @Query('path') path: string = '/',
    @Request() req: any,
  ) {
    const result = await this.filesService.listFiles(serverUuid, path, req.user.id);
    return result;
  }

  @Get('content')
  async getFileContent(
    @Param('serverUuid') serverUuid: string,
    @Query('path') path: string,
    @Request() req: any,
  ) {
    if (!path) {
      throw new BadRequestException('Path parameter is required');
    }
    return await this.filesService.getFileContent(serverUuid, path, req.user.id);
  }

  @Put('content')
  async saveFileContent(
    @Param('serverUuid') serverUuid: string,
    @Body() body: { path: string; content: string },
    @Request() req: any,
  ) {
    if (!body.path || body.content === undefined) {
      throw new BadRequestException('Path and content are required');
    }
    return await this.filesService.saveFileContent(
      serverUuid,
      body.path,
      body.content,
      req.user.id,
    );
  }

  @Post()
  async createFile(
    @Param('serverUuid') serverUuid: string,
    @Body() body: { path: string; type: 'file' | 'directory' },
    @Request() req: any,
  ) {
    if (!body.path || !body.type) {
      throw new BadRequestException('Path and type are required');
    }
    return await this.filesService.createFile(
      serverUuid,
      body.path,
      body.type,
      req.user.id,
    );
  }

  @Delete()
  async deleteFile(
    @Param('serverUuid') serverUuid: string,
    @Query('path') path: string,
    @Request() req: any,
  ) {
    if (!path) {
      throw new BadRequestException('Path parameter is required');
    }
    return await this.filesService.deleteFile(serverUuid, path, req.user.id);
  }

  @Post('upload')
  async uploadFile(
    @Param('serverUuid') serverUuid: string,
    @Body() body: { path: string; content: string; filename: string },
    @Request() req: any,
  ) {
    if (!body.path || !body.filename || body.content === undefined) {
      throw new BadRequestException('Path, filename, and content are required');
    }
    return await this.filesService.uploadFile(
      serverUuid,
      body.path,
      body.filename,
      body.content,
      req.user.id,
    );
  }
}

