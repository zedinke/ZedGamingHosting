import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { PrismaModule } from '@zed-hosting/db';

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
})
export class MetricsModule {}
