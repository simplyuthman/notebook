-- Migration: add_email_verification_fields
-- Adds email verification columns to the User model:
--   emailVerified         - timestamp set when verification succeeds
--   emailVerificationCode - the 6-digit code (unique constraint for lookups)
--   emailVerificationExpiry - when the code expires (10 min from generation)
-- All columns are nullable so existing rows are unaffected.

ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailVerificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpiry" TIMESTAMP(3);

-- Unique index on emailVerificationCode for fast lookup
CREATE UNIQUE INDEX "User_emailVerificationCode_key" ON "User"("emailVerificationCode");
