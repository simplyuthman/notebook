'use client';

import React, { useState } from 'react';
import { config } from '@/config';
import { formatNaira } from '@/lib/formatNaira';
import ConfirmationModal from './ConfirmationModal';
import { SubscriptionStatus } from './types';

interface PlanManagementProps {
  currentPlan: 'FREE' | 'PRO';
  currentInterval: 'MONTHLY' | 'YEARLY' | null;
  currentPeriodEnd?: string | null;
  status?: SubscriptionStatus;
  onUpgrade: (interval: 'MONTHLY' | 'YEARLY') => Promise<void>;
  actionLoading: boolean;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function calculateProjectedEndDate(currentEnd: string | null | undefined, interval: 'MONTHLY' | 'YEARLY'): string {
  const base = currentEnd && new Date(currentEnd) > new Date() ? new Date(currentEnd) : new Date();
  const next = new Date(base);
  if (interval === 'YEARLY') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return formatDate(next.toISOString());
}

export default function PlanManagement({
  currentPlan,
  currentInterval,
  currentPeriodEnd,
  status = 'ACTIVE',
  onUpgrade,
  actionLoading,
}: PlanManagementProps) {
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [pendingChangeInterval, setPendingChangeInterval] = useState<'MONTHLY' | 'YEARLY' | null>(null);

  const monthlyPrice = config.billing.pro.monthlyPrice;
  const yearlyPrice = config.billing.pro.yearlyPrice;
  const savingsPct = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  const yearlyEffectiveMonthly = Math.round(yearlyPrice / 12);

  const hasActiveSubscription = currentPlan === 'PRO' && status === 'ACTIVE' && Boolean(currentPeriodEnd && new Date(currentPeriodEnd) > new Date());
  const isCurrentMonthly = hasActiveSubscription && currentInterval === 'MONTHLY';
  const isCurrentYearly = hasActiveSubscription && currentInterval === 'YEARLY';

  const formattedCurrentPeriodEnd = formatDate(currentPeriodEnd);

  const handleOpenConfirm = (interval: 'MONTHLY' | 'YEARLY') => {
    setPendingChangeInterval(interval);
  };

  const handleConfirmPlanChange = async () => {
    if (!pendingChangeInterval) return;
    const interval = pendingChangeInterval;
    setPendingChangeInterval(null);
    await onUpgrade(interval);
  };

  const comparisonRows = [
    {
      label: 'Monthly Handwritten Pages',
      free: `${config.limits.free.monthlyImages} pages / mo`,
      pro: `${config.limits.pro.monthlyImages} pages / mo`,
    },
    {
      label: 'Max Pages per Book',
      free: `${config.limits.free.perBookImages} pages`,
      pro: `${config.limits.pro.perBookImages} pages`,
    },
    {
      label: 'Book Limit',
      free: `${config.limits.free.maxBooks} books maximum`,
      pro: 'Unlimited books',
    },
    {
      label: 'Export to PDF',
      free: 'Standard (with watermark)',
      pro: 'Watermark-free export',
    },
    {
      label: 'AI Model Vision OCR',
      free: 'Full access',
      pro: 'Full access + Priority Queue',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
          Manage Subscription Plan
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
          Choose the right plan and billing frequency for your studies. Upgrade or switch intervals anytime.
        </p>
      </div>

      {/* Active Proration & Double-Charge Protection Banner */}
      {hasActiveSubscription && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-surface-container-high, #f0f4ff)',
            border: '1px solid var(--color-outline-variant, #ccd8ff)',
            borderRadius: '10px',
            marginBottom: '24px',
            color: 'var(--color-on-surface, #191919)',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontSize: '1.125rem', lineHeight: 1 }}>🛡️</div>
          <div>
            <strong style={{ color: 'var(--color-primary, #0741ff)', display: 'block', marginBottom: '2px' }}>
              Active Subscription Protection & Proration
            </strong>
            Your current Pro subscription is active until <strong>{formattedCurrentPeriodEnd}</strong>. When you switch or renew, your new subscription duration is <strong>additively extended</strong> onto your existing period so no paid days are lost.
          </div>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Free Plan Card */}
        <div
          style={{
            borderRadius: '12px',
            border: currentPlan === 'FREE' ? '2px solid var(--color-primary, #0741ff)' : '1px solid var(--color-outline, #e6e6e6)',
            backgroundColor: currentPlan === 'FREE' ? 'color-mix(in srgb, var(--color-primary) 3%, var(--color-surface))' : 'var(--color-surface-container-low, #f5f5f5)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
              Free Plan
            </span>
            {currentPlan === 'FREE' && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-primary-container, #ccd8ff)',
                  color: 'var(--color-on-primary-container, #002499)',
                }}
              >
                Current Plan
              </span>
            )}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-on-surface, #191919)', marginBottom: '8px' }}>
            ₦0
            <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-on-surface-variant, #4c4c4c)' }}> / forever</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant, #4c4c4c)', marginBottom: '20px' }}>
            Ideal for getting started with single lectures and small note sets.
          </p>

          <ul style={{ margin: '0 0 24px', paddingLeft: '18px', fontSize: '0.8125rem', color: 'var(--color-on-surface, #191919)', lineHeight: 1.8 }}>
            <li>{config.limits.free.monthlyImages} pages / month</li>
            <li>Up to {config.limits.free.maxBooks} digital books</li>
            <li>Max {config.limits.free.perBookImages} pages per book</li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            <button
              type="button"
              disabled
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--color-outline, #e6e6e6)',
                backgroundColor: 'var(--color-surface-variant, #e6e6e6)',
                color: 'var(--color-on-surface-variant, #4c4c4c)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'default',
              }}
            >
              {currentPlan === 'FREE' ? 'Active' : 'Basic Tier'}
            </button>
          </div>
        </div>

        {/* Pro Monthly Card */}
        <div
          style={{
            borderRadius: '12px',
            border: isCurrentMonthly ? '2px solid var(--color-primary, #0741ff)' : '1px solid var(--color-outline, #e6e6e6)',
            backgroundColor: isCurrentMonthly ? 'color-mix(in srgb, var(--color-primary) 3%, var(--color-surface))' : 'var(--color-surface-container-low, #f5f5f5)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary, #0741ff)' }}>
              Pro Monthly
            </span>
            {isCurrentMonthly && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-primary-container, #ccd8ff)',
                  color: 'var(--color-on-primary-container, #002499)',
                }}
              >
                Current Plan
              </span>
            )}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-on-surface, #191919)', marginBottom: '8px' }}>
            {formatNaira(monthlyPrice)}
            <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-on-surface-variant, #4c4c4c)' }}> / month</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant, #4c4c4c)', marginBottom: '20px' }}>
            Month-to-month flexibility for active university terms.
          </p>

          <ul style={{ margin: '0 0 24px', paddingLeft: '18px', fontSize: '0.8125rem', color: 'var(--color-on-surface, #191919)', lineHeight: 1.8 }}>
            <li><strong>150 pages</strong> / month</li>
            <li><strong>Unlimited</strong> digital books</li>
            <li>Up to 300 pages per book</li>
            <li>Watermark-free PDF export</li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            <button
              type="button"
              id="plan-choose-monthly"
              onClick={() => handleOpenConfirm('MONTHLY')}
              disabled={actionLoading || isCurrentMonthly}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--color-primary, #0741ff)',
                backgroundColor: isCurrentMonthly ? 'transparent' : 'var(--color-primary, #0741ff)',
                color: isCurrentMonthly ? 'var(--color-primary, #0741ff)' : '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isCurrentMonthly ? 'default' : 'pointer',
              }}
            >
              {isCurrentMonthly ? 'Current Plan' : currentPlan === 'PRO' ? 'Switch to Monthly' : 'Upgrade to Monthly'}
            </button>
          </div>
        </div>

        {/* Pro Yearly Card */}
        <div
          style={{
            position: 'relative',
            borderRadius: '12px',
            border: '2px solid var(--color-primary, #0741ff)',
            backgroundColor: isCurrentYearly ? 'color-mix(in srgb, var(--color-primary) 4%, var(--color-surface))' : 'var(--color-surface-container-low, #f5f5f5)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(7, 65, 255, 0.1)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              right: '16px',
              backgroundColor: 'var(--color-primary, #0741ff)',
              color: '#ffffff',
              fontSize: '0.6875rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Save {savingsPct}%
          </span>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-on-surface, #191919)' }}>
              Pro Yearly
            </span>
            {isCurrentYearly && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-primary-container, #ccd8ff)',
                  color: 'var(--color-on-primary-container, #002499)',
                }}
              >
                Current Plan
              </span>
            )}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-on-surface, #191919)', marginBottom: '4px' }}>
            {formatNaira(yearlyPrice)}
            <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-on-surface-variant, #4c4c4c)' }}> / year</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary, #0741ff)', fontWeight: 600, marginBottom: '8px' }}>
            {formatNaira(yearlyEffectiveMonthly)} / month equivalent
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant, #4c4c4c)', marginBottom: '20px' }}>
            Best value for full academic years with continuous access.
          </p>

          <ul style={{ margin: '0 0 24px', paddingLeft: '18px', fontSize: '0.8125rem', color: 'var(--color-on-surface, #191919)', lineHeight: 1.8 }}>
            <li><strong>150 pages</strong> / month</li>
            <li><strong>Unlimited</strong> digital books</li>
            <li>Up to 300 pages per book</li>
            <li>Watermark-free PDF export</li>
            <li>Priority model OCR queue</li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            <button
              type="button"
              id="plan-choose-yearly"
              onClick={() => handleOpenConfirm('YEARLY')}
              disabled={actionLoading || isCurrentYearly}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isCurrentYearly ? 'var(--color-surface-variant, #e6e6e6)' : 'var(--color-primary, #0741ff)',
                color: isCurrentYearly ? 'var(--color-on-surface-variant, #4c4c4c)' : '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isCurrentYearly ? 'default' : 'pointer',
              }}
            >
              {isCurrentYearly ? 'Current Plan' : currentPlan === 'PRO' ? 'Switch to Yearly' : 'Upgrade to Yearly'}
            </button>
          </div>
        </div>
      </div>

      {/* Plan Details Comparison Table */}
      <div
        style={{
          border: '1px solid var(--color-outline, #e6e6e6)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-surface-container-high, #ebebeb)',
            borderBottom: '1px solid var(--color-outline, #e6e6e6)',
            fontWeight: 700,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--color-on-surface-variant, #4c4c4c)',
          }}
        >
          Detailed Plan Comparison
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-outline, #e6e6e6)' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--color-on-surface-variant)' }}>Feature</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', width: '30%', color: 'var(--color-on-surface-variant)' }}>Free</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', width: '30%', color: 'var(--color-primary, #0741ff)' }}>Pro</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < comparisonRows.length - 1 ? '1px solid var(--color-outline-variant, #f0f0f0)' : 'none' }}>
                <td style={{ padding: '10px 16px', color: 'var(--color-on-surface, #191919)', fontWeight: 500 }}>{row.label}</td>
                <td style={{ padding: '10px 16px', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>{row.free}</td>
                <td style={{ padding: '10px 16px', color: 'var(--color-on-surface, #191919)', fontWeight: 600 }}>{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Step Before Payment / Upgrade */}
      <ConfirmationModal
        isOpen={pendingChangeInterval !== null}
        title={currentPlan === 'PRO' ? `Switch to Pro ${pendingChangeInterval === 'YEARLY' ? 'Yearly' : 'Monthly'}?` : `Upgrade to Pro ${pendingChangeInterval === 'YEARLY' ? 'Yearly' : 'Monthly'}?`}
        description={
          <div>
            <p style={{ margin: '0 0 10px' }}>
              You are selecting <strong>NotesBook Pro ({pendingChangeInterval === 'YEARLY' ? 'Yearly' : 'Monthly'})</strong> for{' '}
              <strong style={{ color: 'var(--color-primary, #0741ff)' }}>
                {pendingChangeInterval === 'YEARLY' ? formatNaira(yearlyPrice) : formatNaira(monthlyPrice)}
              </strong>
              .
            </p>
            {hasActiveSubscription && pendingChangeInterval && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-container-high, #f5f5f5)',
                  border: '1px solid var(--color-outline, #e6e6e6)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-primary, #0741ff)', marginBottom: '2px' }}>
                  📅 Additive Extension (No Double-Charge)
                </div>
                Your active days through <strong>{formattedCurrentPeriodEnd}</strong> will not be lost. Your new {pendingChangeInterval === 'YEARLY' ? '1-year' : '1-month'} subscription will extend your access through <strong>{calculateProjectedEndDate(currentPeriodEnd, pendingChangeInterval)}</strong>.
              </div>
            )}
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-on-surface-variant, #4c4c4c)' }}>
              You will be redirected to Flutterwave to securely complete your payment.
            </p>
          </div>
        }
        confirmLabel={`Pay ${pendingChangeInterval === 'YEARLY' ? formatNaira(yearlyPrice) : formatNaira(monthlyPrice)}`}
        cancelLabel="Keep Current Plan"
        isLoading={actionLoading}
        onConfirm={handleConfirmPlanChange}
        onCancel={() => setPendingChangeInterval(null)}
      />
    </div>
  );
}
