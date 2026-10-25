"use client";

import { useState } from "react";
import Link from "next/link";
import type { SerializedBook } from "@/server/books";

interface DownloadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: SerializedBook;
  isPro?: boolean;
}

export default function DownloadBookModal({
  isOpen,
  onClose,
  book,
  isPro = false,
}: DownloadBookModalProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"formats" | "preview">("formats");

  if (!isOpen) return null;

  const totalSections = book.sections.length;
  const totalImages = book.images.length;
  const totalWords = book.sections.reduce((acc, s) => {
    const text = s.editedText || s.originalText || "";
    return acc + text.split(/\s+/).filter(Boolean).length;
  }, 0);

  const safeFilename = (book.title || "notes")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Generate plain text
  const generateTextContent = () => {
    let txt = `${book.title}\n`;
    txt += `Generated: ${new Date().toLocaleDateString()}\n`;
    txt += `========================================\n\n`;

    if (book.sections.length === 0) {
      txt += `No transcribed sections available yet.\n`;
    } else {
      for (const section of book.sections) {
        const pageNum = section.sourceImage?.imageOrder ?? section.order;
        txt += `--- SECTION ${section.order} (PAGE #${pageNum}) ---\n\n`;
        const text = section.editedText || section.originalText;
        txt += `${text}\n\n`;
      }
    }

    if (!isPro) {
      txt += `\n========================================\nExported with NotesBook — Free Plan\n`;
    }
    return txt;
  };

  // Generate Markdown
  const generateMarkdownContent = () => {
    let md = `# ${book.title}\n\n`;
    md += `*Generated: ${new Date().toLocaleDateString()}*\n\n`;

    if (book.sections.length === 0) {
      md += `*No transcribed sections available yet.*\n`;
    } else {
      for (const section of book.sections) {
        const pageNum = section.sourceImage?.imageOrder ?? section.order;
        md += `## Section ${section.order} (Page #${pageNum})\n\n`;
        const text = section.editedText || section.originalText;
        md += `${text}\n\n`;

        if (section.flags && section.flags.length > 0) {
          md += `> **Flags:**\n`;
          for (const flag of section.flags) {
            md += `> - [${flag.type}] ${flag.suggestion || "Unreadable text span"}\n`;
          }
          md += `\n`;
        }
      }
    }

    if (!isPro) {
      md += `\n---\n*Exported with NotesBook — Free Plan*\n`;
    }
    return md;
  };

  // Trigger client-side file download
  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    setDownloadingFormat("txt");
    try {
      const content = generateTextContent();
      downloadFile(content, `${safeFilename}.txt`, "text/plain;charset=utf-8");
    } finally {
      setTimeout(() => setDownloadingFormat(null), 600);
    }
  };

  const handleDownloadMd = () => {
    setDownloadingFormat("md");
    try {
      const content = generateMarkdownContent();
      downloadFile(content, `${safeFilename}.md`, "text/markdown;charset=utf-8");
    } finally {
      setTimeout(() => setDownloadingFormat(null), 600);
    }
  };

  // Direct PDF document download via server generator
  const handleDownloadPdf = async () => {
    setDownloadingFormat("pdf");
    try {
      const res = await fetch(`/api/books/${book.id}/export?format=pdf`);
      if (!res.ok) {
        throw new Error("Failed to generate PDF document");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFilename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to download PDF.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Print to PDF with print styles and watermark
  const handlePrintPdf = () => {
    setDownloadingFormat("pdf");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate and download the PDF.");
      setDownloadingFormat(null);
      return;
    }

    const sectionsHtml = book.sections.length === 0
      ? `<p><em>No transcribed sections available.</em></p>`
      : book.sections
          .map((sec) => {
            const pageNum = sec.sourceImage?.imageOrder ?? sec.order;
            const text = (sec.editedText || sec.originalText || "").replace(/\n/g, "<br/>");
            return `
              <div class="section-block">
                <h3>Section #${sec.order} &bull; Page #${pageNum}</h3>
                <div class="section-body">${text}</div>
              </div>
            `;
          })
          .join("");

    const watermarkHtml = !isPro
      ? `<div class="watermark-badge">Generated with NotesBook &bull; Free Plan</div>`
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${book.title} - NotesBook</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
              color: #191919;
              line-height: 1.6;
              padding: 0;
              margin: 0;
            }
            .book-header {
              border-bottom: 2px solid #002499;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .book-title {
              font-size: 26px;
              font-weight: 700;
              margin: 0 0 6px 0;
              color: #0741ff;
            }
            .book-meta {
              font-size: 13px;
              color: #4c4c4c;
            }
            .section-block {
              margin-bottom: 28px;
              page-break-inside: avoid;
            }
            .section-block h3 {
              font-size: 16px;
              font-weight: 600;
              margin: 0 0 8px 0;
              color: #333333;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .section-body {
              font-size: 14px;
              line-height: 1.7;
              color: #191919;
              white-space: pre-wrap;
            }
            .watermark-badge {
              margin-top: 40px;
              padding-top: 16px;
              border-top: 1px dashed #dedede;
              text-align: center;
              font-size: 12px;
              color: #990000;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            @media print {
              .watermark-badge {
                display: block;
              }
            }
          </style>
        </head>
        <body>
          <div class="book-header">
            <h1 class="book-title">${book.title}</h1>
            <div class="book-meta">Exported on ${new Date().toLocaleDateString()} &bull; ${totalSections} Section(s)</div>
          </div>
          ${sectionsHtml}
          ${watermarkHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => setDownloadingFormat(null), 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--color-scrim)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "calc(var(--spacing-collection-base-spacing) * 1px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "calc(var(--spacing-collection-medium-spacing) * 1px)",
          maxWidth: "580px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "calc(var(--spacing-collection-large-spacing) * 1px)",
          border: "1px solid var(--color-outline)",
          boxShadow: "var(--effect-hard-shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "calc(var(--spacing-collection-base-spacing) * 1px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              id="download-modal-title"
              style={{
                margin: 0,
                fontFamily: "var(--typography-title-large-fontfamily)",
                fontSize: "var(--typography-title-medium-fontsize)",
                fontWeight: "600",
                color: "var(--color-on-surface)",
              }}
            >
              Download Transcribed Notes
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                fontFamily: "var(--typography-body-small-fontfamily)",
                fontSize: "var(--typography-body-small-fontsize)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              {book.title} &bull; {totalSections} section(s) &bull; {totalWords} words
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "var(--color-surface-container-high)",
              border: "1px solid var(--color-outline)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-on-surface)",
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

        {/* Plan / Watermark Status Alert (PRD R25 / Rule 6) */}
        <div
          style={{
            padding: "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
            borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
            backgroundColor: isPro
              ? "var(--color-primary-container)"
              : "var(--color-surface-container-high)",
            border: `1px solid ${isPro ? "var(--color-primary)" : "var(--color-outline)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "calc(var(--spacing-collection-small-spacing) * 1px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isPro ? "var(--color-on-primary-container)" : "var(--color-on-surface-variant)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isPro ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
            <span
              style={{
                fontFamily: "var(--typography-label-medium-fontfamily)",
                fontSize: "var(--typography-label-medium-fontsize)",
                fontWeight: "600",
                color: isPro ? "var(--color-on-primary-container)" : "var(--color-on-surface)",
              }}
            >
              {isPro
                ? "PRO Plan — Unbranded watermark-free export"
                : "Free Plan — Watermark included on PDF exports"}
            </span>
          </div>

          {!isPro && (
            <Link
              href="/billing"
              style={{
                fontFamily: "var(--typography-label-small-fontfamily)",
                fontSize: "var(--typography-label-small-fontsize)",
                fontWeight: "700",
                color: "var(--color-primary)",
                textDecoration: "underline",
                whiteSpace: "nowrap",
              }}
            >
              Upgrade to PRO
            </Link>
          )}
        </div>

        {/* Tab switcher: Formats / Preview */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--color-outline)",
            gap: "calc(var(--spacing-collection-base-spacing) * 1px)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("formats")}
            style={{
              padding: "calc(var(--spacing-collection-small-spacing) * 1px) 0",
              border: "none",
              borderBottom: activeTab === "formats" ? "2px solid var(--color-primary)" : "2px solid transparent",
              background: "transparent",
              color: activeTab === "formats" ? "var(--color-primary)" : "var(--color-on-surface-variant)",
              fontFamily: "var(--typography-label-large-fontfamily)",
              fontSize: "var(--typography-label-large-fontsize)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Export Options
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            style={{
              padding: "calc(var(--spacing-collection-small-spacing) * 1px) 0",
              border: "none",
              borderBottom: activeTab === "preview" ? "2px solid var(--color-primary)" : "2px solid transparent",
              background: "transparent",
              color: activeTab === "preview" ? "var(--color-primary)" : "var(--color-on-surface-variant)",
              fontFamily: "var(--typography-label-large-fontfamily)",
              fontSize: "var(--typography-label-large-fontsize)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Text Preview
          </button>
        </div>

        {/* Content: Formats */}
        {activeTab === "formats" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "calc(var(--spacing-collection-small-spacing) * 1px)",
            }}
          >
            {/* Format 1: PDF */}
            <div
              style={{
                border: "1px solid var(--color-outline)",
                borderRadius: "calc(var(--spacing-collection-small-spacing) * 1px)",
                padding: "calc(var(--spacing-collection-base-spacing) * 1px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--color-surface-container-lowest)",
                gap: "calc(var(--spacing-collection-base-spacing) * 1px)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--typography-title-medium-fontfamily)",
                      fontSize: "var(--typography-title-medium-fontsize)",
                      fontWeight: "600",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    PDF Document (.pdf)
                  </span>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      backgroundColor: "var(--color-primary-container)",
                      color: "var(--color-on-primary-container)",
                    }}
                  >
                    Printable
                  </span>
                </div>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontFamily: "var(--typography-body-small-fontfamily)",
                    fontSize: "var(--typography-body-small-fontsize)",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  Formatted book with chapters, section headings, and page layout.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingFormat === "pdf" || totalSections === 0}
                  style={{
                    padding: "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                    borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                    border: "none",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                    fontFamily: "var(--typography-label-large-fontfamily)",
                    fontSize: "var(--typography-label-large-fontsize)",
                    fontWeight: "600",
                    cursor: totalSections === 0 ? "not-allowed" : "pointer",
                    opacity: totalSections === 0 ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    boxShadow: "var(--effect-soft-shadow)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloadingFormat === "pdf" ? "Generating PDF..." : "Download PDF"}
                </button>

                <button
                  type="button"
                  onClick={handlePrintPdf}
                  disabled={totalSections === 0}
                  title="Open formatted print preview"
                  style={{
                    padding: "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-small-spacing) * 1.2px)",
                    borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                    border: "1px solid var(--color-outline)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-on-surface)",
                    fontFamily: "var(--typography-label-large-fontfamily)",
                    fontSize: "var(--typography-label-large-fontsize)",
                    fontWeight: "600",
                    cursor: totalSections === 0 ? "not-allowed" : "pointer",
                    opacity: totalSections === 0 ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print
                </button>
              </div>
            </div>

            {/* Format 2: Markdown */}
            <div
              style={{
                border: "1px solid var(--color-outline)",
                borderRadius: "calc(var(--spacing-collection-small-spacing) * 1px)",
                padding: "calc(var(--spacing-collection-base-spacing) * 1px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--color-surface-container-lowest)",
                gap: "calc(var(--spacing-collection-base-spacing) * 1px)",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--typography-title-medium-fontfamily)",
                    fontSize: "var(--typography-title-medium-fontsize)",
                    fontWeight: "600",
                    color: "var(--color-on-surface)",
                  }}
                >
                  Markdown (.md)
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontFamily: "var(--typography-body-small-fontfamily)",
                    fontSize: "var(--typography-body-small-fontsize)",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  Structured markdown with headings and unreadable span flags.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadMd}
                disabled={downloadingFormat === "md" || totalSections === 0}
                style={{
                  padding: "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                  borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                  border: "1px solid var(--color-outline)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  fontFamily: "var(--typography-label-large-fontfamily)",
                  fontSize: "var(--typography-label-large-fontsize)",
                  fontWeight: "600",
                  cursor: totalSections === 0 ? "not-allowed" : "pointer",
                  opacity: totalSections === 0 ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {downloadingFormat === "md" ? "Saving..." : "Download .md"}
              </button>
            </div>

            {/* Format 3: Plain text */}
            <div
              style={{
                border: "1px solid var(--color-outline)",
                borderRadius: "calc(var(--spacing-collection-small-spacing) * 1px)",
                padding: "calc(var(--spacing-collection-base-spacing) * 1px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--color-surface-container-lowest)",
                gap: "calc(var(--spacing-collection-base-spacing) * 1px)",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--typography-title-medium-fontfamily)",
                    fontSize: "var(--typography-title-medium-fontsize)",
                    fontWeight: "600",
                    color: "var(--color-on-surface)",
                  }}
                >
                  Plain Text (.txt)
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontFamily: "var(--typography-body-small-fontfamily)",
                    fontSize: "var(--typography-body-small-fontsize)",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  Clean text for reading, archiving, or pasting into other apps.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTxt}
                disabled={downloadingFormat === "txt" || totalSections === 0}
                style={{
                  padding: "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
                  borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                  border: "1px solid var(--color-outline)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  fontFamily: "var(--typography-label-large-fontfamily)",
                  fontSize: "var(--typography-label-large-fontsize)",
                  fontWeight: "600",
                  cursor: totalSections === 0 ? "not-allowed" : "pointer",
                  opacity: totalSections === 0 ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {downloadingFormat === "txt" ? "Saving..." : "Download .txt"}
              </button>
            </div>
          </div>
        )}

        {/* Content: Preview */}
        {activeTab === "preview" && (
          <div
            style={{
              backgroundColor: "var(--color-surface-container-highest)",
              padding: "calc(var(--spacing-collection-base-spacing) * 1px)",
              borderRadius: "calc(var(--spacing-collection-small-spacing) * 1px)",
              border: "1px solid var(--color-outline)",
              maxHeight: "260px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: 1.5,
              color: "var(--color-on-surface)",
              whiteSpace: "pre-wrap",
            }}
          >
            {generateTextContent()}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "calc(var(--spacing-collection-small-spacing) * 1px)",
            borderTop: "1px solid var(--color-outline)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-base-spacing) * 1px)",
              borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
              border: "1px solid var(--color-outline)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-on-surface)",
              fontFamily: "var(--typography-label-large-fontfamily)",
              fontSize: "var(--typography-label-large-fontsize)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

