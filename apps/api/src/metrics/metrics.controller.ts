import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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

    return this.prisma.metric.findMany({
      where: { nodeId },
      orderBy: { timestamp: 'desc' },
      take: Math.min(take, 1000),
    });
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

    return this.prisma.metric.findMany({
      where: { serverUuid },
      orderBy: { timestamp: 'desc' },
      take: Math.min(take, 1000),
    });
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

    return summaries;
  }
}
