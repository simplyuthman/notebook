"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadNotesDrawer from "./UploadNotesModal";
import type { SerializedBook, SerializedSourceImage } from "@/server/books";

export default function BookViewClient({ book }: { book: SerializedBook }) {
  const [activeTab, setActiveTab] = useState<"notes" | "transcription" | "jobs">("notes");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SerializedSourceImage | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isTogglingProcessing, setIsTogglingProcessing] = useState(false);
  const [isBackHovered, setIsBackHovered] = useState(false);
  const router = useRouter();

  const isProcessingBook = book.status === "PROCESSING";

  // One handler for both directions: POST starts the pipeline, DELETE stops
  // it (book returns to DRAFT, live jobs are failed and drained).
  const handleToggleProcessing = async () => {
    setIsTogglingProcessing(true);
    const wasProcessing = isProcessingBook;
    try {
      const res = await fetch(`/api/books/${book.id}/process`, {
        method: wasProcessing ? "DELETE" : "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(
          data?.error ?? (wasProcessing ? "Failed to stop processing." : "Failed to start processing.")
        );
        return;
      }
      router.refresh();
    } catch {
      alert(wasProcessing ? "Failed to stop processing." : "Failed to start processing.");
    } finally {
      setIsTogglingProcessing(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (
      !window.confirm(
        "Delete this note? Its transcription, flags, and diagrams will be removed too."
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
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
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

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "20px 0",
        padding: "calc(var(--spacing-collection-large-spacing) * 1px)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Top Navigation & Breadcrumb */}
      <div>
        <Link
          href="/dashboard"
          onMouseEnter={() => setIsBackHovered(true)}
          onMouseLeave={() => setIsBackHovered(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: "500",
            color: isBackHovered
              ? "color-mix(in srgb, var(--color-primary) 75%, var(--color-on-surface))"
              : "var(--color-primary)",
            textDecoration: isBackHovered ? "underline" : "none",
            textUnderlineOffset: "3px",
            transition: "color 0.15s ease, text-decoration 0.15s ease",
            marginBottom: "12px",
          }}
        >
          ← Back to My Books
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1
                style={{
                  fontFamily: "var(--typography-title-large-fontfamily)",
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "var(--color-on-surface)",
                  margin: 0,
                }}
              >
                {book.title}
              </h1>
              <span
                style={{
                  backgroundColor:
                    book.status === "READY"
                      ? "color-mix(in srgb, #22c55e 20%, transparent)"
                      : book.status === "PROCESSING"
                      ? "color-mix(in srgb, #3b82f6 20%, transparent)"
                      : "var(--color-surface-variant)",
                  color:
                    book.status === "READY"
                      ? "#16a34a"
                      : book.status === "PROCESSING"
                      ? "#2563eb"
                      : "var(--color-on-surface-variant)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {book.status}
              </span>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-on-surface-variant)",
                margin: "4px 0 0 0",
              }}
            >
              Created on {new Date(book.createdAt).toLocaleDateString()} • {book.images.length} note page(s) uploaded
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Secondary Button: Upload Notes */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                border: "1px solid var(--color-outline)",
                backgroundColor: "var(--color-surface-container-low)",
                color: "var(--color-on-surface)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Upload Notes
            </button>

            {/* Primary Button: Start/Stop Processing */}
            <button
              type="button"
              onClick={handleToggleProcessing}
              disabled={
                isTogglingProcessing || (!isProcessingBook && book.images.length === 0)
              }
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: isProcessingBook
                  ? "var(--color-error)"
                  : "var(--color-primary)",
                color: isProcessingBook
                  ? "var(--color-on-error)"
                  : "var(--color-on-primary)",
                fontSize: "14px",
                fontWeight: "600",
                cursor:
                  isTogglingProcessing || (!isProcessingBook && book.images.length === 0)
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  isTogglingProcessing || (!isProcessingBook && book.images.length === 0)
                    ? 0.65
                    : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              {isTogglingProcessing ? (
                isProcessingBook
                  ? "Stopping..."
                  : "Starting..."
              ) : (
                <>
                  <span>{isProcessingBook ? "Stop Processing" : "Start Processing"}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--color-outline-variant)",
          paddingBottom: "2px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "notes" ? "2px solid var(--color-primary)" : "2px solid transparent",
            color: activeTab === "notes" ? "var(--color-primary)" : "var(--color-on-surface-variant)",
            fontWeight: activeTab === "notes" ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          📷 Note Images ({book.images.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transcription")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "transcription" ? "2px solid var(--color-primary)" : "2px solid transparent",
            color: activeTab === "transcription" ? "var(--color-primary)" : "var(--color-on-surface-variant)",
            fontWeight: activeTab === "transcription" ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          📖 Transcribed Sections ({book.sections.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "jobs" ? "2px solid var(--color-primary)" : "2px solid transparent",
            color: activeTab === "jobs" ? "var(--color-primary)" : "var(--color-on-surface-variant)",
            fontWeight: activeTab === "jobs" ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ⚡ Pipeline Jobs ({book.jobs.length})
        </button>
      </div>

      {/* TAB 1: NOTE IMAGES GALLERY */}
      {activeTab === "notes" && (
        <div>
          {book.images.length === 0 ? (
            <div
              style={{
                border: "2px dashed var(--color-outline-variant)",
                borderRadius: "12px",
                padding: "48px 24px",
                textAlign: "center",
                backgroundColor: "var(--color-surface-container-lowest)",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-surface-variant)" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "600", color: "var(--color-on-surface)" }}>
                No note photos uploaded yet
              </h3>
              <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "var(--color-on-surface-variant)" }}>
                Upload photos of your handwritten notes to get started. Vision AI will extract text automatically.
              </p>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Upload Notes
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {book.images.map((img, index) => {
                const displayName =
                  img.originalName ??
                  img.storageKey.split("/").pop() ??
                  `Page #${img.imageOrder ?? index + 1}`;

                return (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                    border: "1px solid var(--color-outline-variant)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Thumbnail Placeholder / Image Box */}
                  <div
                    style={{
                      height: "240px",
                      backgroundColor: "var(--color-surface-container-high)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottom: "1px solid var(--color-outline-variant)",
                      position: "relative",
                      padding: "12px",
                    }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-surface-variant)" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span style={{ fontSize: "11px", color: "var(--color-on-surface-variant)", marginTop: "6px" }}>
                      Click to Inspect
                    </span>
                  </div>

                  {/* Card Details */}
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <span
                        title={displayName}
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
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
                            borderRadius: "6px",
                            backgroundColor: "var(--color-surface)",
                            color: "var(--color-error)",
                            cursor: deletingImageId === img.id ? "wait" : "pointer",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            flexShrink: 0,
                            backgroundColor:
                              img.status === "TRANSCRIBED"
                                ? "color-mix(in srgb, #22c55e 18%, transparent)"
                                : "var(--color-surface-variant)",
                            color: img.status === "TRANSCRIBED" ? "#16a34a" : "var(--color-on-surface-variant)",
                          }}
                        >
                          {img.status}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: "11px", color: "var(--color-on-surface-variant)" }}>
                      Quality Score: <strong>{img.qualityScore ? (img.qualityScore * 100).toFixed(0) + "%" : "Passed"}</strong>
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSCRIBED SECTIONS */}
      {activeTab === "transcription" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {book.sections.length === 0 ? (
            <div
              style={{
                border: "1px dashed var(--color-outline-variant)",
                borderRadius: "10px",
                padding: "36px 20px",
                textAlign: "center",
                color: "var(--color-on-surface-variant)",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px" }}>
                No transcribed text sections yet. Once the worker finishes processing your uploaded notes, transcribed sections will appear here.
              </p>
            </div>
          ) : (
            book.sections.map((sec) => (
              <div
                key={sec.id}
                style={{
                  backgroundColor: "var(--color-surface-container-lowest)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "10px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-on-surface-variant)" }}>
                    Section #{sec.order} • Source: Page #{sec.sourceImage?.imageOrder ?? "N/A"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor:
                        sec.confidence === "HIGH"
                          ? "color-mix(in srgb, #22c55e 15%, transparent)"
                          : "var(--color-error-container)",
                      color:
                        sec.confidence === "HIGH" ? "#16a34a" : "var(--color-on-error-container)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {sec.confidence !== "HIGH" && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
                      </svg>
                    )}
                    Confidence: {sec.confidence}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "var(--color-on-surface)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--typography-body-large-fontfamily)",
                  }}
                >
                  {sec.originalText}
                </div>

                {/* Flags indicator per ui-component-builder rules (R18 error token + non-color signal icon) */}
                {sec.flags && sec.flags.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                    {sec.flags.map((flag) => (
                      <span
                        key={flag.id}
                        style={{
                          backgroundColor: "var(--color-error-container)",
                          color: "var(--color-on-error-container)",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
                        </svg>
                        Flag [{flag.type}]: {flag.suggestion || "Unreadable text span"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PIPELINE JOBS */}
      {activeTab === "jobs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {book.jobs.length === 0 ? (
            <p style={{ color: "var(--color-on-surface-variant)", fontSize: "14px" }}>No background jobs created yet.</p>
          ) : (
            book.jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "var(--color-surface-container-lowest)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: "700", color: "var(--color-on-surface)" }}>{job.type}</span>
                  <span style={{ color: "var(--color-on-surface-variant)", fontSize: "12px" }}>
                    Created: {new Date(job.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontWeight: "600",
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor:
                        job.status === "SUCCEEDED"
                          ? "color-mix(in srgb, #22c55e 18%, transparent)"
                          : job.status === "FAILED"
                          ? "var(--color-error-container)"
                          : "var(--color-primary-container)",
                      color:
                        job.status === "SUCCEEDED"
                          ? "#16a34a"
                          : job.status === "FAILED"
                          ? "var(--color-on-error-container)"
                          : "var(--color-on-primary-container)",
                    }}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Note Image Lightbox / Inspector Modal — closes only via its buttons,
          never on outside/backdrop clicks */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "100%",
              padding: "24px",
              border: "1px solid var(--color-outline)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--color-on-surface)" }}>
                Note Page #{selectedImage.imageOrder ?? "N/A"} Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "14px", color: "var(--color-on-surface-variant)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ margin: 0 }}>
                <strong>File Name:</strong> {selectedImage.originalName ?? `Page #${selectedImage.imageOrder ?? "N/A"}`}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Format:</strong> {selectedImage.format}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Status:</strong> {selectedImage.status}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Quality Score:</strong> {selectedImage.qualityScore ? (selectedImage.qualityScore * 100).toFixed(0) + "%" : "100% (Passed)"}
              </p>
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {/* Secondary Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-outline)",
                  backgroundColor: "var(--color-surface-container-low)",
                  color: "var(--color-on-surface)",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Close
              </button>

              {/* Primary Start/Stop Processing Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  void handleToggleProcessing();
                }}
                disabled={isTogglingProcessing}
                style={{
                  padding: "8px 18px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: isProcessingBook
                    ? "var(--color-error)"
                    : "var(--color-primary)",
                  color: isProcessingBook
                    ? "var(--color-on-error)"
                    : "var(--color-on-primary)",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: isTogglingProcessing ? "not-allowed" : "pointer",
                  opacity: isTogglingProcessing ? 0.65 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                }}
              >
                {isTogglingProcessing ? (
                  isProcessingBook ? (
                    "Stopping..."
                  ) : (
                    "Starting..."
                  )
                ) : (
                  <>
                    <span>{isProcessingBook ? "Stop Processing" : "Start Processing"}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Notes Drawer */}
      <UploadNotesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        bookId={book.id}
        bookTitle={book.title}
      />
    </div>
  );
}
