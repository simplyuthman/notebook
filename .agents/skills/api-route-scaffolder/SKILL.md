---
name: api-route-scaffolder
description: Use when creating or editing any route, endpoint, or server action under src/app/api/. Triggers on route, endpoint, handler, server action, API.
---

# API Route Scaffolder

Teaches the opening ritual, in exact order, and thin-handler discipline. Laws live in `security.md` (ownership checks), `money-and-billing.md`/`uploads-and-storage.md` (R31), `coding-standards.md` (thin handlers, error handling), and AGENTS.md Section 4 (`app/` vs `server/` boundary).

## Procedure

1. Confirm the handler lives under `src/app/api/` and contains no business logic, AI calls, or long-running work — it only enqueues jobs or reads status (AGENTS.md Section 4).
2. Check the session first. Reject unauthenticated requests before touching anything else — ownership checks are meaningless until you know who's asking.
3. Parse and validate the request body's shape before using any of it. Never trust client input as-is (`coding-standards.md` strict typing; `security.md` upload-validation principle applied generally).
4. Resolve ownership: load the resource through its chain back to the authenticated user (e.g. `Section → Book.userId`, or a direct `userId` column) and reject the request if it doesn't match. Do this for every resource the endpoint touches — no endpoint skips it "for convenience" (`security.md`).
5. If this route creates an upload or a processing job, apply the limit gates before creating anything: plan allowance first, then the batch ceiling — block with a clear message before any job exists, never accept and fail later (R31, `money-and-billing.md`, `uploads-and-storage.md`).
6. Delegate the actual work to one function in the relevant `src/server/` module (`books`, `billing`, `storage`, `auth`). The handler calls it and returns the result — it does not itself write to the DB, call storage, or call the AI interface (AGENTS.md Section 4/5).
7. Wrap the call in error handling that logs enough context to debug and returns a clean error response. Never a silent catch (`coding-standards.md`).
8. If this route touches money, auth, or schema-adjacent logic, remember the commit needs its Rxx/rule reference and review before merge (`git-conventions.md`).

## Code skeleton

```ts
export async function POST(req: Request) {
  const session = await getServerSession();          // 1. session
  if (!session) return unauthorized();

  const input = validateInput(await req.json());     // 2. input shape

  const resource = await loadWithOwnership(           // 3. ownership
    input.resourceId, session.user.id
  );
  if (!resource) return notFound();

  if (isUploadRoute) {                                // 4. limits, R31
    const allowed = await checkPlanAllowance(session.user.id);
    if (!allowed) return blocked("Upload exceeds your plan allowance.");
    const withinBatch = checkBatchCeiling(input.images.length); // R3, 50 max
    if (!withinBatch) return blocked("Batch exceeds the maximum of 50 images.");
  }

  try {
    const result = await booksService.doTheWork(resource, input); // 5. delegate
    return ok(result);
  } catch (err) {
    logError("route.books.action", err, { userId: session.user.id }); // 6. log, no PII
    return serverError();
  }
}
```

## Traps

- Checking ownership before authentication — you can't check ownership of an unknown user.
- Running the plan-limit check after the job or record already exists.
- Putting AI calls or DB writes directly in the route file instead of `src/server/`.
- Returning success without the server layer writing the matching `Job`/`Transaction` state.
- Skipping the ownership check "just for this one internal/admin route."

## Verify before done

- [ ] Handler contains no business logic — only calls into `src/server/`.
- [ ] Session checked before anything else.
- [ ] Ownership verified via the correct chain for every resource touched.
- [ ] Upload/limit routes check plan allowance, then batch ceiling, before any job is created, with a clear blocked message (R31).
- [ ] Errors are logged with context, never swallowed.
- [ ] Money/auth-adjacent commits reference their Rxx/rule.

**Tests to write:** a test that an unauthenticated request is rejected; a test that a request for another user's resource is rejected; for upload/limit routes, a test that exceeding the plan allowance blocks before any job is created (R31 coverage).