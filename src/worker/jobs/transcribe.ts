import type { TranscribeJobData } from "../transcribeQueue";
import { getObjectBuffer } from "@/server/storage";
import { db } from "@/server/db";
import { aiService } from "@/server/ai";
import { config } from "@/config";
import type { SectionConfidence, FlagType } from "@prisma/client";

/**
 * Rolls up the overall status of a book after a TRANSCRIBE job completes or fails.
 * If all TRANSCRIBE jobs are done, sets book to READY (or DRAFT if all failed).
 * PRD Section 7: "A failed image does not fail the batch... reaches a PARTIAL outcome and continues."
 */
async function rollUpBatchStatus(bookId: string): Promise<void> {
  const allJobs = await db.job.findMany({
    where: { bookId, type: "TRANSCRIBE" },
    select: { status: true },
  });

  const hasPending = allJobs.some(
    (j) => j.status === "QUEUED" || j.status === "RUNNING"
  );

  if (!hasPending && allJobs.length > 0) {
    const anySucceeded = allJobs.some((j) => j.status === "SUCCEEDED");
    if (anySucceeded) {
      await db.book.update({
        where: { id: bookId },
        data: { status: "READY" },
      });
    } else {
      await db.book.update({
        where: { id: bookId },
        data: { status: "DRAFT" },
      });
    }
  }
}

/**
 * Executes the TRANSCRIBE job for one image in the BullMQ worker.
 * Stages 1–4 per PRD Section 6 and pipeline-job-builder skill:
 * - Stage 1: Quality check & retrieval from object storage
 * - Stage 2: Vision OCR transcription & span confidence via aiService
 * - Stage 3: Low-confidence & gap flags stored as TranscriptionFlag records (R10, R11)
 * - Stage 4: Diagrams detected & stored as Diagram records with in-flow order (R12)
 *
 * Enforces per-image failure isolation (AGENTS.md rule 11): one failing image
 * never fails the batch or other jobs.
 */
export async function processTranscribeJob(jobData: TranscribeJobData): Promise<void> {
  const { jobId, bookId, imageId, storageKey } = jobData;

  const job = await db.job.findUnique({
    where: { id: jobId },
  });

  // If stopped by user or already handled, don't re-run
  if (!job || job.status === "FAILED" || job.status === "SUCCEEDED") {
    return;
  }

  // 1. Mark job as running and increment attempts
  await db.job.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      attempts: { increment: 1 },
    },
  });

  try {
    // 2. Check per-book AI cost ceiling (AGENTS.md Section 3 rule 10)
    const existingSectionsCount = await db.section.count({
      where: { bookId },
    });
    const projectedCost = (existingSectionsCount + 1) * config.aiCostPerImage;

    if (projectedCost > config.aiCostCeiling) {
      const ceilingError =
        "Per-book AI cost ceiling reached. Please upgrade plan or add credits to continue.";
      await db.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: ceilingError,
        },
      });
      await rollUpBatchStatus(bookId);
      return;
    }

    // 3. Fetch image binary from object storage (or dev local fallback)
    const imageBuffer = await getObjectBuffer(storageKey);
    if (!imageBuffer) {
      throw new Error(`Image file could not be read from storage (${storageKey})`);
    }

    const sourceImage = await db.sourceImage.findUnique({
      where: { id: imageId },
      select: { format: true, imageOrder: true },
    });

    // 4. Call centralized AI interface (src/server/ai/)
    const transcription = await aiService.transcribe({
      buffer: imageBuffer,
      storageKey,
      mimeType: sourceImage?.format ?? "image/jpeg",
    });

    // Determine overall section confidence
    let sectionConfidence: SectionConfidence = "HIGH";
    if (transcription.spans.some((s) => s.confidence === "GAP")) {
      sectionConfidence = "GAP";
    } else if (transcription.spans.some((s) => s.confidence === "LOW")) {
      sectionConfidence = "LOW";
    }

    const fullText = transcription.spans.map((s) => s.text).join(" ").trim();
    const sectionOrder = sourceImage?.imageOrder ?? existingSectionsCount + 1;

    // 5. Persist Section, Flags, Diagrams, and update SourceImage & Job atomically
    await db.$transaction(async (tx) => {
      const section = await tx.section.create({
        data: {
          bookId,
          sourceImageId: imageId,
          order: sectionOrder,
          originalText: fullText || "[No handwriting detected]",
          confidence: sectionConfidence,
        },
      });

      // Write transcription flags for low-confidence or gap spans (R10, R11)
      const flagSpans = transcription.spans.filter(
        (s) => s.confidence === "LOW" || s.confidence === "GAP"
      );

      for (const span of flagSpans) {
        await tx.transcriptionFlag.create({
          data: {
            sectionId: section.id,
            startOffset: span.startOffset,
            endOffset: span.endOffset,
            type: span.confidence as FlagType,
            suggestion: span.confidence === "LOW" ? span.text : null,
          },
        });
      }

      // Write diagrams detected with in-flow ordering (R12)
      for (const diagram of transcription.diagrams) {
        await tx.diagram.create({
          data: {
            sourceImageId: imageId,
            sectionId: section.id,
            storageKey,
            caption: diagram.caption,
            order: diagram.order,
          },
        });
      }

      // Mark image as transcribed
      await tx.sourceImage.update({
        where: { id: imageId },
        data: { status: "TRANSCRIBED" },
      });

      // Mark job as succeeded
      await tx.job.update({
        where: { id: jobId },
        data: { status: "SUCCEEDED", error: null },
      });
    });

    // Check if the entire book processing has completed
    await rollUpBatchStatus(bookId);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("worker.transcribe.failed", {
      jobId,
      imageId,
      error: errorMessage,
    });

    // Per-image isolation: record failure for this image, do not fail entire batch
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: errorMessage,
      },
    });

    await db.sourceImage.update({
      where: { id: imageId },
      data: { status: "FAILED" },
    });

    await rollUpBatchStatus(bookId);
  }
}
