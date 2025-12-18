import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

/**
 * Invoice and receipt generation for orders
 * Generates PDF invoices and stores metadata in database for audit trail
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate invoice data for a paid order
   */
  async generateInvoiceData(orderId: string): Promise<any> {
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

    const invoiceNumber = this.generateInvoiceNumber(order.createdAt, order.id);
    const priceSnapshot = (order.priceSnapshot as any) || {};
    const displayInfo = priceSnapshot.display || {};

    return {
      invoiceNumber,
      orderDate: order.createdAt,
      dueDate: new Date(order.paidAt!.getTime() + 30 * 24 * 60 * 60 * 1000),
      paidDate: order.paidAt,
      seller: {
        name: 'Zed Gaming Hosting',
        email: 'billing@zedhosting.com',
        address: 'Budapest, Hungary',
      },
      buyer: {
        name: order.user?.email || 'User',
        email: order.user?.email,
      },
      items: [
        {
          description: `${order.plan?.name} - ${displayInfo.gameType} Server`,
          quantity: 1,
          unitPrice: priceSnapshot.monthlyPrice || 0,
          amount: priceSnapshot.monthlyPrice || 0,
        },
      ],
      subtotal: priceSnapshot.monthlyPrice || 0,
      setupFee: priceSnapshot.setupFee || 0,
      tax: 0,
      total: order.totalAmount,
      currency: order.currency,
      notes: `Invoice for ${displayInfo.name} server subscription`,
    };
  }

  /**
   * Generate PDF invoice for a paid order
   * Returns a stream of PDF data
   */
  async generateInvoicePDF(orderId: string): Promise<PassThrough> {
    const invoiceData = await this.generateInvoiceData(orderId);

    const doc = new PDFDocument();
    const stream = new PassThrough();

    doc.pipe(stream);

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(invoiceData.seller.name, { align: 'left' });
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(invoiceData.seller.email)
      .text(invoiceData.seller.address)
      .moveDown(0.5);

    // Invoice title and number
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('INVOICE', { align: 'right' });
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice #: ${invoiceData.invoiceNumber}`, { align: 'right' })
      .text(
        `Date: ${invoiceData.orderDate.toLocaleDateString()}`,
        { align: 'right' }
      )
      .text(
        `Due Date: ${invoiceData.dueDate.toLocaleDateString()}`,
        { align: 'right' }
      )
      .moveDown(1);

    // Buyer info
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('BILL TO:');
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(invoiceData.buyer.name)
      .text(invoiceData.buyer.email)
      .moveDown(1);

    // Items table
    const itemTableTop = doc.y;
    const col1 = 50;
    const col2 = 350;
    const col3 = 450;
    const col4 = 550;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', col1, itemTableTop)
      .text('Qty', col2, itemTableTop)
      .text('Unit Price', col3, itemTableTop)
      .text('Amount', col4, itemTableTop);

    doc.moveTo(50, itemTableTop + 15).lineTo(550, itemTableTop + 15).stroke();

    let y = itemTableTop + 25;
    invoiceData.items.forEach((item: any) => {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(item.description, col1, y)
        .text(item.quantity, col2, y)
        .text(
          `${invoiceData.currency} ${item.unitPrice.toFixed(2)}`,
          col3,
          y
        )
        .text(
          `${invoiceData.currency} ${item.amount.toFixed(2)}`,
          col4,
          y
        );
      y += 25;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;

    // Summary
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', col3, y)
      .text(
        `${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}`,
        col4,
        y
      );
    y += 20;

    if (invoiceData.setupFee > 0) {
      doc
        .text('Setup Fee:', col3, y)
        .text(
          `${invoiceData.currency} ${invoiceData.setupFee.toFixed(2)}`,
          col4,
          y
        );
      y += 20;
    }

    if (invoiceData.tax > 0) {
      doc
        .text('Tax:', col3, y)
        .text(`${invoiceData.currency} ${invoiceData.tax.toFixed(2)}`, col4, y);
      y += 20;
    }

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('TOTAL:', col3, y)
      .text(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, col4, y);

    // Footer
    doc
      .moveTo(50, doc.y + 20)
      .lineTo(550, doc.y + 20)
      .stroke();
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(invoiceData.notes, 50, doc.y + 20, { width: 500, align: 'center' });

    doc.end();

    this.logger.log(
      `Generated PDF invoice ${invoiceData.invoiceNumber} for order ${orderId}`
    );

    return stream;
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
   * Get invoice for an order (returns PDF stream)
   */
  async getInvoice(orderId: string): Promise<any> {
    return this.generateInvoiceData(orderId);
  }

  /**
   * Get invoice PDF stream for downloading
   */
  async getInvoicePDFStream(orderId: string): Promise<PassThrough> {
    return this.generateInvoicePDF(orderId);
  }
}
