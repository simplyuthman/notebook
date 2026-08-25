import { NextResponse } from "next/server";

/**
 * POST /api/auth/signout
 *
 * Clears the userId session cookie and redirects the user to the sign-in page.
 * Using a POST form submission (from the layout) means CSRF attacks cannot
 * trigger a sign-out via a crafted GET link.
 */
export async function POST() {
  const response = NextResponse.redirect(
    new URL("/auth", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  );

  // Delete the session cookie by setting maxAge to 0.
  response.cookies.set("userId", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
