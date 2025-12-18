import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { AuditService } from '../audit/audit.service';

interface CreateOrderInput {
  userId: string;
  userRole?: string;
  planId?: string;
  planSlug?: string;
  billingCycle: 'monthly' | 'hourly';
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

    const unitPrice = billingCycle === 'monthly' ? plan.monthlyPrice : (plan.hourlyPrice ?? plan.monthlyPrice);
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

    // Create order
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

    // For SUPPORTER role, explicitly skip any invoice generation (future integration point)
    // In the future, conditionally call InvoiceService here only if userRole !== 'SUPPORTER'

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
}
