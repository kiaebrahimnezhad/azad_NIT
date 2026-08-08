/*
  Warnings:

  - Added the required column `examEid` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
CREATE SEQUENCE exam_eid_seq;
ALTER TABLE "Exam" ALTER COLUMN "eid" SET DEFAULT nextval('exam_eid_seq');
ALTER SEQUENCE exam_eid_seq OWNED BY "Exam"."eid";

-- AlterTable
CREATE SEQUENCE question_qid_seq;
ALTER TABLE "Question" ADD COLUMN     "examEid" INTEGER NOT NULL,
ALTER COLUMN "qid" SET DEFAULT nextval('question_qid_seq');
ALTER SEQUENCE question_qid_seq OWNED BY "Question"."qid";

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseCid_fkey" FOREIGN KEY ("courseCid") REFERENCES "Course"("cid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examEid_fkey" FOREIGN KEY ("examEid") REFERENCES "Exam"("eid") ON DELETE RESTRICT ON UPDATE CASCADE;
