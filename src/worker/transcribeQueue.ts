import { Queue } from "bullmq";
import { connection } from "./queue";

export const TRANSCRIBE_QUEUE_NAME = "transcribe-queue";

export const transcribeQueue = new Queue(TRANSCRIBE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

transcribeQueue.on("error", (err: Error) => {
  // Catch queue connection errors
});

export interface TranscribeJobData {
  jobId: string;
  bookId: string;
  imageId: string;
  storageKey: string;
  userId: string;
}

export async function enqueueTranscribeJob(data: TranscribeJobData): Promise<void> {
  await transcribeQueue.add(
    "transcribe-image",
    data,
    // Addressable by the DB Job id so a stopped book can drain its queue.
    { jobId: data.jobId }
  );
}

/**
 * Best-effort removal of queued TRANSCRIBE jobs from Redis (used when a
 * student stops processing). Jobs already picked up or finished are left
 * alone — their outcome is recorded in PostgreSQL regardless.
 */
export async function drainQueuedTranscribeJobs(jobIds: string[]): Promise<void> {
  for (const jobId of jobIds) {
    try {
      const job = await transcribeQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      console.warn("worker.transcribeQueue.drain.notice", { jobId, err });
    }
  }
}
