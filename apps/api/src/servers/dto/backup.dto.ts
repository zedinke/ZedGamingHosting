import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateBackupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  serverUuid: string;
}

export class RestoreBackupDto {
  @IsUUID()
  backupId: string;

  @IsUUID()
  serverUuid: string;
}

