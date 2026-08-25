import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyEmailCode } from "@/server/auth/verification";

const schema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits.")
    .regex(/^\d{6}$/, "Verification code must contain only digits."),
});

/**
 * POST /api/auth/verify-email
 * Verifies the submitted 6-digit code against the stored code + expiry.
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const rawInput = await req.json();
    const result = schema.safeParse(rawInput);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { code } = result.data;
    const verification = await verifyEmailCode(userId, code);

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error ?? "Verification failed." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("route.auth.verify-email", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
