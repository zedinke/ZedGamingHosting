import { Module } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { EmailModule } from '../email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [EmailModule, WebSocketModule],
  providers: [SupportTicketService, KnowledgeBaseService, SlaService],
  controllers: [SupportTicketController, KnowledgeBaseController, SlaController],
  exports: [SupportTicketService, KnowledgeBaseService, SlaService],
})
export class SupportModule {}

