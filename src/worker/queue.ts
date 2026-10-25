import { Queue } from "bullmq";
import IORedis from "ioredis";

export const EMAIL_QUEUE_NAME = "verification-email";

const REDIS_URL = process.env.REDIS_URL ?? "";

/**
 * Lazy Redis connection — only created if a Redis URL is configured.
 * This prevents ECONNREFUSED crashes at module-load time when Redis is
 * not available in the local dev environment.
 * The fallback path in the process route handles the no-Redis case.
 */
let _connection: IORedis | null = null;

export function getConnection(): IORedis | null {
  if (!REDIS_URL) return null;
  if (!_connection) {
    _connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      // Limit retries so the app fails fast instead of hanging on startup
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 500, 2000);
      },
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    _connection.on("error", (err) => {
      // Log but don't crash — the app falls back to direct processing
      console.warn("worker.redis.connection_error (will use direct fallback):", err.message);
    });
  }
  return _connection;
}

// Backward-compatible export so worker.ts and transcribeQueue.ts keep working
export const connection = {
  get(): IORedis | null {
    return getConnection();
  },
} as unknown as IORedis;

let _emailQueue: Queue | null = null;

export function getEmailQueue(): Queue | null {
  const conn = getConnection();
  if (!conn) return null;
  if (!_emailQueue) {
    _emailQueue = new Queue(EMAIL_QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });
  }
  return _emailQueue;
}

// Keep the named export for worker.ts
export const emailQueue = {
  add: async (...args: Parameters<Queue["add"]>) => {
    const q = getEmailQueue();
    if (!q) {
      console.warn("worker.emailQueue.skipped_no_redis");
      return null;
    }
    return q.add(...args);
  },
} as unknown as Queue;

export interface VerificationEmailJobData {
  userId: string;
  email: string;
  code: string;
}

/**
 * Enqueues a background job that emails the verification code to the user.
 * No-ops gracefully when Redis is unavailable — email sending has its own
 * direct fallback in the auth routes.
 */
export async function enqueueVerificationEmail(
  data: VerificationEmailJobData,
): Promise<void> {
  const q = getEmailQueue();
  if (!q) {
    console.warn("worker.enqueueVerificationEmail.skipped_no_redis", { userId: data.userId });
    return;
  }
  await q.add("send-verification-email", data);
}
