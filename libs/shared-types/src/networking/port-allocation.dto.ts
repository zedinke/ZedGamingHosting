import { IsString, IsEnum, IsOptional } from 'class-validator';
import { GameType } from '../servers/server.dto';

/**
 * Protocol enum
 */
export enum Protocol {
  UDP = 'UDP',
  TCP = 'TCP',
  BOTH = 'BOTH',
}

/**
 * Port type enum
 */
export enum PortType {
  GAME = 'GAME',
  RCON = 'RCON',
  QUERY = 'QUERY',
  APP = 'APP',
  TV = 'TV',
}

/**
 * DTO for port allocation request
 */
export class PortAllocationRequestDto {
  @IsString()
  nodeId!: string;

  @IsEnum(Protocol)
  protocol!: Protocol;

  @IsEnum(GameType)
  gameType!: GameType;

  @IsOptional()
  @IsString()
  serverUuid?: string;
}

/**
 * DTO for port deallocation
 */
export class PortDeallocationDto {
  @IsString()
  serverUuid!: string;
}


