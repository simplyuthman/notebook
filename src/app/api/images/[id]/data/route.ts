import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { isObjectStorageConfigured } from "@/server/storage";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/images/[id]/data
 *
 * Dev-mode local storage fallback (used ONLY when R2 is not configured).
 * Accepts the raw image binary as multipart/form-data and saves it to
 * .uploads/ in the project root. Never used in production — in production,
 * images are uploaded directly to Cloudflare R2 via presigned PUT URLs.
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Refuse to handle local uploads if R2 is properly configured.
    // The client should never call this endpoint in production.
    if (isObjectStorageConfigured()) {
      return NextResponse.json(
        { error: "Local upload not available when object storage is configured." },
        { status: 400 }
      );
    }

    const params = await props.params;
    const imageId = params.id;

    // 1. Session verification
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 2. Ownership check
    const image = await db.sourceImage.findFirst({
      where: { id: imageId, book: { userId } },
      select: { id: true, format: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found or access denied." }, { status: 404 });
    }

    // 3. Read multipart body
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Determine extension from format field
    const ext = image.format.split("/")[1] ?? "jpeg";
    const filename = `${imageId}.${ext}`;

    // 5. Save to .uploads/ directory in project root
    const uploadsDir = path.join(process.cwd(), ".uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ success: true, filename });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save image locally";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
