"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadNotesDrawer from "./UploadNotesModal";
import ImageThumbnail from "./ImageThumbnail";
import type { SerializedBook, SerializedSourceImage } from "@/server/books";

type ActiveTab = "notes" | "transcription" | "jobs";

/* -------------------------------------------------------------------------- */
/*  Design-system helpers — every visual decision flows through tokens         */
/* -------------------------------------------------------------------------- */

function statusBadge(status: string) {
  const map: Record<
    string,
    { bg: string; fg: string; icon: React.ReactNode }
  > = {
    READY: {
      bg: "var(--color-primary-container)",
      fg: "var(--color-on-primary-container)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    PROCESSING: {
      bg: "var(--color-secondary-container)",
      fg: "var(--color-on-secondary-container)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ),
    },
    DRAFT: {
      bg: "var(--color-surface-container-high)",
      fg: "var(--color-on-surface-variant)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    ARCHIVED: {
      bg: "var(--color-surface-container-high)",
      fg: "var(--color-on-surface-variant)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    },
  };

  const entry = map[status] ?? map.DRAFT;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
        padding:
          "calc(var(--spacing-collection-extra-small-spacing) * 1px) calc(var(--spacing-collection-small-spacing) * 1px)",
        borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
        fontFamily: "var(--typography-label-small-fontfamily)",
        fontSize: "var(--typography-label-small-fontsize)",
        fontWeight: "600",
        letterSpacing: "var(--typography-label-small-letterspacing)",
        textTransform: "uppercase",
        backgroundColor: entry.bg,
        color: entry.fg,
        whiteSpace: "nowrap",
      }}
    >
      {entry.icon}
      {status}
    </span>
  );
}

function imageStatusBadge(status: string) {
  const map: Record<
    string,
    { bg: string; fg: string; label: string }
  > = {
    TRANSCRIBED: {
      bg: "var(--color-primary-container)",
      fg: "var(--color-on-primary-container)",
      label: "Transcribed",
    },
    UPLOADED: {
      bg: "var(--color-surface-container-high)",
      fg: "var(--color-on-surface-variant)",
      label: "Uploaded",
    },
    FAILED: {
      bg: "var(--color-error-container)",
      fg: "var(--color-on-error-container)",
      label: "Failed",
    },
    ACCEPTED: {
      bg: "var(--color-primary-container)",
      fg: "var(--color-on-primary-container)",
      label: "Accepted",
    },
  };

  const entry = map[status] ?? {
    bg: "var(--color-surface-container-high)",
    fg: "var(--color-on-surface-variant)",
    label: status,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px calc(var(--spacing-collection-extra-small-spacing) * 1px)",
        borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
        fontFamily: "var(--typography-label-small-fontfamily)",
        fontSize: "var(--typography-label-small-fontsize)",
        fontWeight: "600",
        letterSpacing: "var(--typography-label-small-letterspacing)",
        textTransform: "uppercase",
        backgroundColor: entry.bg,
        color: entry.fg,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {entry.label}
    </span>
  );
}

function jobStatusBadge(status: string) {
  const map: Record<
    string,
    { bg: string; fg: string }
  > = {
    SUCCEEDED: {
      bg: "var(--color-primary-container)",
      fg: "var(--color-on-primary-container)",
    },
    FAILED: {
      bg: "var(--color-error-container)",
      fg: "var(--color-on-error-container)",
    },
    RUNNING: {
      bg: "var(--color-secondary-container)",
      fg: "var(--color-on-secondary-container)",
    },
    QUEUED: {
      bg: "var(--color-surface-container-high)",
      fg: "var(--color-on-surface-variant)",
    },
    PARTIAL: {
      bg: "var(--color-error-container)",
      fg: "var(--color-on-error-container)",
    },
  };

  const entry = map[status] ?? {
    bg: "var(--color-surface-container-high)",
    fg: "var(--color-on-surface-variant)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
        padding: "2px calc(var(--spacing-collection-extra-small-spacing) * 1px)",
        borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
        fontFamily: "var(--typography-label-small-fontfamily)",
        fontSize: "var(--typography-label-small-fontsize)",
        fontWeight: "600",
        letterSpacing: "var(--typography-label-small-letterspacing)",
        textTransform: "uppercase",
        backgroundColor: entry.bg,
        color: entry.fg,
      }}
    >
      {status === "RUNNING" && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ animation: "spin 1s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {status === "FAILED" || status === "PARTIAL" ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
        </svg>
      ) : null}
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function BookViewClient({ book }: { book: SerializedBook }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("notes");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] =
    useState<SerializedSourceImage | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isTogglingProcessing, setIsTogglingProcessing] = useState(false);
  const router = useRouter();

  const isProcessingBook = book.status === "PROCESSING";

  const handleToggleProcessing = async () => {
    setIsTogglingProcessing(true);
    const wasProcessing = isProcessingBook;
    try {
      const res = await fetch(`/api/books/${book.id}/process`, {
        method: wasProcessing ? "DELETE" : "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        alert(
          data?.error ??
            (wasProcessing
              ? "Failed to stop processing."
              : "Failed to start processing."),
        );
        return;
      }
      router.refresh();
    } catch {
      alert(
        wasProcessing
          ? "Failed to stop processing."
          : "Failed to start processing.",
      );
    } finally {
      setIsTogglingProcessing(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (
      !window.confirm(
        "Delete this note? Its transcription, flags, and diagrams will be removed too.",
      )
    ) {
      return;
    }

    setDeletingImageId(imageId);
    try {
      const res = await fetch(`/api/books/${book.id}/images/${imageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        alert(data?.error ?? "Failed to delete note.");
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to delete note.");
    } finally {
      setDeletingImageId(null);
    }
  };

  /* Count summary for the header */
  const imageCount = book.images.length;
  const sectionCount = book.sections.length;
  const jobCount = book.jobs.length;
  const flagCount = book.sections.reduce(
    (sum, sec) => sum + sec.flags.length,
    0,
  );

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .book-tab-btn {
          padding: calc(var(--spacing-collection-small-spacing) * 1px)
            calc(var(--spacing-collection-base-spacing) * 1px);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-on-surface-variant);
          font-family: var(--typography-label-large-fontfamily);
          font-size: var(--typography-label-large-fontsize);
          font-weight: 500;
          letter-spacing: var(--typography-label-large-letterspacing);
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: calc(var(--spacing-collection-extra-small-spacing) * 1px);
          white-space: nowrap;
        }
        .book-tab-btn:hover {
          color: var(--color-on-surface);
        }
        .book-tab-btn--active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          font-weight: 600;
        }

        .book-image-card {
          background-color: var(--color-surface-container-lowest);
          border: 1px solid var(--color-outline-variant);
          border-radius: calc(var(--spacing-collection-medium-spacing) * 1px);
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          display: flex;
          flex-direction: column;
        }
        .book-image-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--effect-soft-shadow);
        }

        .book-section-card {
          background-color: var(--color-surface-container-lowest);
          border: 1px solid var(--color-outline-variant);
          border-radius: calc(var(--spacing-collection-medium-spacing) * 1px);
          padding: calc(var(--spacing-collection-base-spacing) * 1px);
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing-collection-small-spacing) * 1px);
        }

        .book-job-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: calc(var(--spacing-collection-small-spacing) * 1px)
            calc(var(--spacing-collection-base-spacing) * 1px);
          background-color: var(--color-surface-container-lowest);
          border: 1px solid var(--color-outline-variant);
          border-radius: calc(var(--spacing-collection-small-spacing) * 1px);
        }

        .book-img-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: calc(var(--spacing-collection-small-spacing) * 1px);
        }
        @media (max-width: 900px) {
          .book-img-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .book-img-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "calc(var(--spacing-collection-large-spacing) * 1px)",
          display: "flex",
          flexDirection: "column",
          gap: "calc(var(--spacing-collection-large-spacing) * 1px)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* ─── Back link ──────────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
            fontFamily: "var(--typography-label-large-fontfamily)",
            fontSize: "var(--typography-label-large-fontsize)",
            fontWeight: "500",
            letterSpacing: "var(--typography-label-large-letterspacing)",
            color: "var(--color-primary)",
            textDecoration: "none",
            transition: "opacity 0.15s ease",
            marginBottom: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to My Books
        </Link>

        {/* ─── Header: title, status, actions ─────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "calc(var(--spacing-collection-base-spacing) * 1px)",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "calc(var(--spacing-collection-small-spacing) * 1px)",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontFamily: "var(--typography-headline-medium-fontfamily)",
                  fontSize: "var(--typography-headline-medium-fontsize)",
                  fontWeight: "var(--typography-headline-medium-fontweight)",
                  letterSpacing:
                    "var(--typography-headline-medium-letterspacing)",
                  lineHeight: "var(--typography-headline-medium-lineheight)",
                  color: "var(--color-on-surface)",
                  margin: 0,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {book.title}
              </h1>
              {statusBadge(book.status)}
            </div>
            <p
              style={{
                fontFamily: "var(--typography-body-medium-fontfamily)",
                fontSize: "var(--typography-body-medium-fontsize)",
                fontWeight: "var(--typography-body-medium-fontweight)",
                letterSpacing:
                  "var(--typography-body-medium-letterspacing)",
                lineHeight: "var(--typography-body-medium-lineheight)",
                color: "var(--color-on-surface-variant)",
                margin: "calc(var(--spacing-collection-extra-small-spacing) * 1px) 0 0 0",
              }}
            >
              Created {new Date(book.createdAt).toLocaleDateString()}{" "}
              {imageCount > 0 && `\u00B7 ${imageCount} note page${imageCount === 1 ? "" : "s"}`}
              {flagCount > 0 &&
                ` \u00B7 ${flagCount} flag${flagCount === 1 ? "" : "s"} to review`}
            </p>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: "calc(var(--spacing-collection-small-spacing) * 1px)",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {/* Secondary: Upload */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              style={{
                padding:
                  "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                borderRadius:
                  "calc(var(--spacing-collection-small-spacing) * 1px)",
                border: "1px solid var(--color-outline)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-on-surface)",
                fontFamily: "var(--typography-label-large-fontfamily)",
                fontSize: "var(--typography-label-large-fontsize)",
                fontWeight: "600",
                letterSpacing:
                  "var(--typography-label-large-letterspacing)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                transition: "background-color 0.15s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Notes
            </button>

            {/* Primary: Start / Stop */}
            <button
              type="button"
              onClick={handleToggleProcessing}
              disabled={
                isTogglingProcessing ||
                (!isProcessingBook && imageCount === 0)
              }
              style={{
                padding:
                  "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                borderRadius:
                  "calc(var(--spacing-collection-small-spacing) * 1px)",
                border: "none",
                backgroundColor: isProcessingBook
                  ? "var(--color-error)"
                  : "var(--color-primary)",
                color: isProcessingBook
                  ? "var(--color-on-error)"
                  : "var(--color-on-primary)",
                fontFamily: "var(--typography-label-large-fontfamily)",
                fontSize: "var(--typography-label-large-fontsize)",
                fontWeight: "600",
                letterSpacing:
                  "var(--typography-label-large-letterspacing)",
                cursor:
                  isTogglingProcessing ||
                  (!isProcessingBook && imageCount === 0)
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  isTogglingProcessing ||
                  (!isProcessingBook && imageCount === 0)
                    ? 0.65
                    : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                boxShadow: "var(--effect-soft-shadow)",
                transition: "opacity 0.15s ease",
              }}
            >
              {isTogglingProcessing ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {isProcessingBook ? "Stopping\u2026" : "Starting\u2026"}
                </>
              ) : (
                <>
                  {isProcessingBook ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                  {isProcessingBook ? "Stop Processing" : "Start Processing"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── Tabs ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid var(--color-outline-variant)",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            className={`book-tab-btn ${activeTab === "notes" ? "book-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Note Images ({imageCount})
          </button>

          <button
            type="button"
            className={`book-tab-btn ${activeTab === "transcription" ? "book-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("transcription")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Transcribed Sections ({sectionCount})
          </button>

          <button
            type="button"
            className={`book-tab-btn ${activeTab === "jobs" ? "book-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Pipeline Jobs ({jobCount})
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/*  TAB: NOTE IMAGES                                            */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "notes" && (
          <div>
            {imageCount === 0 ? (
              <div
                style={{
                  border: "2px dashed var(--color-outline-variant)",
                  borderRadius:
                    "calc(var(--spacing-collection-medium-spacing) * 1px)",
                  padding:
                    "calc(var(--spacing-collection-very-large-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                  textAlign: "center",
                  backgroundColor: "var(--color-surface-container-lowest)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap:
                    "calc(var(--spacing-collection-small-spacing) * 1px)",
                }}
              >
                <div style={{ color: "var(--color-on-surface-variant)" }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily:
                      "var(--typography-title-medium-fontfamily)",
                    fontSize:
                      "var(--typography-title-medium-fontsize)",
                    fontWeight:
                      "var(--typography-title-medium-fontweight)",
                    color: "var(--color-on-surface)",
                    margin: 0,
                  }}
                >
                  No note photos uploaded yet
                </h3>
                <p
                  style={{
                    fontFamily:
                      "var(--typography-body-medium-fontfamily)",
                    fontSize:
                      "var(--typography-body-medium-fontsize)",
                    fontWeight:
                      "var(--typography-body-medium-fontweight)",
                    color: "var(--color-on-surface-variant)",
                    margin: 0,
                    maxWidth: "400px",
                  }}
                >
                  Upload photos of your handwritten notes. Vision AI will
                  extract the text automatically.
                </p>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  style={{
                    marginTop:
                      "calc(var(--spacing-collection-small-spacing) * 1px)",
                    padding:
                      "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                    borderRadius:
                      "calc(var(--spacing-collection-small-spacing) * 1px)",
                    border: "none",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                    fontFamily:
                      "var(--typography-label-large-fontfamily)",
                    fontSize:
                      "var(--typography-label-large-fontsize)",
                    fontWeight: "600",
                    letterSpacing:
                      "var(--typography-label-large-letterspacing)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap:
                      "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload Notes
                </button>
              </div>
            ) : (
              <div className="book-img-grid">
                {book.images.map((img, index) => {
                  const displayName =
                    img.originalName ??
                    img.storageKey.split("/").pop() ??
                    `Page #${img.imageOrder ?? index + 1}`;

                  return (
                    <div
                      key={img.id}
                      className="book-image-card"
                      onClick={() => setSelectedImage(img)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedImage(img);
                        }
                      }}
                    >
                      {/* Thumbnail area */}
                      <div
                        style={{
                          height: "220px",
                          backgroundColor:
                            "var(--color-surface-container-high)",
                          overflow: "hidden",
                          borderBottom:
                            "1px solid var(--color-outline-variant)",
                        }}
                      >
                        <ImageThumbnail
                          imageId={img.id}
                          alt={displayName}
                          variant="card"
                        />
                      </div>

                      {/* Card footer */}
                      <div
                        style={{
                          padding:
                            "calc(var(--spacing-collection-small-spacing) * 1px)",
                          display: "flex",
                          flexDirection: "column",
                           gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                         }}
                       >
                         <div
                           style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap:
                              "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                            minWidth: 0,
                          }}
                        >
                          <span
                            title={displayName}
                            style={{
                              fontFamily:
                                "var(--typography-label-medium-fontfamily)",
                              fontSize:
                                "var(--typography-label-medium-fontsize)",
                              fontWeight: "600",
                              letterSpacing:
                                "var(--typography-label-medium-letterspacing)",
                              color: "var(--color-on-surface)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              minWidth: 0,
                            }}
                          >
                            {displayName}
                          </span>

                          {img.status === "UPLOADED" ? (
                            <button
                              type="button"
                              aria-label={`Delete ${displayName}`}
                              title="Delete note"
                              disabled={deletingImageId === img.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteImage(img.id);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "26px",
                                height: "26px",
                                flexShrink: 0,
                                padding: 0,
                                border: "1px solid var(--color-outline)",
                                borderRadius:
                                  "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                                backgroundColor:
                                  "var(--color-surface)",
                                color: "var(--color-error)",
                                cursor:
                                  deletingImageId === img.id
                                    ? "wait"
                                    : "pointer",
                                transition:
                                  "background-color 0.15s ease",
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          ) : (
                            imageStatusBadge(img.status)
                          )}
                        </div>

                        <span
                          style={{
                            fontFamily:
                              "var(--typography-body-small-fontfamily)",
                            fontSize:
                              "var(--typography-body-small-fontsize)",
                            fontWeight:
                              "var(--typography-body-small-fontweight)",
                            color:
                              "var(--color-on-surface-variant)",
                          }}
                        >
                          Quality:{" "}
                          <strong>
                            {img.qualityScore
                              ? `${(img.qualityScore * 100).toFixed(0)}%`
                              : "Passed"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/*  TAB: TRANSCRIBED SECTIONS                                   */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "transcription" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "calc(var(--spacing-collection-small-spacing) * 1px)",
            }}
          >
            {sectionCount === 0 ? (
              <div
                style={{
                  border: "2px dashed var(--color-outline-variant)",
                  borderRadius:
                    "calc(var(--spacing-collection-medium-spacing) * 1px)",
                  padding:
                    "calc(var(--spacing-collection-very-large-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                  textAlign: "center",
                  backgroundColor:
                    "var(--color-surface-container-lowest)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap:
                    "calc(var(--spacing-collection-small-spacing) * 1px)",
                }}
              >
                <div style={{ color: "var(--color-on-surface-variant)" }}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily:
                      "var(--typography-title-medium-fontfamily)",
                    fontSize:
                      "var(--typography-title-medium-fontsize)",
                    fontWeight:
                      "var(--typography-title-medium-fontweight)",
                    color: "var(--color-on-surface)",
                    margin: 0,
                  }}
                >
                  No transcribed text yet
                </h3>
                <p
                  style={{
                    fontFamily:
                      "var(--typography-body-medium-fontfamily)",
                    fontSize:
                      "var(--typography-body-medium-fontsize)",
                    fontWeight:
                      "var(--typography-body-medium-fontweight)",
                    color: "var(--color-on-surface-variant)",
                    margin: 0,
                    maxWidth: "420px",
                  }}
                >
                  Once the worker finishes processing your uploaded notes,
                  transcribed text sections will appear here.
                </p>
              </div>
            ) : (
              book.sections.map((sec) => (
                <div key={sec.id} className="book-section-card">
                  {/* Section header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap:
                        "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "var(--typography-label-medium-fontfamily)",
                        fontSize:
                          "var(--typography-label-medium-fontsize)",
                        fontWeight: "600",
                        letterSpacing:
                          "var(--typography-label-medium-letterspacing)",
                        color: "var(--color-on-surface-variant)",
                        textTransform: "uppercase",
                      }}
                    >
                      Section #{sec.order}
                      {sec.sourceImage &&
                        ` \u00B7 Page #${sec.sourceImage.imageOrder ?? "N/A"}`}
                    </span>

                    {sec.confidence !== "HIGH" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                          padding:
                            "2px calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                          borderRadius:
                            "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                          fontFamily:
                            "var(--typography-label-small-fontfamily)",
                          fontSize:
                            "var(--typography-label-small-fontsize)",
                          fontWeight: "600",
                          backgroundColor:
                            "var(--color-error-container)",
                          color:
                            "var(--color-on-error-container)",
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
                        </svg>
                        Confidence: {sec.confidence}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                          padding:
                            "2px calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                          borderRadius:
                            "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                          fontFamily:
                            "var(--typography-label-small-fontfamily)",
                          fontSize:
                            "var(--typography-label-small-fontsize)",
                          fontWeight: "600",
                          backgroundColor:
                            "var(--color-primary-container)",
                          color:
                            "var(--color-on-primary-container)",
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Confidence: HIGH
                      </span>
                    )}
                  </div>

                  {/* Transcribed text */}
                  <div
                    style={{
                      fontFamily:
                        "var(--typography-body-large-fontfamily)",
                      fontSize:
                        "var(--typography-body-large-fontsize)",
                      fontWeight:
                        "var(--typography-body-large-fontweight)",
                      letterSpacing:
                        "var(--typography-body-large-letterspacing)",
                      lineHeight:
                        "var(--typography-body-large-lineheight)",
                      color: "var(--color-on-surface)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {sec.originalText}
                  </div>

                  {/* Flags — color + non-color signal (ui-component-builder rule) */}
                  {sec.flags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                        flexWrap: "wrap",
                      }}
                    >
                      {sec.flags.map((flag) => (
                        <span
                          key={flag.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                            padding:
                              "calc(var(--spacing-collection-extra-small-spacing) * 1px) calc(var(--spacing-collection-small-spacing) * 1px)",
                            borderRadius:
                              "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                            backgroundColor:
                              "var(--color-error-container)",
                            color:
                              "var(--color-on-error-container)",
                            fontFamily:
                              "var(--typography-label-small-fontfamily)",
                            fontSize:
                              "var(--typography-label-small-fontsize)",
                            fontWeight: "600",
                          }}
                        >
                          {/* Non-color signal: warning triangle icon */}
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="false"
                          >
                            <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
                          </svg>
                          [{flag.type}]:{" "}
                          {flag.suggestion || "Unreadable text span"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/*  TAB: PIPELINE JOBS                                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "jobs" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
            }}
          >
            {jobCount === 0 ? (
              <div
                style={{
                  border: "2px dashed var(--color-outline-variant)",
                  borderRadius:
                    "calc(var(--spacing-collection-medium-spacing) * 1px)",
                  padding:
                    "calc(var(--spacing-collection-very-large-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                  textAlign: "center",
                  backgroundColor:
                    "var(--color-surface-container-lowest)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap:
                    "calc(var(--spacing-collection-small-spacing) * 1px)",
                }}
              >
                <div style={{ color: "var(--color-on-surface-variant)" }}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily:
                      "var(--typography-title-medium-fontfamily)",
                    fontSize:
                      "var(--typography-title-medium-fontsize)",
                    fontWeight:
                      "var(--typography-title-medium-fontweight)",
                    color: "var(--color-on-surface)",
                    margin: 0,
                  }}
                >
                  No pipeline jobs yet
                </h3>
                <p
                  style={{
                    fontFamily:
                      "var(--typography-body-medium-fontfamily)",
                    fontSize:
                      "var(--typography-body-medium-fontsize)",
                    fontWeight:
                      "var(--typography-body-medium-fontweight)",
                    color: "var(--color-on-surface-variant)",
                    margin: 0,
                    maxWidth: "380px",
                  }}
                >
                  Upload notes and click &ldquo;Start Processing&rdquo; to
                  kick off the transcription pipeline.
                </p>
              </div>
            ) : (
              book.jobs.map((job) => (
                <div key={job.id} className="book-job-row">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap:
                        "calc(var(--spacing-collection-base-spacing) * 1px)",
                      minWidth: 0,
                    }}
                  >
                    {/* Job type icon */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius:
                          "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                        backgroundColor:
                          "var(--color-surface-container-high)",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-on-surface-variant)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {job.type === "TRANSCRIBE" ? (
                          <>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </>
                        ) : job.type === "STRUCTURE" ? (
                          <>
                            <line
                              x1="8"
                              y1="6"
                              x2="21"
                              y2="6"
                            />
                            <line
                              x1="8"
                              y1="12"
                              x2="21"
                              y2="12"
                            />
                            <line
                              x1="8"
                              y1="18"
                              x2="21"
                              y2="18"
                            />
                            <line
                              x1="3"
                              y1="6"
                              x2="3.01"
                              y2="6"
                            />
                            <line
                              x1="3"
                              y1="12"
                              x2="3.01"
                              y2="12"
                            />
                            <line
                              x1="3"
                              y1="18"
                              x2="3.01"
                              y2="18"
                            />
                          </>
                        ) : (
                          <>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line
                              x1="12"
                              y1="15"
                              x2="12"
                              y2="3"
                            />
                          </>
                        )}
                      </svg>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--typography-label-large-fontfamily)",
                          fontSize:
                            "var(--typography-label-large-fontsize)",
                          fontWeight: "600",
                          letterSpacing:
                            "var(--typography-label-large-letterspacing)",
                          color: "var(--color-on-surface)",
                        }}
                      >
                        {job.type}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "var(--typography-body-small-fontfamily)",
                          fontSize:
                            "var(--typography-body-small-fontsize)",
                          fontWeight:
                            "var(--typography-body-small-fontweight)",
                          color:
                            "var(--color-on-surface-variant)",
                        }}
                      >
                        {new Date(job.createdAt).toLocaleString()}
                        {job.attempts > 1 &&
                          ` \u00B7 Attempt ${job.attempts}`}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap:
                        "calc(var(--spacing-collection-small-spacing) * 1px)",
                      flexShrink: 0,
                    }}
                  >
                    {job.error && (
                      <span
                        title={job.error}
                        style={{
                          fontFamily:
                            "var(--typography-body-small-fontfamily)",
                          fontSize:
                            "var(--typography-body-small-fontsize)",
                          color: "var(--color-on-error-container)",
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {job.error.length > 30
                          ? `${job.error.slice(0, 30)}\u2026`
                          : job.error}
                      </span>
                    )}
                    {jobStatusBadge(job.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ─── Image Lightbox / Inspector ─────────────────────────────── */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--color-scrim)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "calc(var(--spacing-collection-base-spacing) * 1px)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius:
                "calc(var(--spacing-collection-medium-spacing) * 1px)",
              maxWidth: "560px",
              width: "100%",
              padding:
                "calc(var(--spacing-collection-extra-large-spacing) * 1px)",
              border: "1px solid var(--color-outline)",
              boxShadow: "var(--effect-hard-shadow)",
              display: "flex",
              flexDirection: "column",
              gap:
                "calc(var(--spacing-collection-base-spacing) * 1px)",
            }}
          >
            {/* Lightbox header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily:
                    "var(--typography-title-large-fontfamily)",
                  fontSize:
                    "var(--typography-title-large-fontsize)",
                  fontWeight:
                    "var(--typography-title-large-fontweight)",
                  letterSpacing:
                    "var(--typography-title-large-letterspacing)",
                  color: "var(--color-on-surface)",
                }}
              >
                Page #{selectedImage.imageOrder ?? "N/A"}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                aria-label="Close"
                style={{
                  background:
                    "var(--color-surface-container-high)",
                  border: "1px solid var(--color-outline)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--color-on-surface)",
                  transition: "background-color 0.15s ease",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Image preview */}
            <ImageThumbnail
              imageId={selectedImage.id}
              alt={selectedImage.originalName ?? `Page #${selectedImage.imageOrder ?? "N/A"}`}
              variant="lightbox"
            />

            {/* Metadata grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "auto 1fr",
                gap:
                  "calc(var(--spacing-collection-extra-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                fontFamily:
                  "var(--typography-body-medium-fontfamily)",
                fontSize:
                  "var(--typography-body-medium-fontsize)",
                fontWeight:
                  "var(--typography-body-medium-fontweight)",
              }}
            >
              <span
                style={{
                  color: "var(--color-on-surface-variant)",
                }}
              >
                File
              </span>
              <span
                style={{
                  color: "var(--color-on-surface)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedImage.originalName ??
                  `Page #${selectedImage.imageOrder ?? "N/A"}`}
              </span>

              <span
                style={{
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Format
              </span>
              <span
                style={{ color: "var(--color-on-surface)" }}
              >
                {selectedImage.format.toUpperCase()}
              </span>

              <span
                style={{
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Status
              </span>
              <span>{imageStatusBadge(selectedImage.status)}</span>

              <span
                style={{
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Quality
              </span>
              <span
                style={{ color: "var(--color-on-surface)" }}
              >
                {selectedImage.qualityScore
                  ? `${(selectedImage.qualityScore * 100).toFixed(0)}%`
                  : "Passed"}
              </span>
            </div>

            {/* Lightbox actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap:
                  "calc(var(--spacing-collection-small-spacing) * 1px)",
                paddingTop:
                  "calc(var(--spacing-collection-small-spacing) * 1px)",
                borderTop: "1px solid var(--color-outline-variant)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{
                  padding:
                    "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                  borderRadius:
                    "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                  border: "1px solid var(--color-outline)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  fontFamily:
                    "var(--typography-label-large-fontfamily)",
                  fontSize:
                    "var(--typography-label-large-fontsize)",
                  fontWeight: "600",
                  letterSpacing:
                    "var(--typography-label-large-letterspacing)",
                  cursor: "pointer",
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  void handleToggleProcessing();
                }}
                disabled={isTogglingProcessing}
                style={{
                  padding:
                    "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                  borderRadius:
                    "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                  border: "none",
                  backgroundColor: isProcessingBook
                    ? "var(--color-error)"
                    : "var(--color-primary)",
                  color: isProcessingBook
                    ? "var(--color-on-error)"
                    : "var(--color-on-primary)",
                  fontFamily:
                    "var(--typography-label-large-fontfamily)",
                  fontSize:
                    "var(--typography-label-large-fontsize)",
                  fontWeight: "600",
                  letterSpacing:
                    "var(--typography-label-large-letterspacing)",
                  cursor: isTogglingProcessing
                    ? "not-allowed"
                    : "pointer",
                  opacity: isTogglingProcessing ? 0.65 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap:
                    "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                  boxShadow: "var(--effect-soft-shadow)",
                }}
              >
                {isTogglingProcessing ? (
                  isProcessingBook ? (
                    "Stopping\u2026"
                  ) : (
                    "Starting\u2026"
                  )
                ) : (
                  <>
                    {isProcessingBook ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                    {isProcessingBook
                      ? "Stop Processing"
                      : "Start Processing"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upload Drawer ─────────────────────────────────────────── */}
      <UploadNotesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        bookId={book.id}
        bookTitle={book.title}
      />
    </>
  );
}
