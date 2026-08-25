<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

Rules of engagement for any AI coding agent (running in Antigravity or elsewhere) building this product. This file governs **how** the agent works. It does not describe the product — that is the job of the PRD.

---

## 1. What is this project

This is a web application that turns photos of handwritten student notes into a structured, editable digital book. A student uploads note images, single or bulk. A vision-capable AI model transcribes the handwriting, flags what it cannot read, groups content into proposed chapters, and assembles a draft book the student edits and exports to PDF.

- **Users:** university students and self-learners, launch market Nigeria/West Africa, ages 18 and over only.
- **Version being built:** v1 — "Core capture to book." Do not build v0-only scaffolding as if it were final, and do not build v2 or v3 features (LaTeX, EPUB, multi-language, sharing, quizzes, native mobile, minors) under any circumstance, even if they seem easy to add along the way.
- **Source of truth:** `notes-book-prd-v2.docx` (Handwritten Notes to Digital Book, Version 2.0). If this file and the PRD ever appear to disagree on a requirement's substance, the PRD wins on **what** to build; this file wins on **how** to build it. If the conflict is about behavior (how the agent should act), this file wins.
- Every rule below traces back to a PRD section or requirement number. When you touch code related to one of these areas, re-read the cited requirement before you write anything.

---

## 2. What is locked

The agent must never change, swap, "improve," or work around any of the following. These are settled decisions, not starting points for negotiation.

### Core stack (PRD Section 7 — "The core stack is locked. Do not change it.")
- **Framework:** Next.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL

Do not introduce a second framework, a second ORM, a second database, or a "lighter" alternative for any part of the app, even temporarily, even in a script, even for testing.

### Architecture defaults (PRD Section 7)
- **Background worker:** a dedicated, long-running worker process, separate from the Next.js request path. Default queue: Redis-backed (e.g. BullMQ) on a long-lived container. Do not implement pipeline work as a Next.js API route, a serverless function, or anything bound by a request timeout.
- **Object storage:** cloud object storage for all images and exported PDFs (default: Cloudflare R2). PostgreSQL stores references and metadata only — never binary file data.
- **AI integration:** exactly one internal service interface wraps all calls to the vision-capable AI model. This interface accepts an image and returns transcription, per-span confidence, and diagram regions. No other part of the codebase may call an AI provider's SDK or API directly.
- **Auth:** default Auth.js (NextAuth) with email and Google login. Every book, image, flag, and job is protected behind its owning student's identity — there is no code path that reads or writes one user's data through another user's session.
- **Payments:** Flutterwave, supporting card, bank transfer, and USSD in Naira.

### Data model (PRD Section 10)
The Prisma schema in the PRD — models, enums, relations, cascade rules, and indexes — is locked as written. Do not rename fields, drop the `TranscriptionFlag` span-level model, collapse enums, or "simplify" the schema. Extending the schema with new models is allowed only for something the PRD requires but has no field for yet; if you find yourself doing this, flag it rather than assuming.

**Money rule, no exceptions:** store every amount as a whole number in the smallest currency unit (minor units — kobo for NGN), with an explicit `currency` field. Never use a float or decimal type for money. Anywhere. Ever.

**Config vs. schema:** plan limits, the per-batch image ceiling, and the per-book AI cost ceiling live in application config, not in the database schema and not hardcoded in application logic. If a limit needs to change without a schema migration, it belongs in config.

---

## 3. What must never happen

These are business- and user-protection rules. **Breaking any rule on this list means the task failed, even if the code compiles, the feature demoes, and the tests pass.** Do not treat any of these as negotiable for the sake of shipping something that "basically works."

1. **Never let an unverified or under-18 user create an account.** Age must be verified at sign-up before a book or image can be created or stored. *(R26)*
2. **Never build sharing, collaboration, multi-language transcription, a native mobile app, auto-generated quizzes/flashcards, or EPUB export in this version.** These are explicitly out of scope for v1; some are deferred to v2/v3 behind gates (age verification, consent flow) that do not exist yet. *(Non-Goals, Section 3; Roadmap, Section 13)*
3. **Never fabricate transcribed text for handwriting the model cannot read.** Unreadable spans must be stored as GAP flags with start/end offsets — never filled in with a guess. *(R11, R10)*
4. **Never treat the 50-image-per-batch ceiling as a user allowance.** It is a hard technical upper bound only. Plan limits (free/PRO caps) are enforced first, separately, and are the actual user-facing allowance. *(R3)*
5. **Never let an upload proceed once a student's plan allowance is exceeded.** Block it at upload time with a clear message before any processing job is created. *(R31)*
6. **Never remove the watermark from an export unless the user has an active PRO subscription, and always check this against the live `Subscription` record's status and period — never against a cached or assumed plan value.** *(R25, R34)*
7. **Never leave orphaned data after a delete.** Deleting a book must cascade to its transcriptions, flags, diagrams, and original images. Deleting an account must delete all of the above across every book. *(R28, R29)*
8. **Never price or configure a tier where price per image, or a monthly allowance times cost per image, sits at or below the measured cost floor. There is no unlimited tier, ever, at any point.** *(Section 8, Pricing Principle)*
9. **Never use flagged user notes to train, fine-tune, or improve any model.** Full deletion of images, flags, and text must be possible and complete on request. *(Section 9, Privacy risk)*
10. **Never let AI processing silently exceed the per-book cost ceiling.** When a book approaches the ceiling, processing must pause and prompt the student to spend credits or upgrade — it must not continue spending unchecked. *(Section 6, Cost ceiling)*
11. **Never let one failed image fail an entire batch.** TRANSCRIBE jobs run and fail per image; a batch with some failures reaches a PARTIAL status and continues for the rest. *(Section 7, Worker and async processing)*
12. **Never run the chapter-grouping stage as a single call over an entire book.** It must use per-section embeddings plus a bounded grouping pass so it works on books larger than one model context window. *(Stage 5, Section 6)*
13. **Never record a charge, credit purchase, credit spend, or plan change without writing it to the transaction ledger.** Billing history must be complete and auditable. *(R33)*

---

## 4. How is the work arranged

Use this folder layout. Do not invent a different top-level structure, and do not let pipeline/worker code live inside the Next.js request path.

```
/
├── prisma/
│   └── schema.prisma              # locked schema — see Section 2
├── src/
│   ├── app/                       # Next.js App Router — pages, layouts, route handlers
│   │   ├── (auth)/                # sign-up, sign-in, age verification
│   │   ├── (dashboard)/           # book library, editor, reader
│   │   └── api/                   # thin route handlers: enqueue jobs, read status, webhooks
│   │
│   ├── server/                    # business logic shared by app and worker — no UI code here
│   │   ├── ai/                    # the ONE internal AI interface (transcription, confidence, diagrams)
│   │   ├── billing/                # plan limits, cost-ceiling checks, Flutterwave integration
│   │   ├── storage/                # object storage client (R2/S3), signed URL helpers
│   │   ├── books/                  # book, chapter, section domain logic
│   │   └── auth/                   # session/identity helpers, ownership checks
│   │
│   ├── worker/                    # the dedicated long-running worker process — separate deployable
│   │   ├── queue.ts                # queue client setup (BullMQ or managed equivalent)
│   │   └── jobs/
│   │       ├── transcribe.ts       # Stages 1–4, per image
│   │       ├── structure.ts        # Stages 5–6, per book
│   │       └── export.ts           # Stage 7, per book
│   │
│   ├── lib/                       # small, pure, shared utilities (money formatting, offsets, etc.)
│   └── config/                    # plan limits, batch ceiling, cost ceiling — never hardcoded elsewhere
│
├── tests/
├── prisma/migrations/
└── AGENTS.md                      # this file
```

**Never touch what:**
- Code under `src/app/` may enqueue jobs and read job/document status. It may never run OCR, call the AI interface directly, or perform long-running processing inline.
- Code under `src/worker/` owns all pipeline execution. It may never render UI or import anything from `src/app/`.
- Only `src/server/ai/` may import an AI provider SDK. No other file, in either the app or the worker, calls a model provider directly.
- Only `src/server/billing/` and `src/config/` may define plan limits, prices, or ceilings. No route handler, job, or component may hardcode a number that belongs in config.

---

## 5. How should the code look

- Modern, current-LTS TypeScript and Node.js. No deprecated APIs, no abandoned packages, no experimental language features without a clear reason tied to a real requirement.
- Strict TypeScript settings on. No `any` used to silence an error — fix the type or narrow it.
- Small, single-purpose functions and modules. If a file is doing upload handling, billing checks, and AI calls all at once, split it along the `server/` boundaries above.
- Every external side effect (DB write, storage call, AI call, payment call) goes through the relevant `server/` module — never inline in a route handler or component.
- Errors are handled explicitly and logged with enough context to debug, matching Section 7's error-handling requirement. No silent catches.
- Naming, comments, and structure should read clearly to a new engineer without needing to open the PRD first — but business *rules* (the "why") still live only in the PRD and this file, not duplicated as comments everywhere.

---

## 6. What counts as done

Before marking any task complete, the agent produces a checklist covering:

- [ ] The code builds with zero errors and zero type errors.
- [ ] Every requirement number (R1–R34) touched by this task is listed, with a one-line note on how it's satisfied.
- [ ] None of the "What must never happen" rules in Section 3 were violated — state this explicitly, don't just imply it.
- [ ] No v2/v3-only feature was introduced (check against Non-Goals, Section 3 of the PRD, and the Roadmap, Section 13).
- [ ] Any [ASSUMPTION] tag or Open Question from the PRD that this task touches is listed, with a note on whether it was resolved by an existing PRD decision or is still genuinely open.
- [ ] Money values, if touched, are confirmed as minor-unit integers with an explicit currency — no floats introduced.
- [ ] Tests exist for the new behavior and pass.

A task is not done because the feature demoes. It is done when this checklist is filled out honestly and every box is true.

---

## 7. What the agent does when unsure

- The agent never invents a new feature, a new scope, or a new business rule to fill a gap. If the PRD doesn't say, the agent doesn't guess and build — it stops and asks, or it implements the narrowest possible version that satisfies only the requirements already stated, clearly marked as incomplete.
- The agent never writes speculative, "just in case" code paths for features from v2 or v3. Build for v1's actual requirements only.
- If a requirement seems to conflict with a locked choice in Section 2, or with a rule in Section 3, the agent stops and surfaces the conflict instead of picking a side silently.
- If a PRD Open Question (Section 14) blocks a clean implementation, the agent implements the part that isn't blocked, stubs the blocked part behind a clearly named placeholder, and reports exactly what decision is needed — it does not pick an answer on the team's behalf.
- When in doubt between a clean, smaller implementation and a clever, larger one: build the smaller one. Do not produce spaghetti code to "cover all bases" when the right scope is unclear — narrow scope and ask beats broad guessing every time.