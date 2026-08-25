import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import {
  createAndStoreVerificationCode,
  isVerificationCodeActive,
} from "@/server/auth/verification";
import { sendVerificationEmail } from "@/server/email";
import { after } from "next/server";

/**
 * POST /api/auth/send-verification
 * Generates and stores a fresh verification code for the authenticated user,
 * then enqueues a background job that emails it to them.
 * Rate-limited to once per 10 minutes using the code expiry as a gate.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified." },
        { status: 409 },
      );
    }

    // Rate-limit: do not resend if an active code already exists.
    const active = await isVerificationCodeActive(userId);
    if (active) {
      return NextResponse.json(
        { error: "A verification code was sent recently. Please wait before requesting a new one." },
        { status: 429 },
      );
    }

    // Store the code synchronously so it exists even if the email job fails.
    const code = await createAndStoreVerificationCode(userId);

    // Background delivery via Next.js after() — send the email without blocking.
    after(async () => {
      try {
        await sendVerificationEmail(user.email, code);
      } catch (emailErr) {
        console.error("route.auth.send-verification.email", {
          userId,
          emailErr,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("route.auth.send-verification", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
