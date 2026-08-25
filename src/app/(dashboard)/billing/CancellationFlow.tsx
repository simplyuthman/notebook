'use client';

import React, { useState } from 'react';
import { BillingData } from './types';

interface CancellationFlowProps {
  data: BillingData;
  onConfirmCancel: (reason: string) => Promise<void>;
  onAbort: () => void;
  isLoading: boolean;
}

const CANCELLATION_REASONS = [
  'Too expensive for my current budget',
  'Not using it enough this semester',
  'Missing features I need',
  'Encountered technical difficulties',
  'Switching to another method or tool',
  'Completed my university exams/coursework',
  'Other',
];

function formatDate(iso: string | null): string {
  if (!iso) return 'the end of your current period';
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

export default function CancellationFlow({
  data,
  onConfirmCancel,
  onAbort,
  isLoading,
}: CancellationFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [otherText, setOtherText] = useState<string>('');

  const finalReason = selectedReason === 'Other' && otherText.trim() ? `Other: ${otherText.trim()}` : selectedReason;

  const handleFinish = async () => {
    await onConfirmCancel(finalReason);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
        borderRadius: '14px',
        border: '1px solid var(--color-outline, #e6e6e6)',
        padding: '24px',
      }}
    >
      {/* ── Step 1: Warning & Consequences ── */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#991b1b' }}>
              Cancel Your Pro Subscription
            </h3>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface, #191919)', lineHeight: 1.6, marginBottom: '16px' }}>
            We're sorry to see you go! Before you proceed, please review what happens upon cancellation:
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-on-primary, #ffffff)',
              borderRadius: '10px',
              border: '1px solid var(--color-outline, #e6e6e6)',
              padding: '16px',
              marginBottom: '20px',
              fontSize: '0.8125rem',
              lineHeight: 1.7,
              color: 'var(--color-on-surface, #191919)',
            }}
          >
            <div>✓ <strong>You will retain full Pro access</strong> until <strong>{formatDate(data.currentPeriodEnd)}</strong>.</div>
            <div>✓ <strong>No further recurring charges</strong> will be made to your payment method.</div>
            <div>✓ <strong>Your existing books and notes remain safe</strong> and accessible in your library.</div>
            <div>⚠ After your period ends, monthly upload limits will return to 30 pages and exported PDFs will include a watermark.</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onAbort}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-outline, #e6e6e6)',
                backgroundColor: 'transparent',
                color: 'var(--color-on-surface, #191919)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Keep Subscription
            </button>
            <button
              type="button"
              id="cancel-flow-next-1"
              onClick={() => setStep(2)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Continue with Cancellation →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Reason Survey ── */}
      {step === 2 && (
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
            Help us improve NotesBook
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
            Please let us know why you're cancelling so we can make the product better:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {CANCELLATION_REASONS.map((r) => (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: selectedReason === r ? 'var(--color-primary-container, #ccd8ff)' : 'var(--color-on-primary, #ffffff)',
                  border: selectedReason === r ? '1px solid var(--color-primary, #0741ff)' : '1px solid var(--color-outline, #e6e6e6)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--color-on-surface, #191919)',
                  fontWeight: selectedReason === r ? 600 : 400,
                }}
              >
                <input
                  type="radio"
                  name="cancellationReason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                />
                {r}
              </label>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Tell us a little more about your experience..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--color-outline, #e6e6e6)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                marginBottom: '16px',
                fontFamily: 'inherit',
              }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-outline, #e6e6e6)',
                backgroundColor: 'transparent',
                color: 'var(--color-on-surface, #191919)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              id="cancel-flow-next-2"
              onClick={() => setStep(3)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Continue to Final Step →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Final Confirmation ── */}
      {step === 3 && (
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
            Confirm Cancellation
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)', lineHeight: 1.5 }}>
            Are you sure you want to cancel your NotesBook Pro subscription? Your plan will not renew after <strong>{formatDate(data.currentPeriodEnd)}</strong>.
          </p>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '0.8125rem',
              marginBottom: '20px',
              fontWeight: 500,
            }}
          >
            Reason noted: &ldquo;{finalReason}&rdquo;
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onAbort}
              disabled={isLoading}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-outline, #e6e6e6)',
                backgroundColor: 'transparent',
                color: 'var(--color-on-surface, #191919)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Keep Subscription
            </button>

            <button
              type="button"
              id="cancel-flow-confirm-final"
              onClick={handleFinish}
              disabled={isLoading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Cancelling Subscription…' : 'Cancel Subscription'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
