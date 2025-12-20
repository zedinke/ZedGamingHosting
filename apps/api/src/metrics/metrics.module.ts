import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { PrometheusController } from './prometheus.controller';

@Module({
  imports: [],
  controllers: [MetricsController, PrometheusController],
})
export class MetricsModule {}
