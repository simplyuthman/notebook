"use client";

import { useState, useEffect } from "react";

interface ImageThumbnailProps {
  imageId: string;
  alt: string;
  /** "card" = fixed 220px tall grid thumbnail; "lightbox" = full-width modal preview */
  variant?: "card" | "lightbox";
}

/**
 * Fetches a short-lived signed GET URL from /api/images/[id] and renders
 * the actual note image. Falls back to a placeholder when storage is not
 * configured (dev mode) or loading fails.
 */
export default function ImageThumbnail({
  imageId,
  alt,
  variant = "card",
}: ImageThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadSignedUrl() {
      try {
        const res = await fetch(`/api/images/${imageId}`);
        if (!res.ok) throw new Error("Failed to fetch image URL");
        const data = (await res.json()) as { url: string | null; configured: boolean };
        if (cancelled) return;
        if (data.url) {
          setSrc(data.url);
          setStatus("ready");
        } else {
          setStatus("unavailable");
        }
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    }

    void loadSignedUrl();
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  if (variant === "lightbox") {
    return (
      <div
        style={{
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "var(--color-surface-container-high)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
          maxHeight: "400px",
        }}
      >
        {status === "loading" && (
          <span
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid var(--color-outline-variant)",
              borderTopColor: "var(--color-primary)",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
        )}
        {status === "ready" && src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
        {status === "unavailable" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "24px",
              color: "var(--color-on-surface-variant)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: "13px" }}>Preview not available</span>
          </div>
        )}
      </div>
    );
  }

  // --- card variant ---
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {status === "loading" && (
        <span
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid var(--color-outline-variant)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }}
        />
      )}
      {status === "ready" && src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      )}
      {status === "unavailable" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            color: "var(--color-on-surface-variant)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: "11px" }}>No preview</span>
        </div>
      )}
    </div>
  );
}
