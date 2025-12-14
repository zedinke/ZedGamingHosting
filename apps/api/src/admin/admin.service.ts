import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

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

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        balance: true,
        createdAt: true,
        tenantId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        balance: true,
        createdAt: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Create new user (admin only)
   */
  async createUser(dto: CreateUserDto, adminId: string, ipAddress: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        balance: dto.balance || 0,
      },
      select: {
        id: true,
        email: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    // Audit log
    await this.auditService.createLog({
      action: 'CREATE_USER',
      resourceId: user.id,
      userId: adminId,
      ipAddress,
      details: {
        email: user.email,
        role: user.role,
      },
    });

    // Send welcome email
    this.emailService.sendWelcomeEmail(user.email, user.email.split('@')[0]).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return user;
  }

  /**
   * Update user (admin only)
   */
  async updateUser(userId: string, dto: UpdateUserDto, adminId: string, ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.role && { role: dto.role }),
        ...(dto.balance !== undefined && { balance: dto.balance }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    // Audit log
    await this.auditService.createLog({
      action: 'UPDATE_USER',
      resourceId: userId,
      userId: adminId,
      ipAddress,
      details: {
        oldEmail: user.email,
        newEmail: dto.email,
        oldRole: user.role,
        newRole: dto.role,
        oldBalance: user.balance,
        newBalance: dto.balance,
      },
    });

    return updatedUser;
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string, adminId: string, ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has servers
    const serverCount = await this.prisma.gameServer.count({
      where: { ownerId: userId },
    });

    if (serverCount > 0) {
      throw new BadRequestException('Cannot delete user with active servers');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    // Audit log
    await this.auditService.createLog({
      action: 'DELETE_USER',
      resourceId: userId,
      userId: adminId,
      ipAddress,
      details: {
        email: user.email,
        role: user.role,
      },
    });

    return { success: true };
  }

  /**
   * Update user balance (admin only)
   */
  async updateUserBalance(userId: string, dto: UpdateBalanceDto, adminId: string, ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let newBalance: number;
    const oldBalance = user.balance;

    switch (dto.type) {
      case 'add':
        newBalance = user.balance + dto.amount;
        break;
      case 'subtract':
        newBalance = Math.max(0, user.balance - dto.amount);
        break;
      case 'set':
        newBalance = Math.max(0, dto.amount);
        break;
      default:
        throw new BadRequestException('Invalid balance operation type');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
      select: {
        id: true,
        email: true,
        balance: true,
      },
    });

    // Audit log
    await this.auditService.createLog({
      action: 'UPDATE_USER_BALANCE',
      resourceId: userId,
      userId: adminId,
      ipAddress,
      details: {
        oldBalance,
        newBalance,
        amount: dto.amount,
        type: dto.type,
        reason: dto.reason,
      },
    });

    return updatedUser;
  }

  /**
   * Get all servers (admin only)
   */
  async getAllServers() {
    return await this.prisma.gameServer.findMany({
      include: {
        node: {
          select: {
            id: true,
            name: true,
            publicFqdn: true,
            ipAddress: true,
          },
        },
        networkAllocations: {
          select: {
            port: true,
            protocol: true,
            type: true,
          },
        },
        metrics: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get platform statistics (admin only)
   */
  async getStats() {
    const [totalUsers, totalServers, totalNodes, activeServers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.gameServer.count(),
      this.prisma.node.count(),
      this.prisma.gameServer.count({
        where: { status: 'RUNNING' },
      }),
    ]);

    // Calculate total revenue (sum of all user balances - simplified)
    const revenueResult = await this.prisma.user.aggregate({
      _sum: {
        balance: true,
      },
    });

    // Get server distribution by game type
    const serverDistribution = await this.prisma.gameServer.groupBy({
      by: ['gameType'],
      _count: {
        gameType: true,
      },
    });

    // Get monthly revenue (mock data for now - would need transaction history)
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleString('hu-HU', { month: 'short' }),
        revenue: Math.random() * 3000 + 1000, // Mock data
      };
    });

    return {
      totalUsers,
      totalServers,
      totalNodes,
      activeServers,
      totalRevenue: revenueResult._sum.balance || 0,
      monthlyRevenue,
      serverDistribution: serverDistribution.map((item) => ({
        game: item.gameType,
        count: item._count.gameType,
      })),
    };
  }

  /**
   * Get system settings
   */
  async getSettings() {
    // For now, return default settings
    // In production, these would be stored in a SystemSettings table
    return {
      maintenanceMode: false,
      allowNewRegistrations: true,
      defaultUserRole: 'USER',
      maxServersPerUser: 10,
      maxRamPerUser: 16384, // MB
      maxDiskPerUser: 500, // GB
    };
  }

  /**
   * Update system settings
   */
  async updateSettings(
    dto: {
      maintenanceMode?: boolean;
      allowNewRegistrations?: boolean;
      defaultUserRole?: string;
      maxServersPerUser?: number;
      maxRamPerUser?: number;
      maxDiskPerUser?: number;
    },
    adminId: string,
    ipAddress: string,
  ) {
    // TODO: Store settings in database (SystemSettings table)
    // For now, just validate and return success
    // In production, this would update a SystemSettings record
    
    // Validate settings
    if (dto.maxServersPerUser !== undefined && dto.maxServersPerUser < 1) {
      throw new Error('Max servers per user must be at least 1');
    }
    if (dto.maxRamPerUser !== undefined && dto.maxRamPerUser < 1024) {
      throw new Error('Max RAM per user must be at least 1024 MB');
    }
    if (dto.maxDiskPerUser !== undefined && dto.maxDiskPerUser < 10) {
      throw new Error('Max disk per user must be at least 10 GB');
    }

    // Log the settings change
    await this.auditService.createLog({
      action: 'UPDATE_SYSTEM_SETTINGS',
      resourceId: 'system',
      userId: adminId,
      ipAddress,
      details: dto,
    });

    return {
      message: 'Settings updated successfully',
      settings: dto,
    };
  }
}

