import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { createPaymentLog } from '@/server/billing';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    billingName?: string;
    billingEmail?: string;
    companyName?: string;
    addressLine1?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    taxId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  const { billingName, billingEmail } = body;

  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return NextResponse.json({ error: 'Please enter a valid billing email address.' }, { status: 400 });
  }

  // Update user name if billing name provided
  if (billingName && billingName.trim()) {
    await db.user.update({
      where: { id: userId },
      data: { name: billingName.trim() },
    });
  }

  await createPaymentLog({
    userId,
    reference: `billing-info-update-${userId}-${Date.now()}`,
    event: 'BILLING_INFO_UPDATED',
    status: 'SUCCESS',
    rawPayload: JSON.stringify(body),
  });

  return NextResponse.json({
    success: true,
    message: 'Billing information updated successfully.',
    billingInfo: body,
  });
}
