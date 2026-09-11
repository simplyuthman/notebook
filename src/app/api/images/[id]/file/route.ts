import { cookies } from "next/headers";
import { db } from "@/server/db";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

/**
 * GET /api/images/[id]/file
 *
 * Dev-mode image serving endpoint. Reads the locally stored binary from
 * .uploads/ and streams it back to the browser with the correct Content-Type.
 * Only used when R2 is not configured. Never proxies binaries in production.
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Ownership check
    const image = await db.sourceImage.findFirst({
      where: { id: imageId, book: { userId } },
      select: { id: true, format: true },
    });

    if (!image) {
      return new NextResponse("Not found", { status: 404 });
    }

    // 3. Read from .uploads/
    const ext = image.format.split("/")[1] ?? "jpeg";
    const filename = `${imageId}.${ext}`;
    const filePath = path.join(process.cwd(), ".uploads", filename);

    let buffer: Buffer;
    try {
      buffer = await readFile(filePath);
    } catch {
      return new NextResponse("File not found on server", { status: 404 });
    }

    // 4. Return binary with correct Content-Type and cache headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": image.format || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to serve image";
    return new NextResponse(message, { status: 500 });
  }
}
