import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentService } from './payment.service';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { ProvisioningService } from './provisioning.service';
import { InvoiceService } from './invoice.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [OrdersController, WalletController],
  providers: [OrdersService, PaymentService, WalletService, ProvisioningService, InvoiceService],
})
export class OrdersModule {}
