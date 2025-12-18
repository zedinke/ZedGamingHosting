import { Controller, Get, Query, UseGuards, Logger, Param, Put, Delete, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PrismaService } from '@zed-hosting/db';

interface AdminOrdersQuery {
  skip?: string;
  take?: string;
  status?: string;
  paymentMethod?: string;
}

/**
 * Admin Controller for Orders
 * Requires ADMIN role
 */
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminOrdersController {
  private readonly logger = new Logger(AdminOrdersController.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get all orders with filters and pagination (ADMIN ONLY)
   */
  @Get()
  async getAllOrders(@Query() query: AdminOrdersQuery) {
    const skip = parseInt(query.skip || '0', 10);
    const take = parseInt(query.take || '50', 10);
    const status = query.status;
    const paymentMethod = query.paymentMethod;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    try {
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                gameType: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        data: orders,
        pagination: {
          skip,
          take,
          total,
          pages: Math.ceil(total / take),
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch admin orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single order details (ADMIN ONLY)
   */
  @Get(':id')
  async getOrderDetail(@Param('id') orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          plan: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error: any) {
      this.logger.error(`Failed to fetch order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update order (admin actions)
   */
  @Put(':id')
  async updateOrder(
    @Param('id') orderId: string,
    @Body() updateData: any,
  ) {
    try {
      // Only allow specific fields to be updated
      const allowedFields = ['notes', 'status'];
      const updates: any = {};

      for (const field of allowedFields) {
        if (field in updateData) {
          updates[field] = updateData[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: updates,
        include: {
          user: true,
          plan: true,
        },
      });

      this.logger.log(`Order ${orderId} updated by admin`);
      return order;
    } catch (error: any) {
      this.logger.error(`Failed to update order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Force refund an order (admin action)
   */
  @Put(':id/refund')
  async refundOrder(@Param('id') orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Return paid amount to user wallet
      if (order.status === 'PAID' || order.status === 'ACTIVE') {
        await this.prisma.user.update({
          where: { id: order.userId },
          data: {
            balance: {
              increment: order.totalAmount,
            },
          },
        });

        const updatedOrder = await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'REFUNDED' as any,
            notes: `Admin refund at ${new Date().toISOString()}`,
          },
          include: { user: true, plan: true },
        });

        this.logger.log(
          `Order ${orderId} refunded by admin, amount ${order.totalAmount} added to user ${order.userId}`,
        );
        return updatedOrder;
      }

      throw new Error('Order cannot be refunded in current status');
    } catch (error: any) {
      this.logger.error(`Failed to refund order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete order (admin action - careful!)
   */
  @Delete(':id')
  async deleteOrder(@Param('id') orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Only delete if not paid
      if (order.status === 'PAID' || order.status === 'ACTIVE') {
        throw new Error('Cannot delete paid orders (use refund instead)');
      }

      await this.prisma.order.delete({
        where: { id: orderId },
      });

      this.logger.log(`Order ${orderId} deleted by admin`);
      return { success: true, message: 'Order deleted' };
    } catch (error: any) {
      this.logger.error(`Failed to delete order ${orderId}: ${error.message}`);
      throw error;
    }
  }
}
