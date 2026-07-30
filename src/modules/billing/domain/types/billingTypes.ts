export const BillingPlan = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;
export type BillingPlan = typeof BillingPlan[keyof typeof BillingPlan];

export const SubscriptionStatus = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  PAUSED: 'paused',
  EXPIRED: 'expired',
} as const;
export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export const BillingType = {
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  BOLETO: 'BOLETO',
} as const;
export type BillingType = typeof BillingType[keyof typeof BillingType];

export const InvoiceStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
} as const;
export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const PaymentStatus = {
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PROCESSING: 'processing',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface PaymentCustomer {
  id: string;
  userId: string;
  gatewayName: 'asaas' | 'stripe' | 'mercadopago';
  gatewayCustomerId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Entitlement {
  id: string;
  key: string;
  name: string;
  description?: string;
  valueType: 'boolean' | 'numeric' | 'unlimited';
  createdAt: string;
}

export interface PlanEntitlement {
  id: string;
  planId: string;
  entitlementId: string;
  value: string;
  createdAt: string;
}

export interface UserEntitlementOverride {
  id: string;
  userId: string;
  entitlementId: string;
  customValue: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  paymentCustomerId?: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  gatewaySubscriptionId?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialConsumed: boolean;
  currentPeriodStart: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId?: string;
  userId: string;
  gatewayInvoiceId?: string;
  amount: number;
  status: InvoiceStatus;
  pixCopyPaste?: string;
  pixQrCodeUrl?: string;
  bankSlipUrl?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  invoiceId?: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: BillingType;
  gatewayName: string;
  gatewayTransactionId?: string;
  createdAt: string;
}
