-- MySQL Migration for Homepage Slideshow
-- Created: 2024-12-20
-- Description: Add MediaType enum and HomepageSlide table for landing page slideshow

-- Create HomepageSlide table
CREATE TABLE IF NOT EXISTS `HomepageSlide` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `mediaType` ENUM('IMAGE', 'VIDEO', 'YOUTUBE') NOT NULL,
    `mediaUrl` VARCHAR(500) NOT NULL,
    `linkUrl` VARCHAR(500),
    `linkText` VARCHAR(100),
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `publishedFrom` DATETIME(3),
    `publishedUntil` DATETIME(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `HomepageSlide_isActive_sortOrder_idx` (`isActive`, `sortOrder`),
    INDEX `HomepageSlide_publishedFrom_publishedUntil_idx` (`publishedFrom`, `publishedUntil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample slide
INSERT INTO `HomepageSlide` (`id`, `title`, `description`, `mediaType`, `mediaUrl`, `linkUrl`, `linkText`, `sortOrder`, `isActive`)
VALUES (
    UUID(),
    'Professzionális Game Server Hosting',
    'Indítsd el szervered pillanatok alatt. Minecraft, Rust, CS2 és több játék támogatással.',
    'IMAGE',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=1080&fit=crop',
    '/hu/plans',
    'Csomagok Megtekintése',
    0,
    TRUE
);
