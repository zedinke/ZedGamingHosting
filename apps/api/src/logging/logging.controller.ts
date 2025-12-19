import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { LoggingService } from './logging.service';

interface ErrorLogDto {
  message: string;
  stack?: string;
  context?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  userId?: string;
  userAgent: string;
  timestamp: string;
  url: string;
  metadata?: Record<string, any>;
}

interface BatchErrorLogsDto {
  errors: ErrorLogDto[];
  batchId: string;
}

/**
 * Logging Controller
 * Receives error logs from frontend and other sources
 */
@Controller('logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  /**
   * Log errors from frontend
   * POST /api/logs/errors
   */
  @Post('errors')
  @HttpCode(HttpStatus.ACCEPTED)
  async logErrors(@Body() batch: BatchErrorLogsDto, @Req() request: Request) {
    const userId = (request as any).user?.id;
    const ipAddress = this.getIpAddress(request);

    try {
      for (const error of batch.errors) {
        await this.loggingService.logError({
          ...error,
          userId: error.userId || userId,
          ipAddress,
          source: 'frontend',
        });

        // Send alert for critical errors
        if (error.severity === 'critical') {
          await this.loggingService.sendAlert({
            level: 'critical',
            title: `Critical Frontend Error`,
            message: error.message,
            details: {
              context: error.context,
              url: error.url,
              userId,
              batchId: batch.batchId,
            },
          });
        }
      }

      return {
        success: true,
        batchId: batch.batchId,
        processed: batch.errors.length,
      };
    } catch (error) {
      console.error('Error processing error logs:', error);
      throw error;
    }
  }

  /**
   * Get error logs for admin
   * GET /api/logs/errors
   */
  @Post('errors/search')
  async searchErrors(@Body() query: any) {
    return await this.loggingService.searchErrors(query);
  }

  /**
   * Get logging statistics
   * GET /api/logs/stats
   */
  @Post('stats')
  async getStats() {
    return await this.loggingService.getStats();
  }

  private getIpAddress(request: Request): string {
    const ipHeader = request.headers['x-forwarded-for'];
    return request.ip || (Array.isArray(ipHeader) ? ipHeader[0] : ipHeader) || 'unknown';
  }
}
