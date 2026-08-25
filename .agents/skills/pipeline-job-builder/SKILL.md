---
name: pipeline-job-builder
description: Use when writing anything that runs in the worker — pipeline stages, job types, queue processors, batch handling, or export. Triggers on worker, job, queue, pipeline, batch, TRANSCRIBE, STRUCTURE, EXPORT.
---

# Pipeline Job Builder

Teaches job granularity, the three cost gates in order, PARTIAL batch semantics, and export's watermark/diagram edges. Laws live in PRD Section 6 (Stages 1–7, Cost Ceiling), AGENTS.md Section 3 (rules 4, 5, 6, 10, 11, 12), `money-and-billing.md`, `uploads-and-storage.md`, `ai-pipeline.md`, and `coding-standards.md`.

## Procedure

1. Identify the job type: `TRANSCRIBE` (per-image, Stages 1–4), `STRUCTURE` (per-book, Stages 5–6), or `EXPORT` (per-book, Stage 7). Put the code in exactly that one file under `src/worker/jobs/` — never merge job types into one file (`coding-standards.md`).
2. Before any AI spend, pass all three cost gates, in this order: (a) the student's plan allowance, checked first (R31); (b) the 50-image batch ceiling as a hard technical cap only, never an allowance (R3); (c) the per-book AI cost ceiling from config — if the book is approaching it, pause and prompt the student to spend credits or upgrade instead of continuing (PRD Section 6 Cost Ceiling, `money-and-billing.md`). None of these three run after the job already exists.
3. In `TRANSCRIBE`, process one image at a time. If an image fails, mark that image's `Job` `FAILED` and continue the rest — never fail the whole batch for one image. Once every image in the batch has run, if some failed and some succeeded, the batch reaches `PARTIAL`, not `FAILED` (`uploads-and-storage.md`, AGENTS.md Section 3 rule 11).
4. Inside `TRANSCRIBE`, follow Stages 2–4 in order: call the AI interface for transcription and per-span confidence → write a `TranscriptionFlag` for each span below threshold (`LOW`) and each unreadable span (`GAP`) with exact `startOffset`/`endOffset` → detect diagrams and store them as `Diagram` records with `sectionId` + `order` for in-flow position (R10, R11, R12).
5. In `STRUCTURE`, only run after the book's `TRANSCRIBE` jobs have all finished. Cluster sections by topic using per-section embeddings, then run a bounded grouping pass over cluster summaries — never one call over the whole book (Stage 5, `ai-pipeline.md`). Then assemble (Stage 6): place diagrams at their recorded position, apply chapter/section order, never reflow a diagram for convenience.
6. In `EXPORT`, render the final book to PDF (Stage 7). Apply the watermark for `FREE`, or check the live `Subscription` (`status === ACTIVE` and `currentPeriodEnd` in the future) before omitting it for `PRO` — never cached (R25, R34). Preserve chapter order, headings, and diagram positions exactly (R23).
7. Every job writes its status transitions to the `Job` row (`QUEUED → RUNNING → SUCCEEDED/FAILED/PARTIAL`), increments `attempts` on retry, and logs an error on failure — never a silent catch.
8. The job never imports an AI provider SDK — it calls through `src/server/ai/` only.

## Code skeleton

```ts
// transcribe.ts — per-image failure isolation
for (const image of batch.images) {
  try {
    const result = await aiService.transcribe(image);
    await writeFlags(image, result.spans);       // LOW / GAP per span, R10/R11
    await writeDiagrams(image, result.diagrams);  // sectionId + order, R12
    await updateJob(image.jobId, "SUCCEEDED");
  } catch (err) {
    await updateJob(image.jobId, "FAILED", err);  // isolated, batch continues
  }
}
await rollUpBatchStatus(batch); // PARTIAL if mixed, SUCCEEDED if all passed

// Cost gates — run before enqueueing, in this order
async function checkGatesBeforeSpend(userId: string, batchSize: number, bookId: string) {
  if (!(await withinPlanAllowance(userId))) return blocked("plan");
  if (batchSize > 50) return blocked("batch ceiling");
  if (await approachingCostCeiling(bookId)) return blocked("cost ceiling");
  return ok();
}
```

## Traps

- Putting all three job types in one file "since they're related."
- Checking the cost ceiling only after the book finishes instead of before continuing to spend.
- Letting one failed image throw and crash the whole batch job.
- Running Stage 5 as a single call over the whole book's text.
- Caching the PRO/watermark check for speed.
- Importing an AI SDK directly inside a job file.

## Verify before done

- [ ] Job code lives in exactly one file for its job type.
- [ ] All three cost gates checked, in order, before any AI spend.
- [ ] A failing image sets `FAILED` on that image without throwing the batch; `PARTIAL` computed correctly.
- [ ] Stage 5 uses embeddings + bounded pass, never one whole-book call.
- [ ] Export watermark decision reads the live `Subscription`, uncached.
- [ ] No direct AI SDK import anywhere in `src/worker/`.

**Tests to write:** per-image failure isolation and `PARTIAL` batch status; the cost ceiling pausing rather than overspending; a `FREE`-plan export always watermarked and an `ACTIVE` `PRO` export never watermarked.