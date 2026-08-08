/*
  Warnings:

  - Added the required column `is_valid` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "is_valid" BOOLEAN NOT NULL;
