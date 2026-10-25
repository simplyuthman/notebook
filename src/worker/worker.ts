import { Worker } from "bullmq";
import { getConnection, EMAIL_QUEUE_NAME } from "./queue";
import { TRANSCRIBE_QUEUE_NAME } from "./transcribeQueue";
import { processVerificationEmailJob } from "./jobs/email";
import { processTranscribeJob } from "./jobs/transcribe";

// Dedicated, long-running worker process — the deployable behind
// `npm run start:worker`. Consumes jobs enqueued by the app request path.
// When Redis is not configured, this file no-ops so the dev server boots cleanly.

const conn = getConnection();

if (!conn) {
  console.warn(
    "worker: REDIS_URL is not configured or Redis is unreachable. " +
    "Workers will not start. Transcription falls back to direct inline execution."
  );
} else {
  const emailWorker = new Worker(EMAIL_QUEUE_NAME, processVerificationEmailJob, {
    connection: conn,
    concurrency: 5,
  });

  emailWorker.on("completed", (job) => {
    console.log("worker.email.completed", { jobId: job.id });
  });

  emailWorker.on("failed", (job, err) => {
    console.error("worker.email.failed", { jobId: job?.id, err: err.message });
  });

  console.log(`worker.email.listening on queue "${EMAIL_QUEUE_NAME}" (${process.pid})`);

  const transcribeWorker = new Worker(
    TRANSCRIBE_QUEUE_NAME,
    async (job) => {
      await processTranscribeJob(job.data);
    },
    {
      connection: conn,
      concurrency: 2,
    }
  );

  transcribeWorker.on("completed", (job) => {
    console.log("worker.transcribe.completed", { jobId: job.id });
  });

  transcribeWorker.on("failed", (job, err) => {
    console.error("worker.transcribe.failed", { jobId: job?.id, err: err.message });
  });

  console.log(`worker.transcribe.listening on queue "${TRANSCRIBE_QUEUE_NAME}" (${process.pid})`);
}
