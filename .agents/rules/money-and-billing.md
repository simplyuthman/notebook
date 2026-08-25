---
trigger: glob
---

# Money and Billing Rules

Every rule here traces to a specific PRD requirement or a named financial risk. Breaking any of these means the task failed even if payments appear to process and the UI looks correct.

## Money representation (hard rule)

- All money is stored and calculated as `Int` in minor units (kobo). Never `Float`, never `Decimal`, never a string parsed back into a number for arithmetic. This applies everywhere money is touched: pricing config, `Transaction.amountMinor`, invoices, receipts, logs.
- `currency` is always an explicit field (default `"NGN"`). Never assume currency from context or hardcode a symbol without a matching currency code.

## Pricing floor (hard rule)

- Price per image, for every plan and credit pack, must exceed the measured cost per image with margin. No plan, promotion, or credit pack may be configured at or below the cost floor, even temporarily, even for a launch discount, without an explicit, reviewed exception.
- There is no unlimited tier, ever. Every plan carries a bounded monthly image allowance, and monthly allowance × cost per image must stay below the plan's price with margin.
- These checks live in `src/config/` and `src/server/billing/`, not scattered as inline constants across the codebase.

## Batch ceiling vs. plan allowance (hard rule)

- The 50-image-per-batch ceiling (R3) is a technical upper bound only. It is never displayed, documented, or enforced as if it were a user's plan allowance.
- Plan limits are enforced first, before the batch ceiling is even relevant, and before any processing job is created (R31). An upload exceeding a student's plan allowance is blocked at upload time with a clear message — never accepted and failed later after AI cost has already been spent.

## Cost ceiling (hard rule)

- Every book respects a per-book AI cost ceiling, held in config. When a book approaches it, processing pauses and the student is prompted to spend credits or upgrade. Processing never silently continues past the ceiling.

## Transaction ledger (hard rule)

- Every charge, credit purchase, credit spend, and plan change writes a `Transaction` record. No billing-affecting action is allowed to complete without a corresponding ledger entry — if the ledger write fails, the action itself must not be treated as successful.

## Entitlement checks (hard rule)

- The no-watermark benefit (R25, R34) is gated on `Subscription.status === ACTIVE` and `currentPeriodEnd` being in the future, checked at the moment of export.
- **This check is never cached.** A UI element that merely *displays* the user's plan (e.g. a badge in the dashboard) may use a short-lived cache for responsiveness, but the actual decision to apply or omit a watermark always reads the live `Subscription` record, with no exception for latency or convenience.

## Payment webhook handling (hard rule — see also `security.md`)

- Every Flutterwave webhook is signature-verified before its payload is trusted.
- Webhook processing is idempotent by provider reference. A duplicate delivery must never double-credit an account, double-extend a subscription period, or write a duplicate `Transaction`.
- A failed or reversed payment reflects immediately in the user's `Subscription` or credit balance — no undocumented grace period beyond what is explicitly configured in `src/config/`.

## Payment audit logs (hard rule)

- Every checkout initialization (`CHECKOUT_INITIATED`, `CHECKOUT_INITIATION_FAILED`), incoming webhook (`WEBHOOK_RECEIVED`, `WEBHOOK_INVALID_SIGNATURE`), and settlement decision (`SETTLEMENT_GRANTED`, `SETTLEMENT_DUPLICATE`, `SETTLEMENT_REJECTED`, `SETTLEMENT_UNVERIFIABLE`) writes a `PaymentLog` record.
- Captures provider (default `"FLUTTERWAVE"`), `reference` (tx_ref), kobo minor units (`amountMinor`), status, and full raw payload JSON strings (`rawPayload`) for complete auditability.

## What's genuinely still open

- The exact cost-per-image figure (assumed ~20 Naira in the PRD) is provisional and gated on real measurement. Do not hardcode pricing decisions as if this number were final — read it from config so it can be corrected without a code change.