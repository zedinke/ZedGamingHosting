import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService, PromotionScope, GameType } from '@zed-hosting/db';
import { CreatePromotionDto, UpdatePromotionDto, PromotionResponse } from '@zed-hosting/shared-types';

interface PromotionListFilters {
  scope?: PromotionScope;
  active?: boolean;
  gameType?: GameType;
  planId?: string;
  currentOnly?: boolean;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: PromotionListFilters = {}): Promise<PromotionResponse[]> {
    const whereClauses: Record<string, unknown>[] = [];

    if (filters.scope) whereClauses.push({ scope: filters.scope });
    if (filters.active !== undefined) whereClauses.push({ active: filters.active });
    if (filters.gameType) whereClauses.push({ gameType: filters.gameType });
    if (filters.planId) whereClauses.push({ planId: filters.planId });

    if (filters.currentOnly) {
      const now = new Date();
      whereClauses.push({ startDate: { lte: now } });
      whereClauses.push({ OR: [{ endDate: null }, { endDate: { gte: now } }] });
    }

    const where = whereClauses.length ? { AND: whereClauses } : {};

    const promotions = await this.prisma.promotion.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });

    return promotions.map((promotion) => this.formatPromotion(promotion));
  }

  async findOne(id: string): Promise<PromotionResponse> {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID "${id}" not found`);
    }

    return this.formatPromotion(promotion);
  }

  async create(dto: CreatePromotionDto): Promise<PromotionResponse> {
    this.ensureDateOrder(dto.startDate, dto.endDate);

    const resolvedTargets = await this.resolveScopeTargets(dto.scope, dto.gameType, dto.planId);

    const promotion = await this.prisma.promotion.create({
      data: {
        name: dto.name,
        description: dto.description,
        scope: dto.scope,
        discountPercent: dto.discountPercent,
        gameType: resolvedTargets.gameType,
        planId: resolvedTargets.planId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        active: dto.active ?? true,
      },
    });

    return this.formatPromotion(promotion);
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<PromotionResponse> {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Promotion with ID "${id}" not found`);
    }

    const nextScope = dto.scope ?? existing.scope;
    const nextGameType = dto.gameType ?? existing.gameType ?? undefined;
    const nextPlanId = dto.planId ?? existing.planId ?? undefined;

    this.ensureDateOrder(dto.startDate ?? existing.startDate.toISOString(), dto.endDate ?? existing.endDate?.toISOString());

    const resolvedTargets = await this.resolveScopeTargets(nextScope, nextGameType, nextPlanId);

    const promotion = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        scope: nextScope,
        gameType: resolvedTargets.gameType,
        planId: resolvedTargets.planId,
        ...(dto.discountPercent !== undefined && { discountPercent: dto.discountPercent }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });

    return this.formatPromotion(promotion);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Promotion with ID "${id}" not found`);
    }

    await this.prisma.promotion.delete({ where: { id } });
  }

  async getActivePromotions(gameType?: GameType, planId?: string): Promise<PromotionResponse[]> {
    const now = new Date();
    const scopeFilters = [{ scope: PromotionScope.GLOBAL }];

    if (gameType) {
      scopeFilters.push({ scope: PromotionScope.GAME, gameType });
    }

    if (planId) {
      scopeFilters.push({ scope: PromotionScope.PLAN, planId });
    }

    const promotions = await this.prisma.promotion.findMany({
      where: {
        AND: [
          { active: true },
          { startDate: { lte: now } },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          { OR: scopeFilters },
        ],
      },
      orderBy: [
        { discountPercent: 'desc' },
        { startDate: 'asc' },
      ],
    });

    return promotions.map((promotion) => this.formatPromotion(promotion));
  }

  private ensureDateOrder(start: string, end?: string) {
    if (!end) return;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate < startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }
  }

  private async resolveScopeTargets(scope: PromotionScope, gameType?: GameType, planId?: string) {
    if (scope === PromotionScope.GLOBAL) {
      return { gameType: null, planId: null };
    }

    if (scope === PromotionScope.GAME) {
      if (!gameType) {
        throw new BadRequestException('gameType is required for GAME scope promotions');
      }
      return { gameType, planId: null };
    }

    if (scope === PromotionScope.PLAN) {
      if (!planId) {
        throw new BadRequestException('planId is required for PLAN scope promotions');
      }

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new NotFoundException(`Plan with ID "${planId}" not found`);
      }

      return { gameType: plan.gameType, planId };
    }

    throw new BadRequestException('Unsupported promotion scope');
  }

  private formatPromotion(promotion: any): PromotionResponse {
    return {
      id: promotion.id,
      name: promotion.name,
      description: promotion.description ?? undefined,
      scope: promotion.scope,
      discountPercent: promotion.discountPercent,
      gameType: promotion.gameType ?? undefined,
      planId: promotion.planId ?? undefined,
      startDate: promotion.startDate.toISOString(),
      endDate: promotion.endDate ? promotion.endDate.toISOString() : undefined,
      active: promotion.active,
      createdAt: promotion.createdAt.toISOString(),
      updatedAt: promotion.updatedAt.toISOString(),
    };
  }
}
