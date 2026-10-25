import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { generateBookPdf } from "@/server/books/pdf";

/**
 * GET /api/books/[id]/export?format=txt|md
 *
 * Scaffolder compliance:
 * 1. Checks session first.
 * 2. Checks book ownership (book.userId === session.userId).
 * 3. Formats transcribed sections into requested format (.txt or .md).
 * 4. Returns downloadable text attachment.
 */
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const bookId = params.id;

    // 1. Session verification
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    // 2. Ownership check
    const book = await db.book.findFirst({
      where: { id: bookId, userId },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
        sections: {
          orderBy: { order: "asc" },
          include: {
            flags: true,
            diagrams: true,
            sourceImage: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found or access denied." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "txt").toLowerCase();

    // Check live subscription for watermark status (R25, R34)
    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    });

    const isPro =
      subscription?.status === "ACTIVE" &&
      subscription.currentPeriodEnd > new Date();

    const watermarkNotice = !isPro
      ? "\n---\n*Exported with NotesBook — Free Plan*\n"
      : "";

    const safeTitle = (book.title || "notes")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const sectionId = searchParams.get("sectionId") || undefined;

    if (format === "pdf") {
      const pdfBuffer = await generateBookPdf({
        book,
        isPro,
        singleSectionId: sectionId,
      });

      const filename = sectionId ? `${safeTitle}-section.pdf` : `${safeTitle}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(pdfBuffer.length),
        },
      });
    }

    if (format === "md" || format === "markdown") {
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

      md += watermarkNotice;

      return new NextResponse(md, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeTitle}.md"`,
        },
      });
    }

    // Default plain text format
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

    return new NextResponse(txt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}.txt"`,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to export book";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
