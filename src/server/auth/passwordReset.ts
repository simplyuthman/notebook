import { db } from "@/server/db";
import { generateVerificationCode } from "@/server/auth/verification";

const TOKEN_EXPIRY_MINUTES = 30;

/**
 * Creates a secure, single-use password reset token for the given user.
 * Any existing tokens for the same user are deleted first — a user always
 * has at most one active reset token at a time.
 *
 * Returns the plaintext 6-digit code (to be sent via email).
 */
export async function createPasswordResetToken(
  userId: string,
  email: string,
): Promise<string> {
  const code = generateVerificationCode();
  const token = `${email.toLowerCase()}:${code}`;
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  // Delete any prior tokens for this user before creating the new one.
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId } }),
    db.passwordResetToken.create({
      data: { userId, token, expiresAt },
    }),
  ]);

  return code;
}

/**
 * Looks up and validates a password reset code.
 * Returns the userId if valid, or an error string if not.
 */
export async function validatePasswordResetToken(
  email: string,
  code: string,
): Promise<{ userId: string } | { error: string }> {
  const token = `${email.toLowerCase()}:${code}`;
  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record) {
    return { error: "Invalid or expired password reset code." };
  }

  if (new Date() > record.expiresAt) {
    // Clean up the stale token.
    await db.passwordResetToken.delete({ where: { token } }).catch(() => null);
    return { error: "This password reset code has expired. Please request a new one." };
  }

  return { userId: record.userId };
}

/**
 * Consumes a valid reset code and updates the user's password in a single
 * atomic transaction. Deletes ALL reset tokens for the user on success so
 * that a stolen code cannot be replayed after the password has changed.
 */
export async function consumePasswordResetToken(
  email: string,
  code: string,
  newPasswordHash: string,
): Promise<{ success: true } | { error: string }> {
  const validation = await validatePasswordResetToken(email, code);
  if ("error" in validation) return validation;

  const { userId } = validation;

  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    }),
  ]);

  return { success: true };
}
