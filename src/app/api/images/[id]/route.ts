import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { createPresignedReadUrl, isObjectStorageConfigured } from "@/server/storage";
import { existsSync } from "fs";
import path from "path";

/**
 * GET /api/images/[id]
 *
 * Returns a URL for displaying the image:
 * - When R2 is configured: a short-lived presigned GET URL.
 * - When R2 is NOT configured (dev mode): a URL to /api/images/[id]/file
 *   which serves the locally saved binary, if it exists.
 *
 * Verifies ownership (image → book → userId) before issuing any URL.
 */
export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const imageId = params.id;

    // 1. Session verification
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required." }, { status: 400 });
    }

    // 2. Ownership check — resolve via book.userId (security rule)
    const image = await db.sourceImage.findFirst({
      where: {
        id: imageId,
        book: { userId },
      },
      select: { id: true, storageKey: true, format: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found or access denied." }, { status: 404 });
    }

    // 3. R2 configured — generate short-lived presigned GET URL (5 minutes)
    if (isObjectStorageConfigured()) {
      const url = await createPresignedReadUrl(image.storageKey);
      return NextResponse.json({ url, configured: true });
    }

    // 4. Dev fallback — check for locally saved file in .uploads/
    const ext = image.format.split("/")[1] ?? "jpeg";
    const filename = `${imageId}.${ext}`;
    const localPath = path.join(process.cwd(), ".uploads", filename);
    const localExists = existsSync(localPath);

    if (localExists) {
      // Return route URL that will stream the local file
      return NextResponse.json({
        url: `/api/images/${imageId}/file`,
        configured: false,
        local: true,
      });
    }

    // No file stored anywhere
    return NextResponse.json({ url: null, configured: false, local: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate image URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

