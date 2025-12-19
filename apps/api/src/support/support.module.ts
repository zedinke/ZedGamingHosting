import { Module } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { EmailModule } from '../email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [EmailModule, WebSocketModule],
  providers: [SupportTicketService],
  controllers: [SupportTicketController],
  exports: [SupportTicketService],
})
export class SupportModule {}

