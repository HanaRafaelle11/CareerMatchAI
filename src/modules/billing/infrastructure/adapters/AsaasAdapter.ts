import type { 
  PaymentGatewayAdapter, 
  CreateCustomerParams, 
  CreateSubscriptionParams, 
  CancelSubscriptionParams, 
  GetPixParams, 
  GetPaymentParams 
} from '../../domain/ports/PaymentGatewayAdapter';

export class AsaasAdapter implements PaymentGatewayAdapter {
  async createCustomer(_params: CreateCustomerParams): Promise<{ gatewayCustomerId: string }> {
    throw new Error('Not implemented');
  }

  async createSubscription(_params: CreateSubscriptionParams): Promise<{
    gatewaySubscriptionId: string;
    gatewayInvoiceId?: string;
    status: string;
    pixCopyPaste?: string;
    pixQrCodeUrl?: string;
    bankSlipUrl?: string;
  }> {
    throw new Error('Not implemented');
  }

  async cancelSubscription(_params: CancelSubscriptionParams): Promise<{ success: boolean }> {
    throw new Error('Not implemented');
  }

  async getPix(_params: GetPixParams): Promise<{ pixCopyPaste: string; pixQrCodeUrl?: string }> {
    throw new Error('Not implemented');
  }

  async getPayment(_params: GetPaymentParams): Promise<{ status: string; amount: number; paidAt?: string }> {
    throw new Error('Not implemented');
  }
}
