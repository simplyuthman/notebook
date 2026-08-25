import type { Job } from "bullmq";
import { sendVerificationEmail } from "@/server/email";
import type { VerificationEmailJobData } from "../queue";

/**
 * Worker processor for the "verification-email" queue. Runs in the dedicated
 * worker process — it delivers the code the app already generated and stored
 * (see src/server/auth/verification.ts). Throwing marks the job failed and
 * lets BullMQ retry it (attempts/backoff configured on the queue).
 */
export async function processVerificationEmailJob(
  job: Job<VerificationEmailJobData>,
): Promise<void> {
  const { userId, email, code } = job.data;

  console.log("worker.email.start", { jobId: job.id, userId });

  await sendVerificationEmail(email, code);

  console.log("worker.email.sent", { jobId: job.id, userId });
}
