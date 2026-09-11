import { TranscribeJobData } from "../transcribeQueue";
import { getObjectBuffer } from "@/server/storage";
import { db } from "@/server/db";

/**
 * Executes the TRANSCRIBE job for one image in the BullMQ worker.
 * Retrieves image bytes from Cloudflare R2 / S3 via storageKey (never stored in DB).
 */
export async function processTranscribeJob(jobData: TranscribeJobData): Promise<void> {
  const { jobId, bookId, imageId, storageKey, userId } = jobData;

  // 1. Fetch image binary from object storage
  const imageBuffer = await getObjectBuffer(storageKey);

  // 2. Mark job as running
  await db.job.update({
    where: { id: jobId },
    data: { status: "RUNNING" },
  });

  // Note: AI OCR transcription logic will call the centralized AI interface
  // (src/server/ai/) passing imageBuffer or storage references.
}

