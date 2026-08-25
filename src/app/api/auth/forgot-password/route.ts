import { NextResponse, after } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { createPasswordResetToken } from "@/server/auth/passwordReset";
import { sendPasswordResetEmail } from "@/server/email";

const schema = z.object({
  email: z.string().email("Invalid email address."),
});

/**
 * POST /api/auth/forgot-password
 *
 * Accepts an email address and — if a matching account exists — creates a
 * single-use 6-digit reset code and sends it to the user's inbox.
 *
 * Deliberately returns 200 regardless of whether the email matched, so that
 * this endpoint cannot be used to enumerate which addresses have accounts.
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

    const { email } = result.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Always respond with 200 even if no user was found — prevents account enumeration.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const code = await createPasswordResetToken(user.id, user.email);

    // Fire-and-forget — email failure must not block the response.
    after(async () => {
      try {
        await sendPasswordResetEmail(user.email, code);
      } catch (emailErr) {
        console.error("route.auth.forgot-password.email", { userId: user.id, emailErr });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("route.auth.forgot-password", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
