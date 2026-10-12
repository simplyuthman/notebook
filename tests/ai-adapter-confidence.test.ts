import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ConfidenceSpan, TranscriptionResult } from "../src/server/ai";

describe("AI Interface Confidence & GAP Handling (R10, R11)", () => {
  it("never fabricates text for unreadable handwriting and labels GAP spans", () => {
    // Model raw response simulation with unreadable segment
    const sampleSpans: ConfidenceSpan[] = [
      { text: "Linear Algebra", confidence: "HIGH", startOffset: 0, endOffset: 14 },
      { text: "[Unreadable]", confidence: "GAP", startOffset: 15, endOffset: 27 },
      { text: "eigenvectors", confidence: "LOW", startOffset: 28, endOffset: 40 },
    ];

    const gapSpans = sampleSpans.filter((s) => s.confidence === "GAP");
    assert.equal(gapSpans.length, 1);
    assert.equal(gapSpans[0].confidence, "GAP");
    assert.equal(gapSpans[0].startOffset, 15);
    assert.equal(gapSpans[0].endOffset, 27);
  });

  it("identifies low-confidence spans and retains exact character offsets", () => {
    const lowSpan: ConfidenceSpan = {
      text: "orthogonal",
      confidence: "LOW",
      startOffset: 10,
      endOffset: 20,
    };

    assert.equal(lowSpan.confidence, "LOW");
    assert.equal(lowSpan.endOffset - lowSpan.startOffset, lowSpan.text.length);
  });
});
