import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '@zed-hosting/db';

export interface InvoiceListFilters {
  dateFrom?: string;
  dateTo?: string;
  tenantId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'paidAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'SUPERADMIN')
export class AdminInvoicesController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/admin/invoices
   * List all paid orders (invoices) with pagination and filtering
   */
  @Get()
  async listInvoices(@Query() filters: InvoiceListFilters) {
    const {
      dateFrom,
      dateTo,
      tenantId,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50,
      sortBy = 'paidAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {
      paidAt: { not: null }, // Only paid orders (invoices)
    };

    if (dateFrom) {
      where.paidAt = { ...where.paidAt, gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.paidAt = { ...where.paidAt, lte: new Date(dateTo) };
    }

    if (tenantId) {
      where.user = {
        tenantId,
      };
    }

    if (minAmount !== undefined) {
      where.totalAmount = { ...where.totalAmount, gte: Number(minAmount) };
    }

    if (maxAmount !== undefined) {
      where.totalAmount = { ...where.totalAmount, lte: Number(maxAmount) };
    }

    // Fetch invoices
    const [invoices, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * GET /api/admin/invoices/stats
   * Get invoice statistics
   */
  @Get('stats')
  async getInvoiceStats() {
    const [totalInvoices, totalRevenue, revenueByMonth] = await Promise.all([
      this.prisma.order.count({
        where: { paidAt: { not: null } },
      }),
      this.prisma.order.aggregate({
        where: { paidAt: { not: null } },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.$queryRaw<
        Array<{ month: string; revenue: number; count: number }>
      >`
        SELECT 
          DATE_FORMAT(paidAt, '%Y-%m') as month,
          SUM(totalAmount) as revenue,
          COUNT(*) as count
        FROM Order
        WHERE paidAt IS NOT NULL
        GROUP BY DATE_FORMAT(paidAt, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

    return {
      totalInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      revenueByMonth,
    };
  }
}
