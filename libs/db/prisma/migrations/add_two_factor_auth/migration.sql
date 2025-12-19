-- Add 2FA columns to User table
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorMethod" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorBackupCodes" TEXT;
