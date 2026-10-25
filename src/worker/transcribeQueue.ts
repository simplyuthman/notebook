import { Queue } from "bullmq";
import { getConnection } from "./queue";

export const TRANSCRIBE_QUEUE_NAME = "transcribe-queue";

export interface TranscribeJobData {
  jobId: string;
  bookId: string;
  imageId: string;
  storageKey: string;
  userId: string;
}

let _transcribeQueue: Queue | null = null;

function getTranscribeQueue(): Queue | null {
  const conn = getConnection();
  if (!conn) return null;
  if (!_transcribeQueue) {
    _transcribeQueue = new Queue(TRANSCRIBE_QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });
  }
  return _transcribeQueue;
}

/**
 * Proxy object so callers that reference `transcribeQueue` directly still work.
 * Returns empty arrays / null for queue-inspection methods when Redis is offline.
 */
export const transcribeQueue = {
  add: async (...args: Parameters<Queue["add"]>) => {
    const q = getTranscribeQueue();
    if (!q) return null;
    return q.add(...args);
  },
  getWorkers: async () => {
    const q = getTranscribeQueue();
    if (!q) return [];
    return q.getWorkers();
  },
  getJob: async (jobId: string) => {
    const q = getTranscribeQueue();
    if (!q) return null;
    return q.getJob(jobId);
  },
} as unknown as Queue;

export async function enqueueTranscribeJob(data: TranscribeJobData): Promise<void> {
  const q = getTranscribeQueue();
  if (!q) {
    // Redis offline — the caller (process/route.ts) already has a direct fallback
    console.warn("worker.enqueueTranscribeJob.skipped_no_redis", { jobId: data.jobId });
    return;
  }
  await q.add(
    "transcribe-image",
    data,
    { jobId: data.jobId }
  );
}

/**
 * Best-effort removal of queued TRANSCRIBE jobs from Redis (used when a
 * student stops processing). No-ops when Redis is offline.
 */
export async function drainQueuedTranscribeJobs(jobIds: string[]): Promise<void> {
  const q = getTranscribeQueue();
  if (!q) return;
  for (const jobId of jobIds) {
    try {
      const job = await q.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      console.warn("worker.transcribeQueue.drain.notice", { jobId, err });
    }
  }
}
