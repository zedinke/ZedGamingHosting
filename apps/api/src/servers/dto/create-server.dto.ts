import { IsEnum, IsString, IsOptional, IsObject, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

enum GameType {
  ARK = 'ARK',
  RUST = 'RUST',
  MINECRAFT = 'MINECRAFT',
  CS2 = 'CS2',
  PALWORLD = 'PALWORLD',
}

class ServerResources {
  @IsInt()
  @Min(1)
  cpuLimit!: number; // Cores

  @IsInt()
  @Min(512)
  ramLimit!: number; // MB

  @IsInt()
  @Min(10)
  diskLimit!: number; // GB
}

export class CreateServerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(GameType)
  gameType!: GameType;

  @IsString()
  nodeId!: string;

  @ValidateNested()
  @Type(() => ServerResources)
  resources!: ServerResources;

  @IsObject()
  @IsOptional()
  envVars?: Record<string, string>;

  @IsInt()
  @Min(1)
  @IsOptional()
  startupPriority?: number;

  @IsString()
  @IsOptional()
  clusterId?: string;
}

