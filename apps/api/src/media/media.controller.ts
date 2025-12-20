import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService, UploadedMediaFile } from './media.service';
import { CreateSlideDto, UpdateSlideDto } from './dto/slide.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Get active slides for public display
   * GET /api/media/slides
   */
  @Public()
  @Get('slides')
  async getActiveSlides() {
    return this.mediaService.getActiveSlides();
  }

  /**
   * Get all slides (admin)
   * GET /api/media/slides/all
   */
  @Get('slides/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'RESELLER_ADMIN')
  async getAllSlides() {
    return this.mediaService.getAllSlides();
  }

  /**
   * Get slide by ID
   * GET /api/media/slides/:id
   */
  @Get('slides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'RESELLER_ADMIN')
  async getSlide(@Param('id') id: string) {
    return this.mediaService.getSlideById(id);
  }

  /**
   * Create new slide
   * POST /api/media/slides
   */
  @Post('slides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'RESELLER_ADMIN')
  async createSlide(@Body() dto: CreateSlideDto) {
    return this.mediaService.createSlide(dto);
  }

  /**
   * Update slide
   * PATCH /api/media/slides/:id
   */
  @Patch('slides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'RESELLER_ADMIN')
  async updateSlide(@Param('id') id: string, @Body() dto: UpdateSlideDto) {
    return this.mediaService.updateSlide(id, dto);
  }

  /**
   * Delete slide
   * DELETE /api/media/slides/:id
   */
  @Delete('slides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'RESELLER_ADMIN')
  async deleteSlide(@Param('id') id: string) {
    return this.mediaService.deleteSlide(id);
  }

  /**
   * Upload media file
   * POST /api/media/upload?type=IMAGE|VIDEO
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'RESELLER_ADMIN')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
    },
  }))
  async uploadMedia(
    @UploadedFile() file: UploadedMediaFile,
    @Query('type') type: string,
  ) {
    if (!type || !['IMAGE', 'VIDEO'].includes(type)) {
      throw new BadRequestException('Invalid media type. Must be IMAGE or VIDEO');
    }

    return this.mediaService.uploadMedia(file, type as 'IMAGE' | 'VIDEO');
  }
}
