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
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubdomainService } from './subdomain.service';

interface CreateSubdomainDto {
  subdomain: string;
  ipAddress: string;
}

interface UpdateSubdomainDto {
  ipAddress: string;
}

/**
 * Subdomain Controller
 * API endpoints for server subdomain management
 */
@Controller('servers/:serverId/subdomains')
@UseGuards(JwtAuthGuard)
export class SubdomainController {
  private readonly logger = new Logger(SubdomainController.name);

  constructor(private readonly subdomainService: SubdomainService) {}

  /**
   * Create a new subdomain for a server
   * POST /servers/:serverId/subdomains
   */
  @Post()
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  async createSubdomain(
    @Request() req: any,
    @Param('serverId') serverId: string,
    @Body() dto: CreateSubdomainDto,
  ) {
    if (!dto.subdomain || !dto.ipAddress) {
      throw new BadRequestException('Subdomain and IP address are required');
    }

    this.logger.log(
      `User ${req.user.id} creating subdomain for server ${serverId}`,
    );
    return this.subdomainService.createSubdomain(
      serverId,
      dto.subdomain,
      dto.ipAddress,
    );
  }

  /**
   * Get all subdomains for a server
   * GET /servers/:serverId/subdomains
   */
  @Get()
  async getServerSubdomains(@Param('serverId') serverId: string) {
    return this.subdomainService.getServerSubdomains(serverId);
  }

  /**
   * Get a specific subdomain
   * GET /servers/:serverId/subdomains/:subdomainId
   */
  @Get(':subdomainId')
  async getSubdomain(@Param('subdomainId') subdomainId: string) {
    return this.subdomainService.getSubdomainById(subdomainId);
  }

  /**
   * Update subdomain IP address
   * PUT /servers/:serverId/subdomains/:subdomainId
   */
  @Put(':subdomainId')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  async updateSubdomain(
    @Request() req: any,
    @Param('subdomainId') subdomainId: string,
    @Body() dto: UpdateSubdomainDto,
  ) {
    if (!dto.ipAddress) {
      throw new BadRequestException('IP address is required');
    }

    this.logger.log(`User ${req.user.id} updating subdomain ${subdomainId}`);
    return this.subdomainService.updateSubdomainIp(subdomainId, dto.ipAddress);
  }

  /**
   * Delete a subdomain
   * DELETE /servers/:serverId/subdomains/:subdomainId
   */
  @Delete(':subdomainId')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  async deleteSubdomain(
    @Request() req: any,
    @Param('subdomainId') subdomainId: string,
  ) {
    this.logger.log(`User ${req.user.id} deleting subdomain ${subdomainId}`);
    await this.subdomainService.deleteSubdomain(subdomainId);
  }

  /**
   * Check DNS propagation status
   * GET /servers/:serverId/subdomains/:subdomainId/dns-status
   */
  @Get(':subdomainId/dns-status')
  async checkDnsStatus(
    @Param('subdomainId') subdomainId: string,
  ) {
    const subdomain = await this.subdomainService.getSubdomainById(
      subdomainId,
    );

    if (!subdomain) {
      throw new BadRequestException('Subdomain not found');
    }

    const isPropagated = await this.subdomainService.checkDnsPropagation(
      subdomain.subdomain,
    );

    return {
      subdomain: subdomain.subdomain,
      fullDomain: subdomain.fullDomain,
      ipAddress: subdomain.ipAddress,
      isPropagated,
      propagationStatus: isPropagated ? 'PROPAGATED' : 'PENDING',
    };
  }

  /**
   * List all subdomains (admin only)
   * GET /subdomains
   */
  @Get('/admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  async listAllSubdomains(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subdomainService.listAllSubdomains(
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }
}
