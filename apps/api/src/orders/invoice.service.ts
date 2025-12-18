import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

/**
 * Invoice and receipt generation for orders
 * Stores invoice metadata in database for audit trail
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate invoice for a paid order
   * In production, this would generate a PDF file
   */
  async generateInvoice(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!order.paidAt) {
      throw new Error(`Order ${orderId} is not paid yet`);
    }

    // Generate invoice number (based on timestamp and order ID)
    const invoiceNumber = this.generateInvoiceNumber(order.createdAt, order.id);

    // In production, this would:
    // 1. Generate PDF using a library like pdfkit or puppeteer
    // 2. Upload to S3 or file storage
    // 3. Store reference in database
    // 4. Send email to user

    const priceSnapshot = (order.priceSnapshot as any) || {};
    const displayInfo = priceSnapshot.display || {};

    const invoiceData = {
      invoiceNumber,
      orderDate: order.createdAt,
      dueDate: new Date(order.paidAt!.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from payment
      paidDate: order.paidAt,
      
      // Seller info
      seller: {
        name: 'Zed Gaming Hosting',
        email: 'billing@zedhosting.com',
        address: 'Budapest, Hungary', // Should come from config
      },

      // Buyer info
      buyer: {
        name: order.user?.email || 'User',
        email: order.user?.email,
      },

      // Items
      items: [
        {
          description: `${order.plan?.name} - ${displayInfo.gameType} Server`,
          quantity: 1,
          unitPrice: priceSnapshot.monthlyPrice || 0,
          amount: priceSnapshot.monthlyPrice || 0,
        },
      ],

      // Summary
      subtotal: priceSnapshot.monthlyPrice || 0,
      setupFee: priceSnapshot.setupFee || 0,
      tax: 0, // No tax in this simple implementation
      total: order.totalAmount,
      currency: order.currency,

      // Notes
      notes: `Invoice for ${displayInfo.name} server subscription`,
    };

    this.logger.log(`Generated invoice ${invoiceNumber} for order ${orderId}`);

    return invoiceData;
  }

  /**
   * Generate a unique invoice number
   */
  private generateInvoiceNumber(createdAt: Date, orderId: string): string {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const orderHash = orderId.substring(0, 6).toUpperCase();
    return `INV-${year}-${month}-${orderHash}`;
  }

  /**
   * Get invoice for an order
   */
  async getInvoice(orderId: string): Promise<any> {
    // In production, this would fetch from storage and return the PDF
    return this.generateInvoice(orderId);
  }
}
