-- AlterTable
ALTER TABLE "choices" ADD COLUMN     "matchGroup" TEXT;

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherId" TEXT;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
