/*
  Warnings:

  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "is_valid" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Message";

-- CreateTable
CREATE TABLE "CourseMessage" (
    "id" SERIAL NOT NULL,
    "sender" TEXT NOT NULL,
    "reciver" TEXT NOT NULL,
    "cid" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "CourseMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamMessage" (
    "id" SERIAL NOT NULL,
    "sender" TEXT NOT NULL,
    "reciver" TEXT NOT NULL,
    "eid" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ExamMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReviewMessage" (
    "id" SERIAL NOT NULL,
    "sender" TEXT NOT NULL,
    "reciver" TEXT NOT NULL,
    "commentId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "CommentReviewMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourseMessage" ADD CONSTRAINT "CourseMessage_cid_fkey" FOREIGN KEY ("cid") REFERENCES "Course"("cid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMessage" ADD CONSTRAINT "ExamMessage_eid_fkey" FOREIGN KEY ("eid") REFERENCES "Exam"("eid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReviewMessage" ADD CONSTRAINT "CommentReviewMessage_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
