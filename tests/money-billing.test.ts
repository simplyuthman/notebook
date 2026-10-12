import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "../src/config";
import {
  getProPrice,
  getProPriceInNaira,
  buildProCheckoutReference,
  parseProCheckoutReference,
} from "../src/server/billing";

describe("Money and Billing Rules (PRD Section 8 & Section 10)", () => {
  it("stores money as minor-unit integers (kobo for NGN) with no floats", () => {
    const monthlyPrice = getProPrice("MONTHLY");
    const yearlyPrice = getProPrice("YEARLY");

    assert.equal(Number.isInteger(monthlyPrice), true);
    assert.equal(Number.isInteger(yearlyPrice), true);
    assert.equal(monthlyPrice, 500000); // ₦5,000.00 = 500,000 kobo
    assert.equal(yearlyPrice, 5000000); // ₦50,000.00 = 5,000,000 kobo
  });

  it("converts correctly between naira and kobo at provider boundary", () => {
    assert.equal(getProPriceInNaira("MONTHLY"), 5000);
    assert.equal(getProPriceInNaira("YEARLY"), 50000);
  });

  it("satisfies the pricing principle: subscription price exceeds cost floor with margin", () => {
    const monthlyPrice = config.billing.pro.monthlyPrice; // 500,000 kobo
    const monthlyAllowance = config.limits.pro.monthlyImages; // 150 images
    const costPerImage = config.aiCostPerImage; // 2,000 kobo (₦20)

    const fullAllowanceCost = monthlyAllowance * costPerImage; // 300,000 kobo (₦3,000)
    assert.ok(
      monthlyPrice > fullAllowanceCost,
      `Pro price (${monthlyPrice}) must exceed full allowance cost (${fullAllowanceCost})`
    );
  });

  it("ensures the per-book AI cost ceiling sits above the largest allowed book", () => {
    const largestBookImages = config.limits.pro.perBookImages; // 300 images
    const costPerImage = config.aiCostPerImage; // 2,000 kobo
    const maxBookAiCost = largestBookImages * costPerImage; // 600,000 kobo

    assert.ok(
      config.aiCostCeiling > maxBookAiCost,
      `Per-book cost ceiling (${config.aiCostCeiling}) must exceed max book cost (${maxBookAiCost})`
    );
  });

  it("correctly generates and parses checkout reference tokens", () => {
    const userId = "usr_12345abcdef";
    const ref = buildProCheckoutReference(userId, "MONTHLY");

    assert.ok(ref.startsWith("pro-MONTHLY-"));
    const parsed = parseProCheckoutReference(ref);
    assert.ok(parsed !== null);
    assert.equal(parsed?.userId, userId);
    assert.equal(parsed?.interval, "MONTHLY");
  });
});
