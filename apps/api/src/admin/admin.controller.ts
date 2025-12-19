import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface CreateUserDto {
  email: string;
  password: string;
  role: string;
  balance?: number;
}

interface UpdateUserDto {
  email?: string;
  role?: string;
  balance?: number;
}

interface UpdateBalanceDto {
  amount: number;
  type: 'add' | 'subtract' | 'set';
  reason?: string;
}

/**
 * Admin Controller - handles admin-only endpoints
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN', 'SUPER_ADMIN', 'RESELLER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get all servers
   * GET /api/admin/servers
   */
  @Get('servers')
  async getAllServers() {
    return await this.adminService.getAllServers();
  }

  /**
   * Get system settings
   * GET /api/admin/settings
   */
  @Get('settings')
  async getSettings() {
    return await this.adminService.getSettings();
  }

  /**
   * Update system settings
   * PUT /api/admin/settings
   */
  @Put('settings')
  async updateSettings(
    @Body() dto: {
      maintenanceMode?: boolean;
      allowNewRegistrations?: boolean;
      defaultUserRole?: string;
      maxServersPerUser?: number;
      maxRamPerUser?: number;
      maxDiskPerUser?: number;
    },
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return await this.adminService.updateSettings(dto, req.user.id, ipAddress);
  }
}

