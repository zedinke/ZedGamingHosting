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
  SATISFACTORY = 'SATISFACTORY',
  THE_FOREST = 'THE_FOREST',
  SONS_OF_THE_FOREST = 'SONS_OF_THE_FOREST',
  SEVEN_DAYS_TO_DIE = 'SEVEN_DAYS_TO_DIE',
  VALHEIM = 'VALHEIM',
  PROJECT_ZOMBOID = 'PROJECT_ZOMBOID',
  FACTORIO = 'FACTORIO',
  TERRARIA = 'TERRARIA',
  UNTURNED = 'UNTURNED',
  STARBOUND = 'STARBOUND',
  ECO = 'ECO',
  BAROTRAUMA = 'BAROTRAUMA',
  GARRYS_MOD = 'GARRYS_MOD',
  DAYZ = 'DAYZ',
  ARMA3 = 'ARMA3',
  ARK_SURVIVAL_ASCENDED = 'ARK_SURVIVAL_ASCENDED',
  V_RISING = 'V_RISING',
  ENSHROUDED = 'ENSHROUDED',
  MORDHAU = 'MORDHAU',
  INSURGENCY_SANDSTORM = 'INSURGENCY_SANDSTORM',
  STATIONEERS = 'STATIONEERS',
  SCUM = 'SCUM',
  CONAN_EXILES = 'CONAN_EXILES',
  RAINBOW_SIX_SIEGE = 'RAINBOW_SIX_SIEGE',
  HELL_LET_LOOSE = 'HELL_LET_LOOSE',
  FOXHOLE = 'FOXHOLE',
  READY_OR_NOT = 'READY_OR_NOT',
  DEEP_ROCK_GALACTIC = 'DEEP_ROCK_GALACTIC',
  SPACE_ENGINEERS = 'SPACE_ENGINEERS',
  STARDEW_VALLEY = 'STARDEW_VALLEY',
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


