import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { DatabaseModule } from '../database/database.module';
import { I18nModule } from '../i18n/i18n.module';
import { TasksModule } from '../tasks/tasks.module';
import { NetworkingModule } from '../networking/networking.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, I18nModule, TasksModule, NetworkingModule, EmailModule],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}

