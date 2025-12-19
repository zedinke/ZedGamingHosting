import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { DatabaseModule } from '../database/database.module';
import { NodesModule } from '../nodes/nodes.module';
import { TasksModule } from '../tasks/tasks.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { EmailModule } from '../email/email.module';

/**
 * Agent Module - handles communication with daemon instances
 */
@Module({
  imports: [DatabaseModule, NodesModule, TasksModule, WebSocketModule, EmailModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
