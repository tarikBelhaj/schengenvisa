-- CreateEnum
CREATE TYPE "DogSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "VetRecordType" AS ENUM ('RABIES_VACCINE', 'CHPPI_VACCINE', 'LEPTOSPIROSIS_VACCINE', 'BORDETELLA_VACCINE', 'DEWORMING', 'ANTIPARASITIC', 'RABIES_TITER', 'HEALTH_CERTIFICATE', 'IMPORT_PERMIT', 'OTHER');

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "sex" "DogSex",
    "birthDate" DATE,
    "microchip" TEXT,
    "photo" TEXT,
    "countryCode" TEXT,
    "euPassport" TEXT,
    "weightKg" DOUBLE PRECISION,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetRecord" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "type" "VetRecordType" NOT NULL,
    "date" DATE NOT NULL,
    "expiresAt" DATE,
    "note" TEXT,
    "label" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VetRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dog_userId_idx" ON "Dog"("userId");

-- CreateIndex
CREATE INDEX "VetRecord_dogId_idx" ON "VetRecord"("dogId");

-- CreateIndex
CREATE INDEX "VetRecord_dogId_date_idx" ON "VetRecord"("dogId", "date");

-- AddForeignKey
ALTER TABLE "Dog" ADD CONSTRAINT "Dog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetRecord" ADD CONSTRAINT "VetRecord_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

