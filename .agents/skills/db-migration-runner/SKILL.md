---
name: db-migration-runner
description: Use when editing prisma/schema.prisma, running a Prisma migration, adding a new model or field, or storing any new kind of data. Triggers on migration, schema, migrate, new field, new model, new table, new thing to store.
---

# DB Migration Runner

Teaches the safe sequence for extending the locked Prisma schema. Laws live in `database-schema.md` (locked schema, cascade behavior, indexing, migrations), `money-and-billing.md` and AGENTS.md Section 2 (money representation), and R28/R29 (deletion cascade).

## Procedure

1. Check if an existing model or field already covers the need. Grep `schema.prisma` first. If it's already there, stop — no migration needed.
2. Confirm the new data traces to a specific PRD requirement (Rxx) or named PRD section. If it doesn't trace to anything, stop and flag it instead of inventing a field (AGENTS.md Section 7).
3. Extend the schema narrowly. Do not rename any existing field or enum (`BookStatus`, `ImageStatus`, `SectionConfidence`, `FlagType`, `JobType`, `JobStatus`, `PlanType`, `SubscriptionStatus`, `TransactionType`). Do not collapse `PlanType` beyond `FREE`/`PRO`. Do not touch `TranscriptionFlag`'s shape (`database-schema.md`).
4. If the new field stores money: type it `Int`, store it in minor units (kobo), add an explicit `currency` column defaulting `"NGN"`. Never `Float`, never `Decimal` (`money-and-billing.md`, AGENTS.md Section 2).
5. If the new model has a parent, set `onDelete: Cascade` matching the existing chain — `User → Book/Job/Transaction/Subscription`, `Book → SourceImage/Chapter/Job`, `SourceImage → Section/Diagram`, `Section → TranscriptionFlag/Diagram`. Use `onDelete: SetNull` only where the schema already does (`Chapter`/`Diagram`'s optional relation from `Section`) (`database-schema.md`, R28, R29).
6. Add `@@index` only if a new query filters or joins on this field in a hot path (upload checks, job polling, billing lookups). Don't index speculatively.
7. Run `npx prisma migrate dev --name <description>` to generate the migration.
8. Read the generated SQL. If it's destructive (drops a column/table with existing data), write an explicit note describing what's lost and why it's safe.
9. Never hand-edit an applied migration. If it was wrong, write a new migration that corrects it.
10. Ship the schema edit and its migration file in the same commit/PR. If it touches money, auth, or broad schema shape, reference the Rxx/rule in the commit message and route it through review — not a direct commit to main (`git-conventions.md`).
11. If the new value is a limit or ceiling (not a data shape), put it in `src/config/`, not the schema (AGENTS.md Section 2, `database-schema.md`).

## Code skeleton

```prisma
// Money pattern — copy this shape exactly for any new money field
model Transaction {
  amountMinor Int?
  currency    String @default("NGN")
}

// Cascade pattern — copy this direction exactly for any new child model
model SourceImage {
  bookId String
  book   Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
}

// SetNull pattern — only for optional relations that already use it
model Section {
  chapterId String?
  chapter   Chapter? @relation(fields: [chapterId], references: [id], onDelete: SetNull)
}
```

```bash
npx prisma migrate dev --name add_<field>_to_<model>
```

## Traps

- Adding a `Float` field for money "just this once."
- Renaming an existing field to "improve" naming.
- Hand-editing a migration file after it's been applied to a shared environment.
- Indexing every new field automatically, "just in case."
- Adding a field with no matching requirement number, to be safe.
- Splitting the schema edit and its migration file across two PRs.

## Verify before done

- [ ] Field/model traces to a specific Rxx or PRD section — write down which one.
- [ ] No renamed field/enum, no collapsed `PlanType`, no altered `TranscriptionFlag` shape.
- [ ] Money fields are `Int` + explicit `currency`, never `Float`/`Decimal`.
- [ ] Cascade/`SetNull` direction matches the existing chain exactly.
- [ ] Migration file exists and ships in the same PR as the schema edit.
- [ ] Destructive migration has an explicit note if applicable.
- [ ] Limit/ceiling values live in `src/config/`, not the schema.

**Tests to write:** a cascade-delete test proving child rows are actually removed when their parent (`Book` or `User`) is deleted; if money fields changed, a test proving amounts are stored and read back as integers.