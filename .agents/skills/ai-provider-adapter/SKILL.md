---
name: ai-provider-adapter
description: Use when working inside the AI service layer (src/server/ai/, also referenced as src/services/ai) — adapters, prompts, confidence mapping, or provider switching. Triggers on adapter, prompt, confidence, provider, Claude, DeepSeek.
---

# AI Provider Adapter

Teaches the AiService contract, the review discipline for changes here, response validation, normalization, and the fabrication net enforcing R11. Laws live in `ai-pipeline.md`, AGENTS.md Section 2 (AI integration), `database-schema.md` (`TranscriptionFlag`), and R9/R10/R11.

Note: the locked location for this code is `src/server/ai/` per AGENTS.md Section 4. If you were pointed at `src/services/ai`, treat that as the same place — the folder layout in AGENTS.md is authoritative.

## Procedure

1. All AI calls go through one interface in `src/server/ai/` — call it `AiService`. No job, route handler, or component calls a provider SDK directly (AGENTS.md Section 2, `ai-pipeline.md`).
2. `AiService` exposes exactly two capabilities: vision-transcription (image → text + per-span confidence + diagram regions) and text-structuring (sections/embeddings → chapter groupings). Never one blended call.
3. Each provider gets its own thin adapter file inside `src/server/ai/` (e.g. `claude-adapter.ts`, `deepseek-adapter.ts`). Provider quirks — context window size, rate limits, error codes — stay inside that file, read from provider-specific config, never assumed universal.
4. Neither vendor returns a native confidence score. Prompt the model explicitly to mark spans, then map its uncertainty signal (refusal, hedged language, an explicit "unreadable" marker) into exactly `HIGH`, `LOW`, or `GAP` — matching `SectionConfidence`/`FlagType`. Never read a generic vendor confidence field.
5. The fabrication net: an uncertain or refused span becomes a `GAP` flag with its offsets. It is never filled in with the model's best guess, for any provider. This is R11, and it does not bend.
6. Validate the raw provider response shape before normalizing it. If a provider lacks a capability entirely (e.g. no vision, routed into the vision slot by mistake), fail loudly at config/job time — never fall back to guessing silently.
7. Convert the provider's usage/cost data into minor-unit currency before it reaches the cost-ceiling check — never leak a vendor unit like "tokens" into product logic.
8. `[ASSUMED — extends git-conventions.md's review rule to this area, given R11's fabrication risk]` Any change to an adapter or the shared normalized contract gets two separate, dated reviewer sign-offs before merge — treat it with at least the rigor of a money/schema change.
9. Write the parity test: run the same fixture through every configured adapter (at minimum Claude and DeepSeek) using recorded/mocked responses, and assert identical normalized output. A change tested against only one vendor is not done.

## Code skeleton

```ts
// The one contract — never bypassed
interface AiService {
  transcribe(image: ImageInput): Promise<{
    spans: { text: string; confidence: "HIGH" | "LOW" | "GAP"; startOffset: number; endOffset: number }[];
    diagrams: { storageKey: string; caption: string; order: number }[];
    costMinor: number;
  }>;
  structure(sections: SectionInput[]): Promise<{ chapters: ChapterProposal[] }>;
}

// claude-adapter.ts — quirks stay here
class ClaudeAdapter implements AiService {
  async transcribe(image: ImageInput) {
    const raw = await callClaudeVision(image);          // vendor-specific call
    validateShape(raw);                                  // fail loudly if wrong
    return normalizeToContract(raw);                     // never invent GAP text
  }
}

// Parity test — mandatory
test("claude and deepseek adapters normalize identically", async () => {
  const fixture = loadFixture("sample-handwriting.json");
  expect(await claudeAdapter.transcribe(fixture)).toEqual(await deepseekAdapter.transcribe(fixture));
});
```

## Traps

- Reading a vendor's own "confidence" or "logprobs" field as if it were `SectionConfidence`.
- Letting a low-confidence span get filled in with the model's guess "since it's close."
- Hardcoding a context-window token count instead of reading it from provider config.
- Testing a contract change against only the provider you happen to be using that day.
- Calling a provider SDK from a job file or route handler directly.
- Leaking "tokens" as a unit into the cost-ceiling check instead of converting to currency first.

## Verify before done

- [ ] No file outside `src/server/ai/` imports a provider SDK.
- [ ] Every span is `HIGH`, `LOW`, or `GAP` — nothing else, and `GAP`/`LOW` never contain invented text.
- [ ] Provider-specific config (context window, rate limits) is read from config, not hardcoded.
- [ ] Cost is converted to minor-unit currency before leaving the adapter.
- [ ] Two dated reviewer sign-offs recorded for this change.
- [ ] Parity test passes against every configured adapter.

**Tests to write:** the cross-provider parity test; a test asserting a low-confidence/unreadable span always becomes `GAP`/`LOW` and never appears as invented body text (R11, R10).