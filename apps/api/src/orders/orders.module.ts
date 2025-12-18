import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentService } from './payment.service';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { ProvisioningService } from './provisioning.service';
import { InvoiceService } from './invoice.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    EmailModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController, WalletController],
  providers: [OrdersService, PaymentService, WalletService, ProvisioningService, InvoiceService],
  exports: [OrdersService, PaymentService],
})
export class OrdersModule {}
