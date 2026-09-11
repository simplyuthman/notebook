import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { initializeProCheckout, type BillingInterval } from "@/server/billing";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const VALID_INTERVALS: BillingInterval[] = ["MONTHLY", "YEARLY"];

export async function POST(req: Request) {
  try {
    // 1. Session verification
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 2. Rate Limiting (max 10 attempts per 15 min window per user)
    const clientIp = getClientIp(req);
    const rateLimitKey = `checkout:${userId || clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter > 0 ? retryAfter : 60),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetTime),
          },
        }
      );
    }

    // 2. Validate interval
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const interval = (body as { interval?: unknown })?.interval;
    if (typeof interval !== "string" || !VALID_INTERVALS.includes(interval as BillingInterval)) {
      return NextResponse.json(
        { error: 'interval must be "MONTHLY" or "YEARLY".' },
        { status: 400 }
      );
    }

    // 3. Resolve the payer's email for the Flutterwave customer record
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // 4. Hand off to the billing service — all provider logic lives in server/billing
    const checkout = await initializeProCheckout(userId, user.email, interval as BillingInterval);

    if (!checkout) {
      return NextResponse.json(
        { error: "Online checkout is not available right now. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json({ link: checkout.link });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start checkout";
    console.error("api.billing.checkout.error", { err });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
