-- CreateTable
CREATE TABLE `InvoiceMetadata` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `prefix` VARCHAR(191) NOT NULL DEFAULT 'INV',
    `sequenceNumber` INTEGER NOT NULL DEFAULT 1,
    `lastUsedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `year` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InvoiceMetadata_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `InvoiceMetadata_tenantId_prefix_year_key`(`tenantId`, `prefix`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
