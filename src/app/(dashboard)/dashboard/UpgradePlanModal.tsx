"use client";

import { useState } from "react";
import { config } from "@/config";
import { formatNaira } from "@/lib/formatNaira";

type BillingInterval = "MONTHLY" | "YEARLY";
type CurrentPlan = "FREE" | "PRO";

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: CurrentPlan;
  currentInterval?: BillingInterval | null;
}

interface ComparisonRow {
  label: string;
  free: string | false;
  pro: string | true;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Pages transcribed / month",
    free: `${config.limits.free.monthlyImages}`,
    pro: `${config.limits.pro.monthlyImages}`,
  },
  {
    label: "Pages per book",
    free: `${config.limits.free.perBookImages}`,
    pro: `${config.limits.pro.perBookImages}`,
  },
  {
    label: "Books you can create",
    free: `${config.limits.free.maxBooks}`,
    pro: true,
  },
  {
    label: "Watermark-free PDF export",
    free: false,
    pro: true,
  },
];

export default function UpgradePlanModal({
  isOpen,
  onClose,
  currentPlan = "FREE",
  currentInterval = null,
}: UpgradePlanModalProps) {
  const [loadingInterval, setLoadingInterval] = useState<BillingInterval | null>(null);
  const [hoveredInterval, setHoveredInterval] = useState<BillingInterval | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthlyPrice = config.billing.pro.monthlyPrice;
  const yearlyPrice = config.billing.pro.yearlyPrice;
  const savingsPct = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  const yearlyEffectiveMonthly = Math.round(yearlyPrice / 12);

  const isCurrentMonthly = currentPlan === "PRO" && currentInterval === "MONTHLY";
  const isCurrentYearly = currentPlan === "PRO" && currentInterval === "YEARLY";

  const handleUpgrade = async (interval: BillingInterval) => {
    setLoadingInterval(interval);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = (await res.json().catch(() => null)) as { link?: string; error?: string } | null;

      if (!res.ok || !data?.link) {
        setError(data?.error ?? "Could not start checkout. Please try again.");
        return;
      }

      // Hand off to Flutterwave's hosted checkout page.
      window.location.href = data.link;
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoadingInterval(null);
    }
  };

  const renderComparisonValue = (value: string | boolean, isProColumn: boolean) => {
    if (typeof value === "string") {
      return (
        <span style={{ fontWeight: isProColumn ? 600 : 400 }}>{value}</span>
      );
    }
    if (value === true || isProColumn) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Included"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    }
    return (
      <span aria-label="Not included" style={{ color: "var(--color-outline)" }}>
        —
      </span>
    );
  };

  const ctaButtonStyle = (interval: BillingInterval, isCurrent: boolean): React.CSSProperties => {
    if (isCurrent) {
      return {
        marginTop: "auto",
        width: "100%",
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid var(--color-outline)",
        backgroundColor: "var(--color-surface-variant)",
        color: "var(--color-on-surface-variant)",
        fontFamily: "var(--typography-label-large-fontfamily)",
        fontSize: "var(--typography-label-large-fontsize)",
        fontWeight: "600",
        cursor: "default",
        opacity: 0.85,
      };
    }

    return {
      marginTop: "auto",
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: interval === "YEARLY" ? "none" : "1px solid var(--color-primary)",
      backgroundColor:
        interval === "YEARLY"
          ? hoveredInterval === "YEARLY"
            ? "color-mix(in srgb, var(--color-primary) 82%, var(--color-on-surface))"
            : "var(--color-primary)"
          : hoveredInterval === "MONTHLY"
          ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
          : "transparent",
      color: interval === "YEARLY" ? "var(--color-on-primary)" : "var(--color-primary)",
      fontFamily: "var(--typography-label-large-fontfamily)",
      fontSize: "var(--typography-label-large-fontsize)",
      fontWeight: "600",
      cursor: loadingInterval ? "not-allowed" : "pointer",
      opacity: loadingInterval ? 0.65 : 1,
      transition: "background-color 0.15s ease",
    };
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Pro"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "var(--color-surface)",
          borderRadius: "16px",
          border: "1px solid var(--color-outline)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.22)",
          padding: "24px",
          boxSizing: "border-box",
          animation: "fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <style jsx global>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--typography-title-large-fontfamily)",
                fontSize: "var(--typography-title-large-fontsize)",
                fontWeight: "600",
                color: "var(--color-on-surface)",
                margin: 0,
              }}
            >
              Upgrade to Pro
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "var(--color-on-surface-variant)",
              }}
            >
              {currentPlan === "PRO" ? (
                <>
                  You&apos;re on <strong style={{ fontWeight: 600 }}>Pro ({currentInterval === "YEARLY" ? "Yearly" : "Monthly"})</strong> — thanks for supporting NotesBook. You can switch your billing below.
                </>
              ) : (
                <>You&apos;re currently on the Free plan.</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "var(--color-surface-container-high)",
              border: "1px solid var(--color-outline)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-on-surface)",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            ✕
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 12px",
              backgroundColor: "var(--color-error-container)",
              color: "var(--color-on-error-container)",
              borderRadius: "8px",
              fontSize: "13px",
              marginTop: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* FREE vs PRO comparison */}
        <div
          style={{
            marginTop: "18px",
            border: "1px solid var(--color-outline)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 72px 72px",
              alignItems: "center",
              padding: "10px 14px",
              backgroundColor: "var(--color-surface-container-high)",
              borderBottom: "1px solid var(--color-outline-variant)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--color-on-surface-variant)",
              }}
            >
              Compare plans
            </span>
            <span
              style={{
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--color-on-surface-variant)",
              }}
            >
              Free
            </span>
            <span
              style={{
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--color-primary)",
              }}
            >
              Pro
            </span>
          </div>

          {/* Feature rows */}
          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.label}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 72px 72px",
                alignItems: "center",
                padding: "9px 14px",
                borderBottom: "1px solid var(--color-outline-variant)",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--color-on-surface)" }}>
                {row.label}
              </span>
              <span style={{ textAlign: "center", fontSize: "13px", color: "var(--color-on-surface-variant)" }}>
                {renderComparisonValue(row.free, false)}
              </span>
              <span
                style={{
                  textAlign: "center",
                  fontSize: "13px",
                  color: "var(--color-primary)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {renderComparisonValue(row.pro, true)}
              </span>
            </div>
          ))}
        </div>

        {/* Billing options */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginTop: "18px",
          }}
        >
          {/* Monthly */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "16px",
              borderRadius: "12px",
              border: isCurrentMonthly ? "2px solid var(--color-primary)" : "1px solid var(--color-outline)",
              backgroundColor: isCurrentMonthly ? "color-mix(in srgb, var(--color-primary) 4%, var(--color-surface))" : "transparent",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--color-on-surface-variant)",
                  backgroundColor: "var(--color-surface-variant)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                Monthly
              </span>
              {isCurrentMonthly && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--color-primary)",
                    backgroundColor: "var(--color-primary-container)",
                    padding: "3px 8px",
                    borderRadius: "999px",
                  }}
                >
                  Current Plan
                </span>
              )}
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--typography-headline-large-fontfamily)",
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "var(--color-on-surface)",
                }}
              >
                {formatNaira(monthlyPrice)}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-on-surface-variant)" }}>
                {" "}
                / month
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleUpgrade("MONTHLY")}
              onMouseEnter={() => setHoveredInterval("MONTHLY")}
              onMouseLeave={() => setHoveredInterval(null)}
              disabled={loadingInterval !== null || isCurrentMonthly}
              style={ctaButtonStyle("MONTHLY", isCurrentMonthly)}
            >
              {loadingInterval === "MONTHLY"
                ? "Redirecting…"
                : isCurrentMonthly
                ? "Current Plan"
                : currentPlan === "PRO"
                ? "Switch to Monthly"
                : "Choose Monthly"}
            </button>
          </div>

          {/* Yearly */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "16px",
              borderRadius: "12px",
              border: isCurrentYearly ? "2px solid var(--color-primary)" : "2px solid var(--color-primary)",
              backgroundColor: isCurrentYearly ? "color-mix(in srgb, var(--color-primary) 4%, var(--color-surface))" : "transparent",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  position: "absolute",
                  top: "-11px",
                  right: "12px",
                  whiteSpace: "nowrap",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  fontSize: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "3px 10px",
                  borderRadius: "999px",
                }}
              >
                Save {savingsPct}%
              </span>
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-primary-container)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                Yearly
              </span>
              {isCurrentYearly && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--color-primary)",
                    backgroundColor: "var(--color-primary-container)",
                    padding: "3px 8px",
                    borderRadius: "999px",
                  }}
                >
                  Current Plan
                </span>
              )}
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--typography-headline-large-fontfamily)",
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "var(--color-on-surface)",
                }}
              >
                {formatNaira(yearlyPrice)}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-on-surface-variant)" }}>
                {" "}
                / year
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-on-surface-variant)" }}>
              ≈ {formatNaira(yearlyEffectiveMonthly)}/month
            </p>
            <button
              type="button"
              onClick={() => void handleUpgrade("YEARLY")}
              onMouseEnter={() => setHoveredInterval("YEARLY")}
              onMouseLeave={() => setHoveredInterval(null)}
              disabled={loadingInterval !== null || isCurrentYearly}
              style={ctaButtonStyle("YEARLY", isCurrentYearly)}
            >
              {loadingInterval === "YEARLY"
                ? "Redirecting…"
                : isCurrentYearly
                ? "Current Plan"
                : currentPlan === "PRO"
                ? "Upgrade to Yearly"
                : "Choose Yearly"}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            margin: "14px 0 0",
            textAlign: "center",
            fontSize: "11px",
            color: "var(--color-on-surface-variant)",
          }}
        >
          Prices in Nigerian Naira. Secure checkout via Flutterwave.
        </p>
      </div>
    </div>
  );
}

