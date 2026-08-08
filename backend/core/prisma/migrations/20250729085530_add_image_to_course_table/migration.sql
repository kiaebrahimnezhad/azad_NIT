/*
  Warnings:

  - You are about to drop the `shopping_cart` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "shopping_cart" DROP CONSTRAINT "shopping_cart_cid_fkey";

-- DropForeignKey
ALTER TABLE "shopping_cart" DROP CONSTRAINT "shopping_cart_username_fkey";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "option3" DROP NOT NULL,
ALTER COLUMN "option4" DROP NOT NULL,
ALTER COLUMN "option5" DROP NOT NULL;

-- DropTable
DROP TABLE "shopping_cart";
