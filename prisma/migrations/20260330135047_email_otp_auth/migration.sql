/*
  Warnings:

  - You are about to drop the column `phone` on the `Otp` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email,code]` on the table `Otp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Otp` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Otp_phone_code_key";

-- AlterTable
ALTER TABLE "Otp" DROP COLUMN "phone",
ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Otp_email_code_key" ON "Otp"("email", "code");
