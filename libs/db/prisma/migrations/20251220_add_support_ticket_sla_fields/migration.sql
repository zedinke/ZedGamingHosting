-- AlterTable
ALTER TABLE `SupportTicket` 
ADD COLUMN `assignedAt` DATETIME(3),
ADD COLUMN `slaResponseDeadline` DATETIME(3),
ADD COLUMN `slaResolveDeadline` DATETIME(3),
ADD COLUMN `firstResponseAt` DATETIME(3);

-- CreateTable for SlaPolicy
CREATE TABLE `SlaPolicy` (
    `id` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL,
    `responseTimeHours` INT NOT NULL,
    `resolveTimeHours` INT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SlaPolicy_priority_key`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `SupportTicket_slaResponseDeadline_idx` ON `SupportTicket`(`slaResponseDeadline`);

-- CreateIndex
CREATE INDEX `SupportTicket_slaResolveDeadline_idx` ON `SupportTicket`(`slaResolveDeadline`);
