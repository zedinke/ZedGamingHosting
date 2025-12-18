import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface UpayPaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  payerEmail: string;
  locale?: string;
  callbackUrl?: string;
  redirectUrl?: string;
}

export interface UpayPaymentResponse {
  paymentId: string;
  gatewayUrl: string;
  status: string;
}

/**
 * Upay Payment Gateway Service
 * Handles direct card payments through Upay
 */
@Injectable()
export class UpayService {
  private readonly logger = new Logger(UpayService.name);
  private httpClient: AxiosInstance | null;
  private readonly isProduction: boolean;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const merchantId = this.configService.get<string>('UPAY_MERCHANT_ID');
    const apiKey = this.configService.get<string>('UPAY_API_KEY');
    const env = this.configService.get<string>('UPAY_ENVIRONMENT') || 'test';
    this.isProduction = env === 'production';

    this.baseUrl = this.isProduction
      ? 'https://api.upay.hu/v1'
      : 'https://sandbox.upay.hu/v1';

    if (!merchantId || !apiKey) {
      this.logger.warn('Upay credentials not configured - using mock mode');
      this.httpClient = null;
    } else {
      this.httpClient = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Merchant-Id': merchantId,
        },
        timeout: 30000,
      });
      this.logger.log(`Upay service initialized in ${env} mode`);
    }
  }

  /**
   * Initialize Upay payment session
   */
  async startPayment(request: UpayPaymentRequest): Promise<UpayPaymentResponse> {
    this.logger.log(`Starting Upay payment for order ${request.orderId}`);

    // Mock mode - return fake payment URL
    if (!this.httpClient) {
      const mockPaymentId = `MOCK_UPAY_${Date.now()}`;
      return {
        paymentId: mockPaymentId,
        gatewayUrl: `https://sandbox.upay.hu/pay/${mockPaymentId}`,
        status: 'PENDING',
      };
    }

    try {
      const paymentData = {
        merchantReference: request.orderId,
        orderNumber: request.orderNumber,
        amount: Math.round(request.amount), // Upay expects amount in cents/minor units
        currency: request.currency,
        description: `Payment for order #${request.orderNumber}`,
        customerEmail: request.payerEmail,
        language: request.locale?.split('-')[0] || 'hu',
        successUrl: request.callbackUrl || `${this.configService.get('API_URL')}/payments/upay/callback`,
        cancelUrl: request.redirectUrl || `${this.configService.get('APP_URL')}/dashboard/orders/${request.orderId}`,
        callbackUrl: `${this.configService.get('API_URL')}/payments/upay/webhook`,
      };

      const response = await this.httpClient.post('/payments', paymentData);

      if (!response.data || !response.data.paymentId) {
        throw new Error('Invalid response from Upay API');
      }

      this.logger.log(`Upay payment session created: ${response.data.paymentId}`);

      return {
        paymentId: response.data.paymentId,
        gatewayUrl: response.data.paymentUrl || response.data.redirectUrl,
        status: response.data.status || 'PENDING',
      };
    } catch (error: any) {
      this.logger.error(
        `Upay payment start failed: ${error.message}`,
        error.response?.data || error.stack,
      );
      throw new Error(`Upay payment failed: ${error.message}`);
    }
  }

  /**
   * Get payment status from Upay
   */
  async getPaymentState(paymentId: string): Promise<any> {
    if (!this.httpClient) {
      this.logger.warn(`Mock mode: returning fake status for ${paymentId}`);
      return {
        paymentId: paymentId,
        status: 'SUCCESS',
        merchantReference: 'mock-order-id',
        amount: 1000,
      };
    }

    try {
      const response = await this.httpClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to get Upay payment state: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process Upay callback/webhook
   */
  async processCallback(paymentId: string): Promise<{
    orderId: string;
    status: string;
    isSuccessful: boolean;
  }> {
    this.logger.log(`Processing Upay callback for payment ${paymentId}`);

    try {
      const paymentState = await this.getPaymentState(paymentId);

      const orderId = paymentState.merchantReference;
      const status = paymentState.status;
      const isSuccessful = status === 'SUCCESS' || status === 'COMPLETED' || status === 'AUTHORIZED';

      this.logger.log(
        `Upay payment ${paymentId} status: ${status}, orderId: ${orderId}, success: ${isSuccessful}`,
      );

      return {
        orderId,
        status,
        isSuccessful,
      };
    } catch (error: any) {
      this.logger.error(`Upay callback processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify webhook signature (important for security)
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.httpClient) {
      this.logger.warn('Mock mode: skipping signature verification');
      return true;
    }

    try {
      const apiKey = this.configService.get<string>('UPAY_API_KEY');
      const crypto = require('crypto');
      
      const expectedSignature = crypto
        .createHmac('sha256', apiKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      const isValid = signature === expectedSignature;
      
      if (!isValid) {
        this.logger.error('Upay webhook signature verification failed');
      }
      
      return isValid;
    } catch (error: any) {
      this.logger.error(`Webhook signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentId: string,
    amount: number,
    orderId: string,
  ): Promise<boolean> {
    this.logger.log(`Refunding Upay payment: ${paymentId}, amount: ${amount}`);

    if (!this.httpClient) {
      this.logger.log('Mock mode: refund successful');
      return true;
    }

    try {
      const refundData = {
        paymentId: paymentId,
        amount: Math.round(amount), // Amount in minor units
        reason: `Refund for cancelled order ${orderId}`,
      };

      const response = await this.httpClient.post('/refunds', refundData);

      if (response.data.status === 'SUCCESS' || response.data.status === 'COMPLETED') {
        this.logger.log(`Upay refund successful: ${response.data.refundId}`);
        return true;
      }

      this.logger.warn(`Upay refund returned status: ${response.data.status}`);
      return false;
    } catch (error: any) {
      this.logger.error(
        `Upay refund failed: ${error.message}`,
        error.response?.data || error.stack,
      );
      return false;
    }
  }

  /**
   * Capture an authorized payment (for two-step payments)
   */
  async capturePayment(paymentId: string): Promise<boolean> {
    if (!this.httpClient) {
      this.logger.log(`Mock mode: capturing payment ${paymentId}`);
      return true;
    }

    try {
      const response = await this.httpClient.post(`/payments/${paymentId}/capture`);

      if (response.data.status === 'SUCCESS' || response.data.status === 'COMPLETED') {
        this.logger.log(`Upay payment ${paymentId} captured successfully`);
        return true;
      }

      this.logger.warn(`Upay capture returned status: ${response.data.status}`);
      return false;
    } catch (error: any) {
      this.logger.error(`Upay capture failed: ${error.message}`);
      return false;
    }
  }
}
