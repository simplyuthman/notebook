# Peer Review Documentation

---

## Overview

**NotesBook** is a web application designed for university students and self-learners that transforms photos of handwritten notes into structured, editable digital books. A student uploads single or bulk images of handwritten pages; a vision-capable AI model transcribes the handwriting, assigns character-span confidence metrics, flags unreadable sections without fabricating text, extracts diagrams with preserved in-flow positions, and organizes content into chapters for editing and PDF export.

This release implements **v1 ("Core capture to book")**, adhering strictly to the architectural specifications and constraints defined in the product requirements and rules of engagement:
* **Framework & Core Stack:** Next.js (App Router), TypeScript (strict mode), Prisma ORM, and PostgreSQL.
* **Asynchronous Processing Pipeline:** Dedicated long-running BullMQ worker process backed by Redis, strictly isolated from the Next.js request path.
* **Storage Architecture:** Cloudflare R2 / S3-compatible cloud object storage for binaries, using short-lived presigned upload and read URLs, with metadata in PostgreSQL and an automatic local file fallback for offline local development.
* **Centralized AI Interface:** Vision transcription, confidence scoring, and diagram extraction routed exclusively through a single internal service layer (`src/server/ai/`).
* **Financial Integrity:** All monetary values stored strictly as whole minor units (kobo for NGN) with explicit currency fields—no floating-point values anywhere.
* **Privacy & Isolation:** Zero data leakage across users, rigorous ownership checks on every database access, and full deletion parity (deleting a book or account purges both the database rows and the binary assets from object storage).

---

## Key Features

### 1. Robust Note Capture & Upload Gateway
* **Supported Formats:** Validates JPEG, PNG, and HEIC files server-side (R1).
* **Upload Quotas & Ceilings:** Enforces a hard technical upper bound of 50 images per batch (R3) and plan-specific allowances (Free: 30 images/month, 20 images/book; Pro: 150 images/month, 300 images/book) before initiating processing (R31).
* **Presigned Cloud Uploads:** Generates short-lived presigned PUT URLs so clients upload directly to Cloudflare R2 (R7), with automatic local disk fallback (`.uploads/`) in offline developer environments.

### 2. Vision AI Transcription & Failure Isolation (Stages 1–4)
* **Centralized Provider Adapter:** Integrates Google Gemini Vision via `src/server/ai/` to extract text, span-level confidence, and diagram regions.
* **Fabrication Prevention (R10, R11):** Unreadable or smudged handwriting is explicitly labeled as `GAP` flags with exact `startOffset` and `endOffset` character ranges—never guessed or invented. Spans below confidence thresholds are tagged as `LOW`.
* **Diagram Preservation (R12, R23):** Diagrams are captured as distinct `Diagram` records with in-flow sequence order, rather than forced into plain text.
* **Per-Image Failure Isolation (AGENTS.md Rule 11):** Each image executes in an isolated BullMQ job. A failed image is marked `FAILED` without failing the batch; mixed batches cleanly reach a `PARTIAL` outcome while the book transitions to `READY` so successful pages remain accessible.
* **Per-Book AI Cost Ceiling (Section 6, Rule 10):** Enforces a per-book cost ceiling in application configuration (650,000 kobo / ₦6,500). If projected AI spend exceeds the ceiling, processing pauses cleanly instead of overspending.

### 3. Flutterwave Billing & Subscription Management
* **Strict Minor Units:** All transaction amounts and prices are represented in kobo integers (e.g., Monthly Pro: `500000` kobo = ₦5,000; Yearly Pro: `5000000` kobo = ₦50,000).
* **Live Entitlement Checking:** Watermark-free exports and raised caps check the live `Subscription` status (`ACTIVE` with future `currentPeriodEnd`) directly against the database—never relying on cached or client-supplied plan states (R25, R34).
* **Idempotent Webhook & Settlement:** Signature verification occurs on raw payloads before parsing. Transactions are keyed by reference tokens (`pro-<INTERVAL>-<USER_ID>-<TIMESTAMP>`) to prevent duplicate billing charges (R33).

### 4. Authentication, Verification & Security
* **Age Verification (R26):** Verifies the user is eligible at signup before any book or image can be created.
* **Email Verification & Password Reset:** Multi-step verification codes with expiry limits, delivered via background jobs.
* **Complete Cascading Delete Parity (R28, R29):** Deleting a book or user cascades cleanly across sections, flags, diagrams, and jobs, while purging associated objects from storage.

---

## Peer Review Verification Instructions

Follow these step-by-step instructions to pull, build, run, and verify the implementation independently.

### 1. Prerequisites
Ensure you have the following installed in your local environment:
* **Node.js:** v20+ LTS
* **npm:** v10+
* **PostgreSQL:** Running locally or a remote connection URL
* **Redis (Optional for worker tests):** Running on `localhost:6379` (BullMQ queues degrade gracefully if offline during Next.js builds)

---

### 2. Environment Setup

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repo-url>
   cd notebook
   npm install
   ```

2. **Configure environment variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   * Ensure `DATABASE_URL` points to your PostgreSQL database.
   * `GEMINI_API_KEY`, `FLUTTERWAVE_SECRET_KEY`, and R2 storage credentials are pre-configured with dev mock fallbacks for local evaluation if external API keys are not supplied.

3. **Initialize the Database:**
   Push the locked Prisma schema to your local database:
   ```bash
   npx prisma db push
   ```

---

### 3. Automated Quality Gates

Verify that all automated checks pass with zero errors:

* **Run Automated Test Suites:**
  ```bash
  npm test
  ```
  *Expected Output:* All test suites pass (10/10 tests passing, 0 failing), verifying minor units, cost floors, 50-image batch ceilings, AI GAP span mapping, and partial batch isolation.

* **Run Strict TypeScript Compilation Check:**
  ```bash
  npx tsc --noEmit
  ```
  *Expected Output:* Exits cleanly with code `0` and zero type errors.

* **Run ESLint:**
  ```bash
  npm run lint
  ```
  *Expected Output:* Exits with `✔ No ESLint warnings or errors`.

* **Verify Production Build:**
  ```bash
  npm run build
  ```
  *Expected Output:* Generates all static and dynamic route traces cleanly with code `0`.

---

### 4. Interactive Flow Verification

#### A. Web Application & Dashboard
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. **Sign Up / Sign In:** Register a new account with email and password. Verify password requirements (minimum 8 characters with lowercase, uppercase, number, and special character).
4. **Create a Book:** In the dashboard, click **"New Book"**, enter a title, and confirm creation.
5. **Upload Notes:** Click **"Upload Notes"** inside the book view.
   * Select a note image (PNG, JPEG, or HEIC).
   * Verify that uploading more than 50 images in a single batch is rejected server-side.
   * Confirm the uploaded image appears in the note drawer with an `UPLOADED` status badge.

#### B. Background Worker & Transcription Pipeline
1. In a separate terminal, launch the dedicated long-running worker:
   ```bash
   npm run start:worker
   ```
   *Expected Output:* The worker logs active listeners on the `verification-email` and `transcribe-queue` queues.
2. In the web dashboard book detail view, click **"Start Processing"**.
3. **Observe State Transitions:**
   * The book transitions from `DRAFT` to `PROCESSING`.
   * The worker claims the job, marks it `RUNNING`, downloads the image buffer, and executes OCR via the internal AI interface.
   * Atomic commit writes the transcribed sections, `TranscriptionFlag` records, and `Diagram` records.
   * The image badge updates to `TRANSCRIBED` and the book status finishes at `READY`.

#### C. Billing & Pro Upgrade
1. Click the **"Upgrade to Pro"** button or open the user avatar menu and select **"Billing"**.
2. Notice prices displayed in Naira (₦5,000/mo, ₦50,000/yr), backed strictly by kobo integers in configuration.
3. Test billing cancellation and reactivation dialogs; inspect network payloads to confirm integer money formatting.
4. Verify that non-Pro users receive watermark warnings on exports while active Pro users have watermarks removed based strictly on live subscription dates.

---

### 5. Verification Checklist for Reviewers

| Checkpoint | Requirement | Verification Step |
|---|---|---|
| **Build & Types** | AGENTS.md §5 | `npm run build` and `npx tsc --noEmit` pass with zero errors. |
| **Linting** | AGENTS.md §5 | `npm run lint` reports zero warnings and zero errors. |
| **Unit Tests** | AGENTS.md §6 | `npm test` passes 100% of tests. |
| **Money in Kobo** | PRD §10, Rule 13 | Inspect `src/server/billing/` and `src/config/`: all money fields are integers. |
| **Upload Limits** | R3, R31 | Batches > 50 rejected; monthly caps strictly enforced before processing. |
| **AI Interface** | AGENTS.md §2 | All vision AI calls route strictly through `src/server/ai/`; no inline SDK imports. |
| **GAP Flags** | R10, R11 | Unreadable text marked as `GAP` with offsets; text is never fabricated. |
| **Batch Isolation** | AGENTS.md Rule 11 | Individual image failures mark the image `FAILED` without failing the batch. |
| **Cascade Delete** | R28, R29 | Deleting a book purges DB records and invokes `deleteObject` in storage. |
