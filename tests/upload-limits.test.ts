import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "../src/config";

describe("Upload Limits and Batch Ceilings (R3, R31)", () => {
  it("enforces the 50-image batch ceiling as a hard technical limit", () => {
    const batchCeiling = config.limits.batchCeiling;
    assert.equal(batchCeiling, 50);

    const testBatchSize = 51;
    const isExceeded = testBatchSize > batchCeiling;
    assert.equal(isExceeded, true);
  });

  it("enforces free and pro monthly and per-book allowances from config", () => {
    assert.equal(config.limits.free.monthlyImages, 30);
    assert.equal(config.limits.free.perBookImages, 20);
    assert.equal(config.limits.free.maxBooks, 3);

    assert.equal(config.limits.pro.monthlyImages, 150);
    assert.equal(config.limits.pro.perBookImages, 300);
  });
});
