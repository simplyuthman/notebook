import { Queue } from "bullmq";
import IORedis from "ioredis";

// Name of the queue that delivers verification emails.
export const EMAIL_QUEUE_NAME = "verification-email";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Shared Redis connection. `maxRetriesPerRequest: null` is required so BullMQ
// workers can block on BLPOP without tripping ioredis's retry limit.
export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Queue used by the app (src/app/) to enqueue verification emails. The actual
// sending runs in the dedicated worker process (src/worker/worker.ts) — never
// in the request path.
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export interface VerificationEmailJobData {
  userId: string;
  email: string;
  code: string;
}

/**
 * Enqueues a background job that emails the verification code to the user.
 * The code itself is generated and stored by the caller (see
 * createAndStoreVerificationCode); the worker only delivers the email.
 */
export async function enqueueVerificationEmail(
  data: VerificationEmailJobData,
): Promise<void> {
  await emailQueue.add("send-verification-email", data);
}
