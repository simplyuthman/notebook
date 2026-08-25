import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cancelUserSubscription } from '@/server/billing';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
