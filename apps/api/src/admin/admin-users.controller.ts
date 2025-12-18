import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PrismaService } from '@zed-hosting/db';

interface AdminUsersQuery {
  skip?: string;
  take?: string;
  role?: string;
  search?: string;
}

/**
 * Admin Users Controller
 * Manage users (ADMIN ONLY)
 */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users with filters and pagination (ADMIN ONLY)
   */
  @Get()
  async getAllUsers(@Query() query: AdminUsersQuery) {
    const skip = parseInt(query.skip || '0', 10);
    const take = parseInt(query.take || '50', 10);
    const role = query.role;
    const search = query.search;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            email: true,
            role: true,
            balance: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users,
        pagination: { skip, take, total, pages: Math.ceil(total / take) },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single user details (ADMIN ONLY)
   */
  @Get(':id')
  async getUserDetail(@Param('id') userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          balance: true,
          createdAt: true,
          orders: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) throw new Error('User not found');
      return user;
    } catch (error: any) {
      this.logger.error(`Failed to fetch user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user (ADMIN ONLY)
   */
  @Put(':id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: any,
  ) {
    try {
      const allowedFields = ['role', 'balance'];
      const updates: any = {};

      for (const field of allowedFields) {
        if (field in updateData) {
          if (field === 'balance') {
            // Just set balance, don't increment
            updates.balance = updateData.balance;
          } else {
            updates[field] = updateData[field];
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          role: true,
          balance: true,
        },
      });

      this.logger.log(`User ${userId} updated by admin: ${JSON.stringify(updates)}`);
      return user;
    } catch (error: any) {
      this.logger.error(`Failed to update user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adjust user balance (ADMIN ONLY)
   */
  @Put(':id/balance')
  async adjustBalance(
    @Param('id') userId: string,
    @Body() body: { amount: number; reason?: string },
  ) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: body.amount,
          },
        },
        select: {
          id: true,
          email: true,
          balance: true,
        },
      });

      this.logger.log(
        `User ${userId} balance adjusted by ${body.amount}${body.reason ? ` (${body.reason})` : ''}`,
      );
      return user;
    } catch (error: any) {
      this.logger.error(`Failed to adjust balance for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete user (ADMIN ONLY - careful!)
   */
  @Delete(':id')
  async deleteUser(@Param('id') userId: string) {
    try {
      // Check if user has active orders
      const activeOrders = await this.prisma.order.count({
        where: {
          userId,
          status: {
            in: ['PAID', 'ACTIVE', 'PROVISIONING'],
          },
        },
      });

      if (activeOrders > 0) {
        throw new Error('Cannot delete user with active orders');
      }

      await this.prisma.user.delete({
        where: { id: userId },
      });

      this.logger.log(`User ${userId} deleted by admin`);
      return { success: true, message: 'User deleted' };
    } catch (error: any) {
      this.logger.error(`Failed to delete user ${userId}: ${error.message}`);
      throw error;
    }
  }
}
