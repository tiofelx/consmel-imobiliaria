-- AlterTable
ALTER TABLE "events" ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 60;

-- CreateTable
CREATE TABLE "lancamento_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamento_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamento_leads_createdAt_idx" ON "lancamento_leads"("createdAt");
