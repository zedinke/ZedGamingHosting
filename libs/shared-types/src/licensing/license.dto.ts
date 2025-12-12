import { IsString, IsEnum, IsBoolean, IsOptional, IsDateString, IsInt, IsArray } from 'class-validator';

/**
 * License status enum
 */
export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  GRACE_PERIOD = 'GRACE_PERIOD',
}

/**
 * DTO for license validation request
 */
export class ValidateLicenseDto {
  @IsString()
  licenseKey!: string;

  @IsString()
  serverIp!: string;

  @IsString()
  hwid!: string;

  @IsDateString()
  timestamp!: string;

  @IsString()
  signature!: string;
}

/**
 * DTO for license validation response
 */
export class LicenseValidationResponseDto {
  @IsBoolean()
  valid!: boolean;

  @IsEnum(LicenseStatus)
  status!: LicenseStatus;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsInt()
  maxNodesAllowed?: number;

  @IsOptional()
  @IsBoolean()
  whitelabelEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsString()
  signature!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  gracePeriodEnds?: string;
}


