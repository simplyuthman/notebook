import { NextResponse, after } from "next/server";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth";
import { sendWelcomeEmail, sendVerificationEmail } from "@/server/email";
import { z } from "zod";
import { createAndStoreVerificationCode } from "@/server/auth/verification";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 8 characters"),
  name: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  let idempotencyKey: string | undefined;

  try {
    const rawInput = await req.json();
    const result = signupSchema.safeParse(rawInput);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const input = result.data;
    idempotencyKey = input.idempotencyKey;
    const passwordHash = await hashPassword(input.password);

    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name ?? null,
        idempotencyKey: idempotencyKey ?? null,
      },
    });

    // Generate and store the verification code synchronously so it's ready.
    const code = await createAndStoreVerificationCode(user.id);

    // Fire-and-forget emails (welcome + verification) — email failure must not block account creation.
    after(async () => {
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailErr) {
        // Log but do not surface to caller
        console.error("route.auth.signup.email.welcome", { userId: user.id, emailErr });
      }

      try {
        await sendVerificationEmail(user.email, code);
      } catch (emailErr) {
        console.error("route.auth.signup.email.verification", { userId: user.id, emailErr });
      }
    });

    // Set a userId cookie so the dashboard server component knows who is logged in.
    const response = NextResponse.json({ success: true, userId: user.id });
    response.cookies.set("userId", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    // Handle duplicate email or idempotencyKey (Prisma unique constraint violation)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const target = (err as any).meta?.target;
      const isIdempotencyKeyConflict = Array.isArray(target)
        ? target.includes("idempotencyKey")
        : typeof target === "string" && target.includes("idempotencyKey");

      if (isIdempotencyKeyConflict && idempotencyKey) {
        const existingUser = await db.user.findUnique({
          where: { idempotencyKey },
        });

        if (existingUser) {
          const response = NextResponse.json({ success: true, userId: existingUser.id });
          response.cookies.set("userId", existingUser.id, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
          return response;
        }
      }

      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("route.auth.signup", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
