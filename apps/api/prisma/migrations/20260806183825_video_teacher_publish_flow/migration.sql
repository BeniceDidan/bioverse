/*
  Warnings:

  - You are about to drop the column `subtitleUrl` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `videos` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `videos` table without a default value. This is not possible if the table is not empty.
  - Made the column `materialSectionId` on table `videos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `youtubeId` on table `videos` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "videos" DROP CONSTRAINT "videos_materialSectionId_fkey";

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "subtitleUrl",
DROP COLUMN "thumbnailUrl",
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "materialSectionId" SET NOT NULL,
ALTER COLUMN "youtubeId" SET NOT NULL,
ALTER COLUMN "durationSeconds" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_materialSectionId_fkey" FOREIGN KEY ("materialSectionId") REFERENCES "material_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
