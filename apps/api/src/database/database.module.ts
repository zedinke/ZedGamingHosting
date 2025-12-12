import { Module, Global } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

/**
 * Database module - provides Prisma client globally
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}


