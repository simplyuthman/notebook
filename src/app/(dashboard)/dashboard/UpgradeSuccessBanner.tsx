"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UpgradeSuccessBanner() {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Automatically disappear after 5 seconds and clean the URL
    const timer = setTimeout(() => {
      setDismissed(true);
      router.replace("/dashboard");
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [router]);

  if (dismissed) return null;

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          backgroundColor: "var(--color-surface-container-low, #f5f5f5)",
          color: "var(--color-on-surface, #191919)",
          border: "1px solid var(--color-outline, #e6e6e6)",
          borderRadius: "8px",
          fontFamily: "var(--typography-body-medium-fontfamily, sans-serif)",
          fontSize: "13px",
          fontWeight: "600",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--color-success)",
          }}
        />
        <span>Successfully upgraded to Pro!</span>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            router.replace("/dashboard");
          }}
          aria-label="Dismiss upgrade message"
          style={{
            background: "none",
            border: "none",
            color: "var(--color-on-surface-variant, #4c4c4c)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "700",
            padding: "0 0 0 4px",
            lineHeight: 1,
            opacity: 0.8,
          }}
        >
          ✕
        </button>
      </div>
    </>
  );
}

