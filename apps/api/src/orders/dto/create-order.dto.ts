import { IsString, IsOptional, IsEnum, ValidateIf } from 'class-validator';

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
  billingCycle!: BillingCycle;
}
