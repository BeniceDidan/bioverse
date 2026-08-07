/*
  Warnings:

  - Added the required column `updatedAt` to the `microscope_slides` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "microscope_slides" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "microscope_slides" ADD CONSTRAINT "microscope_slides_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
