import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Adaptador inline do Asaas para compatibilidade com Deno no Supabase Edge Functions
class AsaasEdgeAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.baseUrl = baseUrl || Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';
    this.apiKey = apiKey || Deno.env.get('ASAAS_API_KEY') || '';
  }

  private getHeaders(): Record<string, string> {
    return {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': this.apiKey,
      'User-Agent': 'Vocentro/1.0'
    };
  }

  async createCustomer(params: { userId: string; name: string; email: string; taxId?: string; phone?: string }) {
    const url = `${this.baseUrl}/customers`;
    const cleanTaxId = params.taxId ? params.taxId.replace(/\D/g, '') : undefined;
    const cleanPhone = params.phone ? params.phone.replace(/\D/g, '') : undefined;

    const body = {
      name: params.name,
      email: params.email,
      cpfCnpj: cleanTaxId,
      mobilePhone: cleanPhone,
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
      throw new Error(`${errorMsg}`);
    }

    return { gatewayCustomerId: data.id as string };
  }

  async createSubscription(params: {
    gatewayCustomerId: string;
    planSlug: string;
    amount: number;
    billingCycle: 'MONTHLY' | 'YEARLY';
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    creditCard?: any;
    creditCardHolderInfo?: any;
  }) {
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
      throw new Error(`[Asaas API] ${errorMsg}`);
    }

    const subscriptionId = data.id as string;
    let gatewayInvoiceId: string | undefined;
    let pixCopyPaste: string | undefined;
    let pixQrCodeUrl: string | undefined;
    let bankSlipUrl: string | undefined;

    // Obter cobrança inicial
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
            const pixRes = await fetch(`${this.baseUrl}/payments/${firstPayment.id}/pixQrCode`, {
              headers: this.getHeaders()
            });
            if (pixRes.ok) {
              const pixData = await pixRes.json();
              pixCopyPaste = pixData.payload;
              pixQrCodeUrl = pixData.encodedImage ? `data:image/png;base64,${pixData.encodedImage}` : undefined;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[AsaasEdgeAdapter] Erro ao obter cobrança inicial:', err);
    }

    return {
      gatewaySubscriptionId: subscriptionId,
      gatewayInvoiceId,
      status: data.status as string,
      pixCopyPaste,
      pixQrCodeUrl,
      bankSlipUrl
    };
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Cabeçalho Authorization ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Validar token JWT do candidato
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida ou não autorizada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do Payload da requisição
    const payload = await req.json();
    const { planSlug = 'pro', billingCycle = 'MONTHLY', billingType = 'PIX', cpfCnpj, mobilePhone, name, creditCard, creditCardHolderInfo } = payload;

    // Cliente administrativo do Supabase para mutações seguras no DB
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Chave do Asaas obtida exclusivamente dos Secrets do Supabase
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY') || '';
    const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    const asaasAdapter = new AsaasEdgeAdapter(asaasApiKey, asaasApiUrl);

    // 1. Buscar ou Criar Cliente no Asaas
    let customerDbId: string | null = null;
    let gatewayCustomerId: string | null = null;

    const { data: existingCustomers } = await adminClient
      .from('payment_customers')
      .select('id, gateway_customer_id')
      .eq('user_id', user.id)
      .eq('gateway_name', 'asaas')
      .limit(1);

    if (existingCustomers && existingCustomers.length > 0) {
      customerDbId = existingCustomers[0].id;
      gatewayCustomerId = existingCustomers[0].gateway_customer_id;
    } else {
      // Obter dados do perfil do usuário para complementar
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const customerName = name || profile?.full_name || user.email?.split('@')[0] || 'Candidato Vocentro';
      
      const newAsaasCustomer = await asaasAdapter.createCustomer({
        userId: user.id,
        name: customerName,
        email: user.email!,
        taxId: cpfCnpj,
        phone: mobilePhone
      });

      gatewayCustomerId = newAsaasCustomer.gatewayCustomerId;

      const { data: insertedCustomer, error: insertCustomerError } = await adminClient
        .from('payment_customers')
        .insert({
          user_id: user.id,
          gateway_name: 'asaas',
          gateway_customer_id: gatewayCustomerId,
          metadata: { email: user.email }
        })
        .select('id')
        .single();

      if (insertCustomerError) {
        console.error('[billing-checkout] Erro ao salvar cliente no DB:', insertCustomerError);
      } else {
        customerDbId = insertedCustomer.id;
      }
    }

    const cleanPlanSlug = (typeof planSlug === 'string' ? planSlug : 'pro').toLowerCase().trim();

    // 2. Consultar Plano e Preço
    let { data: planData, error: planError } = await adminClient
      .from('plans')
      .select('id, slug, name, price_monthly, price_yearly, active')
      .eq('slug', cleanPlanSlug)
      .maybeSingle();

    if (planError) {
      console.error('[billing-checkout] Erro ao consultar plano no DB:', planError);
    }

    // Tentar auto-healing / auto-seed se o plano não for encontrado ou estiver inativo
    if (!planData || !planData.active) {
      console.warn(`[billing-checkout] Plano '${cleanPlanSlug}' não encontrado ou inativo. Executando auto-seed dos planos padrão...`);
      
      const defaultPlans = [
        { slug: 'free', name: 'Plano Gratuito', price_monthly: 0.00, price_yearly: 0.00, active: true },
        { slug: 'pro', name: 'Plano Profissional', price_monthly: 29.90, price_yearly: 299.00, active: true },
        { slug: 'enterprise', name: 'Plano Corporativo', price_monthly: 99.90, price_yearly: 999.00, active: true }
      ];

      const { data: seededPlans, error: seedError } = await adminClient
        .from('plans')
        .upsert(defaultPlans, { onConflict: 'slug' })
        .select('id, slug, name, price_monthly, price_yearly, active');

      if (seedError) {
        console.error('[billing-checkout] Erro ao fazer auto-seed dos planos:', seedError);
      } else if (seededPlans) {
        planData = seededPlans.find((p: any) => p.slug === cleanPlanSlug) || null;
      }
    }

    if (!planData || !planData.active) {
      const errDetail = planError ? ` (Erro DB: ${planError.message})` : '';
      return new Response(
        JSON.stringify({ error: `Plano '${cleanPlanSlug}' não encontrado ou inativo.${errDetail}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = billingCycle === 'YEARLY' ? Number(planData.price_yearly) : Number(planData.price_monthly);

    // 3. Criar Assinatura no Asaas
    const asaasSubscription = await asaasAdapter.createSubscription({
      gatewayCustomerId: gatewayCustomerId!,
      planSlug: planData.slug,
      amount,
      billingCycle,
      billingType,
      creditCard,
      creditCardHolderInfo
    });

    // 4. Salvar Assinatura no Supabase
    const periodDays = billingCycle === 'YEARLY' ? 365 : 30;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
    const isCartaoAprovado = billingType === 'CREDIT_CARD' && (asaasSubscription.status === 'ACTIVE' || asaasSubscription.status === 'RECEIVED');

    const { data: insertedSub, error: subError } = await adminClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        payment_customer_id: customerDbId,
        plan_id: planData.id,
        status: isCartaoAprovado ? 'active' : 'pending',
        billing_cycle: billingCycle,
        gateway_subscription_id: asaasSubscription.gatewaySubscriptionId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      })
      .select('id')
      .single();

    if (subError) {
      console.error('[billing-checkout] Erro ao salvar assinatura no DB:', subError);
    }

    const subscriptionDbId = insertedSub?.id;

    // 5. Salvar Fatura (Invoice)
    const { data: insertedInvoice, error: invoiceError } = await adminClient
      .from('invoices')
      .insert({
        subscription_id: subscriptionDbId,
        user_id: user.id,
        gateway_invoice_id: asaasSubscription.gatewayInvoiceId || asaasSubscription.gatewaySubscriptionId,
        amount,
        status: isCartaoAprovado ? 'paid' : 'pending',
        pix_copy_paste: asaasSubscription.pixCopyPaste,
        pix_qr_code_url: asaasSubscription.pixQrCodeUrl,
        bank_slip_url: asaasSubscription.bankSlipUrl,
        due_date: now.toISOString(),
        paid_at: isCartaoAprovado ? now.toISOString() : null
      })
      .select('id')
      .single();

    if (invoiceError) {
      console.error('[billing-checkout] Erro ao salvar fatura no DB:', invoiceError);
    }

    const invoiceDbId = insertedInvoice?.id;

    // 6. Salvar Transação Financeira Inicial
    await adminClient
      .from('transactions')
      .insert({
        invoice_id: invoiceDbId,
        user_id: user.id,
        amount,
        status: isCartaoAprovado ? 'succeeded' : 'processing',
        payment_method: billingType,
        gateway_name: 'asaas',
        gateway_transaction_id: asaasSubscription.gatewayInvoiceId || asaasSubscription.gatewaySubscriptionId
      });

    // Se cartão de crédito aprovado imediatamente, atualizar perfil
    if (isCartaoAprovado) {
      await adminClient
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscriptionDbId,
        gatewaySubscriptionId: asaasSubscription.gatewaySubscriptionId,
        status: isCartaoAprovado ? 'active' : 'pending',
        invoiceId: invoiceDbId,
        amount,
        billingType,
        pixCopyPaste: asaasSubscription.pixCopyPaste,
        pixQrCodeUrl: asaasSubscription.pixQrCodeUrl,
        bankSlipUrl: asaasSubscription.bankSlipUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[billing-checkout] Exceção capturada:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erro ao processar checkout' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
