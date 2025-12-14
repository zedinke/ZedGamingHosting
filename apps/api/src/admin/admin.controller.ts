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
   * Get all users
   * GET /api/admin/users
   */
  @Get('users')
  async getAllUsers(@Request() req: any) {
    return await this.adminService.getAllUsers();
  }

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return await this.adminService.getUserById(id);
  }

  /**
   * Create new user
   * POST /api/admin/users
   */
  @Post('users')
  async createUser(
    @Body() dto: CreateUserDto,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return await this.adminService.createUser(dto, req.user.id, ipAddress);
  }

  /**
   * Update user
   * PUT /api/admin/users/:id
   */
  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return await this.adminService.updateUser(id, dto, req.user.id, ipAddress);
  }

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return await this.adminService.deleteUser(id, req.user.id, ipAddress);
  }

  /**
   * Update user balance
   * POST /api/admin/users/:id/balance
   */
  @Post('users/:id/balance')
  async updateUserBalance(
    @Param('id') id: string,
    @Body() dto: UpdateBalanceDto,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return await this.adminService.updateUserBalance(id, dto, req.user.id, ipAddress);
  }

  /**
   * Get all servers
   * GET /api/admin/servers
   */
  @Get('servers')
  async getAllServers() {
    return await this.adminService.getAllServers();
  }

  /**
   * Get platform statistics
   * GET /api/admin/stats
   */
  @Get('stats')
  async getStats() {
    return await this.adminService.getStats();
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

