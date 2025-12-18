import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { BarionService } from './barion.service';
import { PayPalService } from './paypal.service';
import { UpayService } from './upay.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [BarionService, PayPalService, UpayService],
  exports: [BarionService, PayPalService, UpayService],
})
export class PaymentsModule {}
