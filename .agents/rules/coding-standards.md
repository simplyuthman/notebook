---
trigger: always_on
---

# Coding Standards

Governs how code is written in this repo. Ties to AGENTS.md Section 5 ("How should the code look"). If a rule here can't be enforced by a tool (linter, type checker, CI) or tied to a real failure mode, it doesn't belong here — it's a taste preference, not a rule.

## Language and stack

- TypeScript, strict mode on, across the entire codebase. No exceptions.
- Current LTS Node.js only. No experimental runtime flags in production code.
- `any` is forbidden except in a narrow, explicitly commented boundary (e.g. parsing an untyped third-party webhook payload before validation). Every such use must have a comment naming why, and the value must be validated/narrowed before it's used.
- `// @ts-ignore` is forbidden without a comment explaining exactly why the type error is wrong, not just that it's inconvenient.

## Structure and boundaries

- Follow the folder layout in AGENTS.md Section 4 exactly. `src/app/` never contains pipeline logic, AI calls, or long-running work. `src/worker/` never contains UI. Only `src/server/ai/` imports an AI provider SDK. Only `src/server/billing/` and `src/config/` define plan limits, prices, or ceilings.
- One job type per file under `src/worker/jobs/` (`transcribe.ts`, `structure.ts`, `export.ts`), matching the three tracked job types (TRANSCRIBE, STRUCTURE, EXPORT) from the PRD's pipeline design. Do not merge job logic into one file "for convenience."
- No speculative code for out-of-scope features (multi-language, sharing, quizzes, EPUB, native mobile, LaTeX). If you're writing a code path for something not in v1, delete it, don't comment it out "for later."

## Formatting and linting

- Prettier and ESLint configs are the single source of truth for formatting. Do not hand-format around them or argue about semicolons, quotes, or indentation in review — fix the config once if it's wrong, don't fix it per-file.
- CI must pass lint and type-check with zero errors before merge. A red CI run is a blocked task, not a warning to note and move past.

## Error handling

- Every `catch` block must either handle the error meaningfully or log it with enough context to debug (this satisfies the PRD's job-failure logging requirement) — never a silent, empty catch.
- Never swallow an error from a payment call, an AI call, or a database write. These paths log and surface failure state (e.g. a Job's `status: FAILED` and `error` field), they never fail silently.

## Testing (non-negotiable coverage)

Tests are required, not optional, for:
- Any code touching money (`Transaction`, `Subscription`, price/cost-floor logic).
- Plan-limit enforcement at upload time (R31).
- Cascade delete behavior for Book and User (R28, R29).
- The AI interface wrapper's confidence/GAP-flag handling (R10, R11).
- Batch partial-failure isolation (one failed image must not fail the batch).

A task touching any of the above without a corresponding test is not done, regardless of whether the code runs.

## Dead code and scope discipline

- No commented-out code merged to a branch. Delete it or don't write it.
- No unused exports, unused config flags, or "future-proofing" scaffolding for features not in the current version. If it isn't used by v1, it doesn't ship.