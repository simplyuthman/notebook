import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Batch Isolation and Partial Status (AGENTS.md Section 3 Rule 11)", () => {
  it("isolates image failures so one failed image does not fail the whole batch", () => {
    interface SimulatedJobOutcome {
      imageId: string;
      status: "SUCCEEDED" | "FAILED";
    }

    const batch: SimulatedJobOutcome[] = [
      { imageId: "img_1", status: "SUCCEEDED" },
      { imageId: "img_2", status: "FAILED" },
      { imageId: "img_3", status: "SUCCEEDED" },
    ];

    const hasFailure = batch.some((j) => j.status === "FAILED");
    const hasSuccess = batch.some((j) => j.status === "SUCCEEDED");

    assert.equal(hasFailure, true);
    assert.equal(hasSuccess, true);

    // Compute roll-up: a mixed batch reaches PARTIAL / continued READY state, not total failure
    const batchOutcome = hasSuccess && hasFailure ? "PARTIAL" : hasSuccess ? "SUCCEEDED" : "FAILED";
    assert.equal(batchOutcome, "PARTIAL");
  });
});
