import { Controller, Get, Header } from '@nestjs/common';
import * as client from 'prom-client';

// Register default metrics once
client.collectDefaultMetrics({ prefix: 'api_' });

@Controller('metrics')
export class PrometheusController {
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(): Promise<string> {
    return await client.register.metrics();
  }
}
