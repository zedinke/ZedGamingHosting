import { IsEnum, IsString, IsOptional, IsBoolean, IsInt, IsDateString, IsUrl } from 'class-validator';
import { MediaType } from '@zed-hosting/db';

export class CreateSlideDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MediaType)
  mediaType!: MediaType;

  @IsString()
  mediaUrl!: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  linkText?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  publishedFrom?: string;

  @IsOptional()
  @IsDateString()
  publishedUntil?: string;
}

export class UpdateSlideDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  linkText?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  publishedFrom?: string;

  @IsOptional()
  @IsDateString()
  publishedUntil?: string;
}
