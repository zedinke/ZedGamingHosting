import { IsString } from 'class-validator';

/**
 * Refresh Token DTO - validates refresh token request
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}


