/*
  Warnings:

  - You are about to drop the column `email` on the `Otp` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone,code]` on the table `Otp` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `Otp` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Otp_email_code_key";

-- AlterTable
ALTER TABLE "Otp" DROP COLUMN "email",
ADD COLUMN     "phone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Otp_phone_code_key" ON "Otp"("phone", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
