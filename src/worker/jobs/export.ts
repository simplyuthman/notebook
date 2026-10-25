import { db } from "@/server/db";
import { generateBookPdf } from "@/server/books/pdf";

export interface ExportJobData {
  jobId: string;
  bookId: string;
  userId: string;
}

/**
 * Stage 7: PDF Export pipeline job.
 * Checks live Subscription for PRO status (R25, R34) to determine watermark inclusion.
 * Renders complete book with chapters, sections, and flags to PDF.
 */
export async function processExportJob(jobData: ExportJobData): Promise<Buffer> {
  const { jobId, bookId, userId } = jobData;

  // Mark job as RUNNING
  if (jobId) {
    await db.job.update({
      where: { id: jobId },
      data: { status: "RUNNING" },
    });
  }

  try {
    const book = await db.book.findFirst({
      where: { id: bookId, userId },
      include: {
        chapters: { orderBy: { order: "asc" } },
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
      throw new Error("Book not found for export.");
    }

    // Check live subscription (R25, R34 - never cached)
    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    });

    const isPro =
      subscription?.status === "ACTIVE" &&
      subscription.currentPeriodEnd > new Date();

    const pdfBuffer = await generateBookPdf({
      book,
      isPro,
    });

    if (jobId) {
      await db.job.update({
        where: { id: jobId },
        data: { status: "SUCCEEDED" },
      });
    }

    return pdfBuffer;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Export failed";
    console.error("export.job.failed", { jobId, bookId, errorMsg });

    if (jobId) {
      await db.job.update({
        where: { id: jobId },
        data: { status: "FAILED", error: errorMsg },
      });
    }

    throw err;
  }
}
