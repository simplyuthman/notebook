'use client';

import React, { useState } from 'react';
import { BillingData, BillingTab } from './types';
import StatusAlertBanner from './StatusAlertBanner';
import { formatNaira } from '@/lib/formatNaira';

interface BillingOverviewProps {
  data: BillingData;
  onNavigateTab: (tab: BillingTab) => void;
  onReactivate: () => Promise<void>;
  onStartCancellation: () => void;
  actionLoading: boolean;
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
  const getBadgeConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'var(--color-success-container)', text: 'var(--color-on-success-container)', label: 'Active' };
      case 'TRIAL':
        return { bg: 'var(--color-info-container)', text: 'var(--color-on-info-container)', label: 'Trial Period' };
      case 'CANCELED':
        return { bg: 'var(--color-warning-container)', text: 'var(--color-on-warning-container)', label: 'Cancellation Scheduled' };
      case 'PAST_DUE':
      case 'PAYMENT_FAILED':
        return { bg: 'var(--color-error-container)', text: 'var(--color-on-error-container)', label: 'Payment Action Required' };
      case 'EXPIRED':
        return { bg: 'var(--color-neutral-container)', text: 'var(--color-on-neutral-container)', label: 'Expired' };
      default:
        return { bg: 'var(--color-neutral-container)', text: 'var(--color-on-neutral-container)', label: 'Free Plan' };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: config.bg,
        color: config.text,
        letterSpacing: '0.02em',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.text,
        }}
      />
      {config.label}
    </span>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isHigh = pct >= 80;

  return (
    <div style={{ marginBottom: '14px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8125rem',
          marginBottom: '6px',
        }}
      >
        <span style={{ color: 'var(--color-on-surface, #191919)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--color-on-surface-variant, #4c4c4c)', fontWeight: 600 }}>
          {used} / {limit === 9999 ? 'Unlimited' : limit} {unit}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--color-outline-variant, #e0e0e0)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${limit === 9999 ? 10 : pct}%`,
            height: '100%',
            backgroundColor: isHigh ? 'var(--color-error, #cc0000)' : 'var(--color-primary, #0741ff)',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function BillingOverview({
  data,
  onNavigateTab,
  onReactivate,
  onStartCancellation,
  actionLoading,
}: BillingOverviewProps) {
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const isPro = data.plan === 'PRO';
  const isCanceled = data.status === 'CANCELED';

  return (
    <div>
      <StatusAlertBanner
        status={data.status}
        hasRecentFailure={data.hasRecentPaymentFailure}
        currentPeriodEnd={data.currentPeriodEnd}
        onFixPayment={() => onNavigateTab('payment-method')}
        onResumeSubscription={() => setShowReactivateConfirm(true)}
      />

      {/* Main Plan Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
          borderRadius: '14px',
          border: '1px solid var(--color-outline, #e6e6e6)',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--color-on-surface, #191919)',
                }}
              >
                NotesBook {isPro ? 'Pro' : 'Free'}
              </span>
              <StatusBadge status={data.status} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--color-on-surface-variant, #4c4c4c)',
              }}
            >
              {isPro
                ? `Billed ${data.interval === 'YEARLY' ? 'Yearly' : 'Monthly'}`
                : 'Basic student plan with essential digitization features'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: isPro ? 'var(--color-primary, #0741ff)' : 'var(--color-on-surface, #191919)',
              }}
            >
              {data.priceMinor != null ? formatNaira(data.priceMinor) : '₦0'}
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 400,
                  color: 'var(--color-on-surface-variant, #4c4c4c)',
                }}
              >
                {data.interval === 'YEARLY' ? ' / year' : isPro ? ' / month' : ' / forever'}
              </span>
            </div>
            {data.currentPeriodEnd && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-on-surface-variant, #4c4c4c)',
                  marginTop: '2px',
                }}
              >
                {isCanceled ? 'Access ends: ' : 'Next renewal: '}
                <strong>{formatDate(data.currentPeriodEnd)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-outline-variant, #e0e0e0)',
          }}
        >
          <button
            type="button"
            onClick={() => onNavigateTab('plans')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary, #0741ff)',
              color: 'var(--color-on-primary)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {isPro ? 'Change Plan / Billing Cycle' : 'Upgrade to Pro'}
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('invoices')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--color-on-surface, #191919)',
              border: '1px solid var(--color-outline, #e6e6e6)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            View Invoices
          </button>
        </div>
      </div>

      {/* Plan Usage & Limits Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
            borderRadius: '12px',
            border: '1px solid var(--color-outline, #e6e6e6)',
            padding: '18px',
          }}
        >
          <h4
            style={{
              margin: '0 0 14px',
              fontSize: '0.875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-on-surface-variant, #4c4c4c)',
            }}
          >
            Monthly Usage
          </h4>
          <UsageMeter
            label="Pages Transcribed this month"
            used={data.usage.imagesThisMonth}
            limit={data.usage.imagesLimit}
            unit="pages"
          />
          <UsageMeter
            label="Total Books Created"
            used={data.usage.booksCount}
            limit={data.usage.booksLimit}
            unit="books"
          />
          <UsageMeter
            label="Max Pages in a Book"
            used={data.usage.maxBookImages}
            limit={data.usage.perBookLimit}
            unit="pages"
          />
        </div>

        {/* Payment Method Preview */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
            borderRadius: '12px',
            border: '1px solid var(--color-outline, #e6e6e6)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4
              style={{
                margin: '0 0 14px',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-on-surface-variant, #4c4c4c)',
              }}
            >
              Payment Method
            </h4>

            {data.paymentMethod.last4 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '26px',
                    borderRadius: '4px',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                  }}
                >
                  CARD
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    •••• •••• •••• {data.paymentMethod.last4}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
                    Expires {data.paymentMethod.expMonth}/{data.paymentMethod.expYear} · via {data.paymentMethod.provider}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
                No active card on file. Payments are initiated securely through Flutterwave.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('payment-method')}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: 'var(--color-primary, #0741ff)',
              border: '1px solid var(--color-primary, #0741ff)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Manage Payment Details →
          </button>
        </div>
      </div>

      {/* Subscription Lifecycle Actions */}
      <div
        style={{
          borderTop: '1px solid var(--color-outline, #e6e6e6)',
          paddingTop: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface, #191919)' }}>
            Subscription Lifecycle
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
            {isCanceled
              ? 'Your plan is currently canceled. You can reactivate anytime before your period ends.'
              : isPro
              ? 'You can cancel your Pro plan at any time without losing immediate access.'
              : 'Upgrade to unlock high-capacity batch transcription and watermark-free PDF exports.'}
          </p>
        </div>

        {isCanceled ? (
          <button
            type="button"
            id="billing-overview-reactivate"
            onClick={onReactivate}
            disabled={actionLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary, #0741ff)',
              color: 'var(--color-on-primary)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {actionLoading ? 'Reactivating…' : 'Resume Pro Subscription'}
          </button>
        ) : isPro ? (
          <button
            type="button"
            id="billing-overview-cancel"
            onClick={onStartCancellation}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--color-error, #cc0000)',
              border: '1px solid var(--color-error, #cc0000)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel Subscription
          </button>
        ) : null}
      </div>
    </div>
  );
}
