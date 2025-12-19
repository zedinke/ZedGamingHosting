import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@zed-hosting/db';
import { BarionService } from './barion.service';
import { PayPalService } from './paypal.service';
import { UpayService } from './upay.service';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class PaymentReconcilerService {
  private readonly logger = new Logger(PaymentReconcilerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly barion: BarionService,
    private readonly paypal: PayPalService,
    private readonly upay: UpayService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcilePendingPayments() {
    const pending = await this.prisma.order.findMany({
      where: {
        status: 'PAYMENT_PENDING' as any,
        paymentId: { not: null },
        paymentMethod: { in: ['barion', 'paypal', 'upay'] as any },
      },
      select: { id: true, paymentId: true, paymentMethod: true },
    });

    if (!pending.length) return;

    this.logger.log(`Reconciling ${pending.length} pending payments...`);

    for (const p of pending) {
      try {
        const provider = (p.paymentMethod?.toUpperCase() || 'UNKNOWN') as 'BARION' | 'PAYPAL' | 'UPAY';
        const eventId = `${p.paymentId}:${Date.now()}`;
        const ev = await this.idemp.beginEvent({
          provider,
          eventType: 'reconcile',
          eventId,
          paymentId: p.paymentId!,
          orderId: p.id,
        });

        let ok = false;
        if (p.paymentMethod === 'barion') {
          const res = await this.barion.processCallback(p.paymentId!);
          ok = res.isSuccessful;
        } else if (p.paymentMethod === 'paypal') {
          const res = await this.paypal.processCallback(p.paymentId!);
          ok = res.isSuccessful;
        } else if (p.paymentMethod === 'upay') {
          const res = await this.upay.processCallback(p.paymentId!);
          ok = res.isSuccessful;
        }

        if (ok) {
          await this.prisma.order.update({
            where: { id: p.id },
            data: { status: 'PAID' as any, paidAt: new Date() },
          });
          await this.idemp.markProcessed(ev.id, p.id);
          this.logger.log(`Order ${p.id} reconciled to PAID (method=${p.paymentMethod})`);
        }
      } catch (e: any) {
        try {
          const provider = (p.paymentMethod?.toUpperCase() || 'UNKNOWN') as 'BARION' | 'PAYPAL' | 'UPAY';
          const idKey = `${p.paymentId}:${Date.now()}`;
          const ev = await this.idemp.beginEvent({ provider, eventType: 'reconcile', eventId: idKey, paymentId: p.paymentId!, orderId: p.id });
          await this.idemp.markFailed(ev.id, e?.message || String(e));
        } catch {}
        this.logger.warn(`Reconcile failed for order ${p.id}: ${e?.message || e}`);
      }
    }
  }
}
