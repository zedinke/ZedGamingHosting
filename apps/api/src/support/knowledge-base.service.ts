import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { CreateKnowledgeArticleDto, UpdateKnowledgeArticleDto } from './dto/knowledge-base.dto';

/**
 * Knowledge Base Service
 * Manages FAQ articles and auto-suggestions for support tickets
 */
@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new knowledge base article
   */
  async createArticle(dto: CreateKnowledgeArticleDto): Promise<any> {
    return this.prisma.knowledgeArticle.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        tags: dto.tags || [],
        isPublished: dto.isPublished || false,
      },
    });
  }

  /**
   * Update knowledge base article
   */
  async updateArticle(articleId: string, dto: UpdateKnowledgeArticleDto): Promise<any> {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        tags: dto.tags,
        isPublished: dto.isPublished,
      },
    });
  }

  /**
   * Get all published articles
   */
  async getAllArticles(category?: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const where: any = { isPublished: true };

    if (category) {
      where.category = category;
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          category: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { linkedTickets: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.knowledgeArticle.count({ where }),
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
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
      include: {
        linkedTickets: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
          take: 5,
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  /**
   * Search articles by keyword
   */
  async searchArticles(keyword: string): Promise<any[]> {
    return this.prisma.knowledgeArticle.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
          { tags: { has: keyword.toLowerCase() } },
        ],
      },
      select: {
        id: true,
        title: true,
        category: true,
        tags: true,
        updatedAt: true,
      },
      take: 10,
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
      select: { subject: true, category: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Search by category first, then by keyword matching
    const suggestions = await this.prisma.knowledgeArticle.findMany({
      where: {
        isPublished: true,
        OR: [
          // Exact category match (highest priority)
          {
            category: ticket.category || undefined,
            title: { contains: this.extractKeywords(ticket.subject)[0] || '', mode: 'insensitive' },
          },
          // Title keyword match
          {
            title: { contains: this.extractKeywords(ticket.subject)[0] || '', mode: 'insensitive' },
          },
          // Tag match
          {
            tags: { hasSome: this.extractKeywords(ticket.subject).map((k) => k.toLowerCase()) },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        category: true,
        tags: true,
        _count: { select: { linkedTickets: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return suggestions;
  }

  /**
   * Link article to ticket
   */
  async linkArticleToTicket(ticketId: string, articleId: string): Promise<any> {
    const [ticket, article] = await Promise.all([
      this.prisma.supportTicket.findUnique({ where: { id: ticketId } }),
      this.prisma.knowledgeArticle.findUnique({ where: { id: articleId } }),
    ]);

    if (!ticket || !article) {
      throw new NotFoundException('Ticket or article not found');
    }

    return this.prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        linkedTickets: {
          connect: { id: ticketId },
        },
      },
    });
  }

  /**
   * Get popular articles
   */
  async getPopularArticles(limit: number = 10): Promise<any[]> {
    return this.prisma.knowledgeArticle.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        category: true,
        updatedAt: true,
        _count: { select: { linkedTickets: true } },
      },
      orderBy: {
        linkedTickets: {
          _count: 'desc',
        },
      },
      take: limit,
    });
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 3);
  }

  /**
   * Get article categories
   */
  async getCategories(): Promise<string[]> {
    const result = await this.prisma.knowledgeArticle.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    });

    return result.map((r) => r.category).filter(Boolean);
  }
}
