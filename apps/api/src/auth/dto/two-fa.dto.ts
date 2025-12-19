import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * Setup 2FA Request DTO
 */
export class Setup2FADto {
  @IsOptional()
  @IsString()
  method?: 'totp' | 'sms'; // Default: totp
}

/**
 * Enable 2FA DTO
 */
export class Enable2FADto {
  @IsString()
  secret: string = ''; // TOTP secret from QR code setup

  @IsNumber()
  @Min(100000)
  @Max(999999)
  code: number = 0; // 6-digit verification code
}

/**
 * Verify 2FA DTO
 */
export class Verify2FADto {
  @IsNumber()
  @Min(100000)
  @Max(999999)
  code: number = 0; // 6-digit code from authenticator app
}

/**
 * Verify Backup Code DTO
 */
export class VerifyBackupCodeDto {
  @IsString()
  code: string = ''; // Backup code (format: XXXX-XXXX-XXXX)
}

/**
 * Disable 2FA DTO
 */
export class Disable2FADto {
  @IsNumber()
  @Min(100000)
  @Max(999999)
  code: number = 0; // Current 2FA code to confirm disable
}

/**
 * 2FA Setup Response DTO
 */
export class TwoFASetupResponseDto {
  secret: string = ''; // TOTP secret
  qrCode: string = ''; // QR code as base64 data URL
  manualEntryKey: string = ''; // Manual entry key for authenticator apps
  backupCodes: string[] = []; // Backup codes
}

/**
 * 2FA Status DTO
 */
export class TwoFAStatusDto {
  enabled: boolean = false;
  method: 'totp' | 'sms' | null = null;
  backupCodesCount: number = 0;
  createdAt?: Date;
}

/**
 * Login with 2FA Response
 */
export class LoginWith2FAResponseDto {
  requiresTwoFA: boolean = false;
  sessionToken?: string; // Temporary token for 2FA verification
  expiresIn: number = 0; // Seconds until session token expires
}
