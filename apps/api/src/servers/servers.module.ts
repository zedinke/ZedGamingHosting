import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { ServerFileService } from './server-file.service';
import { ServerFileController } from './server-file.controller';
import { TerminalService } from './terminal.service';
import { TerminalController } from './terminal.controller';
import { DatabaseModule } from '../database/database.module';
import { I18nModule } from '../i18n/i18n.module';
import { TasksModule } from '../tasks/tasks.module';
import { NetworkingModule } from '../networking/networking.module';
import { EmailModule } from '../email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [DatabaseModule, I18nModule, TasksModule, NetworkingModule, EmailModule, WebSocketModule],
  controllers: [ServersController, ServerFileController, TerminalController],
  providers: [ServersService, ServerFileService, TerminalService],
  exports: [ServersService, ServerFileService, TerminalService],
})
export class ServersModule {}

