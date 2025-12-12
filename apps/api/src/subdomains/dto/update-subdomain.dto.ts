import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateSubdomainDto {
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
    message: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
  })
  subdomain?: string;

  @IsString()
  @IsOptional()
  targetIP?: string;
}

