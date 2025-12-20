import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

/**
 * Create Knowledge Article DTO
 */
export class CreateKnowledgeArticleDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

/**
 * Update Knowledge Article DTO
 */
export class UpdateKnowledgeArticleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
