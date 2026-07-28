export interface CustomerProfile {
  id: string;
  email: string;
  name?: string;
  taxId?: string; // CPF / CNPJ para o Asaas
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthlyBrl: number;
  features: string[];
}

export interface IBillingProvider {
  createCustomer(profile: CustomerProfile): Promise<string>;
  createSubscription(customerId: string, planId: string): Promise<{ subscriptionId: string; status: string }>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  getSubscriptionStatus(subscriptionId: string): Promise<string>;
}
