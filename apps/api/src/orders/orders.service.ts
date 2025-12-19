import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { AuditService } from '../audit/audit.service';
import { WalletService } from './wallet.service';
import { BillingCycle } from './dto/create-order.dto';
import { BarionService } from '../payments/barion.service';
import { PayPalService } from '../payments/paypal.service';
import { UpayService } from '../payments/upay.service';
import { EmailService } from '../email/email.service';


interface CreateOrderInput {
  userId: string;
  userRole?: string;
  planId?: string;
  planSlug?: string;
  billingCycle: BillingCycle;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly walletService: WalletService,
    private readonly barion: BarionService,
    private readonly paypal: PayPalService,
    private readonly upay: UpayService,
    private readonly emailService: EmailService,
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

  /**
   * Cancel an order and refund the user if payment was made
   */
  async cancelOrder(id: string, userId: string): Promise<any> {
    const order = await this.getOrderById(id, userId);

    // Check if order can be cancelled
    if (['CANCELLED', 'REFUNDED'].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order with status ${order.status}`);
    }

    // If order was paid, refund the user
    let refundAmount = 0;
    if (order.status === 'PAID' || order.status === 'PROVISIONING' || order.status === 'ACTIVE') {
      refundAmount = order.totalAmount;
      
      // Add refund to user wallet
      await this.walletService.addBalance({
        userId,
        amount: refundAmount,
        reason: `Refund for cancelled order #${order.id.substring(0, 8)}`,
        adminId: 'system',
      });

      // Try external refund where possible (best-effort)
      try {
        if (order.paymentMethod === 'barion' && order.paymentId) {
          await this.barion.refundPayment(order.paymentId, order.totalAmount, order.id);
        } else if (order.paymentMethod === 'paypal' && order.paymentId) {
          // NOTE: PayPal refund requires capture ID. Stubbed as success in service.
          await this.paypal.refundPayment(order.paymentId, order.totalAmount);
        } else if (order.paymentMethod === 'upay' && order.paymentId) {
          await this.upay.refundPayment(order.paymentId, order.totalAmount, order.id);
        }
      } catch (e) {
        this.logger.warn(`External refund attempt failed for order ${order.id}: ${e}`);
      }
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Create DEPROVISION task if server exists
    if (order.serverId) {
      try {
        const server = await this.prisma.gameServer.findUnique({
          where: { uuid: order.serverId },
          select: { uuid: true, nodeId: true, ownerId: true },
        });

        if (server && server.nodeId) {
          // Create DEPROVISION task for daemon to process
          await this.prisma.task.create({
            data: {
              nodeId: server.nodeId,
              type: 'DEPROVISION',
              status: 'PENDING',
              data: {
                serverUuid: server.uuid,
                userId: server.ownerId,
                reason: 'ORDER_CANCELLED',
                orderId: order.id,
              },
            },
          });
          this.logger.log(`Created DEPROVISION task for server ${server.uuid}`);

                  // Send deprovision email to user (best effort)
                  try {
                    const user = await this.prisma.user.findUnique({
                      where: { id: server.ownerId },
                      select: { email: true },
                    });

                    if (user) {
                      const serverName = `Server ${server.uuid.substring(0, 8)}`;
                      await this.emailService.sendServerDeprovisionEmail(
                        user.email,
                        user.email.split('@')[0],
                        serverName,
                        order.id,
                        'ORDER_CANCELLED',
                      );
                    }
                  } catch (emailError: any) {
                    this.logger.error(`Failed to send deprovision email: ${emailError?.message || 'Unknown error'}`);
                  }
        }
      } catch (error: any) {
        this.logger.error(`Failed to create DEPROVISION task: ${error?.message || 'Unknown error'}`);
      }
    }

    // Audit log
    await this.auditService.createLog({
      action: 'CANCEL_ORDER',
      resourceId: id,
      userId,
      ipAddress: 'system',
      details: {
        previousStatus: order.status,
        refundAmount,
      },
    });

    this.logger.log(`Order ${id} cancelled by user ${userId}, refund: ${refundAmount}`);

    return updatedOrder;
  }
}
