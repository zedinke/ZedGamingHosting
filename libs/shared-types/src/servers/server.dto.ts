import { IsString, IsEnum, IsInt, IsOptional, IsObject } from 'class-validator';

/**
 * Game type enum
 */
export enum GameType {
  ARK = 'ARK',
  RUST = 'RUST',
  MINECRAFT = 'MINECRAFT',
  CS2 = 'CS2',
  PALWORLD = 'PALWORLD',
  ATLAS = 'ATLAS',
}

/**
 * Server status enum
 */
export enum ServerStatus {
  INSTALLING = 'INSTALLING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  STOPPING = 'STOPPING',
  CRASHED = 'CRASHED',
  UPDATING = 'UPDATING',
}

/**
 * DTO for creating a new game server
 */
export class CreateServerDto {
  @IsEnum(GameType)
  gameType!: GameType;

  @IsString()
  nodeId!: string;

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsInt()
  startupPriority?: number;

  @IsObject()
  resources!: {
    cpuLimit: number; // Cores
    ramLimit: number; // MB
    diskLimit: number; // GB
  };

  @IsOptional()
  @IsObject()
  envVars?: Record<string, string>;

  @IsOptional()
  @IsString()
  clusterId?: string;
}

/**
 * DTO for updating server resources
 */
export class UpdateServerResourcesDto {
  @IsOptional()
  @IsInt()
  cpuLimit?: number;

  @IsOptional()
  @IsInt()
  ramLimit?: number;

  @IsOptional()
  @IsInt()
  diskLimit?: number;
}

