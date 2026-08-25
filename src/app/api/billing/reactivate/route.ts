import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { reactivateUserSubscription } from '@/server/billing';

export async function POST() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await reactivateUserSubscription(userId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
