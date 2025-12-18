import { Controller, Get, Query, Logger } from '@nestjs/common';
import { BarionService } from './barion.service';
import { PrismaService } from '@zed-hosting/db';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Payment webhooks and callbacks controller
 * Handles Barion payment notifications
 */
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly barionService: BarionService,
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
}
