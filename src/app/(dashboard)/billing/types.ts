export type BillingTab = 'overview' | 'plans' | 'payment-method' | 'billing-info' | 'invoices';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIAL'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED'
  | 'PAYMENT_FAILED'
  | 'INACTIVE';

export interface BillingTx {
  id: string;
  createdAt: string;
  type: string;
  amountMinor: number | null;
  currency: string | null;
  reference: string | null;
}

export interface BillingLog {
  id: string;
  createdAt: string;
  event: string;
  status: string;
  amountMinor: number | null;
  currency: string | null;
  reference: string | null;
  provider: string;
}

export interface UsageMetrics {
  imagesThisMonth: number;
  imagesLimit: number;
  booksCount: number;
  booksLimit: number;
  maxBookImages: number;
  perBookLimit: number;
}

export interface PaymentMethodInfo {
  provider: string;
  brand: string;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

export interface BillingCustomerInfo {
  billingName: string;
  billingEmail: string;
  companyName: string;
  addressLine1: string;
  city: string;
  country: string;
  postalCode: string;
  taxId: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  creditBalance: number;
  memberSince: string;
}

export interface BillingData {
  plan: 'FREE' | 'PRO';
  status: SubscriptionStatus;
  interval: 'MONTHLY' | 'YEARLY' | null;
  priceMinor: number | null;
  currentPeriodEnd: string | null;
  hasRecentPaymentFailure: boolean;
  user: UserSummary;
  usage: UsageMetrics;
  paymentMethod: PaymentMethodInfo;
  billingInfo: BillingCustomerInfo;
  transactions: BillingTx[];
  paymentLogs: BillingLog[];
}
