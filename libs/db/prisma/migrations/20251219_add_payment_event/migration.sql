-- CreateTable
CREATE TABLE `PaymentEvent` (
  `id` VARCHAR(191) NOT NULL,
  `provider` ENUM('BARION','PAYPAL','UPAY') NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `paymentId` VARCHAR(191) NULL,
  `orderId` VARCHAR(191) NULL,
  `status` ENUM('RECEIVED','PROCESSED','FAILED') NOT NULL DEFAULT 'RECEIVED',
  `payload` JSON NULL,
  `error` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processedAt` DATETIME(3) NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndexes
CREATE UNIQUE INDEX `PaymentEvent_provider_eventType_eventId_key` ON `PaymentEvent`(`provider`, `eventType`, `eventId`);
CREATE INDEX `PaymentEvent_paymentId_idx` ON `PaymentEvent`(`paymentId`);
CREATE INDEX `PaymentEvent_orderId_idx` ON `PaymentEvent`(`orderId`);
