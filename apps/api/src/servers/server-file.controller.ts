import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  Logger,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import type { Multer } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServerFileService } from './server-file.service';

/**
 * Server File Manager Controller
 * API endpoints for file management on game servers
 */
@Controller('servers/:serverId/files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'SUPPORT')
export class ServerFileController {
  private readonly logger = new Logger(ServerFileController.name);

  constructor(private readonly fileService: ServerFileService) {}

  /**
   * List files in a directory
   * GET /servers/:serverId/files?path=/
   */
  @Get()
  async listFiles(
    @Param('serverId') serverId: string,
    @Query('path') path: string = '/',
  ) {
    this.logger.log(`Listing files at ${path} for server ${serverId}`);
    return this.fileService.listFiles(serverId, path);
  }

  /**
   * Download a file
   * GET /servers/:serverId/files/download?path=/path/to/file
   */
  @Get('download')
  async downloadFile(
    @Param('serverId') serverId: string,
    @Query('path') filePath: string,
    @Res() res: Response,
  ) {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    this.logger.log(`Downloading file ${filePath} from server ${serverId}`);

    try {
      const { buffer, filename } = await this.fileService.downloadFile(
        serverId,
        filePath,
      );

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      this.logger.error(`Failed to download file: ${error}`);
      throw error;
    }
  }

  /**
   * Upload a file
   * POST /servers/:serverId/files/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req: any,
    @Param('serverId') serverId: string,
    @UploadedFile() file: Multer.File,
    @Body() body: { path: string },
  ) {
    if (!file || !body.path) {
      throw new BadRequestException('File and path are required');
    }

    this.logger.log(
      `User ${req.user.id} uploading file to ${body.path} on server ${serverId}`,
    );

    return this.fileService.uploadFile(serverId, file, body.path);
  }

  /**
   * Delete a file or directory
   * DELETE /servers/:serverId/files
   */
  @Delete()
  @HttpCode(204)
  async deleteFile(
    @Request() req: any,
    @Param('serverId') serverId: string,
    @Body() body: { path: string },
  ) {
    if (!body.path) {
      throw new BadRequestException('File path is required');
    }

    this.logger.log(`User ${req.user.id} deleting ${body.path} from server ${serverId}`);

    await this.fileService.deleteFile(serverId, body.path);
  }

  /**
   * Create a directory
   * POST /servers/:serverId/files/mkdir
   */
  @Post('mkdir')
  async createDirectory(
    @Request() req: any,
    @Param('serverId') serverId: string,
    @Body() body: { path: string },
  ) {
    if (!body.path) {
      throw new BadRequestException('Directory path is required');
    }

    this.logger.log(
      `User ${req.user.id} creating directory ${body.path} on server ${serverId}`,
    );

    return this.fileService.createDirectory(serverId, body.path);
  }

  /**
   * Rename a file
   * POST /servers/:serverId/files/rename
   */
  @Post('rename')
  async renameFile(
    @Request() req: any,
    @Param('serverId') serverId: string,
    @Body() body: { oldPath: string; newPath: string },
  ) {
    if (!body.oldPath || !body.newPath) {
      throw new BadRequestException('Old and new paths are required');
    }

    this.logger.log(
      `User ${req.user.id} renaming ${body.oldPath} to ${body.newPath} on server ${serverId}`,
    );

    return this.fileService.renameFile(serverId, body.oldPath, body.newPath);
  }

  /**
   * Get file content
   * GET /servers/:serverId/files/view?path=/path/to/file
   */
  @Get('view')
  async getFileContent(
    @Param('serverId') serverId: string,
    @Query('path') filePath: string,
  ) {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    this.logger.log(`Viewing file ${filePath} from server ${serverId}`);

    return this.fileService.getFileContent(serverId, filePath);
  }
}
