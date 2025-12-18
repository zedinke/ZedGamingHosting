import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { ProvisioningService } from './provisioning.service';
import { InvoiceService } from './invoice.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: ProvisioningService,
    private readonly invoiceService: InvoiceService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Mock payment: immediately mark order as PAID
   */
  async processMockPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true, plan: true },
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
      include: { user: true, plan: true },
    });

    // Send payment confirmation email
    if (order.user) {
      try {
        await this.emailService.sendPaymentReceivedEmail(
          order.user.email,
          order.user.email,
          orderId,
          order.totalAmount,
          order.currency,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to send payment email for order ${orderId}: ${error}`,
        );
      }
    }

    // Send invoice email
    if (order.user) {
      try {
        await this.invoiceService.sendInvoiceByEmail(orderId);
      } catch (error) {
        this.logger.warn(
          `Failed to send invoice email for order ${orderId}: ${error}`,
        );
      }
    }

    // Trigger server provisioning asynchronously
    try {
      await this.provisioning.provisionServerForOrder(orderId);
    } catch (error) {
      this.logger.error(
        `Failed to provision server for order ${orderId}: ${error}`,
      );
      // Don't fail payment if provisioning fails - admin can retry
    }

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
