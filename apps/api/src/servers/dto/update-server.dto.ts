import { IsEnum, IsString, IsOptional, IsObject, IsInt, Min } from 'class-validator';
import { GameType } from '@zed-hosting/shared-types';

export class UpdateServerDto {
  @IsEnum(GameType)
  @IsOptional()
  gameType?: GameType;

  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  resources?: {
    cpuLimit?: number;
    ramLimit?: number;
    diskLimit?: number;
  };

  @IsObject()
  @IsOptional()
  envVars?: Record<string, string>;

  @IsInt()
  @Min(1)
  @IsOptional()
  startupPriority?: number;
}

