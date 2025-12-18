import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Barion = require('node-barion');

export interface BarionPaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  payerEmail: string;
  locale?: string;
  callbackUrl?: string;
  redirectUrl?: string;
}

export interface BarionPaymentResponse {
  paymentId: string;
  gatewayUrl: string;
  status: string;
}

/**
 * Barion Payment Gateway Service
 * Handles payment initialization and webhook processing
 */
@Injectable()
export class BarionService {
  private readonly logger = new Logger(BarionService.name);
  private barion: any;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    const posKey = this.configService.get<string>('BARION_POS_KEY');
    const env = this.configService.get<string>('BARION_ENVIRONMENT') || 'test';
    this.isProduction = env === 'production';

    if (!posKey) {
      this.logger.warn('Barion POS key not configured - using mock mode');
      this.barion = null;
    } else {
      this.barion = new Barion({
        POSKey: posKey,
        Environment: this.isProduction ? 'prod' : 'test',
        FundingSources: ['All'],
        GuestCheckOut: true,
        Locale: 'hu-HU',
      });
      this.logger.log(
        `Barion service initialized in ${env} mode`,
      );
    }
  }

  /**
   * Initialize a new payment in Barion
   */
  async startPayment(
    request: BarionPaymentRequest,
  ): Promise<BarionPaymentResponse> {
    if (!this.barion) {
      this.logger.warn('Barion not configured - returning mock payment URL');
      return {
        paymentId: `mock_barion_${Date.now()}`,
        gatewayUrl: `${this.configService.get('APP_URL')}/payment/barion/mock?orderId=${request.orderId}`,
        status: 'Prepared',
      };
    }

    try {
      const callbackUrl =
        request.callbackUrl ||
        `${this.configService.get('API_URL')}/payments/barion/callback`;
      const redirectUrl =
        request.redirectUrl ||
        `${this.configService.get('APP_URL')}/dashboard/orders/${request.orderId}`;

      const paymentRequest = {
        PaymentType: 'Immediate',
        ReservationPeriod: null,
        PaymentWindow: '00:30:00',
        GuestCheckOut: true,
        InitiateRecurrence: false,
        RecurrenceId: null,
        FundingSources: ['All'],
        PaymentRequestId: request.orderId,
        PayerHint: request.payerEmail,
        Locale: request.locale || 'hu-HU',
        OrderNumber: request.orderNumber,
        Currency: request.currency,
        CallbackUrl: callbackUrl,
        RedirectUrl: redirectUrl,
        Transactions: [
          {
            POSTransactionId: `${request.orderId}-1`,
            Payee: this.configService.get('BARION_PAYEE_EMAIL'),
            Total: request.amount,
            Comment: `Payment for order ${request.orderNumber}`,
            Items: [
              {
                Name: `Order ${request.orderNumber}`,
                Description: 'Game server hosting service',
                Quantity: 1,
                Unit: 'pcs',
                UnitPrice: request.amount,
                ItemTotal: request.amount,
                SKU: request.orderId,
              },
            ],
          },
        ],
      };

      const result = await this.barion.startPayment(paymentRequest);

      if (result.Errors && result.Errors.length > 0) {
        this.logger.error(
          `Barion payment start failed: ${JSON.stringify(result.Errors)}`,
        );
        throw new Error(
          `Barion error: ${result.Errors.map((e: any) => e.ErrorMessage).join(', ')}`,
        );
      }

      this.logger.log(
        `Barion payment started: ${result.PaymentId} for order ${request.orderId}`,
      );

      return {
        paymentId: result.PaymentId,
        gatewayUrl: result.GatewayUrl,
        status: result.Status,
      };
    } catch (error) {
      this.logger.error(`Failed to start Barion payment: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment status from Barion
   */
  async getPaymentState(paymentId: string): Promise<any> {
    if (!this.barion) {
      this.logger.warn('Barion not configured - returning mock payment state');
      return {
        PaymentId: paymentId,
        Status: 'Succeeded',
        PaymentType: 'Immediate',
      };
    }

    try {
      const result = await this.barion.getPaymentState(paymentId);

      if (result.Errors && result.Errors.length > 0) {
        this.logger.error(
          `Barion get payment state failed: ${JSON.stringify(result.Errors)}`,
        );
        throw new Error(
          `Barion error: ${result.Errors.map((e: any) => e.ErrorMessage).join(', ')}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get Barion payment state: ${error}`);
      throw error;
    }
  }

  /**
   * Process Barion callback/webhook
   */
  async processCallback(paymentId: string): Promise<{
    orderId: string;
    status: string;
    isSuccessful: boolean;
  }> {
    try {
      const paymentState = await this.getPaymentState(paymentId);

      this.logger.log(
        `Processing Barion callback for payment ${paymentId}, status: ${paymentState.Status}`,
      );

      const isSuccessful =
        paymentState.Status === 'Succeeded' ||
        paymentState.Status === 'Authorized';

      // Extract order ID from PaymentRequestId
      const orderId = paymentState.PaymentRequestId;

      return {
        orderId,
        status: paymentState.Status,
        isSuccessful,
      };
    } catch (error) {
      this.logger.error(`Failed to process Barion callback: ${error}`);
      throw error;
    }
  }

  /**
   * Refund a payment (for order cancellation)
   */
  async refundPayment(
    paymentId: string,
    amount: number,
    orderId: string,
  ): Promise<boolean> {
    if (!this.barion) {
      this.logger.warn('Barion not configured - mock refund success');
      return true;
    }

    try {
      const refundRequest = {
        PaymentId: paymentId,
        POSTransactionId: `${orderId}-refund-${Date.now()}`,
        TransactionsToRefund: [
          {
            POSTransactionId: `${orderId}-1`,
            AmountToRefund: amount,
            Comment: `Refund for cancelled order ${orderId}`,
          },
        ],
      };

      const result = await this.barion.refundPayment(refundRequest);

      if (result.Errors && result.Errors.length > 0) {
        this.logger.error(
          `Barion refund failed: ${JSON.stringify(result.Errors)}`,
        );
        return false;
      }

      this.logger.log(
        `Barion refund successful for payment ${paymentId}, amount: ${amount}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to refund Barion payment: ${error}`);
      return false;
    }
  }
}
