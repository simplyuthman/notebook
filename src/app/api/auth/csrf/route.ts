import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  // Generate a random CSRF token
  const csrfToken = randomBytes(32).toString("hex");

  const response = NextResponse.json({ csrfToken });

  // Set the token in an HttpOnly cookie so it cannot be read by JS,
  // but it will be automatically sent with subsequent requests to our domain.
  response.cookies.set("csrf_token", csrfToken, {
    httpOnly: true,
    sameSite: "lax", // 'lax' or 'strict' both prevent basic CSRF.
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
