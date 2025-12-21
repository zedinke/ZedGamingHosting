-- Add email verification fields to User table
ALTER TABLE User ADD COLUMN emailVerified BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE User ADD COLUMN emailVerificationToken VARCHAR(191) UNIQUE;
ALTER TABLE User ADD COLUMN emailVerificationExpires DATETIME(3);

-- Create index for faster lookups
CREATE INDEX idx_User_emailVerificationToken ON User(emailVerificationToken);
