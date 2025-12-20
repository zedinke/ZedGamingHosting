import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as client from 'prom-client';

// HTTP metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestsInProgress = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['method'],
});

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip metrics endpoint itself
    if (req.path === '/metrics') {
      return next();
    }

    const start = Date.now();
    const method = req.method;
    
    // Increment in-progress requests
    httpRequestsInProgress.inc({ method });

    // Track when response finishes
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      const statusCode = res.statusCode.toString();

      // Record metrics
      httpRequestDurationMicroseconds.observe(
        { method, route, status_code: statusCode },
        duration
      );

      httpRequestsTotal.inc({ method, route, status_code: statusCode });
      
      // Decrement in-progress requests
      httpRequestsInProgress.dec({ method });
    });

    next();
  }
}
