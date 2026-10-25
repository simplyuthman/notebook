import { PDFDocument, rgb, StandardFonts, degrees, PDFFont, PDFPage } from "pdf-lib";

export interface PdfExportBook {
  id: string;
  title: string;
  chapters?: Array<{
    id: string;
    title: string;
    order: number;
  }>;
  sections: Array<{
    id: string;
    order: number;
    chapterId?: string | null;
    originalText: string;
    editedText?: string | null;
    sourceImage?: {
      imageOrder?: number | null;
      originalName?: string | null;
    } | null;
    flags?: Array<{
      type: string;
      suggestion?: string | null;
    }>;
  }>;
}

export interface GeneratePdfOptions {
  book: PdfExportBook;
  isPro?: boolean;
  singleSectionId?: string;
}

function wrapTextToLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  // Normalize characters for standard Helvetica (ASCII / WinAnsi)
  const clean = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");

  const paragraphs = clean.split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      if (!word) continue;
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

/**
 * Generates a clean, professional PDF from transcribed note sections.
 * Satisfies PRD Stage 7 (Export) and rules R23, R25, R34:
 * - Checks live Pro subscription for watermark exclusion
 * - Preserves headings, chapters, sections, and note ordering
 * - Formats flags and warnings
 */
export async function generateBookPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const { book, isPro = false, singleSectionId } = options;

  const doc = await PDFDocument.create();
  doc.setTitle(book.title);
  doc.setAuthor("NotesBook");
  doc.setCreator("NotesBook AI Digital Note System");
  doc.setCreationDate(new Date());

  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  // A4 page dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 50;
  const marginTop = 60;
  const marginBottom = 65;
  const contentWidth = pageWidth - marginX * 2;

  let currentPage: PDFPage = doc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - marginTop;

  function ensureSpace(requiredHeight: number) {
    if (currentY - requiredHeight < marginBottom) {
      currentPage = doc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - marginTop;
    }
  }

  // Filter sections if singleSectionId is provided
  const targetSections = singleSectionId
    ? book.sections.filter((s) => s.id === singleSectionId)
    : book.sections;

  // Document Cover / Title Header
  ensureSpace(90);
  currentPage.drawText(book.title || "Transcribed Notes", {
    x: marginX,
    y: currentY,
    size: 20,
    font: boldFont,
    color: rgb(0.04, 0.15, 0.35), // Primary Navy
  });
  currentY -= 26;

  const subtitle = singleSectionId
    ? `Single Section Export · Generated ${new Date().toLocaleDateString()}`
    : `${targetSections.length} Transcribed Note Section${targetSections.length === 1 ? "" : "s"} · Generated ${new Date().toLocaleDateString()}`;

  currentPage.drawText(subtitle, {
    x: marginX,
    y: currentY,
    size: 10,
    font: regularFont,
    color: rgb(0.4, 0.45, 0.5),
  });
  currentY -= 16;

  // Divider line below header
  currentPage.drawLine({
    start: { x: marginX, y: currentY },
    end: { x: pageWidth - marginX, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  });
  currentY -= 20;

  if (targetSections.length === 0) {
    ensureSpace(30);
    currentPage.drawText("No transcribed sections available to export.", {
      x: marginX,
      y: currentY,
      size: 11,
      font: italicFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  } else {
    // Group sections by chapter if chapters are present
    let lastChapterId: string | null = null;

    for (let sIdx = 0; sIdx < targetSections.length; sIdx++) {
      const section = targetSections[sIdx];

      // Chapter header if chapter changed
      if (book.chapters && section.chapterId && section.chapterId !== lastChapterId) {
        lastChapterId = section.chapterId;
        const chapter = book.chapters.find((c) => c.id === section.chapterId);
        if (chapter) {
          ensureSpace(50);
          currentY -= 10;
          currentPage.drawText(`Chapter ${chapter.order}: ${chapter.title}`, {
            x: marginX,
            y: currentY,
            size: 14,
            font: boldFont,
            color: rgb(0.1, 0.2, 0.4),
          });
          currentY -= 18;
        }
      }

      // Section Header (Page Index + Order)
      ensureSpace(35);
      const pageNum = section.sourceImage?.imageOrder ?? section.order;
      const sectionHeader = `Section ${section.order} (Page #${pageNum})`;

      currentPage.drawText(sectionHeader, {
        x: marginX,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.25, 0.3),
      });
      currentY -= 16;

      // Section Body Text
      const text = section.editedText || section.originalText || "No text available.";
      const lines = wrapTextToLines(text, regularFont, 10, contentWidth);

      for (const line of lines) {
        ensureSpace(15);
        if (line) {
          currentPage.drawText(line, {
            x: marginX,
            y: currentY,
            size: 10,
            font: regularFont,
            color: rgb(0.15, 0.15, 0.15),
          });
        }
        currentY -= 14;
      }

      // Flag details if present (R10, R11)
      if (section.flags && section.flags.length > 0) {
        ensureSpace(20);
        currentY -= 4;
        for (const flag of section.flags) {
          ensureSpace(14);
          const flagNotice = `[${flag.type}]: ${flag.suggestion || "Unreadable text span"}`;
          currentPage.drawText(flagNotice, {
            x: marginX + 10,
            y: currentY,
            size: 8.5,
            font: italicFont,
            color: rgb(0.7, 0.35, 0.1),
          });
          currentY -= 12;
        }
      }

      currentY -= 16; // Margin between sections
    }
  }

  // Final Pass: Headers, Footers, Page Numbers & Watermark (R25, R34)
  const totalPages = doc.getPageCount();

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const page = doc.getPage(pIdx);

    // Running Header (pages > 0)
    if (pIdx > 0) {
      page.drawText(book.title.slice(0, 45), {
        x: marginX,
        y: pageHeight - 35,
        size: 8,
        font: italicFont,
        color: rgb(0.5, 0.55, 0.6),
      });
      page.drawLine({
        start: { x: marginX, y: pageHeight - 40 },
        end: { x: pageWidth - marginX, y: pageHeight - 40 },
        thickness: 0.5,
        color: rgb(0.85, 0.87, 0.9),
      });
    }

    // Running Footer
    page.drawLine({
      start: { x: marginX, y: 45 },
      end: { x: pageWidth - marginX, y: 45 },
      thickness: 0.5,
      color: rgb(0.85, 0.87, 0.9),
    });

    const pageStr = `Page ${pIdx + 1} of ${totalPages}`;
    const pageStrWidth = regularFont.widthOfTextAtSize(pageStr, 8);
    page.drawText(pageStr, {
      x: pageWidth - marginX - pageStrWidth,
      y: 32,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.55, 0.6),
    });

    // Watermark rule: FREE plan gets visible footer and diagonal watermark (R25, R34)
    if (!isPro) {
      page.drawText("Exported with NotesBook — Free Plan", {
        x: marginX,
        y: 32,
        size: 8,
        font: boldFont,
        color: rgb(0.55, 0.6, 0.65),
      });

      page.drawText("NotesBook Free Plan", {
        x: 100,
        y: 380,
        size: 38,
        font: boldFont,
        color: rgb(0.93, 0.93, 0.93),
        rotate: degrees(35),
      });
    }
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
