'use client';

import React, { useState } from 'react';
import { BillingTx, BillingLog } from './types';
import { formatNaira } from '@/lib/formatNaira';

interface InvoiceHistorySectionProps {
  transactions: BillingTx[];
  paymentLogs: BillingLog[];
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === 'PAID' || status === 'SUCCESS' || status === 'GRANTED';
  const isFailed = status === 'FAILED' || status === 'REJECTED';

  const bg = isPaid ? '#d1fae5' : isFailed ? '#fee2e2' : '#f3f4f6';
  const color = isPaid ? '#065f46' : isFailed ? '#991b1b' : '#374151';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.6875rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        textTransform: 'uppercase',
      }}
    >
      {isPaid ? 'PAID' : isFailed ? 'FAILED' : status}
    </span>
  );
}

export default function InvoiceHistorySection({
  transactions,
  paymentLogs,
}: InvoiceHistorySectionProps) {
  const [subView, setSubView] = useState<'invoices' | 'logs'>('invoices');

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
            Invoices &amp; Payment History
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
            Download formal tax receipts and view detailed billing ledger activity.
          </p>
        </div>

        {/* View toggle */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--color-surface-container-high, #ebebeb)',
            borderRadius: '8px',
            padding: '3px',
          }}
        >
          <button
            type="button"
            onClick={() => setSubView('invoices')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: subView === 'invoices' ? 'var(--color-on-primary, #ffffff)' : 'transparent',
              color: subView === 'invoices' ? 'var(--color-on-surface, #191919)' : 'var(--color-on-surface-variant, #4c4c4c)',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: subView === 'invoices' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Invoices ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('logs')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: subView === 'logs' ? 'var(--color-on-primary, #ffffff)' : 'transparent',
              color: subView === 'logs' ? 'var(--color-on-surface, #191919)' : 'var(--color-on-surface-variant, #4c4c4c)',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: subView === 'logs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Gateway Audit Logs ({paymentLogs.length})
          </button>
        </div>
      </div>

      {/* Invoices View */}
      {subView === 'invoices' && (
        <>
          {transactions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
                borderRadius: '12px',
                border: '1px dashed var(--color-outline, #e6e6e6)',
              }}
            >
              <div style={{ color: 'var(--color-on-surface-variant, #4c4c4c)', marginBottom: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-on-surface, #191919)' }}>
                No invoices recorded yet
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
                Once you subscribe to Pro or make a purchase, all formal receipts will appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--color-outline, #e6e6e6)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface-container-high, #ebebeb)', borderBottom: '1px solid var(--color-outline, #e6e6e6)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Invoice</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const invoiceNum = `INV-${new Date(tx.createdAt).getFullYear()}-${tx.id.slice(-6).toUpperCase()}`;
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-outline-variant, #f0f0f0)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-on-surface, #191919)' }}>
                          {invoiceNum}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
                          {formatDate(tx.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status="PAID" />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
                          {tx.amountMinor != null ? formatNaira(tx.amountMinor) : '₦0'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <a
                            href={`/api/billing/invoice/${tx.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--color-primary-container, #ccd8ff)',
                              color: 'var(--color-on-primary-container, #002499)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            View Receipt
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Gateway Audit Logs View */}
      {subView === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paymentLogs.length === 0 ? (
            <p style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '32px 0' }}>
              No audit logs recorded.
            </p>
          ) : (
            paymentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-outline, #e6e6e6)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-on-surface, #191919)' }}>
                    {log.event.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant, #4c4c4c)', marginTop: '2px' }}>
                    {log.provider} · {formatDate(log.createdAt)} {log.reference && `· Ref: ${log.reference}`}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={log.status} />
                  {log.amountMinor != null && (
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '2px' }}>
                      {formatNaira(log.amountMinor)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
