---
trigger: always_on
---

# Security Rules

Specific, checkable rules only. Generic "be secure" language is deliberately excluded — if a rule can't be pointed at a concrete failure mode, it doesn't belong here.

## Ownership checks (hard rule)

- Every read or write to `Book`, `SourceImage`, `Section`, `TranscriptionFlag`, `Diagram`, `Job`, `Transaction`, or `Subscription` must verify the row belongs to the authenticated user — via `userId` or the chain back to it (e.g. `Section` → `Book.userId`).
- No endpoint, script, or admin tool skips this check "for convenience," including during local development or testing. A missing ownership check is a data leak between students, not a minor gap — it fails the task even if the endpoint returns the expected shape of data.

## Entitlement checks (hard rule)

- Never trust a client-supplied plan, subscription, or credit value to grant an entitlement. Any check that gates a paid benefit (no watermark, higher upload cap, extra credits) reads the live `Subscription`/`User.creditBalance` record server-side at the moment the benefit is granted. See `money-and-billing.md` for the full entitlement-check rule.

## Age verification (hard rule)

- R26 requires verifying the user is 15 or over at sign-up. This check happens server-side and blocks account creation on failure. A client-side checkbox alone does not satisfy this requirement — it must be enforced where it can't be bypassed by disabling JavaScript or editing a request.

## Payment webhook handling (hard rule)

- Every incoming webhook from the payment provider (Flutterwave) must have its signature verified before any part of its payload is trusted.
- Webhook processing must be idempotent, keyed by the provider's transaction/reference ID. A duplicate delivery of the same event must never credit an account, extend a subscription, or record a transaction twice.
- An unverified or duplicate webhook event is discarded and logged, never partially processed "just in case it's legitimate."

## Upload validation (hard rule)

- Uploaded files are validated server-side against the accepted formats (JPEG, PNG, HEIC per R1). Client-reported MIME type or file extension is never trusted alone — the server checks the actual file content.

## Secrets and configuration

- API keys, database connection strings, and provider credentials live only in environment variables or a secrets manager. Never hardcoded in source, never committed (see `git-conventions.md`), never logged.

## Logging and PII

- Application logs (including the job-failure logs required for debugging) never contain a user's email, name, uploaded image content, or transcribed note text. Log identifiers (user ID, job ID, book ID) instead of the personal data itself.

## Encryption baseline

- Data in transit uses TLS everywhere (provided by default through the locked stack and hosting providers). Data at rest in object storage and PostgreSQL uses the storage/database provider's default encryption at rest. This is a stated baseline, not something to re-litigate per feature — if a provider's default changes, update this file once, not per PR.

## Dependencies

- Do not knowingly introduce a package with a known, unpatched vulnerability. Keep dependencies on supported versions; do not pin to an outdated version to avoid a minor breaking change without a documented reason.