import type { 
  PaymentGatewayAdapter, 
  CreateCustomerParams, 
  CreateSubscriptionParams, 
  CancelSubscriptionParams, 
  GetPixParams, 
  GetPaymentParams 
} from '../../domain/ports/PaymentGatewayAdapter';

export class BillingService {
  private readonly gatewayAdapter: PaymentGatewayAdapter;

  constructor(gatewayAdapter: PaymentGatewayAdapter) {
    this.gatewayAdapter = gatewayAdapter;
  }

  async registerCustomer(params: CreateCustomerParams) {
    return this.gatewayAdapter.createCustomer(params);
  }

  async startSubscription(params: CreateSubscriptionParams) {
    return this.gatewayAdapter.createSubscription(params);
  }

  async stopSubscription(params: CancelSubscriptionParams) {
    return this.gatewayAdapter.cancelSubscription(params);
  }

  async fetchPixData(params: GetPixParams) {
    return this.gatewayAdapter.getPix(params);
  }

  async fetchPaymentStatus(params: GetPaymentParams) {
    return this.gatewayAdapter.getPayment(params);
  }
}
