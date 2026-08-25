---
trigger: always_on
---

# Uploads and Storage Rules

## Accepted input (hard rule)

- Only JPEG, PNG, and HEIC are accepted (R1). Reject anything else server-side, regardless of client-reported extension or MIME type — see `security.md` for the validation rule.
- A single image or a batch upload in one action must both be supported (R2). Uploads happen per-image, not as one atomic blob, so that one failing image never blocks the rest of the batch.

## Limits (hard rule)

- Plan image caps are enforced before anything else, at upload time, blocking uploads that exceed the student's allowance with a clear message (R31).
- The 50-image-per-batch ceiling (R3) is a hard technical upper bound that applies regardless of plan — it is not a substitute for plan-limit enforcement and not itself a sellable allowance. See `money-and-billing.md`.

## Quality gate (hard rule)

- Every image runs a quality check (resolution, blur, contrast) before acceptance (R4). An image failing the check is flagged and the student is prompted to re-upload it (R5) — it is never silently accepted into the pipeline in a state likely to produce garbage transcription.

## Where files live (hard rule)

- Original images and exported PDFs live in cloud object storage (default: Cloudflare R2). PostgreSQL stores only the `storageKey` reference and metadata (quality score, status, order) — binary image or PDF data is never written to the database (R7).
- Prefer signed, short-lived upload URLs for client-to-storage uploads so the application server does not proxy raw binary bytes through itself unnecessarily. *(Project convention — not explicit in the PRD, but a direct consequence of the storage architecture it specifies.)*

## Retention (hard rule, precisely scoped)

- An original image is retained for the life of its book, so the student can always compare the source image to its transcription (R20, R21 depend on this).
- The image is deleted, along with its database row, only when its book is deleted (R28) or the account is deleted (R29). Deletion must be complete in **both** object storage and the database — a database row removed while the file remains in storage (or vice versa) is an incomplete delete, not a finished one.

## Per-image failure isolation (hard rule)

- A failed image is isolated and reported per image; it never fails the entire batch. TRANSCRIBE jobs run and fail per image; a batch with some failed images reaches a `PARTIAL` outcome and continues processing the rest. This is both a functional requirement and the named mitigation for large-upload failure risk in the PRD — do not implement batch processing as all-or-nothing.

## Diagrams

- Detected diagrams are extracted and stored as their own linked `Diagram` records with an in-flow position (`order`, `sectionId`), not re-embedded inline inside transcribed text (R12, R23). Their position in the final book must match where they were recorded, not wherever layout happens to place them.