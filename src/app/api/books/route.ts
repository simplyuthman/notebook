import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createBook } from "@/server/books";
import { z } from "zod";

const createBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title is too long"),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createBookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const book = await createBook(userId, parsed.data.title);

    return NextResponse.json({ success: true, book });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create book";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
