import { Worker } from "bullmq";
import { connection, EMAIL_QUEUE_NAME } from "./queue";
import { processVerificationEmailJob } from "./jobs/email";

// Dedicated, long-running worker process — the deployable behind
// `npm run start:worker`. Consumes jobs enqueued by the app request path.
const worker = new Worker(EMAIL_QUEUE_NAME, processVerificationEmailJob, {
  connection,
  concurrency: 5,
});

worker.on("completed", (job) => {
  console.log("worker.email.completed", { jobId: job.id });
});

worker.on("failed", (job, err) => {
  console.error("worker.email.failed", { jobId: job?.id, err: err.message });
});

console.log(
  `worker.email.listening on queue "${EMAIL_QUEUE_NAME}" (${process.pid})`,
);
