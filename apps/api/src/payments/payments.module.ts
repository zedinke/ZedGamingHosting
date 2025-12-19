import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { BarionService } from './barion.service';
import { PayPalService } from './paypal.service';
import { UpayService } from './upay.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentReconcilerService } from './reconciler.service';
import { IdempotencyService } from './idempotency.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [BarionService, PayPalService, UpayService, PaymentReconcilerService, IdempotencyService],
  exports: [BarionService, PayPalService, UpayService, PaymentReconcilerService, IdempotencyService],
})
export class PaymentsModule {}
