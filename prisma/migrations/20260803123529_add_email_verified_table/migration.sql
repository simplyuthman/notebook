/*
  Warnings:

  - You are about to drop the column `emailVerificationCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationExpiry` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_emailVerificationCode_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationCode",
DROP COLUMN "emailVerificationExpiry";

-- CreateTable
CREATE TABLE "EmailVerified" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerified_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerified_userId_key" ON "EmailVerified"("userId");

-- CreateIndex
CREATE INDEX "EmailVerified_userId_idx" ON "EmailVerified"("userId");

-- AddForeignKey
ALTER TABLE "EmailVerified" ADD CONSTRAINT "EmailVerified_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
