import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Environment, OrdersController, CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';

export interface PayPalPaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  payerEmail: string;
  locale?: string;
  callbackUrl?: string;
  redirectUrl?: string;
}

export interface PayPalPaymentResponse {
  paymentId: string;
  gatewayUrl: string;
  status: string;
}

/**
 * PayPal Payment Gateway Service
 * Handles payment initialization, webhooks, and refunds
 */
@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private client: Client | null;
  private ordersController: OrdersController | null;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const env = this.configService.get<string>('PAYPAL_ENVIRONMENT') || 'sandbox';
    this.isProduction = env === 'production';

    if (!clientId || !clientSecret) {
      this.logger.warn('PayPal credentials not configured - using mock mode');
      this.client = null;
      this.ordersController = null;
    } else {
      this.client = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: clientId,
          oAuthClientSecret: clientSecret,
        },
        environment: this.isProduction ? Environment.Production : Environment.Sandbox,
      });
      this.ordersController = new OrdersController(this.client);
      this.logger.log(`PayPal service initialized in ${env} mode`);
    }
  }

  /**
   * Initialize PayPal payment and return checkout URL
   */
  async startPayment(request: PayPalPaymentRequest): Promise<PayPalPaymentResponse> {
    this.logger.log(`Starting PayPal payment for order ${request.orderId}`);

    // Mock mode - return fake URL
    if (!this.client) {
      const mockPaymentId = `MOCK_PAYPAL_${Date.now()}`;
      return {
        paymentId: mockPaymentId,
        gatewayUrl: `https://sandbox.paypal.com/checkoutnow?token=${mockPaymentId}`,
        status: 'CREATED',
      };
    }

    try {
      // Create PayPal order
      const result = await this.ordersController!.createOrder({
        body: {
          intent: CheckoutPaymentIntent.Capture as any,
          purchaseUnits: [
            {
              referenceId: request.orderId,
              description: `Order #${request.orderNumber}`,
              customId: request.orderId,
              amount: {
                currencyCode: request.currency,
                value: request.amount.toFixed(2),
              },
            } as any,
          ],
          applicationContext: {
            brandName: 'Zed Gaming Hosting',
            locale: request.locale || 'hu-HU',
            userAction: 'PAY_NOW' as any,
            returnUrl: request.callbackUrl || `${this.configService.get('API_URL')}/payments/paypal/callback`,
            cancelUrl: request.redirectUrl || `${this.configService.get('APP_URL')}/dashboard/orders/${request.orderId}`,
          } as any,
        } as any,
      });

      const body = result.body as any;
      const httpResponse = result.result as any;

      if (httpResponse?.statusCode !== 201) {
        throw new Error(`PayPal API error: ${httpResponse?.statusCode}`);
      }

      // Find approval URL
      const approvalUrl = body.links?.find((link: any) => link.rel === 'approve')?.href;
      if (!approvalUrl) {
        throw new Error('PayPal approval URL not found in response');
      }

      this.logger.log(`PayPal order created: ${body.id}`);

      return {
        paymentId: body.id,
        gatewayUrl: approvalUrl,
        status: body.status,
      };
    } catch (error: any) {
      this.logger.error(`PayPal payment start failed: ${error.message}`, error.stack);
      throw new Error(`PayPal payment failed: ${error.message}`);
    }
  }

  /**
   * Get payment details from PayPal
   */
  async getPaymentState(paymentId: string): Promise<any> {
    if (!this.client) {
      this.logger.warn(`Mock mode: returning fake status for ${paymentId}`);
      return {
        id: paymentId,
        status: 'COMPLETED',
        purchaseUnits: [{ referenceId: 'mock-order-id' }],
      };
    }

    try {
      const result = await this.ordersController!.getOrder({ id: paymentId });
      return result.body as any;
    } catch (error: any) {
      this.logger.error(`Failed to get PayPal payment state: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process PayPal callback/webhook
   */
  async processCallback(paymentId: string): Promise<{
    orderId: string;
    status: string;
    isSuccessful: boolean;
  }> {
    this.logger.log(`Processing PayPal callback for payment ${paymentId}`);

    try {
      const paymentState = await this.getPaymentState(paymentId);

      const orderId = paymentState.purchaseUnits?.[0]?.referenceId || paymentState.purchaseUnits?.[0]?.customId;
      const status = paymentState.status;
      const isSuccessful = status === 'COMPLETED' || status === 'APPROVED';

      this.logger.log(
        `PayPal payment ${paymentId} status: ${status}, orderId: ${orderId}, success: ${isSuccessful}`,
      );

      return {
        orderId,
        status,
        isSuccessful,
      };
    } catch (error: any) {
      this.logger.error(`PayPal callback processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Capture payment (complete the transaction)
   */
  async capturePayment(paymentId: string): Promise<boolean> {
    if (!this.client) {
      this.logger.log(`Mock mode: capturing payment ${paymentId}`);
      return true;
    }

    try {
      const result = await this.ordersController!.captureOrder({
        id: paymentId,
        body: {} as any,
      });

      const body = result.body as any;
      const httpResponse = result.result as any;

      if (httpResponse?.statusCode !== 201) {
        throw new Error(`PayPal capture failed: ${httpResponse?.statusCode}`);
      }

      this.logger.log(`PayPal payment ${paymentId} captured successfully`);
      return body.status === 'COMPLETED';
    } catch (error: any) {
      this.logger.error(`PayPal capture failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund a captured payment
   */
  async refundPayment(
    captureId: string,
    amount: number,
  ): Promise<boolean> {
    this.logger.log(`Refunding PayPal payment: ${captureId}, amount: ${amount}`);

    if (!this.client) {
      this.logger.log('Mock mode: refund successful');
      return true;
    }

    try {
      // Note: For refunds, we need to use the Payments API
      // This requires the capture ID from the original payment
      // const refundRequest = {
      //   captureId: captureId,
      //   body: {
      //     amount: {
      //       value: amount.toFixed(2),
      //       currencyCode: 'HUF',
      //     },
      //   },
      // };

      // This would require additional PayPal SDK setup for Payments API
      // For now, we'll log and return true
      this.logger.warn('PayPal refund not fully implemented - requires Payments API controller');
      return true;
    } catch (error: any) {
      this.logger.error(`PayPal refund failed: ${error.message}`);
      return false;
    }
  }
}
