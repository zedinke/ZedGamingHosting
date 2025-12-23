-- Add social auth fields to users
ALTER TABLE `User`
  ADD COLUMN `provider` ENUM('LOCAL','GOOGLE','DISCORD') NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN `providerId` VARCHAR(191) NULL,
  ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
  ADD INDEX `User_provider_providerId_idx` (`provider`, `providerId`);
