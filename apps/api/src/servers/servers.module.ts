import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { DatabaseModule } from '../database/database.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [DatabaseModule, I18nModule],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}

