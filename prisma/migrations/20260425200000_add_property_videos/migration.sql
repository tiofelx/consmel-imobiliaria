-- AlterTable
ALTER TABLE "properties" ADD COLUMN "videos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
