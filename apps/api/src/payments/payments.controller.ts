import { Controller, Get, Post, Query, Body, Headers, Logger } from '@nestjs/common';
import { BarionService } from './barion.service';
import { PayPalService } from './paypal.service';
import { UpayService } from './upay.service';
import { PrismaService } from '@zed-hosting/db';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Payment webhooks and callbacks controller
 * Handles Barion, PayPal, and Upay payment notifications
 */
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly barionService: BarionService,
    private readonly paypalService: PayPalService,
    private readonly upayService: UpayService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Barion callback endpoint (webhook)
   * Called by Barion when payment status changes
   */
  @Public()
  @Get('barion/callback')
  async barionCallback(@Query('paymentId') paymentId: string) {
    this.logger.log(`Received Barion callback for payment: ${paymentId}`);

    try {
      const result = await this.barionService.processCallback(paymentId);

      if (result.isSuccessful) {
        // Update order status to PAID
        const order = await this.prisma.order.findUnique({
          where: { id: result.orderId },
        });

        if (!order) {
          this.logger.error(`Order ${result.orderId} not found`);
          return { success: false, error: 'Order not found' };
        }

        if (order.status === 'PAYMENT_PENDING') {
          await this.prisma.order.update({
            where: { id: result.orderId },
            data: {
              status: 'PAID' as any,
              paidAt: new Date(),
              paymentMethod: 'barion',
              paymentId: paymentId,
            },
          });

          this.logger.log(
            `Order ${result.orderId} marked as PAID via Barion payment ${paymentId}`,
          );

          // Note: Provisioning and emails will be triggered by payment service
        }
      }

      return { success: true, orderId: result.orderId };
    } catch (error: any) {
      this.logger.error(`Barion callback processing failed: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manual payment status check endpoint
   */
  @Public()
  @Get('barion/status')
  async checkBarionStatus(@Query('paymentId') paymentId: string) {
    try {
      const state = await this.barionService.getPaymentState(paymentId);
      return { success: true, state };
    } catch (error: any) {
      this.logger.error(`Failed to check Barion status: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * PayPal callback endpoint
   * Called by PayPal when user completes/cancels payment
   */
  @Public()
  @Get('paypal/callback')
  async paypalCallback(
    @Query('token') token: string,
    @Query('PayerID') _payerId: string,
  ) {
    this.logger.log(`Received PayPal callback for payment: ${token}`);

    try {
      // Capture the payment
      const captured = await this.paypalService.capturePayment(token);
      
      if (!captured) {
        this.logger.error(`PayPal payment ${token} capture failed`);
        return { success: false, error: 'Payment capture failed' };
      }

      const result = await this.paypalService.processCallback(token);

      if (result.isSuccessful) {
        // Update order status to PAID
        const order = await this.prisma.order.findUnique({
          where: { id: result.orderId },
        });

        if (!order) {
          this.logger.error(`Order ${result.orderId} not found`);
          return { success: false, error: 'Order not found' };
        }

        if (order.status === 'PAYMENT_PENDING') {
          await this.prisma.order.update({
            where: { id: result.orderId },
            data: {
              status: 'PAID' as any,
              paidAt: new Date(),
              paymentMethod: 'paypal',
              paymentId: token,
            },
          });

          this.logger.log(
            `Order ${result.orderId} marked as PAID via PayPal payment ${token}`,
          );
        }
      }

      return { success: true, orderId: result.orderId };
    } catch (error: any) {
      this.logger.error(`PayPal callback processing failed: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * PayPal status check endpoint
   */
  @Public()
  @Get('paypal/status')
  async checkPayPalStatus(@Query('paymentId') paymentId: string) {
    try {
      const state = await this.paypalService.getPaymentState(paymentId);
      return { success: true, state };
    } catch (error: any) {
      this.logger.error(`Failed to check PayPal status: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upay callback endpoint
   * Called by Upay when user completes payment
   */
  @Public()
  @Get('upay/callback')
  async upayCallback(@Query('paymentId') paymentId: string) {
    this.logger.log(`Received Upay callback for payment: ${paymentId}`);

    try {
      const result = await this.upayService.processCallback(paymentId);

      if (result.isSuccessful) {
        // Update order status to PAID
        const order = await this.prisma.order.findUnique({
          where: { id: result.orderId },
        });

        if (!order) {
          this.logger.error(`Order ${result.orderId} not found`);
          return { success: false, error: 'Order not found' };
        }

        if (order.status === 'PAYMENT_PENDING') {
          await this.prisma.order.update({
            where: { id: result.orderId },
            data: {
              status: 'PAID' as any,
              paidAt: new Date(),
              paymentMethod: 'upay',
              paymentId: paymentId,
            },
          });

          this.logger.log(
            `Order ${result.orderId} marked as PAID via Upay payment ${paymentId}`,
          );
        }
      }

      return { success: true, orderId: result.orderId };
    } catch (error: any) {
      this.logger.error(`Upay callback processing failed: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upay webhook endpoint (for server-to-server notifications)
   */
  @Public()
  @Post('upay/webhook')
  async upayWebhook(
    @Body() payload: any,
    @Headers('x-upay-signature') signature: string,
  ) {
    this.logger.log('Received Upay webhook notification');

    try {
      // Verify signature
      const isValid = this.upayService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        this.logger.error('Upay webhook signature verification failed');
        return { success: false, error: 'Invalid signature' };
      }

      const paymentId = payload.paymentId;
      const result = await this.upayService.processCallback(paymentId);

      if (result.isSuccessful) {
        const order = await this.prisma.order.findUnique({
          where: { id: result.orderId },
        });

        if (!order) {
          this.logger.error(`Order ${result.orderId} not found`);
          return { success: false, error: 'Order not found' };
        }

        if (order.status === 'PAYMENT_PENDING') {
          await this.prisma.order.update({
            where: { id: result.orderId },
            data: {
              status: 'PAID' as any,
              paidAt: new Date(),
              paymentMethod: 'upay',
              paymentId: paymentId,
            },
          });

          this.logger.log(
            `Order ${result.orderId} marked as PAID via Upay webhook ${paymentId}`,
          );
        }
      }

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Upay webhook processing failed: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upay status check endpoint
   */
  @Public()
  @Get('upay/status')
  async checkUpayStatus(@Query('paymentId') paymentId: string) {
    try {
      const state = await this.upayService.getPaymentState(paymentId);
      return { success: true, state };
    } catch (error: any) {
      this.logger.error(`Failed to check Upay status: ${error}`);
      return { success: false, error: error.message };
    }
  }
}
