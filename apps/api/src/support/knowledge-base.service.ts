import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { CreateKnowledgeArticleDto, UpdateKnowledgeArticleDto } from './dto/knowledge-base.dto';

/**
 * Knowledge Base Service
 * Manages FAQ articles and auto-suggestions for support tickets
 */
@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new knowledge base article
   */
  async createArticle(dto: CreateKnowledgeArticleDto, authorId: string): Promise<any> {
    return this.prisma.knowledgeBaseArticle.create({
      data: {
        title: dto.title,
        content: dto.content,
        slug: dto.title.toLowerCase().replace(/\s+/g, '-'),
        categoryId: dto.category || 'default-category',
        authorId,
        tags: dto.tags || [],
        published: dto.isPublished || false,
      },
    });
  }

  /**
   * Update knowledge base article
   */
  async updateArticle(articleId: string, dto: UpdateKnowledgeArticleDto): Promise<any> {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: {
        title: dto.title,
        content: dto.content,
        slug: dto.title ? dto.title.toLowerCase().replace(/\s+/g, '-') : undefined,
        categoryId: dto.category,
        tags: dto.tags,
        published: dto.isPublished,
      },
    });
  }

  /**
   * Get all published articles
   */
  async getAllArticles(categoryId?: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const where: any = { published: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: { select: { id: true, name: true } },
          tags: true,
          views: true,
          author: { select: { id: true, email: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.knowledgeBaseArticle.count({ where }),
    ]);

    return {
      articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get article by ID
   */
  async getArticleById(articleId: string): Promise<any> {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, email: true } },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count
    await this.prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  /**
   * Search articles by keyword
   */
  async searchArticles(keyword: string, limit: number = 10): Promise<any[]> {
    return this.prisma.knowledgeBaseArticle.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: { select: { name: true } },
        tags: true,
        createdAt: true,
      },
      orderBy: { views: 'desc' },
      take: limit,
    });
  }

  /**
   * Get suggested articles for a ticket
   * Uses title and category for relevance matching
   */
  async suggestArticlesForTicket(
    ticketId: string,
    limit: number = 5
  ): Promise<any[]> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { subject: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const keywords = this.extractKeywords(ticket.subject);

    // Search by keywords matching
    const suggestions = await this.prisma.knowledgeBaseArticle.findMany({
      where: {
        published: true,
        OR: [
          {
            title: { contains: keywords[0] || '' },
          },
          {
            content: { contains: keywords[0] || '' },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: { select: { name: true } },
        tags: true,
        views: true,
        createdAt: true,
      },
      orderBy: { views: 'desc' },
      take: limit,
    });

    return suggestions;
  }

  /**
   * Link article to ticket
   */
  async linkArticleToTicket(articleId: string): Promise<any> {
    return this.prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: {
        helpful: { increment: 1 },
      },
    });
  }

  /**
   * Get popular articles
   */
  async getPopularArticles(limit: number = 10): Promise<any[]> {
    return this.prisma.knowledgeBaseArticle.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        category: { select: { name: true } },
        views: true,
        helpful: true,
        createdAt: true,
      },
      orderBy: { views: 'desc' },
      take: limit,
    });
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  private extractKeywords(text: string): string[] {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'am', 'are', 'be', 'been', 'being',
    ];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 3);
  }

  /**
   * Get article categories
   */
  async getCategories(): Promise<any[]> {
    return this.prisma.knowledgeBaseCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Delete a knowledge base article
   */
  async deleteArticle(articleId: string): Promise<any> {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${articleId} not found`);
    }

    return this.prisma.knowledgeBaseArticle.delete({
      where: { id: articleId },
    });
  }
}