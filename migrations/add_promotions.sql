-- Add PromotionScope enum and Promotion table
CREATE TABLE IF NOT EXISTS `Promotion` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `scope` ENUM('GLOBAL', 'GAME', 'PLAN') NOT NULL,
  `discountPercent` INT NOT NULL,
  `gameType` ENUM('ARK', 'RUST', 'MINECRAFT', 'CS2', 'PALWORLD', 'ATLAS'),
  `planId` VARCHAR(191),
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3),
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_scope_active` (`scope`, `active`),
  INDEX `idx_gameType_active` (`gameType`, `active`),
  INDEX `idx_planId_active` (`planId`, `active`),
  INDEX `idx_startDate` (`startDate`),
  INDEX `idx_endDate` (`endDate`),
  FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
