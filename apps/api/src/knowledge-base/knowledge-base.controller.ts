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
 * 
 * IMPORTANT: Admin endpoints must come first before wildcard routes
 */
@Controller('knowledge-base')
export class KnowledgeBaseController {
  private readonly logger = new Logger(KnowledgeBaseController.name);

  constructor(private readonly kbService: KnowledgeBaseService) {}

  // ========== ADMIN ENDPOINTS (MUST BE FIRST before wildcards) ==========

  /**
   * Get all admin articles (admin only)
   * GET /knowledge-base/admin/articles
   */
  @Get('admin/articles')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdminArticles(
    @Query('category') categoryId?: string,
    @Query('published') published?: string,
  ) {
    return this.kbService.getAllArticles({
      categoryId,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
    });
  }

  /**
   * Create article (admin only)
   * POST /knowledge-base (admin)
   */
  @Post()
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

  // ========== STATIC ROUTES ==========

  // ========== STATIC ROUTES ==========

  /**
   * Search articles (public)
   * GET /knowledge-base/search?q=query
   */
  @Get('search')
  async searchArticles(
    @Query('q') query?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kbService.searchArticles(
      query || '',
      limit ? parseInt(limit, 10) : 50,
    );
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
   * Create category (admin only)
   * POST /knowledge-base/categories
   */
  @Post('categories')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createCategory(@Body() body: {
    name: string;
    description?: string;
    icon?: string;
  }) {
    this.logger.log(`Admin creating knowledge base category: ${body.name}`);
    return this.kbService.createCategory(body);
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

  // ========== DYNAMIC ROUTES (with :id param) ==========

  /**
   * Get article by ID or slug (public)
   * GET /knowledge-base/:slug
   */
  @Get(':slug')
  async getArticleBySlug(@Param('slug') slug: string) {
    return this.kbService.getArticle(slug, true); // Increment views
  }

  /**
   * Get related articles (public)
   * GET /knowledge-base/:id/related
   */
  @Get(':id/related')
  async getRelatedArticles(@Param('id') articleId: string) {
    return this.kbService.getRelatedArticles(articleId);
  }

  /**
   * Record article feedback (public)
   * POST /knowledge-base/:id/feedback
   */
  @Post(':id/feedback')
  async recordFeedback(
    @Param('id') articleId: string,
    @Body() body: { type: 'helpful' | 'not-helpful' },
  ) {
    return this.kbService.recordFeedback(articleId, body.type === 'helpful');
  }

  /**
   * Update article (admin only)
   * PATCH /knowledge-base/:id
   */
  @Patch(':id')
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
   * DELETE /knowledge-base/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteArticle(@Param('id') articleId: string) {
    this.logger.log(`Admin deleting knowledge base article: ${articleId}`);
    return this.kbService.deleteArticle(articleId);
  }
}
