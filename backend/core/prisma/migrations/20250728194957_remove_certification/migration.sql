/*
  Warnings:

  - You are about to drop the column `certificate` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "certificate",
ALTER COLUMN "field2" DROP NOT NULL;
