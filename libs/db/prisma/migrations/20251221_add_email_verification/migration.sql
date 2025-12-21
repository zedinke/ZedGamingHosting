-- Add email verification fields to User table
ALTER TABLE User ADD COLUMN emailVerified BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE User ADD COLUMN emailVerificationToken VARCHAR(191) UNIQUE;
ALTER TABLE User ADD COLUMN emailVerificationExpires DATETIME(3);

-- Create index for faster lookups
CREATE INDEX idx_User_emailVerificationToken ON User(emailVerificationToken);
-- Create BillingProfile table
CREATE TABLE IF NOT EXISTS BillingProfile (
	id VARCHAR(191) NOT NULL,
	userId VARCHAR(191) NOT NULL UNIQUE,
	type ENUM('INDIVIDUAL', 'COMPANY') NOT NULL DEFAULT 'INDIVIDUAL',
	fullName VARCHAR(191),
	companyName VARCHAR(191),
	taxNumber VARCHAR(191),
	country VARCHAR(191) NOT NULL,
	city VARCHAR(191) NOT NULL,
	postalCode VARCHAR(191) NOT NULL,
	street VARCHAR(191) NOT NULL,
	phone VARCHAR(191),
	createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	PRIMARY KEY (id),
	UNIQUE KEY idx_BillingProfile_userId (userId),
	KEY idx_BillingProfile_userId_2 (userId),
	CONSTRAINT BillingProfile_ibfk_1 FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
