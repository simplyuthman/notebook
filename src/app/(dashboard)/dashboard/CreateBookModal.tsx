"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBookModal({ isOpen, onClose }: CreateBookModalProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create book");
      }

      setTitle("");
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline)",
          borderRadius: "calc(var(--spacing-collection-medium-spacing, 12) * 1px)",
          padding: "calc(var(--spacing-collection-extra-large-spacing, 24) * 1px)",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "var(--typography-title-large-fontfamily)",
            fontSize: "var(--typography-title-large-fontsize)",
            fontWeight: "600",
            color: "var(--color-on-surface)",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Create New Book
        </h2>
        <p
          style={{
            fontFamily: "var(--typography-body-medium-fontfamily)",
            fontSize: "var(--typography-body-medium-fontsize)",
            color: "var(--color-on-surface-variant)",
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          Give your new notes book a title to get started.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--color-error-container)",
              color: "var(--color-on-error-container)",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="book-title"
              style={{
                display: "block",
                fontFamily: "var(--typography-label-medium-fontfamily)",
                fontSize: "var(--typography-label-medium-fontsize)",
                fontWeight: "500",
                color: "var(--color-on-surface)",
                marginBottom: "6px",
              }}
            >
              Book Title
            </label>
            <input
              id="book-title"
              type="text"
              placeholder="e.g. Organic Chemistry 101"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid var(--color-outline)",
                backgroundColor: "var(--color-surface-container-lowest)",
                color: "var(--color-on-surface)",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid var(--color-outline)",
                backgroundColor: "transparent",
                color: "var(--color-on-surface-variant)",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-action-btn"
              disabled={loading || !title.trim()}
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                fontWeight: "500",
                cursor: loading || !title.trim() ? "not-allowed" : "pointer",
                opacity: loading || !title.trim() ? 0.6 : 1,
              }}
            >
              {loading ? "Creating..." : "Create Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
