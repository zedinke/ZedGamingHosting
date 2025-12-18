import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { CreatePlanDto, UpdatePlanDto, PlanResponse } from '@zed-hosting/shared-types';
import { PlanStatus, GameType } from '@zed-hosting/db';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all plans (optionally filtered by game type and status)
   */
  async findAll(gameType?: GameType, status?: PlanStatus): Promise<PlanResponse[]> {
    const plans = await this.prisma.plan.findMany({
      where: {
        ...(gameType && { gameType }),
        ...(status && { status }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { monthlyPrice: 'asc' },
      ],
    });

    return plans.map(plan => this.formatPlanResponse(plan));
  }

  /**
   * Get a single plan by ID or slug
   */
  async findOne(idOrSlug: string): Promise<PlanResponse> {
    const plan = await this.prisma.plan.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID or slug "${idOrSlug}" not found`);
    }

    return this.formatPlanResponse(plan);
  }

  /**
   * Create a new plan
   */
  async create(createPlanDto: CreatePlanDto): Promise<PlanResponse> {
    // Check if slug already exists
    const existing = await this.prisma.plan.findUnique({
      where: { slug: createPlanDto.slug },
    });

    if (existing) {
      throw new ConflictException(`Plan with slug "${createPlanDto.slug}" already exists`);
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        slug: createPlanDto.slug,
        gameType: createPlanDto.gameType,
        ramMb: createPlanDto.ramMb,
        cpuCores: createPlanDto.cpuCores,
        diskGb: createPlanDto.diskGb,
        maxSlots: createPlanDto.maxSlots,
        monthlyPrice: createPlanDto.monthlyPrice,
        hourlyPrice: createPlanDto.hourlyPrice,
        setupFee: createPlanDto.setupFee || 0,
        features: createPlanDto.features || [],
        description: createPlanDto.description,
        isPopular: createPlanDto.isPopular || false,
        sortOrder: createPlanDto.sortOrder || 0,
      },
    });

    return this.formatPlanResponse(plan);
  }

  /**
   * Update a plan
   */
  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<PlanResponse> {
    // Check if plan exists
    const existing = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }

    // Check if slug is being changed and if it already exists
    if (updatePlanDto.slug && updatePlanDto.slug !== existing.slug) {
      const slugExists = await this.prisma.plan.findUnique({
        where: { slug: updatePlanDto.slug },
      });

      if (slugExists) {
        throw new ConflictException(`Plan with slug "${updatePlanDto.slug}" already exists`);
      }
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(updatePlanDto.name && { name: updatePlanDto.name }),
        ...(updatePlanDto.slug && { slug: updatePlanDto.slug }),
        ...(updatePlanDto.status && { status: updatePlanDto.status }),
        ...(updatePlanDto.ramMb && { ramMb: updatePlanDto.ramMb }),
        ...(updatePlanDto.cpuCores && { cpuCores: updatePlanDto.cpuCores }),
        ...(updatePlanDto.diskGb && { diskGb: updatePlanDto.diskGb }),
        ...(updatePlanDto.maxSlots !== undefined && { maxSlots: updatePlanDto.maxSlots }),
        ...(updatePlanDto.monthlyPrice !== undefined && { monthlyPrice: updatePlanDto.monthlyPrice }),
        ...(updatePlanDto.hourlyPrice !== undefined && { hourlyPrice: updatePlanDto.hourlyPrice }),
        ...(updatePlanDto.setupFee !== undefined && { setupFee: updatePlanDto.setupFee }),
        ...(updatePlanDto.features && { features: updatePlanDto.features }),
        ...(updatePlanDto.description !== undefined && { description: updatePlanDto.description }),
        ...(updatePlanDto.isPopular !== undefined && { isPopular: updatePlanDto.isPopular }),
        ...(updatePlanDto.sortOrder !== undefined && { sortOrder: updatePlanDto.sortOrder }),
      },
    });

    return this.formatPlanResponse(plan);
  }

  /**
   * Delete a plan (soft delete by archiving)
   */
  async remove(id: string): Promise<void> {
    // Check if plan exists
    const existing = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            servers: true,
            orders: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }

    // Don't allow deletion if there are active servers or orders
    if (existing._count.servers > 0) {
      throw new BadRequestException(
        `Cannot delete plan "${existing.name}" - it has ${existing._count.servers} active servers. Archive it instead.`
      );
    }

    if (existing._count.orders > 0) {
      // Archive instead of delete
      await this.prisma.plan.update({
        where: { id },
        data: { status: PlanStatus.ARCHIVED },
      });
    } else {
      // Safe to hard delete
      await this.prisma.plan.delete({
        where: { id },
      });
    }
  }

  /**
   * Get plans by game type (public endpoint)
   */
  async getByGameType(gameType: GameType): Promise<PlanResponse[]> {
    const plans = await this.prisma.plan.findMany({
      where: {
        gameType,
        status: PlanStatus.ACTIVE,
      },
      orderBy: [
        { isPopular: 'desc' },
        { sortOrder: 'asc' },
        { monthlyPrice: 'asc' },
      ],
    });

    return plans.map(plan => this.formatPlanResponse(plan));
  }

  /**
   * Format plan for response
   */
  private formatPlanResponse(plan: any): PlanResponse {
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      gameType: plan.gameType,
      status: plan.status,
      ramMb: plan.ramMb,
      cpuCores: plan.cpuCores,
      diskGb: plan.diskGb,
      maxSlots: plan.maxSlots,
      monthlyPrice: plan.monthlyPrice,
      hourlyPrice: plan.hourlyPrice,
      setupFee: plan.setupFee,
      features: plan.features as string[] || [],
      description: plan.description,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
