import type { IBillingProvider, CustomerProfile } from './IBillingProvider';

export class AsaasBillingAdapter implements IBillingProvider {
  private _apiKey: string;
  private _isSandbox: boolean;

  constructor(apiKey: string = '', isSandbox: boolean = true) {
    this._apiKey = apiKey;
    this._isSandbox = isSandbox;
    console.log('[AsaasBillingAdapter] Adapter instanciado com Sandbox:', this._isSandbox, !!this._apiKey);
  }

  async createCustomer(profile: CustomerProfile): Promise<string> {
    console.log('[AsaasBillingAdapter] Stub de criação de cliente Asaas preparado para:', profile.email);
    return `asaas_cus_${Date.now()}`;
  }

  async createSubscription(customerId: string, planId: string): Promise<{ subscriptionId: string; status: string }> {
    console.log('[AsaasBillingAdapter] Stub de criação de assinatura Asaas:', customerId, planId);
    return { subscriptionId: `sub_${Date.now()}`, status: 'pending' };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log('[AsaasBillingAdapter] Stub de cancelamento de assinatura Asaas:', subscriptionId);
    return true;
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<string> {
    console.log('[AsaasBillingAdapter] Status verificado para:', subscriptionId);
    return 'active';
  }
}
