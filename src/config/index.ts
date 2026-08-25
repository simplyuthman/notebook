export const config = {
  limits: {
    free: {
      monthlyImages: 30,
      maxBooks: 3,
      perBookImages: 20
    },
    pro: {
      monthlyImages: 150,
      perBookImages: 300
    },
    batchCeiling: 50, // technical maximum per batch
    maxFileSizeMB: 10,
    maxFileSizeBytes: 10 * 1024 * 1024 // 10 MB in bytes
  },
  aiCostCeiling: 2000, // per book cost ceiling in kobo
  aiCostPerImage: 2000, // approx cost per image in minor units (kobo)
  billing: {
    currency: "NGN",
    pro: {
      monthlyPrice: 500000, // kobo → ₦5,000 / month
      yearlyPrice: 5000000, // kobo → ₦50,000 / year (10× monthly — effective ≈₦4,167/mo, above the ₦3,000/mo cost floor of a full Pro allowance)
      /**
       * Flutterwave Payment Plan IDs created via scripts/create-flw-plans.ts.
       * Used when initializing checkout so Flutterwave auto-renews the subscription.
       * Do NOT change these without creating a new plan via the API first.
       *   Monthly: "NotesBook Pro Monthly" — ₦5,000/mo  (plan_token: rpp_d4c23bf68d9648faaf52)
       *   Yearly:  "NotesBook Pro Yearly"  — ₦50,000/yr (plan_token: rpp_a34113c5880b9c506875)
       */
      flutterwavePlanId: {
        monthly: 242372,
        yearly: 242373,
      },
    }
  }
};

