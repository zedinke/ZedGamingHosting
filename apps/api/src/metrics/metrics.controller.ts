import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Convert BigInt values to strings for JSON serialization
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }
  return obj;
}

@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetricsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get latest metrics for a node
   */
  @Get('node/:nodeId')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'RESELLER_ADMIN')
  async getNodeMetrics(
    @Param('nodeId') nodeId: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 100;

    const metrics = await this.prisma.metric.findMany({
      where: { nodeId },
      orderBy: { timestamp: 'desc' },
      take: Math.min(take, 1000),
    });

    return serializeBigInt(metrics);
  }

  /**
   * Get metrics for a specific server
   */
  @Get('server/:serverUuid')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'RESELLER_ADMIN')
  async getServerMetrics(
    @Param('serverUuid') serverUuid: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 100;

    const metrics = await this.prisma.metric.findMany({
      where: { serverUuid },
      orderBy: { timestamp: 'desc' },
      take: Math.min(take, 1000),
    });

    return serializeBigInt(metrics);
  }

  /**
   * Get metrics for all nodes (summary)
   */
  @Get('nodes/summary')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'RESELLER_ADMIN')
  async getNodesSummary() {
    // Get latest metric for each node
    const nodes = await this.prisma.node.findMany({
      select: { id: true },
    });

    const summaries = await Promise.all(
      nodes.map(async (node) => {
        const latestMetric = await this.prisma.metric.findFirst({
          where: { nodeId: node.id },
          orderBy: { timestamp: 'desc' },
        });

        return {
          nodeId: node.id,
          metric: latestMetric,
        };
      }),
    );

    return serializeBigInt(summaries);
  }
}
