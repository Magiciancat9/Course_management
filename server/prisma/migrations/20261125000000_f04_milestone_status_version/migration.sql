-- Additive F-04 migration: add explicit draft/published lifecycle, publication time, and optimistic-lock version.
-- Existing rows default to DRAFT with NULL publishedAt and version 1 (no silent publication or invented timestamps).
CREATE TYPE "MilestoneStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "Milestone"
ADD COLUMN "status" "MilestoneStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
