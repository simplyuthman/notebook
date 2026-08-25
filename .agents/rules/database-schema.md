---
trigger: glob
---

# Database and Schema Rules

Governs Prisma schema changes and PostgreSQL usage. The schema in PRD Section 10 is locked (AGENTS.md Section 2). This file governs how it may be extended and how migrations are handled.

## The schema is locked, not a draft

- Do not rename fields or enums (`BookStatus`, `ImageStatus`, `SectionConfidence`, `FlagType`, `JobType`, `JobStatus`, `PlanType`, `SubscriptionStatus`, `TransactionType`).
- Do not remove `TranscriptionFlag`. It exists specifically to satisfy R10, R11, and R19 (span-level low-confidence and GAP tracking). Collapsing it into a text blob or a boolean is a schema regression even if something still "shows a flag."
- Do not collapse `PlanType` beyond `FREE`/`PRO`, or add a plan tier, without this being a decided product change — not something to invent mid-task.
- New models or fields are allowed only when they satisfy an existing PRD requirement that has no field for it yet. If you find yourself adding a field to support something the PRD doesn't ask for, stop and flag it instead of shipping it.

## Cascade behavior is a hard rule, not a default

- `onDelete: Cascade` relations must match the PRD schema exactly: deleting a `User` cascades to `Book`, `Job`, `Transaction`, `Subscription`. Deleting a `Book` cascades to `SourceImage`, `Chapter`, `Job`. Deleting a `SourceImage` cascades to `Section`, `Diagram`. Deleting a `Section` cascades to `TranscriptionFlag`, `Diagram`.
- `Chapter` and `Diagram` use `onDelete: SetNull` on `Section`'s optional relations exactly as specified — do not change these to `Cascade` or `Restrict`.
- This is what satisfies R28 (deleting a book deletes its transcriptions, flags, diagrams, and images) and R29 (deleting an account deletes everything). A broken cascade direction is a data-privacy failure even if the delete button returns success.

## Money fields

- Money is always `Int`, in minor units (kobo), never `Float` or `Decimal`. `Transaction.amountMinor` and any future money field follow this without exception.
- `currency` is always an explicit column (default `"NGN"`), never assumed from context.

## Indexing

- Keep every `@@index` already present in the PRD schema (`Book.userId`, `SourceImage.bookId`, `Chapter.bookId`, `Section.bookId`/`chapterId`, `TranscriptionFlag.sectionId`, `Diagram.sourceImageId`/`sectionId`, `Job.bookId`/`userId`/`status`/`sourceImageId`, `Transaction.userId`).
- Add a new index only when a new query filters or joins on a field that isn't already indexed and that query runs in a hot path (upload-time checks, job polling, billing lookups). Do not index every field "just in case" — that's a performance cost with no named benefit.

## Migrations

- Every schema change ships with its Prisma migration file in the same PR. A schema edit without a matching migration is an incomplete task.
- Migrations are never hand-edited after being applied to a shared environment. If a migration was wrong, write a new one that corrects it.
- Destructive migrations (dropping a column or table with existing data) require an explicit note in the PR describing what data is lost and why it's safe — never a silent drop.

## PaymentLog model

- The `PaymentLog` model records an audit trail for every billing attempt, webhook, and settlement result.
- Fields: `id`, `userId` (optional, `onDelete: Cascade`), `reference`, `providerTxId`, `provider` (default `"FLUTTERWAVE"`), `event`, `status`, `amountMinor` (kobo `Int`), `currency` (default `"NGN"`), `rawPayload` (full raw JSON payload string), `error`, `createdAt`.
- Indexed on `userId`, `reference`, `providerTxId`, `createdAt`.

## Config vs. schema

- Plan limits, the batch ceiling (50 images per R3), and the per-book AI cost ceiling live in `src/config/`, never as schema columns, never hardcoded in a migration seed. If a limit needs to change without a deploy, it belongs in config, not the database.