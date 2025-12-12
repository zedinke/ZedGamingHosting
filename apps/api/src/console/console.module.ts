import { Module } from '@nestjs/common';
import { ConsoleGateway } from './console.gateway';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ConsoleGateway],
})
export class ConsoleModule {}

