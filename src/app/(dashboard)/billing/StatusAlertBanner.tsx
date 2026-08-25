'use client';

import React from 'react';
import { SubscriptionStatus } from './types';

interface StatusAlertBannerProps {
  status: SubscriptionStatus;
  hasRecentFailure?: boolean;
  currentPeriodEnd?: string | null;
  onFixPayment?: () => void;
  onResumeSubscription?: () => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'the end of your billing cycle';
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

export default function StatusAlertBanner({
  status,
  hasRecentFailure,
  currentPeriodEnd,
  onFixPayment,
  onResumeSubscription,
}: StatusAlertBannerProps) {
  if (status === 'ACTIVE' && !hasRecentFailure) {
    return null;
  }

  if (hasRecentFailure || status === 'PAYMENT_FAILED' || status === 'PAST_DUE') {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '10px',
          color: '#991b1b',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Payment Action Required</div>
            <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
              Your latest payment could not be processed. Update your payment method to prevent interruption of your subscription.
            </div>
          </div>
        </div>

        {onFixPayment && (
          <button
            type="button"
            onClick={onFixPayment}
            style={{
              padding: '6px 12px',
              backgroundColor: '#991b1b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Update Payment Method
          </button>
        )}
      </div>
    );
  }

  if (status === 'CANCELED') {
    return (
      <div
        role="status"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '10px',
          color: '#92400e',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Cancellation Scheduled</div>
            <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
              Your Pro benefits remain active until {formatDate(currentPeriodEnd)}. After this date, your account will move to the Free plan.
            </div>
          </div>
        </div>

        {onResumeSubscription && (
          <button
            type="button"
            onClick={onResumeSubscription}
            style={{
              padding: '6px 12px',
              backgroundColor: '#b45309',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Resume Subscription
          </button>
        )}
      </div>
    );
  }

  return null;
}
