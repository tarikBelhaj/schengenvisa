-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('DAYS_10', 'DAYS_0', 'OVERAGE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alertEmail" TEXT;

-- CreateTable
CREATE TABLE "SentAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "daysLeft" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentAlert_userId_idx" ON "SentAlert"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SentAlert_personId_kind_key" ON "SentAlert"("personId", "kind");

-- AddForeignKey
ALTER TABLE "SentAlert" ADD CONSTRAINT "SentAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

