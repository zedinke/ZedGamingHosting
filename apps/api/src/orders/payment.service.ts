import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { ProvisioningService } from './provisioning.service';
import { InvoiceService } from './invoice.service';
import { EmailService } from '../email/email.service';
import { BarionService } from '../payments/barion.service';
import { PayPalService } from '../payments/paypal.service';
import { UpayService } from '../payments/upay.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: ProvisioningService,
    private readonly invoiceService: InvoiceService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => BarionService))
    private readonly barionService: BarionService,
    @Inject(forwardRef(() => PayPalService))
    private readonly paypalService: PayPalService,
    @Inject(forwardRef(() => UpayService))
    private readonly upayService: UpayService,
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
   * Barion payment: generate redirect URL
   */
  async generateBarionRedirect(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.user) {
      throw new Error('Order user not found');
    }

    try {
      const result = await this.barionService.startPayment({
        orderId: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        amount: order.totalAmount,
        currency: order.currency,
        payerEmail: order.user.email,
        locale: 'hu-HU',
      });

      // Store Barion payment ID in order
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId: result.paymentId,
          paymentMethod: 'barion',
        },
      });

      this.logger.log(
        `Barion payment initiated for order ${orderId}: ${result.paymentId}`,
      );

      return { redirectUrl: result.gatewayUrl, paymentId: result.paymentId };
    } catch (error) {
      this.logger.error(
        `Failed to generate Barion redirect for order ${orderId}: ${error}`,
      );
      throw error;
    }
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

  /**
   * PayPal payment: generate redirect URL
   */
  async generatePayPalRedirect(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.user) {
      throw new Error('Order user not found');
    }

    try {
      const result = await this.paypalService.startPayment({
        orderId: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        amount: order.totalAmount,
        currency: order.currency,
        payerEmail: order.user.email,
        locale: 'hu-HU',
      });

      // Store PayPal payment ID in order
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId: result.paymentId,
          paymentMethod: 'paypal',
        },
      });

      this.logger.log(
        `PayPal payment initiated for order ${orderId}: ${result.paymentId}`,
      );

      return { redirectUrl: result.gatewayUrl, paymentId: result.paymentId };
    } catch (error) {
      this.logger.error(
        `Failed to generate PayPal redirect for order ${orderId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Upay payment: generate redirect URL for card payment
   */
  async generateUpayRedirect(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.user) {
      throw new Error('Order user not found');
    }

    try {
      const result = await this.upayService.startPayment({
        orderId: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        amount: order.totalAmount,
        currency: order.currency,
        payerEmail: order.user.email,
        locale: 'hu-HU',
      });

      // Store Upay payment ID in order
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId: result.paymentId,
          paymentMethod: 'upay',
        },
      });

      this.logger.log(
        `Upay payment initiated for order ${orderId}: ${result.paymentId}`,
      );

      return { redirectUrl: result.gatewayUrl, paymentId: result.paymentId };
    } catch (error) {
      this.logger.error(
        `Failed to generate Upay redirect for order ${orderId}: ${error}`,
      );
      throw error;
    }
  }
}
