import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFullBillingDetails } from '@/server/billing';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getUserFullBillingDetails(userId);
  return NextResponse.json(data);
}
