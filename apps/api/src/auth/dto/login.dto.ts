import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Login DTO - validates login request
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

