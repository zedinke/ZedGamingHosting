import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class CreateSubdomainDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
    message: 'Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
  })
  subdomain!: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/, {
    message: 'Domain must be a valid domain name',
  })
  domain?: string;

  @IsString()
  @IsNotEmpty()
  serverUuid!: string;
}

