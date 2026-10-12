import { Worker } from "bullmq";
import { connection, EMAIL_QUEUE_NAME } from "./queue";
import { TRANSCRIBE_QUEUE_NAME } from "./transcribeQueue";
import { processVerificationEmailJob } from "./jobs/email";
import { processTranscribeJob } from "./jobs/transcribe";

// Dedicated, long-running worker process — the deployable behind
// `npm run start:worker`. Consumes jobs enqueued by the app request path.

// 1. Email worker
const emailWorker = new Worker(EMAIL_QUEUE_NAME, processVerificationEmailJob, {
  connection,
  concurrency: 5,
});

emailWorker.on("completed", (job) => {
  console.log("worker.email.completed", { jobId: job.id });
});

emailWorker.on("failed", (job, err) => {
  console.error("worker.email.failed", { jobId: job?.id, err: err.message });
});

emailWorker.on("error", (err) => {
  console.error("worker.email.connection_error", err.message);
});

// 2. Transcribe worker
const transcribeWorker = new Worker(
  TRANSCRIBE_QUEUE_NAME,
  async (job) => {
    await processTranscribeJob(job.data);
  },
  {
    connection,
    concurrency: 2,
  }
);

transcribeWorker.on("completed", (job) => {
  console.log("worker.transcribe.completed", { jobId: job.id });
});

transcribeWorker.on("failed", (job, err) => {
  console.error("worker.transcribe.failed", { jobId: job?.id, err: err.message });
});

transcribeWorker.on("error", (err) => {
  console.error("worker.transcribe.connection_error", err.message);
});

console.log(
  `Worker active. Listening on "${EMAIL_QUEUE_NAME}" and "${TRANSCRIBE_QUEUE_NAME}" (${process.pid})`
);
