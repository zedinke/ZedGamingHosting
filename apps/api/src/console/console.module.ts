import { Module } from '@nestjs/common';
import { ConsoleController } from './console.controller';
import { ConsoleService } from './console.service';
import { DatabaseModule } from '../database/database.module';
import { TasksModule } from '../tasks/tasks.module';

/**
 * Console Module - handles server console/logs endpoints
 */
@Module({
  imports: [DatabaseModule, TasksModule],
  controllers: [ConsoleController],
  providers: [ConsoleService],
  exports: [ConsoleService],
})
export class ConsoleModule {}

