import { db } from "@/server/db";
import { aiService } from "@/server/ai";

/**
 * Stages 5–6: Semantic structuring and chapter organization.
 * Groups transcribed note sections into proposed chapters.
 */
export async function processStructureJob(bookId: string): Promise<void> {
  const book = await db.book.findUnique({
    where: { id: bookId },
    include: {
      sections: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!book || book.sections.length === 0) {
    if (book) {
      await db.book.update({
        where: { id: bookId },
        data: { status: "READY" },
      });
    }
    return;
  }

  // Prepare section inputs for aiService (Stages 5-6)
  const sectionInputs = book.sections.map((s) => ({
    id: s.id,
    order: s.order,
    originalText: s.editedText || s.originalText,
  }));

  try {
    const proposal = await aiService.structure(sectionInputs);

    if (proposal.chapters && proposal.chapters.length > 0) {
      // Clear existing proposed chapters if re-structuring
      await db.chapter.deleteMany({
        where: { bookId },
      });

      for (const ch of proposal.chapters) {
        const createdChapter = await db.chapter.create({
          data: {
            bookId,
            title: ch.title || `Chapter ${ch.order}`,
            order: ch.order,
          },
        });

        if (ch.sectionIds && ch.sectionIds.length > 0) {
          await db.section.updateMany({
            where: {
              id: { in: ch.sectionIds },
              bookId,
            },
            data: {
              chapterId: createdChapter.id,
            },
          });
        }
      }
    } else {
      // Default single chapter fallback
      const createdChapter = await db.chapter.create({
        data: {
          bookId,
          title: "Chapter 1: Notes",
          order: 1,
        },
      });
      await db.section.updateMany({
        where: { bookId },
        data: { chapterId: createdChapter.id },
      });
    }
  } catch (err) {
    console.error("structure.job.error", { bookId, err });
  } finally {
    await db.book.update({
      where: { id: bookId },
      data: { status: "READY" },
    });
  }
}
