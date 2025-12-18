import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PassThrough } from 'stream';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on configuration
   */
  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const smtpSecure = this.configService.get<boolean>('SMTP_SECURE', false);

    // If SMTP is not configured, disable email service
    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn('SMTP not configured, email service disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    this.logger.log('Email transporter initialized');
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized, skipping email send');
      return;
    }

    const smtpFrom = this.configService.get<string>('SMTP_FROM', this.configService.get<string>('SMTP_USER') || 'noreply@zedgaminghosting.hu');

    try {
      await this.transporter.sendMail({
        from: options.from || smtpFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html || ''),
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send server status change notification
   */
  async sendServerStatusNotification(
    userEmail: string,
    serverName: string,
    status: string,
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      RUNNING: 'fut',
      STOPPED: 'leállított',
      CRASHED: 'leállt (hiba)',
      STARTING: 'indul',
      STOPPING: 'leáll',
    };

    const statusMessage = statusMessages[status] || status;

    await this.sendEmail({
      to: userEmail,
      subject: `Szerver állapot változás: ${serverName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Szerver állapot változás</h2>
          <p>Kedves felhasználó!</p>
          <p>A(z) <strong>${serverName}</strong> szerver állapota <strong>${statusMessage}</strong> lett.</p>
          <p>Ha kérdésed van, kérlek vedd fel velünk a kapcsolatot.</p>
          <p>Üdvözlettel,<br>ZedGamingHosting Csapat</p>
        </div>
      `,
      text: `Szerver állapot változás: ${serverName}\n\nA szerver állapota ${statusMessage} lett.`,
    });
  }

  /**
   * Send server backup notification
   */
  async sendBackupNotification(
    userEmail: string,
    serverName: string,
    backupType: 'created' | 'restored' | 'failed',
  ): Promise<void> {
    const messages: Record<string, { subject: string; message: string }> = {
      created: {
        subject: `Backup létrehozva: ${serverName}`,
        message: 'A szerver backup-ja sikeresen létrehozva.',
      },
      restored: {
        subject: `Backup visszaállítva: ${serverName}`,
        message: 'A szerver backup-ja sikeresen visszaállítva.',
      },
      failed: {
        subject: `Backup hiba: ${serverName}`,
        message: 'A backup művelet sikertelen volt.',
      },
    };

    const msg = messages[backupType];

    await this.sendEmail({
      to: userEmail,
      subject: msg.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${backupType === 'failed' ? '#ef4444' : '#10b981'};">
            ${backupType === 'failed' ? 'Backup hiba' : 'Backup művelet'}
          </h2>
          <p>Kedves felhasználó!</p>
          <p>A(z) <strong>${serverName}</strong> szerver esetén:</p>
          <p>${msg.message}</p>
          <p>Ha kérdésed van, kérlek vedd fel velünk a kapcsolatot.</p>
          <p>Üdvözlettel,<br>ZedGamingHosting Csapat</p>
        </div>
      `,
      text: `${msg.subject}\n\n${msg.message}`,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userEmail: string, userName?: string): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Üdvözöljük a ZedGamingHosting platformon!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Üdvözöljük!</h2>
          <p>Kedves ${userName || 'felhasználó'}!</p>
          <p>Köszönjük, hogy regisztráltál a ZedGamingHosting platformra!</p>
          <p>Most már létrehozhatod első szerveredet és elkezdhetsz játszani.</p>
          <p>Ha kérdésed van, kérlek vedd fel velünk a kapcsolatot.</p>
          <p>Üdvözlettel,<br>ZedGamingHosting Csapat</p>
        </div>
      `,
      text: 'Üdvözöljük a ZedGamingHosting platformon!\n\nKöszönjük, hogy regisztráltál!',
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001')}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: userEmail,
      subject: 'Jelszó visszaállítás',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Jelszó visszaállítás</h2>
          <p>Kedves felhasználó!</p>
          <p>Jelszó visszaállítási kérést kaptunk a fiókodhoz.</p>
          <p>Az alábbi linkre kattintva beállíthatod az új jelszavad:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Jelszó visszaállítása
            </a>
          </p>
          <p>Ez a link 1 óráig érvényes.</p>
          <p>Ha nem te kérted a jelszó visszaállítását, kérlek hagyd figyelmen kívül ezt az emailt.</p>
          <p>Üdvözlettel,<br>ZedGamingHosting Csapat</p>
        </div>
      `,
      text: `Jelszó visszaállítás\n\nKattints az alábbi linkre: ${resetUrl}\n\nEz a link 1 óráig érvényes.`,
    });
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Send invoice PDF by email
   */
  async sendInvoiceEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceNumber: string,
    pdfStream: PassThrough,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_FROM') || 'billing@zedhosting.com',
        to: recipientEmail,
        subject: `Számla ${invoiceNumber} - Zed Gaming Hosting`,
        html: this.getInvoiceEmailTemplate(recipientName, invoiceNumber),
        attachments: [
          {
            filename: `Szamla-${invoiceNumber}.pdf`,
            content: pdfStream,
            contentType: 'application/pdf',
          },
        ],
      };

      if (!this.transporter) {
        this.logger.warn(
          `[DEV MODE] Would send invoice email to ${recipientEmail}`,
        );
        return true;
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Számla ${invoiceNumber} elküldve ${recipientEmail}-nek (Message ID: ${info.messageId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Hiba a számla ${invoiceNumber} küldésekor ${recipientEmail}-nek: ${error}`,
      );
      return false;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentReceivedEmail(
    recipientEmail: string,
    recipientName: string,
    orderNumber: string,
    amount: number,
    currency: string,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_FROM') || 'billing@zedhosting.com',
        to: recipientEmail,
        subject: `Fizetés Sikeres - Rendelés ${orderNumber} - Zed Gaming Hosting`,
        html: this.getPaymentReceivedTemplate(
          recipientName,
          orderNumber,
          amount,
          currency,
        ),
      };

      if (!this.transporter) {
        this.logger.warn(
          `[DEV MODE] Would send payment confirmation to ${recipientEmail}`,
        );
        return true;
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Fizetés megerősítés elküldve ${recipientEmail}-nek (Message ID: ${info.messageId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Hiba a fizetés megerősítés küldésekor ${recipientEmail}-nek: ${error}`,
      );
      return false;
    }
  }

  /**
   * Email template for invoices
   */
  private getInvoiceEmailTemplate(
    recipientName: string,
    invoiceNumber: string,
  ): string {
    const appUrl = this.configService.get('APP_URL') || 'https://zedhosting.com';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; font-size: 12px; color: #999; padding: 20px; }
            .button { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Zed Gaming Hosting</h1>
              <p>Számla ${invoiceNumber}</p>
            </div>
            <div class="content">
              <p>Szia ${recipientName}!</p>
              <p>Csatolt a PDF formátumban az Ön számlája: <strong>${invoiceNumber}</strong></p>
              <p>A számlát az alábbi linkről is letöltheti az ügyfélpanelén:</p>
              <p><a href="${appUrl}/dashboard/orders" class="button">Ügyfélpanel</a></p>
              <p>Ha bármilyen kérdése van, kérjük vegye fel velünk a kapcsolatot.</p>
              <p>
                <strong>Zed Gaming Hosting</strong><br>
                ${this.configService.get('SMTP_FROM') || 'billing@zedhosting.com'}
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Zed Gaming Hosting. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Email template for payment confirmations
   */
  private getPaymentReceivedTemplate(
    recipientName: string,
    orderNumber: string,
    amount: number,
    currency: string,
  ): string {
    const appUrl = this.configService.get('APP_URL') || 'https://zedhosting.com';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; font-size: 12px; color: #999; padding: 20px; }
            .button { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Zed Gaming Hosting</h1>
              <p>Fizetés Sikeresen Feldolgozva</p>
            </div>
            <div class="content">
              <p>Szia ${recipientName}!</p>
              <div class="success">
                <strong>✓ A fizetés sikeresen feldolgozásra került!</strong><br>
                Rendelés: ${orderNumber}<br>
                Összeg: ${currency} ${amount}
              </div>
              <p>A szerver most kezd el kiépíteni. Néhány percet igényelhet az indítás.</p>
              <p>Kövesse a rendelés állapotát az ügyfélpanelen:</p>
              <p><a href="${appUrl}/dashboard/orders/${orderNumber}" class="button">Rendelés megtekintése</a></p>
              <p>Ha bármilyen kérdése van, kérjük vegye fel velünk a kapcsolatot.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Zed Gaming Hosting. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

