import { Module } from '@nestjs/common';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';

/**
 * Logging Module
 * Handles error logging, metrics collection, and system alerts
 * Provides endpoints for frontend to report errors
 */
@Module({
  controllers: [LoggingController],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
