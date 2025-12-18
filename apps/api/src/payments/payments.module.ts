import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { BarionService } from './barion.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [BarionService],
  exports: [BarionService],
})
export class PaymentsModule {}
