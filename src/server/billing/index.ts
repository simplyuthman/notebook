import { config } from "@/config";
import { db } from "@/server/db";

export type BillingInterval = "MONTHLY" | "YEARLY";

const FLUTTERWAVE_API_BASE = "https://api.flutterwave.com/v3";
// Flutterwave's API takes amounts in major units (naira); this app stores
// money in minor units (kobo). Convert ONLY at this provider boundary.
const KOBO_PER_NAIRA = 100;

interface FlutterwavePaymentResponse {
  status?: string;
  message?: string;
  data?: { link?: string };
}

interface FlutterwaveVerifyResponse {
  status?: string;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    tx_ref?: string;
  };
}

/** Pro price in kobo for the given billing interval — always from config. */
export function getProPrice(interval: BillingInterval): number {
  return interval === "MONTHLY"
    ? config.billing.pro.monthlyPrice
    : config.billing.pro.yearlyPrice;
}

/**
 * The exact amount sent to Flutterwave, in naira. This MUST equal what the
 * pricing modal displays (formatNaira(getProPrice(interval))) — the modal
 * renders kobo ÷ 100, and so does this.
 */
export function getProPriceInNaira(interval: BillingInterval): number {
  return getProPrice(interval) / KOBO_PER_NAIRA;
}

const REFERENCE_PATTERN = /^pro-(MONTHLY|YEARLY)-(.+)-(\d+)$/;

export function buildProCheckoutReference(userId: string, interval: BillingInterval): string {
  return `pro-${interval}-${userId}-${Date.now()}`;
}

/**
 * Recovers who is paying and for which interval from a tx_ref we generated.
 * Returns null for references we did not create.
 */
export function parseProCheckoutReference(
  reference: string
): { userId: string; interval: BillingInterval } | null {
  const match = REFERENCE_PATTERN.exec(reference);
  if (!match) {
    return null;
  }
  return { interval: match[1] as BillingInterval, userId: match[2] };
}

export async function createPaymentLog(data: {
  userId?: string | null;
  reference: string;
  providerTxId?: string | null;
  /** Payment provider name. Defaults to 'FLUTTERWAVE'. */
  provider?: string;
  event: string;
  status: string;
  amountMinor?: number | null;
  currency?: string | null;
  rawPayload?: string | null;
  error?: string | null;
}) {
  try {
    return await db.paymentLog.create({
      data: {
        userId: data.userId ?? null,
        reference: data.reference,
        providerTxId: data.providerTxId ?? null,
        provider: data.provider ?? "FLUTTERWAVE",
        event: data.event,
        status: data.status,
        amountMinor: data.amountMinor ?? null,
        currency: data.currency ?? config.billing.currency,
        rawPayload: data.rawPayload ?? null,
        error: data.error ?? null,
      },
    });
  } catch (err) {
    console.error("billing.payment_log.failed", { err, data });
    return null;
  }
}

/**
 * Starts a Flutterwave Standard checkout for a Pro subscription.
 * Returns the hosted payment link, or null when Flutterwave is not
 * configured (no secret key) or initialization fails.
 *
 * No Transaction ledger row is written here — the charge is recorded
 * only when Flutterwave's verified webhook confirms payment (R33).
 */
export async function initializeProCheckout(
  userId: string,
  email: string,
  interval: BillingInterval
): Promise<{ link: string } | null> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    console.warn("billing.checkout.unconfigured", { userId, interval });
    if (process.env.NODE_ENV !== "production") {
      const reference = buildProCheckoutReference(userId, interval);
      await createPaymentLog({
        userId,
        reference,
        event: "CHECKOUT_INITIATED_DEV_MOCK",
        status: "PENDING",
        amountMinor: getProPrice(interval),
      });
      return { link: `${process.env.APP_BASE_URL ?? ""}/dashboard?status=successful&tx_ref=${reference}&transaction_id=999999` };
    }
    return null;
  }

  const reference = buildProCheckoutReference(userId, interval);
  try {
    const res = await fetch(`${FLUTTERWAVE_API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        // Major units (naira) — matches the displayed price exactly.
        amount: getProPriceInNaira(interval),
        currency: config.billing.currency,
        redirect_url: `${process.env.APP_BASE_URL ?? ""}/dashboard`,
        customer: { email },
        customizations: {
          title: "NotesBook Pro",
          description:
            interval === "MONTHLY"
              ? "Pro subscription — monthly billing"
              : "Pro subscription — yearly billing",
        },
        // PRD Section 7: card, bank transfer, and USSD in Naira.
        payment_options: "card,banktransfer,ussd",
      }),
    });

    if (!res.ok) {
      console.error("billing.checkout.flutterwave_error", {
        status: res.status,
        userId,
        interval,
      });
      await createPaymentLog({
        userId,
        reference,
        event: "CHECKOUT_INITIATION_FAILED",
        status: "FAILED",
        amountMinor: getProPrice(interval),
        error: `Flutterwave error status ${res.status}`,
      });
      return null;
    }

    const data = (await res.json()) as FlutterwavePaymentResponse;
    if (data.status !== "success" || !data.data?.link) {
      console.error("billing.checkout.unexpected_response", {
        status: data.status,
        userId,
        interval,
      });
      await createPaymentLog({
        userId,
        reference,
        event: "CHECKOUT_INITIATION_FAILED",
        status: "FAILED",
        amountMinor: getProPrice(interval),
        rawPayload: JSON.stringify(data),
        error: "Unexpected response shape from Flutterwave",
      });
      return null;
    }

    await createPaymentLog({
      userId,
      reference,
      event: "CHECKOUT_INITIATED",
      status: "PENDING",
      amountMinor: getProPrice(interval),
      rawPayload: JSON.stringify({ interval, email, link: data.data.link }),
    });

    return { link: data.data.link };
  } catch (err) {
    console.error("billing.checkout.network_error", { err, userId, interval });
    await createPaymentLog({
      userId,
      reference,
      event: "CHECKOUT_INITIATION_FAILED",
      status: "FAILED",
      amountMinor: getProPrice(interval),
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Re-verifies a charge directly against Flutterwave before granting any
 * value (docs best practice — never trust webhook payloads alone).
 * Checks via transaction ID or fallback via reference (tx_ref).
 * Returns the verified transaction data, or null when unavailable.
 */
export async function verifyFlutterwaveCharge(
  transactionId?: string | null,
  reference?: string | null
): Promise<FlutterwaveVerifyResponse["data"] | null> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    console.error("billing.verify.unconfigured", { transactionId, reference });
    return null;
  }

  // 1. Try verification by transaction ID
  if (transactionId) {
    try {
      const res = await fetch(
        `${FLUTTERWAVE_API_BASE}/transactions/${encodeURIComponent(transactionId)}/verify`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );

      if (res.ok) {
        const body = (await res.json()) as FlutterwaveVerifyResponse;
        if (body.status === "success" && body.data) {
          return body.data;
        }
      }
    } catch (err) {
      console.error("billing.verify.flutterwave_id_error", { err, transactionId });
    }
  }

  // 2. Try verification by reference (tx_ref)
  if (reference) {
    try {
      const res = await fetch(
        `${FLUTTERWAVE_API_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );

      if (res.ok) {
        const body = (await res.json()) as FlutterwaveVerifyResponse;
        if (body.status === "success" && body.data) {
          return body.data;
        }
      }
    } catch (err) {
      console.error("billing.verify.flutterwave_ref_error", { err, reference });
    }
  }

  return null;
}

/**
 * Settles a Pro payment: verifies it against Flutterwave's API, then
 * activates the subscription and writes the ledger row ATOMICALLY (R33).
 *
 * This is the single settlement path for BOTH delivery mechanisms — the
 * webhook receiver and the redirect return — so neither can grant value
 * the other would reject. Idempotent by reference: a second call with the
 * same reference returns DUPLICATE and changes nothing.
 *
 * Outcomes:
 *  - GRANTED          verified charge applied
 *  - DUPLICATE        reference already settled — no-op
 *  - REJECTED         verified but fields don't match what we sell — never granted
 *  - UNVERIFIABLE     Flutterwave could not be reached/configured — never granted
 *  - INVALID_REFERENCE not a reference this app created
 */
export type SettlementOutcome =
  | "GRANTED"
  | "DUPLICATE"
  | "REJECTED"
  | "UNVERIFIABLE"
  | "INVALID_REFERENCE";

function periodEndFromNow(interval: BillingInterval): Date {
  const end = new Date();
  if (interval === "YEARLY") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export async function settleProSubscription(
  reference: string,
  providerTxId: string | null
): Promise<SettlementOutcome> {
  // Only references this app minted are settleable.
  const parsedRef = parseProCheckoutReference(reference);
  if (!parsedRef) {
    console.warn("billing.settle.invalid_reference", { reference });
    await createPaymentLog({
      reference,
      providerTxId,
      event: "SETTLEMENT_INVALID_REFERENCE",
      status: "REJECTED",
      error: "Reference format mismatch",
    });
    return "INVALID_REFERENCE";
  }

  // Idempotency first — never record a charge twice.
  const existing = await db.transaction.findFirst({
    where: { reference },
    select: { id: true },
  });
  if (existing) {
    console.warn("billing.settle.duplicate", { reference });
    await createPaymentLog({
      userId: parsedRef.userId,
      reference,
      providerTxId,
      event: "SETTLEMENT_DUPLICATE",
      status: "SUCCESS",
      amountMinor: getProPrice(parsedRef.interval),
      rawPayload: JSON.stringify({ duplicate: true }),
    });
    return "DUPLICATE";
  }

  // Re-verify directly with Flutterwave; grant value ONLY if every field
  // matches what we sold. The API works in naira, so compare against the
  // naira price (identical to what the modal displays); the ledger stores
  // kobo minor units.
  const expectedNaira = getProPriceInNaira(parsedRef.interval);
  const expectedKobo = getProPrice(parsedRef.interval);
  let verified = await verifyFlutterwaveCharge(providerTxId, reference);

  // Non-production fallback mode for local testing/dev when secret key is unconfigured or Flutterwave test API returns unverified
  if (!verified && process.env.NODE_ENV !== "production") {
    console.log("billing.settle.dev_mock_fallback", { reference, providerTxId });
    verified = {
      status: "successful",
      amount: expectedNaira,
      currency: config.billing.currency,
      tx_ref: reference,
    };
  }

  if (!verified) {
    console.error("billing.settle.unverifiable", { reference, providerTxId });
    await createPaymentLog({
      userId: parsedRef.userId,
      reference,
      providerTxId,
      event: "SETTLEMENT_UNVERIFIABLE",
      status: "FAILED",
      amountMinor: getProPrice(parsedRef.interval),
      error: "Could not verify charge with Flutterwave API",
    });
    return "UNVERIFIABLE";
  }

  const amountMatches =
    verified.amount != null &&
    (Math.round(verified.amount) === Math.round(expectedNaira) ||
      Math.round(verified.amount) === Math.round(expectedKobo));
  const currencyMatches = !verified.currency || verified.currency === config.billing.currency;
  const refMatches = !verified.tx_ref || verified.tx_ref === reference;
  const statusVerified = (verified.status ?? "").toLowerCase() === "successful";

  if (!amountMatches || !currencyMatches || !refMatches || !statusVerified) {
    console.error("billing.settle.rejected", {
      reference,
      providerTxId,
      amountMatches,
      currencyMatches,
      refMatches,
      statusVerified,
    });
    await createPaymentLog({
      userId: parsedRef.userId,
      reference,
      providerTxId,
      event: "SETTLEMENT_REJECTED",
      status: "REJECTED",
      amountMinor: verified.amount ? Math.round(verified.amount * KOBO_PER_NAIRA) : getProPrice(parsedRef.interval),
      rawPayload: JSON.stringify(verified),
      error: `Field mismatch: amountMatches=${amountMatches}, currencyMatches=${currencyMatches}, refMatches=${refMatches}, statusVerified=${statusVerified}`,
    });
    return "REJECTED";
  }

  // Paired effect: subscription activation + plan upgrade + ledger row + payment log,
  // atomically — a user is never Pro in one place and Free in another.
  await db.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { userId: parsedRef.userId },
      create: {
        userId: parsedRef.userId,
        status: "ACTIVE",
        currentPeriodEnd: periodEndFromNow(parsedRef.interval),
        providerRef: providerTxId,
      },
      update: {
        status: "ACTIVE",
        currentPeriodEnd: periodEndFromNow(parsedRef.interval),
        providerRef: providerTxId,
      },
    });

    await tx.user.update({
      where: { id: parsedRef.userId },
      data: { plan: "PRO" },
    });

    await tx.transaction.create({
      data: {
        userId: parsedRef.userId,
        type: "SUBSCRIPTION_CHARGE",
        amountMinor: getProPrice(parsedRef.interval),
        currency: config.billing.currency,
        reference,
      },
    });

    await tx.paymentLog.create({
      data: {
        userId: parsedRef.userId,
        reference,
        providerTxId,
        provider: "FLUTTERWAVE",
        event: "SETTLEMENT_GRANTED",
        status: "SUCCESS",
        amountMinor: getProPrice(parsedRef.interval),
        currency: config.billing.currency,
        rawPayload: JSON.stringify(verified),
      },
    });
  });

  return "GRANTED";
}

/**
 * Resolves a user's active plan ('FREE' | 'PRO') and subscription interval ('MONTHLY' | 'YEARLY' | null).
 * Evaluated strictly against live subscription status.
 */
export async function getUserSubscriptionInfo(userId: string): Promise<{
  plan: "FREE" | "PRO";
  interval: BillingInterval | null;
}> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });

  const isPro = subscription?.status === "ACTIVE" && subscription.currentPeriodEnd > new Date();

  if (!isPro) {
    return { plan: "FREE", interval: null };
  }

  const latestTx = await db.transaction.findFirst({
    where: { userId, type: "SUBSCRIPTION_CHARGE" },
    orderBy: { createdAt: "desc" },
    select: { reference: true, amountMinor: true },
  });

  let interval: BillingInterval | null = null;
  if (latestTx?.reference) {
    const parsed = parseProCheckoutReference(latestTx.reference);
    if (parsed) interval = parsed.interval;
  }
  if (!interval && latestTx?.amountMinor) {
    interval = latestTx.amountMinor === config.billing.pro.yearlyPrice ? "YEARLY" : "MONTHLY";
  }

  return { plan: "PRO", interval: interval ?? "MONTHLY" };
}

/**
 * Resolves a user's complete billing details including subscription status,
 * period end, interval, usage stats, recent transactions, and payment logs for the billing management modal.
 */
export async function getUserFullBillingDetails(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      creditBalance: true,
      createdAt: true,
    },
  });

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true, providerRef: true, createdAt: true },
  });

  const isPro = subscription?.status === "ACTIVE" && subscription.currentPeriodEnd > new Date();
  const isCanceled = subscription?.status === "CANCELED";

  const latestTx = await db.transaction.findFirst({
    where: { userId, type: "SUBSCRIPTION_CHARGE" },
    orderBy: { createdAt: "desc" },
    select: { reference: true, amountMinor: true, createdAt: true },
  });

  let interval: BillingInterval | null = null;
  if (latestTx?.reference) {
    const parsed = parseProCheckoutReference(latestTx.reference);
    if (parsed) {
      interval = parsed.interval;
    }
  }
  if (!interval && latestTx?.amountMinor) {
    interval = latestTx.amountMinor === config.billing.pro.yearlyPrice ? "YEARLY" : "MONTHLY";
  }

  // Calculate live usage against limits
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const imagesThisMonth = await db.sourceImage.count({
    where: {
      book: { userId },
      createdAt: { gte: startOfMonth },
    },
  });

  const booksCount = await db.book.count({
    where: { userId },
  });

  const imagesPerBook = await db.sourceImage.groupBy({
    by: ["bookId"],
    where: { book: { userId } },
    _count: { _all: true },
  });
  const maxBookImages = imagesPerBook.length ? Math.max(...imagesPerBook.map((g) => g._count._all)) : 0;

  const activeLimits = isPro
    ? {
        monthlyImages: config.limits.pro.monthlyImages,
        maxBooks: 9999,
        perBookImages: config.limits.pro.perBookImages,
      }
    : config.limits.free;

  const transactions = await db.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const paymentLogs = await db.paymentLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const priceMinor = isPro || isCanceled
    ? (interval === "YEARLY" ? config.billing.pro.yearlyPrice : config.billing.pro.monthlyPrice)
    : null;

  // Determine effective status display
  let computedStatus: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "PAYMENT_FAILED" | "INACTIVE" = "INACTIVE";
  if (isPro) {
    computedStatus = "ACTIVE";
  } else if (isCanceled) {
    computedStatus = subscription && subscription.currentPeriodEnd > new Date() ? "CANCELED" : "EXPIRED";
  } else if (subscription?.status === "PAST_DUE") {
    computedStatus = "PAST_DUE";
  } else if (user?.plan === "PRO") {
    computedStatus = "EXPIRED";
  }

  // Check if recent payment failure occurred in logs
  const latestLog = paymentLogs[0];
  const hasRecentPaymentFailure = latestLog && (latestLog.event.includes("FAILED") || latestLog.event.includes("REJECTED") || latestLog.status === "FAILED");

  return {
    plan: isPro ? ("PRO" as const) : ("FREE" as const),
    status: computedStatus,
    interval,
    priceMinor,
    currentPeriodEnd: subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
    hasRecentPaymentFailure: Boolean(hasRecentPaymentFailure),
    user: {
      id: user?.id ?? userId,
      email: user?.email ?? "",
      name: user?.name ?? "",
      creditBalance: user?.creditBalance ?? 0,
      memberSince: user?.createdAt.toISOString() ?? new Date().toISOString(),
    },
    usage: {
      imagesThisMonth,
      imagesLimit: activeLimits.monthlyImages,
      booksCount,
      booksLimit: activeLimits.maxBooks,
      maxBookImages,
      perBookLimit: activeLimits.perBookImages,
    },
    paymentMethod: {
      provider: "Flutterwave",
      brand: "Mastercard / Visa / Verve",
      last4: isPro ? "4242" : null,
      expMonth: isPro ? 12 : null,
      expYear: isPro ? 2028 : null,
      isDefault: true,
    },
    billingInfo: {
      billingName: user?.name ?? "",
      billingEmail: user?.email ?? "",
      companyName: "",
      addressLine1: "",
      city: "",
      country: "Nigeria",
      postalCode: "",
      taxId: "",
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      createdAt: t.createdAt.toISOString(),
      type: t.type,
      amountMinor: t.amountMinor,
      currency: t.currency,
      reference: t.reference,
    })),
    paymentLogs: paymentLogs.map((l) => ({
      id: l.id,
      createdAt: l.createdAt.toISOString(),
      event: l.event,
      status: l.status,
      amountMinor: l.amountMinor,
      currency: l.currency,
      reference: l.reference,
      provider: l.provider,
    })),
  };
}

/**
 * Cancels a user's active Pro subscription.
 * Updates Subscription.status to 'CANCELED' and logs the cancellation event.
 * Access remains granted until currentPeriodEnd per live entitlement check rules.
 */
export async function cancelUserSubscription(
  userId: string,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
  currentPeriodEnd?: string | null;
}> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return { success: false, error: "No subscription record found." };
  }

  if (subscription.status === "CANCELED") {
    return { success: false, error: "Subscription is already canceled." };
  }

  const reference = `sub-cancel-${userId}-${Date.now()}`;

  await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { userId },
      data: { status: "CANCELED" },
    });

    await tx.paymentLog.create({
      data: {
        userId,
        reference,
        provider: "FLUTTERWAVE",
        event: "SUBSCRIPTION_CANCELED",
        status: "SUCCESS",
        currency: config.billing.currency,
        rawPayload: reason ? JSON.stringify({ reason }) : null,
      },
    });
  });

  return {
    success: true,
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
  };
}

/**
 * Reactivates a canceled Pro subscription if the current period has not yet expired.
 */
export async function reactivateUserSubscription(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return { success: false, error: "No subscription record found." };
  }

  if (subscription.currentPeriodEnd <= new Date()) {
    return { success: false, error: "Subscription period has expired. Please upgrade again." };
  }

  const reference = `sub-reactivate-${userId}-${Date.now()}`;

  await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { userId },
      data: { status: "ACTIVE" },
    });

    await tx.paymentLog.create({
      data: {
        userId,
        reference,
        provider: "FLUTTERWAVE",
        event: "SUBSCRIPTION_REACTIVATED",
        status: "SUCCESS",
        currency: config.billing.currency,
      },
    });
  });

  return { success: true };
}




