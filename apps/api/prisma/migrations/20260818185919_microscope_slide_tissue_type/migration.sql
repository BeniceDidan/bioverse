-- CreateEnum
CREATE TYPE "TissueType" AS ENUM ('EPITEL', 'IKAT', 'OTOT', 'SARAF', 'LAINNYA');

-- AlterTable
ALTER TABLE "microscope_slides" ADD COLUMN     "tissueType" "TissueType" NOT NULL DEFAULT 'LAINNYA';
