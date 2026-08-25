---
trigger: always_on
---

# Git Conventions

Soft conventions are noted as such. Hard rules are marked and block merge regardless of how clean the rest of the commit is.

## Soft conventions (style, not gates)

- Prefer conventional-commit-style prefixes (`feat:`, `fix:`, `chore:`, `refactor:`) for readability. Not enforced by CI, not worth a review comment on its own.
- Branch names should reference the task or requirement they address (e.g. `feat/r31-upload-plan-limit-check`) where practical.

## Hard rules

- **Never commit secrets.** No API keys, database URLs, provider credentials, or `.env` contents in any commit, ever, including in commit messages or squashed history. This is enforced by a pre-commit or CI secret scan, not by trusting review to catch it. A leaked key is a security incident regardless of whether the feature works.
- **Schema changes and their Prisma migration ship in the same commit or PR.** A schema edit merged without its migration is an incomplete, broken change — the database and the code are now out of sync.
- **Traceability for money, auth, and schema-affecting changes.** Any commit touching `Transaction`, `Subscription`, plan-limit logic, authentication/ownership checks, or the Prisma schema must reference the requirement number (Rxx) or AGENTS.md rule it relates to in the commit message or PR description. If a billing bug appears later, this is how it gets found and understood quickly — "fixed a bug" is not sufficient for these paths.
- **No direct commits to main for money, auth, or schema changes.** These require review before merge, even if the author is confident. This does not apply to pure refactors or docs changes.

## What's not a rule

- Squash-vs-merge preference, PR size limits, and exact branch naming grammar are not enforced here. Pick a sane default and move on; it's not worth blocking a task over.