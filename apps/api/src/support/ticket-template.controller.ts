import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TicketTemplateService } from './ticket-template.service';
import { CreateTicketTemplateDto, UpdateTicketTemplateDto } from './dto/ticket-template.dto';

/**
 * Ticket Template Controller
 * API endpoints for support staff response templates
 */
@Controller('support/templates')
@UseGuards(JwtAuthGuard)
export class TicketTemplateController {
  private readonly logger = new Logger(TicketTemplateController.name);

  constructor(private readonly templateService: TicketTemplateService) {}

  /**
   * Get all templates (paginated, searchable)
   * GET /support/templates?category=X&page=1&limit=20
   */
  @Get()
  async getAllTemplates(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.templateService.getAllTemplates(
      category,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get all unique categories
   * GET /support/templates/categories
   */
  @Get('categories')
  async getCategories() {
    return this.templateService.getCategories();
  }

  /**
   * Search templates by keyword
   * GET /support/templates/search/:keyword
   */
  @Get('search/:keyword')
  async searchTemplates(
    @Param('keyword') keyword: string,
    @Query('limit') limit?: string,
  ) {
    return this.templateService.searchTemplates(
      keyword,
      parseInt(limit || '10'),
    );
  }

  /**
   * Get popular templates (most used)
   * GET /support/templates/popular
   */
  @Get('popular')
  async getPopularTemplates(@Query('limit') limit?: string) {
    return this.templateService.getPopularTemplates(parseInt(limit || '10'));
  }

  /**
   * Get a specific template by ID
   * GET /support/templates/:id
   */
  @Get(':id')
  async getTemplate(@Param('id') id: string) {
    return this.templateService.getTemplateById(id);
  }

  /**
   * Create a new template (SUPERADMIN only)
   * POST /support/templates
   */
  @Post()
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'SUPPORT')
  async createTemplate(
    @Request() req: any,
    @Body() dto: CreateTicketTemplateDto,
  ) {
    this.logger.log(`User ${req.user.id} creating ticket template`);
    return this.templateService.createTemplate(dto, req.user.id);
  }

  /**
   * Update a template (SUPERADMIN only)
   * PUT /support/templates/:id
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'SUPPORT')
  async updateTemplate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTicketTemplateDto,
  ) {
    this.logger.log(`User ${req.user.id} updating template ${id}`);
    return this.templateService.updateTemplate(id, dto, req.user.id);
  }

  /**
   * Delete a template (SUPERADMIN only)
   * DELETE /support/templates/:id
   */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  async deleteTemplate(@Param('id') id: string) {
    this.logger.log(`Deleting template ${id}`);
    await this.templateService.deleteTemplate(id);
  }

  /**
   * Apply template to create a response with macro substitution
   * POST /support/templates/:id/apply/:ticketId
   * Body: { variables: { user_name: "John", staff_name: "Jane", ... } }
   */
  @Post(':id/apply/:ticketId')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'SUPPORT')
  async applyTemplate(
    @Param('id') templateId: string,
    @Param('ticketId') ticketId: string,
    @Body() body: { variables?: Record<string, string> },
  ) {
    this.logger.log(`Applying template ${templateId} to ticket ${ticketId}`);
    return this.templateService.applyTemplate(
      templateId,
      ticketId,
      body.variables || {},
    );
  }
}
