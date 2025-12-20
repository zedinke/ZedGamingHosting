import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { PrometheusController } from './prometheus.controller';
import { MetricsMiddleware } from './metrics.middleware';

@Module({
  imports: [],
  controllers: [MetricsController, PrometheusController],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}

