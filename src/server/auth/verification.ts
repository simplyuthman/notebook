import crypto from "crypto";
import { db } from "@/server/db";

const CODE_EXPIRY_MINUTES = 10;

/**
 * Generates a 6-digit numeric verification code from crypto.randomBytes(32).
 * Uses the first 4 bytes as a uint32, mod 1_000_000, zero-padded to 6 digits.
 */
export function generateVerificationCode(): string {
  const buf = crypto.randomBytes(32);
  const uint32 = buf.readUInt32BE(0);
  const sixDigit = uint32 % 1_000_000;
  return sixDigit.toString().padStart(6, "0");
}

/**
 * Creates a fresh 6-digit code in the temporary EmailVerified table with an
 * expiry 10 minutes from now, and returns the plaintext code.
 *
 * A user has at most one active record (userId is unique), so any prior
 * record — active or expired — is removed before the new one is stored.
 */
export async function createAndStoreVerificationCode(
  userId: string,
): Promise<string> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await db.$transaction([
    db.emailVerified.deleteMany({ where: { userId } }),
    db.emailVerified.create({
      data: { userId, code, expiresAt },
    }),
  ]);

  return code;
}

/**
 * Verifies a submitted code against the EmailVerified record for this user.
 * If valid, deletes the temporary record and marks emailVerified.
 * Returns true on success, false on any failure.
 */
export async function verifyEmailCode(
  userId: string,
  submittedCode: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  if (user.emailVerified) {
    return { success: true }; // already verified — idempotent
  }

  const record = await db.emailVerified.findUnique({ where: { userId } });

  if (!record) {
    return { success: false, error: "No verification code found. Please request a new one." };
  }

  if (new Date() > record.expiresAt) {
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  if (record.code !== submittedCode.trim()) {
    return { success: false, error: "Invalid verification code." };
  }

  // Delete the temporary record and mark verified in the same operation.
  await db.$transaction([
    db.emailVerified.delete({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        emailVerification: true,
      },
    }),
  ]);

  return { success: true };
}

/**
 * Returns true if an active (unexpired) verification record exists for this
 * user — i.e. a new code cannot be sent yet (rate-limit: one per
 * CODE_EXPIRY_MINUTES).
 */
export async function isVerificationCodeActive(userId: string): Promise<boolean> {
  const record = await db.emailVerified.findUnique({ where: { userId } });

  if (!record) return false;
  return new Date() < record.expiresAt;
}
