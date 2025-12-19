import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

export type PaymentProvider = 'BARION' | 'PAYPAL' | 'UPAY';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async beginEvent(params: {
    provider: PaymentProvider;
    eventType: string;
    eventId: string;
    paymentId?: string;
    orderId?: string;
    payload?: any;
  }): Promise<{ alreadyProcessed: boolean; id: string }>
  {
    const { provider, eventType, eventId, paymentId, orderId, payload } = params;
    try {
      const rec = await this.prisma.paymentEvent.create({
        data: {
          provider,
          eventType,
          eventId,
          paymentId,
          orderId,
          status: 'RECEIVED' as any,
          payload: payload ?? undefined,
        },
        select: { id: true, status: true },
      });
      return { alreadyProcessed: false, id: rec.id };
    } catch (e: any) {
      // Unique violation means we've seen this event before
      if (e?.code === 'P2002') {
        const existing = await this.prisma.paymentEvent.findUnique({
          where: {
            provider_eventType_eventId: {
              provider: provider as any,
              eventType,
              eventId,
            },
          },
          select: { id: true, status: true },
        });
        if (existing) {
          const processed = existing.status === ('PROCESSED' as any);
          return { alreadyProcessed: processed, id: existing.id };
        }
      }
      this.logger.error(`beginEvent failed: ${e?.message || e}`);
      throw e;
    }
  }

  async markProcessed(id: string, orderId?: string) {
    await this.prisma.paymentEvent.update({
      where: { id },
      data: { status: 'PROCESSED' as any, processedAt: new Date(), orderId },
    });
  }

  async markFailed(id: string, error: string) {
    await this.prisma.paymentEvent.update({
      where: { id },
      data: { status: 'FAILED' as any, error },
    });
  }
}
