-- DropIndex
DROP INDEX "User_mail_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "verified" DROP NOT NULL;
