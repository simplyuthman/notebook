import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createPaymentLog, parseProCheckoutReference, settleProSubscription } from "@/server/billing";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Flutterwave webhook receiver for subscription payments.
 *
 * Order of operations (never reordered):
 *  1. Apply Rate Limiting (max 10 attempts per 15 min window per IP).
 *  2. Verify signature against RAW body BEFORE parsing anything.
 *  3. Delegate to settleProSubscription — idempotency check, API
 *     re-verification, then the paired subscription+ledger write (R33).
 */

interface WebhookPayload {
  type?: string;
  data?: {
    id?: string | number;
    tx_ref?: string;
  };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function isSignatureValid(
  rawBody: string,
  secret: string,
  hmacSignature: string | null,
  verifHash: string | null
): boolean {
  // New style: HMAC-SHA256 of the raw body, base64-encoded.
  if (hmacSignature) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
    if (safeEqual(expected, hmacSignature)) {
      return true;
    }
  }
  // Legacy v3 style: header equals the configured secret hash verbatim.
  if (verifHash) {
    if (safeEqual(secret, verifHash)) {
      return true;
    }
  }
  return false;
}

export async function POST(req: Request) {
  // 1. Rate Limiting (max 10 attempts per 15 minutes window)
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`webhook:${clientIp}`, {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.success) {
    console.warn("billing.webhook.rate_limited", { clientIp });
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many webhook requests. Please retry later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter > 0 ? retryAfter : 60),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetTime),
        },
      }
    );
  }

  const rawBody = await req.text();
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const hmacSignature = req.headers.get("flutterwave-signature");
  const verifHash = req.headers.get("verif-hash");

  // 2. Signature verification FIRST.
  if (!secret || !isSignatureValid(rawBody, secret, hmacSignature, verifHash)) {
    console.warn("billing.webhook.discarded", {
      reason: !secret ? "unconfigured" : "signature_mismatch",
    });
    await createPaymentLog({
      reference: "WEBHOOK_UNVERIFIED",
      event: "WEBHOOK_INVALID_SIGNATURE",
      status: "FAILED",
      rawPayload: rawBody.slice(0, 1000),
      error: !secret ? "unconfigured_secret" : "signature_mismatch",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Safe to parse only after the signature verified.
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    console.warn("billing.webhook.discarded", { reason: "unparseable_body" });
    await createPaymentLog({
      reference: "WEBHOOK_UNPARSEABLE",
      event: "WEBHOOK_UNPARSEABLE",
      status: "FAILED",
      rawPayload: rawBody.slice(0, 1000),
      error: "JSON parse failed",
    });
    return NextResponse.json({ received: true });
  }

  const data = payload.data ?? {};
  const reference = typeof data.tx_ref === "string" ? data.tx_ref : null;
  const providerTxId = data.id != null ? String(data.id) : null;
  const parsed = reference ? parseProCheckoutReference(reference) : null;

  await createPaymentLog({
    userId: parsed?.userId ?? null,
    reference: reference ?? "WEBHOOK_NO_REF",
    providerTxId,
    event: "WEBHOOK_RECEIVED",
    status: "SUCCESS",
    rawPayload: JSON.stringify(payload),
  });

  // 2. Only completed charges matter here; ack everything else.
  if (payload.type !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  if (!reference) {
    console.warn("billing.webhook.ignored", { reason: "missing_reference" });
    return NextResponse.json({ received: true });
  }

  // 3. Shared settlement path — verify + grant atomically, idempotently.
  try {
    const outcome = await settleProSubscription(reference, providerTxId);
    console.log("billing.webhook.settled", { reference, outcome });
    // All outcomes are terminal answers; ack so Flutterwave stops retrying.
    return NextResponse.json({ received: true, outcome });
  } catch (err) {
    // Transient failure (DB unreachable etc.) — non-200 makes Flutterwave
    // retry (3×, 30 min apart) until the ledger lands.
    console.error("billing.webhook.apply_failed", { err, reference });
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
  }
}

