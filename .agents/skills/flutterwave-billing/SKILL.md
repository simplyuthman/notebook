---
name: flutterwave-billing
description: Use when working on anything where kobo moves — payments, webhooks, subscriptions, credits, refunds, or the watermark gate. Triggers on payment, webhook, subscription, credit, refund, watermark, Flutterwave.
---

# Flutterwave Billing

Teaches the webhook order of operations, idempotency by reference, and atomic ledger-paired balance changes. Laws live in `money-and-billing.md`, `security.md` (payment webhook handling), R32/R33/R34, and AGENTS.md Section 3 rules 6 and 13.

## Procedure

1. On any incoming Flutterwave webhook, read the raw request body and verify its signature before parsing it as JSON or trusting any field in it.
2. If the signature doesn't verify, log `WEBHOOK_INVALID_SIGNATURE` to `PaymentLog` and discard the event. Never partially process it "just in case it's legitimate."
3. Look up the event by the provider's transaction/reference id before applying any effect. If a `Transaction` with that reference already exists, record `SETTLEMENT_DUPLICATE` to `PaymentLog`, acknowledge and stop — never credit, extend, or record twice for the same reference.
4. For a new, verified event: apply the business effect (credit purchase, subscription charge/renewal, or failure/reversal) and write the paired `Transaction` ledger row AND `PaymentLog` audit row (`SETTLEMENT_GRANTED`) in the same `db.$transaction` operation. If the ledger write fails, the balance/subscription change must not be treated as successful either.
5. For a charge/renewal: update `Subscription.status` and `currentPeriodEnd`. For a failure/reversal: reflect it immediately in `Subscription`/credit balance — no undocumented grace period beyond what's explicitly in config.
6. Never grant the no-watermark benefit from this webhook path by writing a cached flag. It is always re-derived at export time by reading the live `Subscription.status === ACTIVE` and `currentPeriodEnd` in the future (R25, R34 — this connects to the export stage in `pipeline-job-builder`).
7. Return the correct acknowledgment to Flutterwave so it doesn't retry an already-handled event.
8. Every price/allowance value used here (price per image, cost floor, monthly allowance) is read from `src/server/billing/` or `src/config/` — never inline, and never at or below the measured cost floor.

## Code skeleton

```ts
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers)) {           // 1–2. verify first
    logDiscardedWebhook(rawBody);
    return ack();
  }

  const event = JSON.parse(rawBody);
  const existing = await db.transaction.findFirst({        // 3. idempotency
    where: { reference: event.reference },
  });
  if (existing) return ack();

  await db.$transaction(async (tx) => {                     // 4. paired ledger write
    await applyBillingEffect(tx, event);                    // credit / charge / reversal
    await tx.transaction.create({ data: toLedgerRow(event) });
  });

  return ack();
}

// No-watermark is never decided here — only at export time (pipeline-job-builder):
// const active = subscription.status === "ACTIVE" && subscription.currentPeriodEnd > now();
```

## Traps

- Parsing the JSON body before verifying the signature.
- Trusting a webhook event without checking if its reference was already processed.
- Updating balance/subscription without a paired `Transaction` write in the same operation.
- Granting no-watermark by writing a cached flag instead of re-checking `Subscription` live at export.
- Hardcoding a price or allowance number inline instead of reading config.

## Verify before done

- [ ] Signature verified before any payload field is read.
- [ ] Idempotency checked by provider reference before applying any effect.
- [ ] Ledger write is atomically paired with the balance/subscription change.
- [ ] No-watermark decision is never pre-computed here — only checked live at export.
- [ ] All price/allowance values come from config, none inline, none at or below cost floor.

**Tests to write:** duplicate-webhook-delivery test asserting no double credit/extension (R33); a test that a reversed/failed payment immediately reflects in `Subscription`/credit state.