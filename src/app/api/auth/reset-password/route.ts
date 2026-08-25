import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/server/auth";
import { consumePasswordResetToken } from "@/server/auth/passwordReset";

const schema = z.object({
  email: z.string().email("Invalid email address."),
  code: z.string().length(6, "Reset code must be 6 digits.").regex(/^\d{6}$/, "Reset code must be 6 digits."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[#@>^]/, "Password must contain a special character (#@>^)."),
});

/**
 * POST /api/auth/reset-password
 *
 * Validates the one-time 6-digit reset code and, on success, atomically:
 *   1. Updates the user's passwordHash.
 *   2. Deletes all reset tokens for that user (prevents replay).
 */
export async function POST(req: Request) {
  try {
    const rawInput = await req.json();
    const result = schema.safeParse(rawInput);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, code, password } = result.data;
    const passwordHash = await hashPassword(password);

    const outcome = await consumePasswordResetToken(email, code, passwordHash);

    if ("error" in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("route.auth.reset-password", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
