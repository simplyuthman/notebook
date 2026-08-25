"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadNotesModal from "./UploadNotesModal";

interface UploadNotesButtonProps {
  bookId: string;
  bookTitle: string;
  imagesCount?: number;
  buttonText?: string;
}

export default function UploadNotesButton({
  bookId,
  bookTitle,
  imagesCount = 0,
  buttonText,
}: UploadNotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const hasNotes = imagesCount > 0;
  const label = buttonText || (hasNotes ? "Continue" : "Upload notes");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasNotes) {
      // Navigate by title — never expose the raw database ID in the URL
      router.push(`/dashboard?book=${encodeURIComponent(bookTitle)}`);
    } else {
      // If no notes uploaded yet, open the Upload Notes Drawer
      setIsOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        style={
          hasNotes
            ? {
                // Primary button style — shown once a book has notes ("Continue")
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "var(--typography-label-medium-fontfamily)",
                fontSize: "var(--typography-label-medium-fontsize)",
                fontWeight: "600",
                color: "var(--color-on-primary)",
                backgroundColor: "var(--color-primary)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }
            : {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "var(--typography-label-medium-fontfamily)",
                fontSize: "var(--typography-label-medium-fontsize)",
                fontWeight: "600",
                color: "var(--color-primary)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }
        }
      >
        {label}
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
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {!hasNotes && (
        <UploadNotesModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          bookId={bookId}
          bookTitle={bookTitle}
        />
      )}
    </>
  );
}
