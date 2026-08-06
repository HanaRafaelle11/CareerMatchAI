import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

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

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get_subscription';

    // ── Ação 1: Recuperação Automática de Checkout Pendente (Item 3) ──
    if (action === 'recover_checkout') {
      const { data: pendingInvoice } = await adminClient
        .from('invoices')
        .select(`
          id, amount, status, pix_copy_paste, pix_qr_code_url, bank_slip_url, created_at,
          subscription:subscriptions (id, status, billing_cycle, gateway_subscription_id, plan:plans (name, slug))
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingInvoice && pendingInvoice.subscription) {
        return new Response(
          JSON.stringify({
            hasPendingCheckout: true,
            invoiceId: pendingInvoice.id,
            subscriptionId: (pendingInvoice.subscription as any).id,
            gatewaySubscriptionId: (pendingInvoice.subscription as any).gateway_subscription_id,
            planName: (pendingInvoice.subscription as any).plan?.name,
            amount: pendingInvoice.amount,
            pixCopyPaste: pendingInvoice.pix_copy_paste,
            pixQrCodeUrl: pendingInvoice.pix_qr_code_url,
            bankSlipUrl: pendingInvoice.bank_slip_url,
            createdAt: pendingInvoice.created_at
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ hasPendingCheckout: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Ação 2: Cancelamento de Assinatura pelo Candidato ──
    if (action === 'cancel_subscription') {
      const { data: activeSub } = await adminClient
        .from('subscriptions')
        .select('id, gateway_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle();

      if (!activeSub) {
        return new Response(
          JSON.stringify({ error: 'Nenhuma assinatura ativa encontrada para cancelamento' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cancelar no Asaas (se houver ID de gateway)
      const asaasApiKey = Deno.env.get('ASAAS_API_KEY') || '';
      const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

      if (activeSub.gateway_subscription_id && asaasApiKey) {
        try {
          await fetch(`${asaasApiUrl}/subscriptions/${activeSub.gateway_subscription_id}`, {
            method: 'DELETE',
            headers: {
              'accept': 'application/json',
              'access_token': asaasApiKey
            }
          });
        } catch (err) {
          console.warn('[billing-portal] Aviso ao cancelar no Asaas:', err);
        }
      }

      // Atualizar status no banco com Grace Period (mantem liberado ate o fim do periodo)
      await adminClient
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('id', activeSub.id);

      // Registrar auditoria
      await adminClient.from('activity_logs').insert({
        user_id: user.id,
        event_type: 'subscription_canceled_by_user',
        metadata: { subscription_id: activeSub.id }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Assinatura cancelada com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Ação 2.5: Reativação de Assinatura Cancelada ──
    if (action === 'reactivate_subscription') {
      const now = new Date();

      const { data: currentSub } = await adminClient
        .from('subscriptions')
        .select(`
          id, status, billing_cycle, current_period_end, payment_customer_id, gateway_subscription_id,
          plan:plans (id, slug, name, price_monthly, price_yearly)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 1. Checagem de idempotência: se a assinatura já estiver ativa, retorne sucesso imediatamente
      if (currentSub?.status === 'active') {
        return new Response(
          JSON.stringify({ success: true, message: 'Sua assinatura já está ativa.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Validação de elegibilidade e vigência no futuro
      const isUnexpired = currentSub?.current_period_end && new Date(currentSub.current_period_end) > now;
      if (!currentSub || currentSub.status !== 'canceled' || !isUnexpired) {
        return new Response(
          JSON.stringify({ error: 'Nenhuma assinatura cancelada dentro da vigência foi encontrada para reativação. Por favor, faça um novo checkout.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const asaasApiKey = Deno.env.get('ASAAS_API_KEY') || '';
      const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

      let newGatewaySubscriptionId = currentSub.gateway_subscription_id;

      // 3. Resolver o ID de cliente no gateway
      let gatewayCustomerId: string | undefined;
      if (currentSub.payment_customer_id) {
        const { data: cust } = await adminClient
          .from('payment_customers')
          .select('gateway_customer_id')
          .eq('id', currentSub.payment_customer_id)
          .maybeSingle();
        gatewayCustomerId = cust?.gateway_customer_id;
      }

      if (!gatewayCustomerId) {
        const { data: cust } = await adminClient
          .from('payment_customers')
          .select('gateway_customer_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        gatewayCustomerId = cust?.gateway_customer_id;
      }

      // 4. Criar nova assinatura no Asaas com nextDueDate no fim da vigência paga atual
      if (asaasApiKey && gatewayCustomerId) {
        try {
          const periodEndDate = new Date(currentSub.current_period_end);
          const nextDueDateStr = periodEndDate.toISOString().split('T')[0];

          const planObj = currentSub.plan as any;
          // price_weekly não existe no banco — R$ 9,90 é valor fixo de produto (intencional)
          // Produto oferece apenas WEEKLY e MONTHLY; YEARLY não é uma opção ativa de compra
          const planPrice = currentSub.billing_cycle === 'WEEKLY'
            ? 9.90
            : (planObj?.price_monthly || 29.90);

          const asaasRes = await fetch(`${asaasApiUrl}/subscriptions`, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'access_token': asaasApiKey
            },
            body: JSON.stringify({
              customer: gatewayCustomerId,
              billingType: 'CREDIT_CARD',
              value: planPrice,
              nextDueDate: nextDueDateStr,
              cycle: currentSub.billing_cycle || 'MONTHLY',
              description: `Reativação de Assinatura Vocentro - ${planObj?.name || 'Pro'}`,
              externalReference: user.id
            })
          });

          if (asaasRes.ok) {
            const newAsaasSub = await asaasRes.json();
            if (newAsaasSub?.id) {
              newGatewaySubscriptionId = newAsaasSub.id;
            }
          } else {
            const errData = await asaasRes.json().catch(() => ({}));
            console.warn('[billing-portal] Aviso ao recriar assinatura no Asaas:', errData);
          }
        } catch (err) {
          console.error('[billing-portal] Erro ao integrar com Asaas na reativação:', err);
        }
      }

      // 5. Atualizar registro local para status active e canceled_at = null (sem tocar em profiles)
      await adminClient
        .from('subscriptions')
        .update({
          status: 'active',
          canceled_at: null,
          gateway_subscription_id: newGatewaySubscriptionId
        })
        .eq('id', currentSub.id);

      // Registrar auditoria
      await adminClient.from('activity_logs').insert({
        user_id: user.id,
        event_type: 'subscription_reactivated_by_user',
        metadata: { subscription_id: currentSub.id, gateway_subscription_id: newGatewaySubscriptionId }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Assinatura reativada com sucesso!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Ação 3: Obter Detalhes da Assinatura, Sincronizar com Asaas e Retornar Histórico ──
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY') || '';
    const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    // Se houver fatura pendente, sincronizar status em tempo real na API do Asaas
    const { data: pendingInvoice } = await adminClient
      .from('invoices')
      .select('id, subscription_id, gateway_invoice_id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingInvoice && pendingInvoice.gateway_invoice_id && asaasApiKey) {
      try {
        const asaasRes = await fetch(`${asaasApiUrl}/payments/${pendingInvoice.gateway_invoice_id}`, {
          headers: {
            'accept': 'application/json',
            'access_token': asaasApiKey
          }
        });

        if (asaasRes.ok) {
          const asaasPay = await asaasRes.json();
          const statusAsaas = asaasPay.status;

          if (statusAsaas === 'RECEIVED' || statusAsaas === 'CONFIRMED' || statusAsaas === 'RECEIVED_IN_CASH') {
            const now = new Date().toISOString();
            await adminClient.from('invoices').update({ status: 'paid', paid_at: now }).eq('id', pendingInvoice.id);
            if (pendingInvoice.subscription_id) {
              await adminClient.from('subscriptions').update({ status: 'active', current_period_start: now }).eq('id', pendingInvoice.subscription_id);
            }
          } else if (statusAsaas === 'OVERDUE' || statusAsaas === 'DELETED' || statusAsaas === 'REFUNDED') {
            await adminClient.from('invoices').update({ status: 'expired' }).eq('id', pendingInvoice.id);
            if (pendingInvoice.subscription_id) {
              const { data: currentSub } = await adminClient
                .from('subscriptions')
                .select('current_period_end, status')
                .eq('id', pendingInvoice.subscription_id)
                .single();

              const hasActivePeriod = Boolean(currentSub?.current_period_end && new Date(currentSub.current_period_end) > new Date());
              if (!hasActivePeriod) {
                await adminClient.from('subscriptions').update({ status: 'expired' }).eq('id', pendingInvoice.subscription_id);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[billing-portal] Erro ao sincronizar pagamento pendente com Asaas:', err);
      }
    }

    const { data: subData } = await adminClient
      .from('subscriptions')
      .select(`
        id, status, billing_cycle, current_period_start, current_period_end, canceled_at, created_at,
        plan:plans (id, slug, name, price_monthly, price_yearly)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: invoicesData } = await adminClient
      .from('invoices')
      .select('id, amount, status, bank_slip_url, pix_copy_paste, created_at, paid_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return new Response(
      JSON.stringify({
        subscription: subData || null,
        invoices: invoicesData || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[billing-portal] Exceção capturada:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erro ao processar requisição do portal' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
