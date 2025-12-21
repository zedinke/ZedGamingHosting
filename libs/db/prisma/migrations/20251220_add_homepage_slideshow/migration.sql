-- MySQL-compatible migration for homepage slideshow
CREATE TABLE `HomepageSlide` (
    `id` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `description` TEXT NULL,
    `mediaType` ENUM('IMAGE', 'VIDEO', 'YOUTUBE') NOT NULL,
    `mediaUrl` TEXT NOT NULL,
    `linkUrl` TEXT NULL,
    `linkText` TEXT NULL,
    `sortOrder` INT NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `publishedFrom` DATETIME(3) NULL,
    `publishedUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `HomepageSlide_isActive_sortOrder_idx` (`isActive`, `sortOrder`),
    INDEX `HomepageSlide_publishedFrom_publishedUntil_idx` (`publishedFrom`, `publishedUntil`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
