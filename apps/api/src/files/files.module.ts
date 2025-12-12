import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { DatabaseModule } from '../database/database.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [DatabaseModule, I18nModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

