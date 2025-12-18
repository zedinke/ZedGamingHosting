import { IsString, IsEnum, IsInt, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';
import { GameType, PlanStatus } from '@zed-hosting/db';

/**
 * DTO for creating a new plan
 */
export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsEnum(GameType)
  gameType!: GameType;

  @IsInt()
  @Min(512)
  ramMb!: number;

  @IsInt()
  @Min(1)
  cpuCores!: number;

  @IsInt()
  @Min(5)
  diskGb!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSlots?: number;

  @IsInt()
  @Min(0)
  monthlyPrice!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hourlyPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  setupFee?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

/**
 * DTO for updating a plan
 */
export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsOptional()
  @IsInt()
  @Min(512)
  ramMb?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cpuCores?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  diskGb?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSlots?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hourlyPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  setupFee?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

/**
 * Plan response interface
 */
export interface PlanResponse {
  id: string;
  name: string;
  slug: string;
  gameType: GameType;
  status: PlanStatus;
  ramMb: number;
  cpuCores: number;
  diskGb: number;
  maxSlots?: number;
  monthlyPrice: number;
  hourlyPrice?: number;
  setupFee: number;
  features?: string[];
  description?: string;
  isPopular: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
