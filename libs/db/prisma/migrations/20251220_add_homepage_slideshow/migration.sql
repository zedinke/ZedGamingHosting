-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'YOUTUBE');

-- CreateTable
CREATE TABLE "HomepageSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "linkText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedFrom" TIMESTAMP(3),
    "publishedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageSlide_isActive_sortOrder_idx" ON "HomepageSlide"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "HomepageSlide_publishedFrom_publishedUntil_idx" ON "HomepageSlide"("publishedFrom", "publishedUntil");
