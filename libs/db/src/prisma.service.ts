import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from './generated';

/**
 * Prisma Service - Database client wrapper
 * Handles connection lifecycle and provides type-safe database access
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: unknown) => {
        const event = e as { query: string; params: string; duration: number };
        this.logger.debug(`Query: ${event.query} | Params: ${event.params} | Duration: ${event.duration}ms`);
      });
    }

    this.$on('error' as never, (e: unknown) => {
      const event = e as { message: string; target: string };
      this.logger.error(`Database error: ${event.message}`, event.target);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

