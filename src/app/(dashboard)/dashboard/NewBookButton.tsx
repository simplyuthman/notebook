"use client";

import { useState } from "react";
import CreateBookModal from "./CreateBookModal";

interface NewBookButtonProps {
  buttonText?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function NewBookButton({
  buttonText = "New Book",
  style,
  className = "primary-action-btn",
}: NewBookButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={className}
        onClick={() => setIsOpen(true)}
        style={{
          padding:
            "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
          border: "none",
          borderRadius: "calc(var(--spacing-collection-small-spacing) * 1px)",
          fontFamily: "var(--typography-label-large-fontfamily)",
          fontSize: "var(--typography-label-large-fontsize)",
          fontWeight: "500",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
          ...style,
        }}
      >
        <span style={{ fontSize: "var(--typography-headline-small-fontsize)", lineHeight: 1 }}>
          +
        </span>{" "}
        {buttonText}
      </button>

      <CreateBookModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
