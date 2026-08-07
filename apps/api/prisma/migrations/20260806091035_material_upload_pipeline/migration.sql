-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADED', 'READY_TO_EXPAND', 'EXPANDING', 'EXPANDED', 'FAILED');

-- AlterTable
ALTER TABLE "material_sections" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "material_uploads" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "extractedText" TEXT,
    "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorMessage" TEXT,
    "materialSectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_uploads_materialSectionId_key" ON "material_uploads"("materialSectionId");

-- CreateIndex
CREATE INDEX "material_uploads_teacherId_idx" ON "material_uploads"("teacherId");

-- AddForeignKey
ALTER TABLE "material_uploads" ADD CONSTRAINT "material_uploads_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_uploads" ADD CONSTRAINT "material_uploads_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_uploads" ADD CONSTRAINT "material_uploads_materialSectionId_fkey" FOREIGN KEY ("materialSectionId") REFERENCES "material_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
