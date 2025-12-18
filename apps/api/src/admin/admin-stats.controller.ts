import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PrismaService } from '@zed-hosting/db';

interface PlatformStats {
  users: {
    total: number;
    active: number;
    premium: number;
  };
  orders: {
    total: number;
    paid: number;
    pending: number;
  };
  servers: {
    total: number;
    active: number;
  };
  nodes: {
    total: number;
    healthy: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
}

/**
 * Admin Stats Controller
 * Platform-wide statistics and metrics
 */
@Controller('admin/stats')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminStatsController {
  private readonly logger = new Logger(AdminStatsController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get platform statistics (ADMIN ONLY)
   */
  @Get()
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDayAfterLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all metrics in parallel
      const [
        totalUsers,
        activeUsers,
        premiumUsers,
        totalOrders,
        paidOrders,
        pendingOrders,
        totalServers,
        activeServers,
        totalNodes,
        healthyNodes,
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
      ] = await Promise.all([
        // Users
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'SUPERADMIN',
          },
        }),

        // Orders
        this.prisma.order.count(),
        this.prisma.order.count({
          where: {
            status: {
              in: ['PAID', 'ACTIVE'],
            },
          },
        }),
        this.prisma.order.count({
          where: {
            status: 'PAYMENT_PENDING',
          },
        }),

        // Servers (if exists in DB)
        this.prisma.$executeRawUnsafe('SELECT COUNT(*) as count FROM Server')
          .then((result: any) => result[0]?.count || 0)
          .catch(() => 0),
        this.prisma.$executeRawUnsafe(
          'SELECT COUNT(*) as count FROM Server WHERE status = "ACTIVE"',
        )
          .then((result: any) => result[0]?.count || 0)
          .catch(() => 0),

        // Nodes
        this.prisma.$executeRawUnsafe('SELECT COUNT(*) as count FROM Node')
          .then((result: any) => result[0]?.count || 0)
          .catch(() => 0),
        this.prisma.$executeRawUnsafe('SELECT COUNT(*) as count FROM Node WHERE status = "HEALTHY"')
          .then((result: any) => result[0]?.count || 0)
          .catch(() => 0),

        // Revenue calculations
        this.prisma.order.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            status: {
              in: ['PAID', 'ACTIVE'],
            },
          },
        }),
        this.prisma.order.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            status: {
              in: ['PAID', 'ACTIVE'],
            },
            createdAt: {
              gte: firstDayThisMonth,
              lt: now,
            },
          },
        }),
        this.prisma.order.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            status: {
              in: ['PAID', 'ACTIVE'],
            },
            createdAt: {
              gte: firstDayLastMonth,
              lt: firstDayAfterLastMonth,
            },
          },
        }),
      ]);

      const stats: PlatformStats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          premium: premiumUsers,
        },
        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
        },
        servers: {
          total: totalServers as number,
          active: activeServers as number,
        },
        nodes: {
          total: totalNodes as number,
          healthy: healthyNodes as number,
        },
        revenue: {
          total: (totalRevenue?._sum?.totalAmount || 0) as number,
          thisMonth: (thisMonthRevenue?._sum?.totalAmount || 0) as number,
          lastMonth: (lastMonthRevenue?._sum?.totalAmount || 0) as number,
        },
      };

      this.logger.log('Platform stats retrieved');
      return stats;
    } catch (error: any) {
      this.logger.error(`Failed to fetch platform stats: ${error.message}`);
      throw error;
    }
  }
}
