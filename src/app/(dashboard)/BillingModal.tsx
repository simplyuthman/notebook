'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BillingData, BillingTab } from './billing/types';
import BillingHeader from './billing/BillingHeader';
import BillingNavigation from './billing/BillingNavigation';
import BillingOverview from './billing/BillingOverview';
import PlanManagement from './billing/PlanManagement';
import PaymentMethodSection from './billing/PaymentMethodSection';
import BillingInfoSection from './billing/BillingInfoSection';
import InvoiceHistorySection from './billing/InvoiceHistorySection';
import CancellationFlow from './billing/CancellationFlow';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: BillingTab;
}

export default function BillingModal({
  isOpen,
  onClose,
  initialTab = 'overview',
}: BillingModalProps) {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BillingTab>(initialTab);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/info');
      if (!res.ok) throw new Error('Failed to load billing details.');
      const json: BillingData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setActiveTab(initialTab);
      setActionMsg(null);
      setIsCancelling(false);
    }
  }, [isOpen, initialTab, fetchData]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Auto-dismiss action feedback messages after 5 seconds
  useEffect(() => {
    if (!actionMsg) return;
    const timer = setTimeout(() => {
      setActionMsg(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [actionMsg]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUpgrade = async (interval: 'MONTHLY' | 'YEARLY') => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.link) {
        throw new Error(resJson.error ?? 'Could not start checkout.');
      }
      // Redirect to Flutterwave hosted checkout
      window.location.href = resJson.link;
    } catch (e) {
      setActionMsg({ type: 'error', text: e instanceof Error ? e.message : 'Checkout failed.' });
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Cancellation failed.');
      setActionMsg({
        type: 'success',
        text: 'Your Pro subscription has been scheduled for cancellation. Benefits remain active until the end of your billing cycle.',
      });
      setIsCancelling(false);
      await fetchData();
    } catch (e) {
      setActionMsg({ type: 'error', text: e instanceof Error ? e.message : 'Cancellation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/billing/reactivate', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Reactivation failed.');
      setActionMsg({ type: 'success', text: 'Pro subscription resumed successfully!' });
      await fetchData();
    } catch (e) {
      setActionMsg({ type: 'error', text: e instanceof Error ? e.message : 'Reactivation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes billingModalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
      `}</style>

      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        aria-modal="true"
        role="dialog"
        aria-labelledby="billing-modal-title"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9000,
          padding: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-on-primary, #ffffff)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--color-outline, #e6e6e6)',
            overflow: 'hidden',
            animation: 'billingModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <BillingHeader onClose={onClose} />

          {/* Navigation Tabs */}
          <BillingNavigation
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setIsCancelling(false);
              setActionMsg(null);
            }}
            hasPaymentIssue={data?.hasRecentPaymentFailure || data?.status === 'PAYMENT_FAILED'}
          />

          {/* Body Content */}
          <div
            id={`billing-panel-${activeTab}`}
            role="tabpanel"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            {/* Loading State */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⏳</div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Loading billing details…</div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  borderRadius: '10px',
                  padding: '16px',
                  color: '#991b1b',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={fetchData}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #991b1b',
                    background: 'transparent',
                    color: '#991b1b',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Action Feedback Alerts */}
            {actionMsg && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  backgroundColor: actionMsg.type === 'success' ? 'var(--color-surface-container-low, #f5f5f5)' : '#fee2e2',
                  color: actionMsg.type === 'success' ? 'var(--color-on-surface, #191919)' : '#991b1b',
                  border: `1px solid ${actionMsg.type === 'success' ? 'var(--color-outline, #e6e6e6)' : '#f87171'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {actionMsg.type === 'success' && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span>{actionMsg.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionMsg(null)}
                  aria-label="Dismiss message"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-on-surface-variant, #4c4c4c)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0 4px',
                    fontSize: '14px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Main Tabs Router */}
            {!loading && !error && data && (
              <>
                {isCancelling ? (
                  <CancellationFlow
                    data={data}
                    onConfirmCancel={handleCancelConfirm}
                    onAbort={() => setIsCancelling(false)}
                    isLoading={actionLoading}
                  />
                ) : (
                  <>
                    {activeTab === 'overview' && (
                      <BillingOverview
                        data={data}
                        onNavigateTab={setActiveTab}
                        onReactivate={handleReactivate}
                        onStartCancellation={() => setIsCancelling(true)}
                        actionLoading={actionLoading}
                      />
                    )}

                    {activeTab === 'plans' && (
                      <PlanManagement
                        currentPlan={data.plan}
                        currentInterval={data.interval}
                        currentPeriodEnd={data.currentPeriodEnd}
                        status={data.status}
                        onUpgrade={handleUpgrade}
                        actionLoading={actionLoading}
                      />
                    )}

                    {activeTab === 'payment-method' && (
                      <PaymentMethodSection
                        paymentMethod={data.paymentMethod}
                        onUpgrade={handleUpgrade}
                        actionLoading={actionLoading}
                      />
                    )}

                    {activeTab === 'billing-info' && (
                      <BillingInfoSection
                        initialInfo={data.billingInfo}
                        onSaved={fetchData}
                      />
                    )}

                    {activeTab === 'invoices' && (
                      <InvoiceHistorySection
                        transactions={data.transactions}
                        paymentLogs={data.paymentLogs}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
