'use client';

import React from 'react';

interface BillingHeaderProps {
  onClose: () => void;
}

export default function BillingHeader({ onClose }: BillingHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--color-outline, #e6e6e6)',
        backgroundColor: 'var(--color-surface, #fafafa)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-container, #ccd8ff)',
              color: 'var(--color-on-primary-container, #002499)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </span>
          <h2
            id="billing-modal-title"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-on-surface, #191919)',
              fontFamily: 'var(--typography-title-large-fontfamily, inherit)',
            }}
          >
            Billing &amp; Subscription
          </h2>
        </div>
        <p
          style={{
            margin: '4px 0 0 36px',
            fontSize: '0.8125rem',
            color: 'var(--color-on-surface-variant, #4c4c4c)',
            fontFamily: 'var(--typography-body-small-fontfamily, inherit)',
          }}
        >
          Manage your subscription, payment method, invoices, and billing preferences.
        </p>
      </div>

      <button
        id="billing-modal-close"
        type="button"
        onClick={onClose}
        aria-label="Close billing dialog"
        style={{
          background: 'var(--color-surface-container-high, #ebebeb)',
          border: '1px solid var(--color-outline, #e6e6e6)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-on-surface, #191919)',
          fontSize: '1.125rem',
          fontWeight: '600',
          transition: 'background-color 0.15s ease, transform 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-variant, #e6e6e6)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-container-high, #ebebeb)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ✕
      </button>
    </div>
  );
}
