import { IsString, IsInt, IsBoolean, IsOptional, IsEnum, IsIP } from 'class-validator';

/**
 * Disk type enum
 */
export enum DiskType {
  NVME = 'NVME',
  SSD = 'SSD',
  HDD = 'HDD',
}

/**
 * Node status enum
 */
export enum NodeStatus {
  PROVISIONING = 'PROVISIONING',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * DTO for creating a new node
 */
export class CreateNodeDto {
  @IsString()
  name!: string;

  @IsIP()
  ipAddress!: string;

  @IsOptional()
  @IsString()
  publicFqdn?: string;

  @IsInt()
  totalRam!: number; // MB

  @IsInt()
  totalCpu!: number; // Cores

  @IsEnum(DiskType)
  diskType!: DiskType;

  @IsOptional()
  @IsBoolean()
  isClusterStorage?: boolean;

  @IsOptional()
  @IsInt()
  maxConcurrentUpdates?: number;
}

/**
 * DTO for node registration (from daemon)
 */
export class RegisterNodeDto {
  @IsString()
  agentId!: string;

  @IsIP()
  agentIp!: string;

  @IsString()
  machineId!: string;

  @IsString()
  version!: string;

  @IsString()
  provisioningToken!: string;

  capabilities!: {
    docker: boolean;
    zfs: boolean;
    nfs: boolean;
  };
}


