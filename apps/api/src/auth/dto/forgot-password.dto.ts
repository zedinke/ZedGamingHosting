import { IsEmail } from 'class-validator';

/**
 * Request password reset DTO
 */
export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}
