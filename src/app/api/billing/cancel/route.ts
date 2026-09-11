import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cancelUserSubscription } from '@/server/billing';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate Limiting (max 10 attempts per 15 min window)
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`cancel:${userId || clientIp}`, {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many cancellation attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter > 0 ? retryAfter : 60),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }

  let reason: string | undefined;
  try {
    const body = (await req.json()) as { reason?: string };
    if (typeof body.reason === 'string') {
      reason = body.reason.trim();
    }
  } catch {
    // Body is optional
  }

  const result = await cancelUserSubscription(userId, reason);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, currentPeriodEnd: result.currentPeriodEnd });
}
