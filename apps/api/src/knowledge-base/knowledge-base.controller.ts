import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { KnowledgeBaseService } from './knowledge-base.service';

/**
 * Knowledge Base Controller
 * Public endpoints for viewing articles and admin endpoints for management
 */
@Controller('knowledge-base')
export class KnowledgeBaseController {
  private readonly logger = new Logger(KnowledgeBaseController.name);

  constructor(private readonly kbService: KnowledgeBaseService) {}

  /**
   * Get all published articles (public)
   * GET /knowledge-base/articles?category=xxx&tags=tag1,tag2&search=keyword&page=1&limit=20
   */
  @Get('articles')
  async getPublishedArticles(
    @Query('category') categoryId?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tagArray = tags ? tags.split(',') : undefined;
    return this.kbService.getPublishedArticles({
      categoryId,
      tags: tagArray,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Get article by ID or slug (public)
   * GET /knowledge-base/articles/:idOrSlug
   */
  @Get('articles/:idOrSlug')
  async getArticle(@Param('idOrSlug') idOrSlug: string) {
    return this.kbService.getArticle(idOrSlug, true); // Increment views
  }

  /**
   * Search articles (public)
   * GET /knowledge-base/search?q=query&limit=10
   */
  @Get('search')
  async searchArticles(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.kbService.searchArticles(
      query,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * Record article feedback (public)
   * POST /knowledge-base/articles/:id/feedback
   */
  @Post('articles/:id/feedback')
  async recordFeedback(
    @Param('id') articleId: string,
    @Body() body: { helpful: boolean },
  ) {
    return this.kbService.recordFeedback(articleId, body.helpful);
  }

  /**
   * Get all categories (public)
   * GET /knowledge-base/categories
   */
  @Get('categories')
  async getCategories() {
    return this.kbService.getCategories();
  }

  /**
   * Auto-suggest articles based on ticket content (requires auth)
   * POST /knowledge-base/suggest
   */
  @Post('suggest')
  @UseGuards(JwtAuthGuard)
  async suggestArticles(
    @Body() body: { subject: string; description: string },
  ) {
    return this.kbService.suggestArticles(body.subject, body.description);
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * Get all articles (admin only)
   * GET /knowledge-base/admin/articles?category=xxx&published=true&page=1&limit=20
   */
  @Get('admin/articles')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllArticles(
    @Query('category') categoryId?: string,
    @Query('published') published?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kbService.getAllArticles({
      categoryId,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Create article (admin only)
   * POST /knowledge-base/admin/articles
   */
  @Post('admin/articles')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createArticle(@Request() req: any, @Body() body: {
    title: string;
    content: string;
    excerpt?: string;
    categoryId: string;
    tags?: string[];
    published?: boolean;
  }) {
    this.logger.log(`Admin creating knowledge base article: ${body.title}`);
    return this.kbService.createArticle({
      ...body,
      authorId: req.user.id,
    });
  }

  /**
   * Update article (admin only)
   * PATCH /knowledge-base/admin/articles/:id
   */
  @Patch('admin/articles/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateArticle(
    @Request() req: any,
    @Param('id') articleId: string,
    @Body() body: {
      title?: string;
      content?: string;
      excerpt?: string;
      categoryId?: string;
      tags?: string[];
      published?: boolean;
    },
  ) {
    this.logger.log(`Admin updating knowledge base article: ${articleId}`);
    return this.kbService.updateArticle(articleId, body, req.user.id);
  }

  /**
   * Delete article (admin only)
   * DELETE /knowledge-base/admin/articles/:id
   */
  @Delete('admin/articles/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteArticle(@Param('id') articleId: string) {
    this.logger.log(`Admin deleting knowledge base article: ${articleId}`);
    return this.kbService.deleteArticle(articleId);
  }

  /**
   * Create category (admin only)
   * POST /knowledge-base/admin/categories
   */
  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createCategory(@Body() body: {
    name: string;
    description?: string;
    icon?: string;
    parentId?: string;
    order?: number;
  }) {
    this.logger.log(`Admin creating knowledge base category: ${body.name}`);
    return this.kbService.createCategory(body);
  }
}
