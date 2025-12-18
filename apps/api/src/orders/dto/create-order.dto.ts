import { IsString, IsOptional, IsEnum, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  HOURLY = 'HOURLY',
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.planSlug)
  planId?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.planId)
  planSlug?: string;

  @IsEnum(BillingCycle)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  billingCycle: BillingCycle = BillingCycle.MONTHLY;
}
