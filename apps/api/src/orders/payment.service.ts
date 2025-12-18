import { Injectable } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mock payment: immediately mark order as PAID
   */
  async processMockPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID' as any,
        paidAt: new Date(),
        paymentMethod: 'mock',
        paymentId: `mock_${Date.now()}`,
      },
    });

    return updatedOrder;
  }

  /**
   * Barion payment: generate redirect URL (stub)
   */
  async generateBarionRedirect(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Stub: in production, call Barion API
    const redirectUrl = `https://payment.sandbox.barion.com/Pay?token=BARION_TOKEN_STUB_${orderId}`;
    return { redirectUrl };
  }

  /**
   * Stripe payment: generate checkout session (stub)
   */
  async generateStripeSession(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Stub: in production, call Stripe API
    const sessionUrl = `https://checkout.stripe.com/pay/cs_test_stub_${orderId}`;
    return { sessionUrl };
  }
}
