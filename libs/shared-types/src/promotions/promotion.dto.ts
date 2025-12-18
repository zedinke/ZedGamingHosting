import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { GameType, PromotionScope } from '@zed-hosting/db';

export class CreatePromotionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionScope)
  scope!: PromotionScope;

  @ValidateIf((o) => o.scope === PromotionScope.GAME)
  @IsEnum(GameType)
  gameType?: GameType;

  @ValidateIf((o) => o.scope === PromotionScope.PLAN)
  @IsString()
  planId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PromotionScope)
  scope?: PromotionScope;

  @ValidateIf((o) => o.scope === PromotionScope.GAME || o.gameType)
  @IsOptional()
  @IsEnum(GameType)
  gameType?: GameType;

  @ValidateIf((o) => o.scope === PromotionScope.PLAN || o.planId)
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export interface PromotionResponse {
  id: string;
  name: string;
  description?: string;
  scope: PromotionScope;
  discountPercent: number;
  gameType?: GameType;
  planId?: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
