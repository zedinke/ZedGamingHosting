import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateTicketTemplateDto, UpdateTicketTemplateDto } from './dto/ticket-template.dto';

/**
 * Ticket Template Service
 * Manages response templates for support staff
 * Supports macro substitution and quick responses
 */
@Injectable()
export class TicketTemplateService {
  private readonly logger = new Logger(TicketTemplateService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new ticket response template
   */
  async createTemplate(dto: CreateTicketTemplateDto, userId: string) {
    try {
      const template = await this.prisma.ticketTemplate.create({
        data: {
          name: dto.name,
          subject: dto.subject,
          content: dto.content,
          category: dto.category || 'General',
          tags: dto.tags || [],
          description: dto.description,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      this.logger.log(`Template "${template.name}" created by ${userId}`);
      return template;
    } catch (error) {
      this.logger.error(`Failed to create template: ${error}`);
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateId: string,
    dto: UpdateTicketTemplateDto,
    userId: string,
  ) {
    try {
      const template = await this.prisma.ticketTemplate.update({
        where: { id: templateId },
        data: {
          ...dto,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Template "${template.name}" updated by ${userId}`);
      return template;
    } catch (error) {
      this.logger.error(`Failed to update template: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string) {
    try {
      await this.prisma.ticketTemplate.delete({
        where: { id: templateId },
      });

      this.logger.log(`Template ${templateId} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete template: ${error}`);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  async getAllTemplates(category?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      this.prisma.ticketTemplate.findMany({
        where: category ? { category } : {},
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticketTemplate.count({
        where: category ? { category } : {},
      }),
    ]);

    return {
      data: templates,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific template by ID
   */
  async getTemplateById(templateId: string) {
    return this.prisma.ticketTemplate.findUnique({
      where: { id: templateId },
      include: {
        createdByUser: { select: { id: true, email: true, name: true } },
        updatedByUser: { select: { id: true, email: true, name: true } },
      },
    });
  }

  /**
   * Search templates by keyword
   */
  async searchTemplates(keyword: string, limit: number = 10) {
    return this.prisma.ticketTemplate.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { subject: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
          { tags: { hasSome: [keyword] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string) {
    return this.prisma.ticketTemplate.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const categories = await this.prisma.ticketTemplate.findMany({
      distinct: ['category'],
      select: { category: true },
      where: { category: { not: null } },
    });

    return categories.map((c: any) => c.category).filter(Boolean);
  }

  /**
   * Apply macro substitutions to template content
   * Supports: {{user_name}}, {{ticket_id}}, {{ticket_title}}, {{current_date}}, {{staff_name}}
   */
  applyMacros(content: string, variables: Record<string, string>): string {
    let result = content;

    // Date macro
    result = result.replace('{{current_date}}', new Date().toLocaleDateString('hu-HU'));
    result = result.replace('{{current_time}}', new Date().toLocaleTimeString('hu-HU'));

    // Variable substitution
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    return result;
  }

  /**
   * Apply template to create response with macro substitution
   */
  async applyTemplate(
    templateId: string,
    variables: Record<string, string>,
  ) {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Log template usage
      await this.prisma.ticketTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      // Apply macros
      const content = this.applyMacros(template.content, variables);
      const subject = this.applyMacros(template.subject, variables);

      return { subject, content };
    } catch (error) {
      this.logger.error(`Failed to apply template: ${error}`);
      throw error;
    }
  }

  /**
   * Get popular templates based on usage
   */
  async getPopularTemplates(limit: number = 10) {
    return this.prisma.ticketTemplate.findMany({
      orderBy: { usageCount: 'desc' },
      take: limit,
    });
  }
}
