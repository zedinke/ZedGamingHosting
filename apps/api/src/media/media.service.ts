import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { CreateSlideDto, UpdateSlideDto } from './dto/slide.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = process.env.MEDIA_STORAGE_DIR || './storage/media';

  constructor(private readonly prisma: PrismaService) {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Media upload directory ready: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error}`);
    }
  }

  /**
   * Get all active slides for public display
   */
  async getActiveSlides() {
    const now = new Date();
    
    return this.prisma.homepageSlide.findMany({
      where: {
        isActive: true,
        OR: [
          { publishedFrom: null, publishedUntil: null },
          { publishedFrom: { lte: now }, publishedUntil: null },
          { publishedFrom: null, publishedUntil: { gte: now } },
          { publishedFrom: { lte: now }, publishedUntil: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get all slides (admin)
   */
  async getAllSlides() {
    return this.prisma.homepageSlide.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get slide by ID
   */
  async getSlideById(id: string) {
    const slide = await this.prisma.homepageSlide.findUnique({
      where: { id },
    });

    if (!slide) {
      throw new NotFoundException(`Slide with ID ${id} not found`);
    }

    return slide;
  }

  /**
   * Create new slide
   */
  async createSlide(dto: CreateSlideDto) {
    // Validate YouTube URL if mediaType is YOUTUBE
    if (dto.mediaType === 'YOUTUBE') {
      this.validateYouTubeUrl(dto.mediaUrl);
    }

    return this.prisma.homepageSlide.create({
      data: {
        title: dto.title,
        description: dto.description,
        mediaType: dto.mediaType,
        mediaUrl: dto.mediaUrl,
        linkUrl: dto.linkUrl,
        linkText: dto.linkText || 'Tudj meg többet',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        publishedFrom: dto.publishedFrom ? new Date(dto.publishedFrom) : null,
        publishedUntil: dto.publishedUntil ? new Date(dto.publishedUntil) : null,
      },
    });
  }

  /**
   * Update slide
   */
  async updateSlide(id: string, dto: UpdateSlideDto) {
    await this.getSlideById(id); // Check existence

    // Validate YouTube URL if changing to YOUTUBE
    if (dto.mediaType === 'YOUTUBE' && dto.mediaUrl) {
      this.validateYouTubeUrl(dto.mediaUrl);
    }

    return this.prisma.homepageSlide.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.mediaType && { mediaType: dto.mediaType }),
        ...(dto.mediaUrl && { mediaUrl: dto.mediaUrl }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
        ...(dto.linkText !== undefined && { linkText: dto.linkText }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.publishedFrom !== undefined && { 
          publishedFrom: dto.publishedFrom ? new Date(dto.publishedFrom) : null 
        }),
        ...(dto.publishedUntil !== undefined && { 
          publishedUntil: dto.publishedUntil ? new Date(dto.publishedUntil) : null 
        }),
      },
    });
  }

  /**
   * Delete slide
   */
  async deleteSlide(id: string) {
    const slide = await this.getSlideById(id);

    // Delete file if it's a local upload
    if ((slide.mediaType === 'IMAGE' || slide.mediaType === 'VIDEO') && 
        slide.mediaUrl.startsWith('/media/')) {
      try {
        const filePath = path.join(this.uploadDir, path.basename(slide.mediaUrl));
        await fs.unlink(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to delete file: ${error}`);
      }
    }

    await this.prisma.homepageSlide.delete({
      where: { id },
    });

    return { message: 'Slide deleted successfully' };
  }

  /**
   * Upload media file (image or video)
   */
  async uploadMedia(file: Express.Multer.File, mediaType: 'IMAGE' | 'VIDEO') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate MIME type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (mediaType === 'IMAGE' && !allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image type. Allowed: JPEG, PNG, WebP, GIF');
    }

    if (mediaType === 'VIDEO' && !allowedVideoTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video type. Allowed: MP4, WebM, MOV');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    const filePath = path.join(this.uploadDir, filename);

    try {
      if (mediaType === 'IMAGE') {
        // Optimize image with Sharp
        await sharp(file.buffer)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(filePath.replace(/\.[^.]+$/, '.webp'));
        
        const webpFilename = filename.replace(/\.[^.]+$/, '.webp');
        this.logger.log(`Image optimized and saved: ${webpFilename}`);
        
        return {
          filename: webpFilename,
          path: `/media/${webpFilename}`,
          size: (await fs.stat(path.join(this.uploadDir, webpFilename))).size,
        };
      } else {
        // Save video as-is
        await fs.writeFile(filePath, file.buffer);
        this.logger.log(`Video saved: ${filename}`);
        
        return {
          filename,
          path: `/media/${filename}`,
          size: file.size,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to save media: ${error}`);
      throw new BadRequestException('Failed to process media file');
    }
  }

  /**
   * Validate YouTube URL
   */
  private validateYouTubeUrl(url: string) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    
    if (!youtubeRegex.test(url)) {
      throw new BadRequestException('Invalid YouTube URL format');
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
}
