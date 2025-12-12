import { IsEnum, IsString, IsOptional, IsObject, IsInt, Min } from 'class-validator';

enum GameType {
  ARK = 'ARK',
  RUST = 'RUST',
  MINECRAFT = 'MINECRAFT',
  CS2 = 'CS2',
  PALWORLD = 'PALWORLD',
}

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

