import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import {
  checkUploadAllowance,
  buildStorageKey,
  createPresignedUploadUrl,
  isObjectStorageConfigured,
} from "@/server/storage";
import { config } from "@/config";
import { z } from "zod";

const uploadNotesSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  files: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .min(1, "At least one file must be selected"),
});

export async function POST(req: Request) {
  try {
    // 1. Session verification
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = uploadNotesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { bookId, files } = parsed.data;

    // 2. Ownership check (R26 & Security rule)
    const book = await db.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found or access denied." }, { status: 404 });
    }

    // 3. MIME type & File size validation (R1 & 10MB limit)
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic"];
    for (const file of files) {
      const mime = file.type.toLowerCase();
      const isHeic = file.name.toLowerCase().endsWith(".heic");
      if (!allowedMimeTypes.some((t) => mime.includes(t)) && !isHeic) {
        return NextResponse.json(
          { error: `Invalid file format for "${file.name}". Only JPEG, PNG, and HEIC files are accepted.` },
          { status: 400 }
        );
      }
      if (file.size > config.limits.maxFileSizeBytes) {
        return NextResponse.json(
          { error: `"${file.name}" exceeds the maximum allowed file size of ${config.limits.maxFileSizeMB} MB.` },
          { status: 400 }
        );
      }
    }

    // 4. Plan Allowance & Batch Ceiling Enforcement (R31 & R3)
    await checkUploadAllowance(userId, files.length, bookId);

    // 5. Create SourceImages in UPLOADED/PENDING_UPLOAD status and generate Presigned Upload URLs
    const uploads = [];
    const existingImagesCount = await db.sourceImage.count({ where: { bookId } });
    const hasObjectStorage = isObjectStorageConfigured();

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const imageId = `img_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;
      const storageKey = buildStorageKey(userId, bookId, imageId, file.name);

      // Create SourceImage DB record (R7 - metadata only, no binary in DB)
      const sourceImage = await db.sourceImage.create({
        data: {
          id: imageId,
          bookId,
          storageKey,
          originalName: file.name,
          format: file.type || "image/jpeg",
          status: "UPLOADED",
          imageOrder: existingImagesCount + index + 1,
          qualityScore: 1.0, // Quality check pass baseline
        },
      });

      let uploadUrl: string | null = null;
      if (hasObjectStorage) {
        uploadUrl = await createPresignedUploadUrl(storageKey, file.type || "image/jpeg");
      }

      uploads.push({
        id: sourceImage.id,
        storageKey,
        name: file.name,
        uploadUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Registered ${files.length} note photo(s).`,
      uploads,
      hasObjectStorage,
      imageCount: files.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload notes";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const completeUploadSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  imageIds: z.array(z.string()).min(1, "At least one imageId is required"),
});

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = completeUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { bookId, imageIds } = parsed.data;

    // Verify book ownership
    const book = await db.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found or access denied." }, { status: 404 });
    }

    // Mark uploaded images as ready (UPLOADED)
    await db.sourceImage.updateMany({
      where: {
        id: { in: imageIds },
        bookId,
      },
      data: {
        status: "UPLOADED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Images marked as uploaded successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
