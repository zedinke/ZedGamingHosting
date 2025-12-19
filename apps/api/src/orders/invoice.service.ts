import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { EmailService } from '../email/email.service';

/**
 * Invoice and receipt generation for orders
 * Generates PDF invoices and stores metadata in database for audit trail
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private getStorageDir() {
    return process.env.INVOICE_STORAGE_DIR || path.join(process.cwd(), 'storage', 'invoices');
  }

  /**
   * Generate invoice data for a paid order
   */
  async generateInvoiceData(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
        plan: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!order.paidAt) {
      throw new Error(`Order ${orderId} is not paid yet`);
    }

    const invoiceNumber = await this.generateInvoiceNumber(
      order.createdAt,
      order.user?.tenant?.id
    );
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
   * Persist invoice PDF to storage and return absolute file path.
   */
  async persistInvoicePDF(orderId: string): Promise<string> {
    const invoiceData = await this.generateInvoiceData(orderId);
    const storageRoot = this.getStorageDir();
    const year = String(invoiceData.orderDate.getFullYear());
    const targetDir = path.join(storageRoot, year);
    const filename = `${invoiceData.invoiceNumber}.pdf`;
    const filePath = path.join(targetDir, filename);

    await fs.promises.mkdir(targetDir, { recursive: true });

    // If already exists, return existing path
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return filePath;
    } catch {}

    // Generate and write
    const pdfStream = await this.generateInvoicePDF(orderId);
    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      pdfStream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
    });

    this.logger.log(`Saved invoice ${invoiceData.invoiceNumber} to ${filePath}`);
    return filePath;
  }

  /**
   * Generate a unique invoice number using InvoiceMetadata table
   * Format: PREFIX-YEAR-NNNNNN (e.g., INV-2025-000001)
   */
  private async generateInvoiceNumber(createdAt: Date, tenantId?: string): Promise<string> {
    const year = createdAt.getFullYear();
    const prefix = 'INV';

    // Use transaction to safely increment counter
    const metadata = await this.prisma.$transaction(async (tx) => {
      // Find or create invoice metadata for this tenant/year
      let meta = await tx.invoiceMetadata.findFirst({
        where: {
          tenantId: tenantId || null,
          prefix,
          year,
        },
      });

      if (!meta) {
        // Create new counter for this year
        meta = await tx.invoiceMetadata.create({
          data: {
            tenantId: tenantId || null,
            prefix,
            year,
            sequenceNumber: 1,
            lastUsedDate: createdAt,
          },
        });
      } else {
        // Increment counter
        meta = await tx.invoiceMetadata.update({
          where: { id: meta.id },
          data: {
            sequenceNumber: { increment: 1 },
            lastUsedDate: createdAt,
          },
        });
      }

      return meta;
    });

    // Format: INV-2025-000001
    const paddedNumber = String(metadata.sequenceNumber).padStart(6, '0');
    return `${prefix}-${year}-${paddedNumber}`;
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
    // Try to serve from persisted storage first
    const invoiceData = await this.generateInvoiceData(orderId);
    const storageRoot = this.getStorageDir();
    const year = String(invoiceData.orderDate.getFullYear());
    const filePath = path.join(storageRoot, year, `${invoiceData.invoiceNumber}.pdf`);

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      const stream = new PassThrough();
      fs.createReadStream(filePath).pipe(stream);
      return stream;
    } catch {
      // Not found -> generate and persist
      await this.persistInvoicePDF(orderId);
      const stream = new PassThrough();
      fs.createReadStream(filePath).pipe(stream);
      return stream;
    }
  }

  /**
   * Send invoice PDF by email
   */
  async sendInvoiceByEmail(orderId: string): Promise<boolean> {
    const invoiceData = await this.generateInvoiceData(orderId);
    // Ensure persistent copy exists for audit
    const filePath = await this.persistInvoicePDF(orderId);
    const pdfStream = new PassThrough();
    fs.createReadStream(filePath).pipe(pdfStream);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order || !order.user) {
      this.logger.error(`Order ${orderId} or user not found for email`);
      return false;
    }

    return this.emailService.sendInvoiceEmail(
      order.user.email,
      order.user.email,
      invoiceData.invoiceNumber,
      pdfStream,
    );
  }
}
