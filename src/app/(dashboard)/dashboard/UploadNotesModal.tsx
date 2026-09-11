"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/config";

interface UploadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
}

export default function UploadNotesModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
}: UploadNotesModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<"form" | "success">("form");
  const [uploadedCount, setUploadedCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setError(null);
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic"];

    const newFiles: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const isHeic = file.name.toLowerCase().endsWith(".heic");
      const isTypeValid = validTypes.includes(file.type.toLowerCase()) || isHeic;

      if (!isTypeValid) {
        setError(`"${file.name}" rejected. Only JPEG, PNG, and HEIC files are accepted.`);
      } else if (file.size > config.limits.maxFileSizeBytes) {
        setError(`"${file.name}" rejected. File size exceeds the maximum of ${config.limits.maxFileSizeMB} MB.`);
      } else {
        newFiles.push(file);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one photo of your notes.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filePayloads = files.map((f) => ({
        name: f.name,
        type: f.type || "image/jpeg",
        size: f.size,
      }));

      // 1. Request presigned upload URLs from server
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          files: filePayloads,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate upload.");
      }

      // 2. Direct-to-storage upload if presigned URLs were provided (Cloudflare R2 / S3)
      if (data.hasObjectStorage && Array.isArray(data.uploads)) {
        const uploadedImageIds: string[] = [];
        const uploadErrors: string[] = [];

        await Promise.all(
          data.uploads.map(async (uploadItem: { id: string; name: string; uploadUrl: string | null }, idx: number) => {
            const file = files[idx];
            if (uploadItem.uploadUrl && file) {
              try {
                const putRes = await fetch(uploadItem.uploadUrl, {
                  method: "PUT",
                  headers: {
                    "Content-Type": file.type || "image/jpeg",
                  },
                  body: file,
                });

                if (!putRes.ok) {
                  throw new Error(`Storage upload failed for ${uploadItem.name}`);
                }
                uploadedImageIds.push(uploadItem.id);
              } catch (putErr) {
                console.error("Direct storage upload error:", putErr);
                uploadErrors.push(uploadItem.name);
              }
            }
          })
        );

        if (uploadErrors.length > 0 && uploadedImageIds.length === 0) {
          throw new Error(`Failed to upload images to cloud storage: ${uploadErrors.join(", ")}`);
        }

        // 3. Mark successful uploads as UPLOADED
        if (uploadedImageIds.length > 0) {
          await fetch("/api/upload", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookId,
              imageIds: uploadedImageIds,
            }),
          });
        }
      }

      // 2b. Dev-mode local fallback — upload binaries to server when R2 is not configured
      if (!data.hasObjectStorage && Array.isArray(data.uploads)) {
        await Promise.all(
          data.uploads.map(async (uploadItem: { id: string; name: string }, idx: number) => {
            const file = files[idx];
            if (!file) return;
            try {
              const formData = new FormData();
              formData.append("file", file);
              await fetch(`/api/images/${uploadItem.id}/data`, {
                method: "POST",
                body: formData,
              });
            } catch (localErr) {
              console.warn("Local image save failed (preview may be unavailable):", localErr);
            }
          })
        );
      }

      setUploadedCount(files.length);
      setFiles([]);
      setUploadStep("success");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForMore = () => {
    setUploadStep("form");
    setFiles([]);
    setError(null);
  };

  const handleGoToBook = () => {
    onClose();
    // Navigate by title — never expose the raw database ID in the URL
    router.push(`/dashboard?book=${encodeURIComponent(bookTitle)}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        transition: "opacity 0.25s ease-in-out",
      }}
    /* NOTE: Backdrop click intentionally does NOT call onClose per user requirement! */
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          backgroundColor: "var(--color-surface)",
          borderLeft: "1px solid var(--color-outline)",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.18)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: "24px",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <style jsx global>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--color-outline-variant)",
            marginBottom: "20px",
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
              {uploadStep === "form" ? "Upload Notes" : "Upload Complete"}
            </h2>
            <span
              style={{
                fontFamily: "var(--typography-label-small-fontfamily)",
                fontSize: "12px",
                color: "var(--color-on-surface-variant)",
              }}
            >
              {bookTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close Drawer"
            style={{
              background: "var(--color-surface-container-high)",
              border: "1px solid var(--color-outline)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              color: "var(--color-on-surface)",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            ✕
          </button>
        </div>

        {/* UPLOAD FORM */}
        {uploadStep === "form" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {error && (
              <div
                role="alert"
                style={{
                  padding: "12px 14px",
                  backgroundColor: "var(--color-error-container)",
                  color: "var(--color-on-error-container)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragOver ? "var(--color-primary)" : "var(--color-outline-variant)"}`,
                borderRadius: "10px",
                padding: "32px 20px",
                textAlign: "center",
                backgroundColor: isDragOver ? "var(--color-primary-container)" : "var(--color-surface-container-lowest)",
                cursor: loading ? "wait" : "pointer",
                transition: "border-color 0.2s, background-color 0.2s",
                marginBottom: "20px",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "10px" }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div
                style={{
                  fontFamily: "var(--typography-label-large-fontfamily)",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "var(--color-on-surface)",
                }}
              >
                Drag & drop photos here, or click to browse
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-on-surface-variant)", marginTop: "6px" }}>
                JPEG, PNG, HEIC · up to {config.limits.maxFileSizeMB} MB each
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,.heic"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={loading}
              />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "10px 14px",
                      backgroundColor: "var(--color-surface-container-low)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "var(--color-on-surface)",
                      border: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        minWidth: 0,
                      }}
                    >
                      {file.name}
                    </span>
                    {!loading && (
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => removeFile(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-on-surface-variant)",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "0 2px",
                          flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ flexGrow: 1 }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--color-outline-variant)" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-outline)",
                  backgroundColor: "transparent",
                  color: "var(--color-on-surface)",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || files.length === 0}
                style={{
                  flex: 2,
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: loading || files.length === 0 ? "not-allowed" : "pointer",
                  opacity: loading || files.length === 0 ? 0.65 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid var(--color-on-primary)",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    <span>Uploading…</span>
                  </>
                ) : (
                  `Upload ${files.length > 0 ? `${files.length} ` : ""}Photo${files.length === 1 ? "" : "s"}`
                )}
              </button>
            </div>
          </form>
        )}

        {/* SUCCESS */}
        {uploadStep === "success" && (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div
                aria-hidden="true"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                  fontSize: "24px",
                }}
              >
                ✓
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "var(--color-on-surface)",
                }}
              >
                {uploadedCount} photo{uploadedCount === 1 ? "" : "s"} uploaded.
              </p>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "13px",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Open your book and click “Start Processing” to transcribe them.
              </p>
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "16px", borderTop: "1px solid var(--color-outline-variant)" }}>
              <button
                type="button"
                onClick={handleGoToBook}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  fontWeight: "600",
                  fontSize: "15px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                View Book
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleResetForMore}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--color-on-surface-variant)",
                  fontWeight: "500",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Upload more photos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
