import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { formatNaira } from '@/lib/formatNaira';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  const transactionId = params.id;

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Strict ownership check (R28, Security standards)
  if (!transaction || transaction.userId !== userId) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  const invoiceNumber = `INV-${transaction.createdAt.getFullYear()}-${transaction.id.slice(-6).toUpperCase()}`;
  const amountFormatted = formatNaira(transaction.amountMinor ?? 0);
  const dateFormatted = transaction.createdAt.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate clean, printable HTML receipt
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${invoiceNumber} - NotesBook</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #191919;
      background: #fafafa;
      margin: 0;
      padding: 40px 20px;
    }
    .invoice-card {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e6e6e6;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      padding: 36px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0741ff;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #0741ff;
      letter-spacing: -0.5px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-num {
      font-size: 16px;
      font-weight: 700;
      color: #191919;
    }
    .invoice-date {
      font-size: 13px;
      color: #666666;
      margin-top: 4px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
      font-size: 14px;
    }
    .meta-block h4 {
      margin: 0 0 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888888;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .table th {
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666666;
      border-bottom: 1px solid #e6e6e6;
      padding: 10px 12px;
    }
    .table td {
      padding: 14px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      gap: 32px;
      font-size: 16px;
      font-weight: 700;
      padding-top: 12px;
      border-top: 2px solid #e6e6e6;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      background: #d1fae5;
      color: #065f46;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
      text-align: center;
      font-size: 12px;
      color: #888888;
    }
    .print-btn {
      display: block;
      margin: 20px auto 0;
      padding: 10px 20px;
      background: #0741ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">NotesBook</div>
        <div style="font-size: 13px; color: #666; margin-top: 4px;">Digital Handwritten Notes Platform</div>
      </div>
      <div class="invoice-title">
        <div class="invoice-num">${invoiceNumber}</div>
        <div class="invoice-date">Date: ${dateFormatted}</div>
        <div style="margin-top: 6px;"><span class="badge">PAID</span></div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-block">
        <h4>Billed To</h4>
        <div><strong>${transaction.user.name || 'Student Account'}</strong></div>
        <div>${transaction.user.email}</div>
      </div>
      <div class="meta-block">
        <h4>Payment Reference</h4>
        <div style="word-break: break-all; font-family: monospace; font-size: 12px;">${transaction.reference || transaction.id}</div>
        <div style="margin-top: 4px;">Provider: Flutterwave</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>NotesBook Pro Subscription</strong><br>
            <span style="font-size: 12px; color: #666;">Full capture-to-book access, 150 images/mo, watermark-free PDF exports.</span>
          </td>
          <td style="text-align: right; font-weight: 600;">${amountFormatted}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <span>Total Paid:</span>
      <span style="color: #0741ff;">${amountFormatted}</span>
    </div>

    <div class="footer">
      Thank you for subscribing to NotesBook.<br>
      Questions? Contact support@notesbook.app
    </div>

    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
