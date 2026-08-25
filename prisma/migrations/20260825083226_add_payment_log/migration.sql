-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reference" TEXT NOT NULL,
    "providerTxId" TEXT,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountMinor" INTEGER,
    "currency" TEXT DEFAULT 'NGN',
    "rawPayload" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_userId_idx" ON "PaymentLog"("userId");

-- CreateIndex
CREATE INDEX "PaymentLog_reference_idx" ON "PaymentLog"("reference");

-- CreateIndex
CREATE INDEX "PaymentLog_providerTxId_idx" ON "PaymentLog"("providerTxId");

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
