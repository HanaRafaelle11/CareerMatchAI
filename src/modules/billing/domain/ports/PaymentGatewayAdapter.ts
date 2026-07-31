import type { BillingType, BillingCycle } from '../types/billingTypes';

export interface CreateCustomerParams {
  userId: string;
  name: string;
  email: string;
  taxId?: string; // CPF / CNPJ
  phone?: string;
}

export interface CreateSubscriptionParams {
  gatewayCustomerId: string;
  planSlug: string;
  amount: number;
  billingCycle: BillingCycle;
  billingType: BillingType;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
  };
}

export interface CancelSubscriptionParams {
  gatewaySubscriptionId: string;
}

export interface GetPixParams {
  gatewayPaymentId: string;
}

export interface GetPaymentParams {
  gatewayPaymentId: string;
}

export interface PaymentGatewayAdapter {
  createCustomer(params: CreateCustomerParams): Promise<{ gatewayCustomerId: string }>;
  createSubscription(params: CreateSubscriptionParams): Promise<{
    gatewaySubscriptionId: string;
    gatewayInvoiceId?: string;
    status: string;
    pixCopyPaste?: string;
    pixQrCodeUrl?: string;
    bankSlipUrl?: string;
  }>;
  cancelSubscription(params: CancelSubscriptionParams): Promise<{ success: boolean }>;
  getPix(params: GetPixParams): Promise<{ pixCopyPaste: string; pixQrCodeUrl?: string }>;
  getPayment(params: GetPaymentParams): Promise<{ status: string; amount: number; paidAt?: string }>;
}
