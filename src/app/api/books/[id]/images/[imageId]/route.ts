import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteNoteImage } from "@/server/books";

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    // 1. Session check first
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 2. Resolve params
    const { id: bookId, imageId } = await context.params;

    // 3. Ownership + delete delegated to the server module (Book.userId chain)
    const deleted = await deleteNoteImage(userId, bookId, imageId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Note not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("route.books.image.delete", err);
    return NextResponse.json(
      { error: "Failed to delete note." },
      { status: 500 }
    );
  }
}
