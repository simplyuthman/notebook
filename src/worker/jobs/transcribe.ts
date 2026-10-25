import { TranscribeJobData } from "../transcribeQueue";
import { getObjectBuffer } from "@/server/storage";
import { db } from "@/server/db";
import { aiService } from "@/server/ai";
import { config } from "@/config";
import { processStructureJob } from "./structure";
import type { SectionConfidence } from "@prisma/client";

/**
 * Executes the TRANSCRIBE job for one image in the BullMQ worker.
 * Follows Stages 1–4 per PRD Section 6 and pipeline-job-builder rules:
 * - Cost ceiling checked before AI spend (PRD Section 6)
 * - Isolated per-image failure (one failing image does not fail the batch)
 * - R10 & R11: Writes TranscriptionFlags for LOW and GAP spans with offsets
 * - R12: Extracts and links Diagrams
 * - Triggers Stage 5-6 structuring once all note images finish
 */
export async function processTranscribeJob(jobData: TranscribeJobData): Promise<void> {
  const { jobId, bookId, imageId, storageKey, userId } = jobData;

  // 1. Mark job as running and increment attempts
  await db.job.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      attempts: { increment: 1 },
    },
  });

  try {
    // 2. Cost Gate: Check per-book AI cost ceiling from config
    const existingTranscribedCount = await db.sourceImage.count({
      where: { bookId, status: "TRANSCRIBED" },
    });
    const currentCostMinor = existingTranscribedCount * config.aiCostPerImage;

    if (currentCostMinor >= config.aiCostCeiling) {
      await db.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: "Book has reached the AI cost ceiling. Upgrade or spend credits to continue.",
        },
      });
      await db.book.update({
        where: { id: bookId },
        data: { status: "DRAFT" },
      });
      return;
    }

    // 3. Fetch image binary from object storage (or dev-mode local storage fallback)
    const imageBuffer = await getObjectBuffer(storageKey);
    if (!imageBuffer) {
      throw new Error(`Note image binary could not be found in storage for key: ${storageKey}`);
    }

    // Determine mimeType from SourceImage record
    const sourceImage = await db.sourceImage.findUnique({
      where: { id: imageId },
    });
    const mimeType = sourceImage?.format || "image/jpeg";

    // 4. Call centralized AI interface (src/server/ai/) - Stages 2-4
    const result = await aiService.transcribe({
      buffer: imageBuffer,
      storageKey,
      mimeType,
    });

    // 5. Combine spans into originalText and determine overall Section confidence
    const spanTexts: string[] = [];
    let hasGap = false;
    let hasLow = false;

    for (const span of result.spans) {
      spanTexts.push(span.text);
      if (span.confidence === "GAP") hasGap = true;
      if (span.confidence === "LOW") hasLow = true;
    }

    const overallConfidence: SectionConfidence = hasGap ? "GAP" : hasLow ? "LOW" : "HIGH";
    const combinedText = spanTexts.join(" ").trim() || "No readable handwriting detected.";

    // Order: determine position based on image order or existing sections
    const imageOrder =
      sourceImage?.imageOrder ?? (await db.section.count({ where: { bookId } })) + 1;

    // Check if section already exists for this image (e.g. on retry), update or create
    let section = await db.section.findFirst({
      where: { sourceImageId: imageId, bookId },
    });

    if (section) {
      section = await db.section.update({
        where: { id: section.id },
        data: {
          originalText: combinedText,
          confidence: overallConfidence,
          order: imageOrder,
        },
      });
      // Clear old flags and diagrams on re-transcribe
      await db.transcriptionFlag.deleteMany({ where: { sectionId: section.id } });
      await db.diagram.deleteMany({ where: { sourceImageId: imageId } });
    } else {
      section = await db.section.create({
        data: {
          bookId,
          sourceImageId: imageId,
          order: imageOrder,
          originalText: combinedText,
          confidence: overallConfidence,
        },
      });
    }

    // 6. Write TranscriptionFlags for LOW and GAP spans (R10, R11)
    for (const span of result.spans) {
      if (span.confidence === "LOW" || span.confidence === "GAP") {
        await db.transcriptionFlag.create({
          data: {
            sectionId: section.id,
            startOffset: span.startOffset,
            endOffset: span.endOffset,
            type: span.confidence,
            suggestion: span.confidence === "GAP" ? "Unreadable handwriting" : "Low confidence reading",
          },
        });
      }
    }

    // 7. Write Diagrams (R12: sectionId + order for in-flow position)
    for (const diagram of result.diagrams) {
      await db.diagram.create({
        data: {
          sourceImageId: imageId,
          sectionId: section.id,
          storageKey: diagram.storageKey || storageKey,
          caption: diagram.caption,
          order: diagram.order,
        },
      });
    }

    // 8. Update SourceImage status to TRANSCRIBED
    await db.sourceImage.update({
      where: { id: imageId },
      data: { status: "TRANSCRIBED" },
    });

    // 9. Update Job status to SUCCEEDED
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "SUCCEEDED",
        error: null,
      },
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : "Transcription failed";
    console.error("transcribe.job.failed_per_image_isolated", { jobId, imageId, errorMsg: rawMsg });

    // Sanitize error string so no internal JSON or stack traces are stored or exposed to client
    let friendlyError = "Transcription failed";
    if (rawMsg.includes("cost ceiling")) {
      friendlyError = "AI cost limit reached";
    } else if (rawMsg.includes("Stopped by user")) {
      friendlyError = "Stopped by user";
    } else if (rawMsg.includes("404") || rawMsg.includes("503") || rawMsg.includes("ApiError") || rawMsg.startsWith("{")) {
      friendlyError = "AI service temporarily unavailable";
    }

    // Per-image failure isolation (AGENTS.md Section 3 rule 11):
    // One failed image must never fail the entire batch!
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: friendlyError,
      },
    });

    await db.sourceImage.update({
      where: { id: imageId },
      data: { status: "FAILED" },
    });
  }

  // 10. Check if all images for this book have completed
  await checkAndProgressBook(bookId);
}

/**
 * Checks overall batch status for a book.
 * If all note images have finished transcribing, triggers Stage 5–6 structuring.
 */
async function checkAndProgressBook(bookId: string): Promise<void> {
  const allImages = await db.sourceImage.findMany({
    where: { bookId },
    select: { id: true, status: true },
  });

  const pendingImages = allImages.filter(
    (img) => img.status === "UPLOADED" || img.status === "ACCEPTED"
  );

  // If there are still images waiting to be transcribed, wait
  if (pendingImages.length > 0) {
    return;
  }

  const transcribedImages = allImages.filter((img) => img.status === "TRANSCRIBED");
  const failedImages = allImages.filter((img) => img.status === "FAILED");

  if (transcribedImages.length > 0) {
    // Some or all images transcribed successfully -> run structuring (Stages 5-6)
    try {
      await processStructureJob(bookId);
    } catch (err) {
      console.error("checkAndProgressBook.structure_failed", err);
      await db.book.update({
        where: { id: bookId },
        data: { status: "READY" },
      });
    }
  } else if (failedImages.length === allImages.length) {
    // All images failed -> revert book to DRAFT
    await db.book.update({
      where: { id: bookId },
      data: { status: "DRAFT" },
    });
  }
}
