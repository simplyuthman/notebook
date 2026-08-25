"use client";

import { useState } from "react";
import BillingModal from "../BillingModal";

type CurrentPlan = "FREE" | "PRO";
type BillingInterval = "MONTHLY" | "YEARLY";

interface UpgradeBannerLinkProps {
  currentPlan?: CurrentPlan;
  currentInterval?: BillingInterval | null;
}

/**
 * Inline text-link trigger for the billing modal — used inside server-rendered
 * warning banners where modal state can't live.
 */
export default function UpgradeBannerLink({
  currentPlan = "FREE",
  currentInterval = null,
}: UpgradeBannerLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          color: "inherit",
          fontWeight: 700,
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        upgrade to Pro.
      </button>

      <BillingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTab="plans"
      />
    </>
  );
}


