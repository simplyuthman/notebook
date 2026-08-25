---
name: r2-storage-handler
description: Use when files move or are deleted — uploads, signed URLs, storage keys, or deleting a book or account. Triggers on upload, signed URL, storage key, delete book, delete account.
---

# R2 Storage Handler

Teaches ownership-encoded keys, row-and-object pairing, immutable originals, and the full deletion parity procedure. Laws live in `uploads-and-storage.md`, `database-schema.md` (cascade rules), R7/R28/R29, and AGENTS.md Section 2 (object storage).

## Procedure

1. Only JPEG, PNG, HEIC are accepted. Validate actual file content server-side — never trust a client-reported extension or MIME type alone (R1).
2. Store the original image in cloud object storage (default Cloudflare R2). The database (`SourceImage.storageKey`) holds only the reference and metadata (`format`, `qualityScore`, `status`, `imageOrder`) — never the binary bytes (R7).
3. `[ASSUMED — derived from security.md's ownership-check principle, applied to storage keys]` Build the storage key so it encodes ownership (scoped under the owning user/book id), so a leaked key alone doesn't cross user boundaries without also passing the route-layer ownership check.
4. Prefer short-lived signed URLs for direct client-to-storage upload, rather than proxying raw bytes through the application server.
5. Run the quality check (resolution, blur, contrast) on each image before accepting it. A failing image is flagged and the student is prompted to re-upload — it does not silently enter the pipeline (R4, R5).
6. Treat the original image as immutable and retained for the life of its book — never deleted or overwritten while the book exists, since R20/R21 depend on comparing the original to its transcription at any time.
7. Delete the image only when its book is deleted (R28) or the account is deleted (R29). Delete in both places — object storage and the database row — in the same deletion operation. A row removed with the object left in storage, or the reverse, is an incomplete delete.
8. For book deletion: issue the object-storage deletion for every `SourceImage`/`Diagram` `storageKey` and any exported PDF tied to that book, alongside the schema's cascade (`Book → SourceImage/Chapter/Job`, `SourceImage → Section/Diagram`, `Section → TranscriptionFlag/Diagram`). Don't rely on the cascade alone — it doesn't reach into object storage.
9. For account deletion: repeat step 8 across every book the user owns, plus the user's own row (R29).
10. A failed image never fails the rest of its batch — isolate and report per image.

## Code skeleton

```ts
// Ownership-encoded key
function buildStorageKey(userId: string, bookId: string, imageId: string) {
  return `users/${userId}/books/${bookId}/images/${imageId}`;
}

// Deletion parity — object storage AND database row, same operation
async function deleteBook(bookId: string) {
  const images = await db.sourceImage.findMany({ where: { bookId } });
  const diagrams = await db.diagram.findMany({ where: { sourceImage: { bookId } } });

  await Promise.all([
    ...images.map((img) => storage.delete(img.storageKey)),
    ...diagrams.map((d) => storage.delete(d.storageKey)),
    storage.delete(exportKeyFor(bookId)),
  ]);

  await db.book.delete({ where: { id: bookId } }); // cascades DB rows only
}
```

## Traps

- Deleting the database row for a book without also deleting its files from object storage.
- Deleting the object-storage files without removing the corresponding database rows.
- Trusting client-reported file type instead of validating actual content.
- Overwriting or mutating the original image after upload.
- Building storage keys with no ownership scoping, relying only on the app-layer check.
- Letting one bad image in a batch throw and cancel the rest of the upload.

## Verify before done

- [ ] Uploaded file format validated server-side against actual content.
- [ ] Database stores only `storageKey`/metadata; binary lives only in object storage.
- [ ] Storage key encodes ownership scoping.
- [ ] Quality-failing images are flagged, not silently processed.
- [ ] Book/account deletion removes both object-storage files and database rows, fully, with no orphan in either place.
- [ ] One failing image in a batch doesn't cancel the others.

**Tests to write:** a deletion-parity test asserting both storage objects and database rows are gone after a book/account delete (R28/R29); a test for per-image failure isolation during upload/quality-check.