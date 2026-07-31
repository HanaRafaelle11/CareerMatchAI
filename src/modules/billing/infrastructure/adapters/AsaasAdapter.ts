import type { 
  PaymentGatewayAdapter, 
  CreateCustomerParams, 
  CreateSubscriptionParams, 
  CancelSubscriptionParams, 
  GetPixParams, 
  GetPaymentParams 
} from '../../domain/ports/PaymentGatewayAdapter';

declare const Deno: any;
declare const process: any;

export class AsaasAdapter implements PaymentGatewayAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof Deno !== 'undefined' ? Deno.env.get('ASAAS_API_URL') : process.env.ASAAS_API_URL) || 'https://api.asaas.com/v3';
    this.apiKey = apiKey || (typeof Deno !== 'undefined' ? Deno.env.get('ASAAS_API_KEY') : process.env.ASAAS_API_KEY) || '';
  }

  private getHeaders(): Record<string, string> {
    return {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': this.apiKey,
      'User-Agent': 'Vocentro/1.0'
    };
  }

  async createCustomer(params: CreateCustomerParams): Promise<{ gatewayCustomerId: string }> {
    const url = `${this.baseUrl}/customers`;
    const body = {
      name: params.name,
      email: params.email,
      cpfCnpj: params.taxId,
      mobilePhone: params.phone,
      externalReference: params.userId
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.errors?.[0]?.description || data.message || 'Erro ao criar cliente no Asaas';
      throw new Error(`[Asaas API Error] ${errorMsg}`);
    }

    return { gatewayCustomerId: data.id };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<{
    gatewaySubscriptionId: string;
    gatewayInvoiceId?: string;
    status: string;
    pixCopyPaste?: string;
    pixQrCodeUrl?: string;
    bankSlipUrl?: string;
  }> {
    const url = `${this.baseUrl}/subscriptions`;
    const today = new Date().toISOString().split('T')[0];

    const body: Record<string, any> = {
      customer: params.gatewayCustomerId,
      billingType: params.billingType,
      value: params.amount,
      nextDueDate: today,
      cycle: params.billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
      description: `Assinatura Vocentro - Plano ${params.planSlug.toUpperCase()}`,
    };

    if (params.billingType === 'CREDIT_CARD' && params.creditCard) {
      body.creditCard = params.creditCard;
      if (params.creditCardHolderInfo) {
        body.creditCardHolderInfo = params.creditCardHolderInfo;
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.errors?.[0]?.description || data.message || 'Erro ao criar assinatura no Asaas';
      throw new Error(`[Asaas API Error] ${errorMsg}`);
    }

    const subscriptionId = data.id;
    let gatewayInvoiceId: string | undefined;
    let pixCopyPaste: string | undefined;
    let pixQrCodeUrl: string | undefined;
    let bankSlipUrl: string | undefined;

    // Buscar a cobrança gerada para a assinatura
    try {
      const paymentsUrl = `${this.baseUrl}/subscriptions/${subscriptionId}/payments`;
      const paymentsRes = await fetch(paymentsUrl, { headers: this.getHeaders() });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const firstPayment = paymentsData.data?.[0];
        if (firstPayment) {
          gatewayInvoiceId = firstPayment.id;
          bankSlipUrl = firstPayment.bankSlipUrl;

          if (params.billingType === 'PIX' && firstPayment.id) {
            const pixData = await this.getPix({ gatewayPaymentId: firstPayment.id });
            pixCopyPaste = pixData.pixCopyPaste;
            pixQrCodeUrl = pixData.pixQrCodeUrl;
          }
        }
      }
    } catch (err) {
      console.warn('[AsaasAdapter] Aviso ao buscar cobrança inicial da assinatura:', err);
    }

    return {
      gatewaySubscriptionId: subscriptionId,
      gatewayInvoiceId,
      status: data.status,
      pixCopyPaste,
      pixQrCodeUrl,
      bankSlipUrl
    };
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/subscriptions/${params.gatewaySubscriptionId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.errors?.[0]?.description || data.message || 'Erro ao cancelar assinatura no Asaas';
      throw new Error(`[Asaas API Error] ${errorMsg}`);
    }

    return { success: data.deleted || true };
  }

  async getPix(params: GetPixParams): Promise<{ pixCopyPaste: string; pixQrCodeUrl?: string }> {
    const url = `${this.baseUrl}/payments/${params.gatewayPaymentId}/pixQrCode`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.errors?.[0]?.description || data.message || 'Erro ao obter PIX no Asaas';
      throw new Error(`[Asaas API Error] ${errorMsg}`);
    }

    return {
      pixCopyPaste: data.payload,
      pixQrCodeUrl: data.encodedImage ? `data:image/png;base64,${data.encodedImage}` : undefined
    };
  }

  async getPayment(params: GetPaymentParams): Promise<{ status: string; amount: number; paidAt?: string }> {
    const url = `${this.baseUrl}/payments/${params.gatewayPaymentId}`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.errors?.[0]?.description || data.message || 'Erro ao consultar pagamento no Asaas';
      throw new Error(`[Asaas API Error] ${errorMsg}`);
    }

    return {
      status: data.status,
      amount: data.value,
      paidAt: data.confirmedDate || data.paymentDate
    };
  }
}
