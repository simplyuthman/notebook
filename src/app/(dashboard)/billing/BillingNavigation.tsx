'use client';

import React from 'react';
import { BillingTab } from './types';

interface BillingNavigationProps {
  activeTab: BillingTab;
  onSelectTab: (tab: BillingTab) => void;
  hasPaymentIssue?: boolean;
}

interface NavItem {
  id: BillingTab;
  label: string;
  badge?: string;
  badgeType?: 'danger' | 'info';
}

export default function BillingNavigation({
  activeTab,
  onSelectTab,
  hasPaymentIssue,
}: BillingNavigationProps) {
  const tabs: NavItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans', label: 'Manage Plan' },
    {
      id: 'payment-method',
      label: 'Payment Method',
      badge: hasPaymentIssue ? 'Action Required' : undefined,
      badgeType: 'danger',
    },
    { id: 'billing-info', label: 'Billing Details' },
    { id: 'invoices', label: 'Invoices & History' },
  ];

  return (
    <div
      style={{
        width: '100%',
        borderBottom: '1px solid var(--color-outline, #e6e6e6)',
        backgroundColor: 'var(--color-surface, #fafafa)',
        position: 'relative',
      }}
    >
      <nav
        role="tablist"
        aria-label="Billing navigation tabs"
        style={{
          display: 'flex',
          gap: '4px',
          padding: '0 16px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`billing-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`billing-panel-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              style={{
                padding: '12px 10px',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-primary, #0741ff)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--color-primary, #0741ff)' : 'var(--color-on-surface-variant, #4c4c4c)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                transition: 'color 0.15s ease, border-color 0.15s ease',
                fontFamily: 'var(--typography-body-medium-fontfamily)',
              }}
            >
              {tab.label}
              {tab.badge && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '999px',
                    backgroundColor: tab.badgeType === 'danger' ? 'var(--color-error-container)' : 'var(--color-info-container)',
                    color: tab.badgeType === 'danger' ? 'var(--color-on-error-container)' : 'var(--color-on-info-container)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
