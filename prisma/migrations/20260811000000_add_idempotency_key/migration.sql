-- AlterTable
ALTER TABLE "User" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_idempotencyKey_key" ON "User"("idempotencyKey");
