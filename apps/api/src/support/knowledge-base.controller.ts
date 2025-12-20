import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeArticleDto, UpdateKnowledgeArticleDto } from './dto/knowledge-base.dto';

/**
 * Knowledge Base Controller - Public FAQ and article management
 */
@Controller('api/knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  /**
   * Get all published articles (public)
   */
  @Public()
  @Get('articles')
  async getAllArticles(
    @Query('category') category?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.knowledgeBaseService.getAllArticles(
      category,
      parseInt(page),
      parseInt(limit)
    );
  }

  /**
   * Get article by ID (public)
   */
  @Public()
  @Get('articles/:id')
  async getArticleById(@Param('id') articleId: string) {
    return this.knowledgeBaseService.getArticleById(articleId);
  }

  /**
   * Search articles (public)
   */
  @Public()
  @Get('articles/search/:keyword')
  async searchArticles(@Param('keyword') keyword: string) {
    return this.knowledgeBaseService.searchArticles(keyword);
  }

  /**
   * Get popular articles (public)
   */
  @Public()
  @Get('popular')
  async getPopularArticles(@Query('limit') limit: string = '10') {
    return this.knowledgeBaseService.getPopularArticles(parseInt(limit));
  }

  /**
   * Get article categories (public)
   */
  @Public()
  @Get('categories')
  async getCategories() {
    return this.knowledgeBaseService.getCategories();
  }

  /**
   * Get suggested articles for ticket (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'SUPPORT')
  @Get('suggest/:ticketId')
  async suggestForTicket(
    @Param('ticketId') ticketId: string,
    @Query('limit') limit: string = '5'
  ) {
    return this.knowledgeBaseService.suggestArticlesForTicket(
      ticketId,
      parseInt(limit)
    );
  }

  /**
   * Create knowledge article (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @Post('articles')
  async createArticle(@Body() dto: CreateKnowledgeArticleDto) {
    return this.knowledgeBaseService.createArticle(dto);
  }

  /**
   * Update knowledge article (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @Put('articles/:id')
  async updateArticle(
    @Param('id') articleId: string,
    @Body() dto: UpdateKnowledgeArticleDto
  ) {
    return this.knowledgeBaseService.updateArticle(articleId, dto);
  }

  /**
   * Delete knowledge article (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @Delete('articles/:id')
  async deleteArticle(@Param('id') articleId: string) {
    return this.knowledgeBaseService.deleteArticle(articleId);
  }

  /**
   * Link article to ticket (staff)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'SUPPORT')
  @Post('articles/:articleId/link/:ticketId')
  async linkArticleToTicket(
    @Param('articleId') articleId: string,
    @Param('ticketId') ticketId: string
  ) {
    return this.knowledgeBaseService.linkArticleToTicket(ticketId, articleId);
  }
}
