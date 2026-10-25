'use client';

import React, { useState } from 'react';
import UpgradePlanModal from './dashboard/UpgradePlanModal';

export type CurrentPlan = 'FREE' | 'PRO';
export type BillingInterval = 'MONTHLY' | 'YEARLY';

interface UpgradePlanButtonProps {
  currentPlan?: CurrentPlan;
  currentInterval?: BillingInterval | null;
}

export default function UpgradePlanButton({
  currentPlan = 'FREE',
  currentInterval = null,
}: UpgradePlanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActivePro = currentPlan === 'PRO';

  return (
    <>
      <button
        type='button'
        id="dashboard-upgrade-plan-btn"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
          backgroundColor: hasActivePro ? 'var(--color-primary-container, #ccd8ff)' : 'var(--color-primary, #0741ff)',
          color: hasActivePro ? 'var(--color-on-primary-container, #002499)' : 'var(--color-on-primary)',
          borderRadius: 'calc(var(--spacing-collection-small-spacing) * 1px)',
          padding: 'calc(var(--spacing-collection-extra-small-spacing) * 2px) calc(var(--spacing-collection-medium-spacing) * 1px)',
          border: hasActivePro ? '1px solid var(--color-outline)' : 'none',
          fontFamily: 'var(--typography-label-large-fontfamily)',
          fontSize: 'var(--typography-label-large-fontsize)',
          fontWeight: '600',
          textDecoration: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.15s ease',
        }}
      >
        {hasActivePro ? 'Pro Plan' : 'Upgrade Plan'}
      </button>

      <UpgradePlanModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentPlan={currentPlan}
        currentInterval={currentInterval}
      />
    </>
  );
}



