import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { AuditService } from '../audit/audit.service';
import { BillingCycle } from './dto/create-order.dto';

interface CreateOrderInput {
  userId: string;
  userRole?: string;
  planId?: string;
  planSlug?: string;
  billingCycle: BillingCycle;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createOrder(input: CreateOrderInput) {
    const { planId, planSlug, billingCycle, userId, userRole } = input;

    if (!planId && !planSlug) {
      throw new BadRequestException('Either planId or planSlug is required');
    }

    const plan = await this.prisma.plan.findFirst({
      where: {
        OR: [
          planId ? { id: planId } : undefined,
          planSlug ? { slug: planSlug } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const unitPrice = billingCycle === BillingCycle.MONTHLY ? plan.monthlyPrice : (plan.hourlyPrice ?? plan.monthlyPrice);
    const totalAmount = (unitPrice || 0) + (plan.setupFee || 0);

    const priceSnapshot = {
      monthlyPrice: plan.monthlyPrice,
      hourlyPrice: plan.hourlyPrice,
      setupFee: plan.setupFee,
      resources: {
        ramMb: plan.ramMb,
        cpuCores: plan.cpuCores,
        diskGb: plan.diskGb,
        maxSlots: plan.maxSlots,
      },
      display: {
        name: plan.name,
        slug: plan.slug,
        gameType: plan.gameType,
      },
      billingCycle,
    };

    const order = await this.prisma.order.create({
      data: {
        userId,
        planId: plan.id,
        status: 'PAYMENT_PENDING' as any,
        priceSnapshot: priceSnapshot as any,
        totalAmount,
        currency: 'HUF',
        notes: userRole === 'SUPPORTER' ? 'Invoice suppressed: SUPPORTER role' : undefined,
      },
    });

    await this.auditService.createLog({
      action: 'CREATE_ORDER',
      resourceId: order.id,
      userId,
      ipAddress: 'system',
      details: {
        planId: plan.id,
        billingCycle,
        totalAmount,
        skippedInvoice: userRole === 'SUPPORTER',
      },
    });

    return order;
  }

  async listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: {
          select: {
            name: true,
            slug: true,
            gameType: true,
            monthlyPrice: true,
            hourlyPrice: true,
            setupFee: true,
          },
        },
      },
    });
  }

  async getOrderById(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        plan: {
          select: {
            name: true,
            slug: true,
            gameType: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
