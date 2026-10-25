'use client';

import React, { useState } from 'react';
import { PaymentMethodInfo } from './types';
import ConfirmationModal from './ConfirmationModal';

interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethodInfo;
  onUpgrade: (interval: 'MONTHLY' | 'YEARLY') => Promise<void>;
  actionLoading: boolean;
}

export default function PaymentMethodSection({
  paymentMethod,
  onUpgrade,
  actionLoading,
}: PaymentMethodSectionProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
          Payment Method
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
          Manage your saved payment cards and payment gateway preferences via Flutterwave.
        </p>
      </div>

      {/* Payment Method Details Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
          borderRadius: '12px',
          border: '1px solid var(--color-outline, #e6e6e6)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '38px',
                borderRadius: '6px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              CARD
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
                  {paymentMethod.brand}
                </span>
                {paymentMethod.isDefault && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--color-primary-container, #ccd8ff)',
                      color: 'var(--color-on-primary-container, #002499)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)', marginTop: '2px' }}>
                {paymentMethod.last4 ? (
                  <>•••• •••• •••• {paymentMethod.last4} &nbsp;·&nbsp; Expires {paymentMethod.expMonth}/{paymentMethod.expYear}</>
                ) : (
                  <>Connected via {paymentMethod.provider} standard checkout</>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-outline, #e6e6e6)',
              backgroundColor: 'var(--color-surface-container-lowest, #ffffff)',
              color: 'var(--color-on-surface, #191919)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Update Payment Method
          </button>
        </div>
      </div>

      {/* Security notice */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'var(--color-surface, #fafafa)',
          border: '1px dashed var(--color-outline, #e6e6e6)',
          borderRadius: '10px',
          color: 'var(--color-on-surface-variant, #4c4c4c)',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--color-primary, #0741ff)' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div>
          <strong>PCI-DSS Compliant Security:</strong> NotesBook does not store full credit card numbers or security CVV codes on our servers. All financial transactions and payment method tokenizations are handled securely by Flutterwave in compliance with CBN and global banking security standards.
        </div>
      </div>

      {/* Update Card Flow Dialog */}
      <ConfirmationModal
        isOpen={showUpdateModal}
        title="Update Payment Method"
        description={
          <div>
            <p style={{ margin: '0 0 10px' }}>
              To securely update or replace your default payment card, you will be redirected to the Flutterwave verification portal.
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
              A small verification check may be authorized by your bank and reversed automatically.
            </p>
          </div>
        }
        confirmLabel="Continue to Flutterwave"
        cancelLabel="Cancel"
        isLoading={actionLoading}
        onConfirm={async () => {
          setShowUpdateModal(false);
          await onUpgrade('MONTHLY');
        }}
        onCancel={() => setShowUpdateModal(false)}
      />
    </div>
  );
}
