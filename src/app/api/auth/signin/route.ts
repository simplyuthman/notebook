import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyPassword } from "@/server/auth";
import { z } from "zod";

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {

    const rawInput = await req.json();
    const result = signinSchema.safeParse(rawInput);


    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const input = result.data;

    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(input.password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // Set a userId cookie so the dashboard server component knows who is logged in.
    const response = NextResponse.json({ success: true, userId: user.id });
    response.cookies.set("userId", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error("route.auth.signin", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
