import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@zedgaming/db';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new knowledge base article
   */
  async createArticle(data: {
    title: string;
    content: string;
    excerpt?: string;
    categoryId: string;
    authorId: string;
    tags?: string[];
    published?: boolean;
  }) {
    // Generate slug from title
    const slug = this.generateSlug(data.title);

    // Check if slug already exists
    const existing = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Article with this title already exists');
    }

    // Create article
    const article = await this.prisma.knowledgeBaseArticle.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        categoryId: data.categoryId,
        authorId: data.authorId,
        tags: data.tags || [],
        published: data.published || false,
        publishedAt: data.published ? new Date() : null,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create initial version
    await this.prisma.articleVersion.create({
      data: {
        articleId: article.id,
        version: 1,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        createdBy: data.authorId,
      },
    });

    this.logger.log(`Created knowledge base article: ${article.id}`);
    return article;
  }

  /**
   * Get all published articles (public access)
   */
  async getPublishedArticles(params?: {
    categoryId?: string;
    tags?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { published: true };

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.tags && params.tags.length > 0) {
      where.tags = {
        hasSome: params.tags,
      };
    }

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
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
   * Get all articles (admin only)
   */
  async getAllArticles(params?: {
    categoryId?: string;
    published?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.published !== undefined) {
      where.published = params.published;
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { updatedAt: 'desc' },
        ],
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
   * Get article by ID or slug
   */
  async getArticle(idOrSlug: string, incrementViews = false) {
    const article = await this.prisma.knowledgeBaseArticle.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5, // Last 5 versions
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count
    if (incrementViews && article.published) {
      await this.prisma.knowledgeBaseArticle.update({
        where: { id: article.id },
        data: { views: { increment: 1 } },
      });
    }

    return article;
  }

  /**
   * Update article
   */
  async updateArticle(
    articleId: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      categoryId?: string;
      tags?: string[];
      published?: boolean;
    },
    updatedBy: string,
  ) {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const updateData: any = { ...data };

    // Update slug if title changed
    if (data.title && data.title !== article.title) {
      updateData.slug = this.generateSlug(data.title);

      // Check if new slug already exists
      const existing = await this.prisma.knowledgeBaseArticle.findUnique({
        where: { slug: updateData.slug },
      });

      if (existing && existing.id !== articleId) {
        throw new ConflictException('Article with this title already exists');
      }
    }

    // Set publishedAt if publishing for first time
    if (data.published && !article.published) {
      updateData.publishedAt = new Date();
    }

    const updatedArticle = await this.prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: updateData,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create new version if content changed
    if (data.title || data.content || data.excerpt) {
      const latestVersion = article.versions[0];
      const newVersion = (latestVersion?.version || 0) + 1;

      await this.prisma.articleVersion.create({
        data: {
          articleId: article.id,
          version: newVersion,
          title: data.title || article.title,
          content: data.content || article.content,
          excerpt: data.excerpt || article.excerpt,
          createdBy: updatedBy,
        },
      });
    }

    this.logger.log(`Updated knowledge base article: ${articleId}`);
    return updatedArticle;
  }

  /**
   * Delete article
   */
  async deleteArticle(articleId: string) {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.prisma.knowledgeBaseArticle.delete({
      where: { id: articleId },
    });

    this.logger.log(`Deleted knowledge base article: ${articleId}`);
    return { message: 'Article deleted successfully' };
  }

  /**
   * Record article feedback
   */
  async recordFeedback(articleId: string, helpful: boolean) {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: helpful
        ? { helpful: { increment: 1 } }
        : { notHelpful: { increment: 1 } },
    });

    return { message: 'Feedback recorded' };
  }

  /**
   * Create category
   */
  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    parentId?: string;
    order?: number;
  }) {
    const slug = this.generateSlug(data.name);

    const existing = await this.prisma.knowledgeBaseCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.knowledgeBaseCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
        parentId: data.parentId,
        order: data.order || 0,
      },
    });
  }

  /**
   * Get all categories
   */
  async getCategories() {
    return this.prisma.knowledgeBaseCategory.findMany({
      include: {
        children: true,
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Search articles (uses fulltext search)
   */
  async searchArticles(query: string, limit = 10) {
    // For MySQL/MariaDB fulltext search
    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        category: true,
      },
      orderBy: [
        { views: 'desc' },
        { helpful: 'desc' },
      ],
    });

    return articles;
  }

  /**
   * Auto-suggest articles based on ticket keywords
   */
  async suggestArticles(ticketSubject: string, ticketDescription: string) {
    // Extract keywords (simple implementation)
    const keywords = [
      ...ticketSubject.toLowerCase().split(/\s+/),
      ...ticketDescription.toLowerCase().split(/\s+/),
    ]
      .filter(word => word.length > 3)
      .slice(0, 10);

    if (keywords.length === 0) return [];

    // Search for articles containing keywords
    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where: {
        published: true,
        OR: keywords.map(keyword => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } },
          ],
        })),
      },
      take: 5,
      include: {
        category: true,
      },
      orderBy: [
        { helpful: 'desc' },
        { views: 'desc' },
      ],
    });

    return articles;
  }

  /**
   * Generate URL-friendly slug from string
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
