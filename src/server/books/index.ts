import { db } from "@/server/db";
import { config } from "@/config";
import { deleteObject } from "@/server/storage";
import { drainQueuedTranscribeJobs } from "@/worker/transcribeQueue";

export async function createBook(userId: string, title: string) {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error("Book title is required.");
  }

  // Plan limits are enforced against the LIVE subscription only (R34 style —
  // never a cached plan value). User.plan is display/denormalized data.
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });

  const hasActivePro =
    subscription?.status === "ACTIVE" && subscription.currentPeriodEnd > new Date();

  // If not on an active Pro period, check book count against the free limit
  if (!hasActivePro) {
    const bookCount = await db.book.count({
      where: { userId },
    });

    if (bookCount >= config.limits.free.maxBooks) {
      throw new Error(`Free plan limit reached (${config.limits.free.maxBooks} books maximum). Please upgrade to Pro.`);
    }
  }

  return await db.book.create({
    data: {
      userId,
      title: cleanTitle,
      status: "DRAFT",
    },
  });
}

// Client-facing shape of a book: identical to the Prisma result except every
// Date is an ISO string, so the object can cross the server/client boundary.
export interface SerializedFlag {
  id: string;
  sectionId: string;
  startOffset: number;
  endOffset: number;
  type: "LOW" | "GAP";
  suggestion: string | null;
  resolved: boolean;
  createdAt: string;
}

export interface SerializedDiagram {
  id: string;
  sourceImageId: string;
  sectionId: string | null;
  storageKey: string;
  caption: string | null;
  order: number | null;
  createdAt: string;
}

export interface SerializedSourceImage {
  id: string;
  bookId: string;
  storageKey: string;
  originalName: string | null;
  format: string;
  qualityScore: number | null;
  status: string;
  imageOrder: number | null;
  createdAt: string;
}

export interface SerializedSection {
  id: string;
  bookId: string;
  chapterId: string | null;
  sourceImageId: string;
  order: number;
  originalText: string;
  editedText: string | null;
  confidence: "HIGH" | "LOW" | "GAP";
  createdAt: string;
  updatedAt: string;
  flags: SerializedFlag[];
  diagrams: SerializedDiagram[];
  sourceImage?: SerializedSourceImage;
}

export interface SerializedChapter {
  id: string;
  bookId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedJob {
  id: string;
  userId: string;
  bookId: string;
  sourceImageId: string | null;
  type: string;
  status: string;
  attempts: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedBook {
  id: string;
  userId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  images: SerializedSourceImage[];
  chapters: SerializedChapter[];
  sections: SerializedSection[];
  jobs: SerializedJob[];
}

/**
 * Converts the Prisma book result from getBookDetails into a JSON-safe object
 * for Client Components by replacing Date fields with ISO strings.
 */
export function serializeBookForClient(
  book: NonNullable<Awaited<ReturnType<typeof getBookDetails>>>,
): SerializedBook {
  return {
    ...book,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    images: book.images.map((img) => ({
      ...img,
      createdAt: img.createdAt.toISOString(),
    })),
    chapters: book.chapters.map((ch) => ({
      ...ch,
      createdAt: ch.createdAt.toISOString(),
      updatedAt: ch.updatedAt.toISOString(),
    })),
    sections: book.sections.map((sec) => ({
      ...sec,
      createdAt: sec.createdAt.toISOString(),
      updatedAt: sec.updatedAt.toISOString(),
      sourceImage: sec.sourceImage
        ? {
            ...sec.sourceImage,
            createdAt: sec.sourceImage.createdAt.toISOString(),
          }
        : undefined,
      flags: sec.flags.map((flag) => ({
        ...flag,
        createdAt: flag.createdAt.toISOString(),
      })),
      diagrams: sec.diagrams.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      })),
    })),
    jobs: book.jobs.map((job) => ({
      ...job,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    })),
  };
}

export async function getBookDetails(userId: string, bookIdentifier: string) {
  if (!userId || !bookIdentifier) return null;

  const cleanIdentifier = decodeURIComponent(bookIdentifier).trim();

  const book = await db.book.findFirst({
    where: {
      userId, // Strictly check ownership (R-security)
      OR: [
        { id: cleanIdentifier },
        { title: { equals: cleanIdentifier, mode: "insensitive" } },
      ],
    },
    include: {
      images: {
        orderBy: { imageOrder: "asc" },
        include: {
          diagrams: true,
        },
      },
      chapters: {
        orderBy: { order: "asc" },
      },
      sections: {
        orderBy: { order: "asc" },
        include: {
          flags: true,
          diagrams: true,
          sourceImage: true,
        },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return book;
}

/**
 * Deletes a single note image owned by the student.
 * Ownership is resolved through Book.userId — a mismatched user, book, or
 * image id returns false and deletes nothing.
 *
 * Deletion parity (R28): the stored object and the DB row go together; the
 * schema cascade removes the image's sections, their flags, and its diagrams.
 */
export async function deleteNoteImage(
  userId: string,
  bookId: string,
  imageId: string,
): Promise<boolean> {
  const image = await db.sourceImage.findFirst({
    where: { id: imageId, bookId, book: { userId } },
    select: { id: true, storageKey: true },
  });

  if (!image) {
    return false;
  }

  await deleteObject(image.storageKey);
  await db.sourceImage.delete({ where: { id: image.id } });

  return true;
}

/**
 * Stops an in-flight pipeline run for a book owned by the student.
 * The book returns to DRAFT (so it can be restarted), every non-terminal
 * TRANSCRIBE job is recorded as FAILED ("Stopped by user") in the ledger,
 * and queued Redis entries are drained best-effort so the worker never
 * picks them up later. Images stay UPLOADED, ready for a fresh start.
 *
 * Idempotent: stopping a book that is not PROCESSING is a no-op success.
 */
export async function stopProcessing(userId: string, bookId: string): Promise<boolean> {
  const book = await db.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true, status: true },
  });

  if (!book) {
    return false;
  }

  if (book.status !== "PROCESSING") {
    return true;
  }

  const liveJobs = await db.job.findMany({
    where: { bookId, type: "TRANSCRIBE", status: { in: ["QUEUED", "RUNNING"] } },
    select: { id: true },
  });
  const liveJobIds = liveJobs.map((j) => j.id);

  await db.$transaction([
    db.job.updateMany({
      where: { id: { in: liveJobIds } },
      data: { status: "FAILED", error: "Stopped by user" },
    }),
    db.book.update({ where: { id: bookId }, data: { status: "DRAFT" } }),
  ]);

  await drainQueuedTranscribeJobs(liveJobIds);

  return true;
}

