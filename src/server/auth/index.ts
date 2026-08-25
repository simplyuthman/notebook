import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password with bcrypt (12 salt rounds).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * Returns true if they match.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
