import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import * as client from 'prom-client';

// Register default metrics once
client.collectDefaultMetrics({ prefix: 'api_' });

@Controller('')
export class PrometheusController {
  @Get('metrics')
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(): Promise<string> {
    return await client.register.metrics();
  }
}
