import { Module } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { DbModule } from '@zed-hosting/db';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DbModule, EmailModule],
  providers: [SupportTicketService],
  controllers: [SupportTicketController],
  exports: [SupportTicketService],
})
export class SupportModule {}

