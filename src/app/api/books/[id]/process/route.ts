import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { stopProcessing } from "@/server/books";
import { enqueueTranscribeJob, transcribeQueue } from "@/worker/transcribeQueue";
import { processTranscribeJob } from "@/worker/jobs/transcribe";

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const bookId = params.id;

    // 1. Session verification
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required." }, { status: 400 });
    }

    // 2. Ownership check (R-security)
    const book = await db.book.findFirst({
      where: { id: bookId, userId },
      include: {
        images: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found or access denied." }, { status: 404 });
    }

    // 3. Find note images to process (status UPLOADED, ACCEPTED, or FAILED for retry)
    const imagesToProcess = book.images.filter(
      (img) => img.status === "UPLOADED" || img.status === "ACCEPTED" || img.status === "FAILED"
    );

    if (imagesToProcess.length === 0) {
      return NextResponse.json(
        { error: "No uploaded note pages ready for processing in this book." },
        { status: 400 }
      );
    }

    // 4. Update book status to PROCESSING
    await db.book.update({
      where: { id: bookId },
      data: { status: "PROCESSING" },
    });

    const createdJobs = [];

    // 5. Create TRANSCRIBE Jobs and enqueue per image
    for (const image of imagesToProcess) {
      const job = await db.job.create({
        data: {
          userId,
          bookId,
          sourceImageId: image.id,
          type: "TRANSCRIBE",
          status: "QUEUED",
        },
      });

      const jobPayload = {
        jobId: job.id,
        bookId,
        imageId: image.id,
        storageKey: image.storageKey,
        userId,
      };

      try {
        await enqueueTranscribeJob(jobPayload);

        // In development / local environment: if no dedicated worker process is connected
        // to BullMQ, dispatch asynchronously in background so jobs never hang in QUEUED
        const workers = await transcribeQueue.getWorkers().catch(() => []);
        if (workers.length === 0) {
          void processTranscribeJob(jobPayload).catch((e) =>
            console.error("Immediate transcription fallback error:", e)
          );
        }
      } catch (qErr) {
        console.warn("Worker queue enqueue notice (Redis may be offline):", qErr);
        // Fallback when Redis is offline entirely
        void processTranscribeJob(jobPayload).catch((e) =>
          console.error("Offline transcription fallback error:", e)
        );
      }

      createdJobs.push(job);
    }

    return NextResponse.json({
      success: true,
      message: `Started processing ${imagesToProcess.length} note page(s).`,
      jobCount: createdJobs.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start processing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Stops an in-flight pipeline run: book returns to DRAFT, live jobs are
// failed and drained from the queue. All logic lives in server/books.
export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const stopped = await stopProcessing(userId, params.id);

    if (!stopped) {
      return NextResponse.json({ error: "Book not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Processing stopped." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to stop processing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
