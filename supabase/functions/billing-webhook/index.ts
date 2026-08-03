import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('ASAAS_WEBHOOK_SECRET');
    const tokenHeader = req.headers.get('asaas-access-token');

    // 1. Validação de Segurança do Token do Asaas (se configurado)
    if (webhookSecret && tokenHeader && tokenHeader !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Token de acesso do webhook inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();
    const eventType = payload.event || payload.eventType || 'UNKNOWN';
    const paymentData = payload.payment || payload.subscription || payload;
    const paymentId = paymentData?.id || payload.id || 'evt_unknown';
    const eventId = `${paymentId}_${eventType}`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 2. Garantia de Idempotência: Verificar se o evento já foi processado
    const { data: existingLog } = await adminClient
      .from('webhook_logs')
      .select('id, status')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingLog && existingLog.status === 'processed') {
      return new Response(
        JSON.stringify({ success: true, message: 'Evento já processado com sucesso (idempotente)' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar log inicial pendente
    if (!existingLog) {
      await adminClient.from('webhook_logs').insert({
        gateway_name: 'asaas',
        event_id: eventId,
        event_type: eventType,
        payload,
        status: 'pending'
      });
    }

    // 3. Processamento de Eventos
    const gatewaySubId = paymentData?.subscription || paymentData?.id;
    const gatewayPayId = paymentData?.id;

    if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RESTORED') {
      // Buscar assinatura correspondente pelo ID do gateway
      const { data: subs } = await adminClient
        .from('subscriptions')
        .select('id, user_id, billing_cycle')
        .or(`gateway_subscription_id.eq.${gatewaySubId},gateway_subscription_id.eq.${gatewayPayId}`)
        .limit(1);

      let targetSub = subs?.[0];
      let targetUserId = targetSub?.user_id || paymentData?.externalReference || payload?.externalReference;

      // Se não encontrou assinatura pelo ID do gateway, buscar fatura ou cliente associado
      if (!targetUserId) {
        const { data: invs } = await adminClient
          .from('invoices')
          .select('id, user_id, subscription_id')
          .or(`gateway_invoice_id.eq.${gatewayPayId},gateway_invoice_id.eq.${gatewaySubId}`)
          .limit(1);

        if (invs?.[0]?.user_id) {
          targetUserId = invs[0].user_id;
        }
      }

      if (!targetUserId && paymentData?.customer) {
        const { data: customers } = await adminClient
          .from('payment_customers')
          .select('user_id')
          .eq('gateway_customer_id', paymentData.customer)
          .limit(1);
        if (customers?.[0]?.user_id) {
          targetUserId = customers[0].user_id;
        }
      }

      if (!targetUserId && (paymentData?.customerEmail || paymentData?.email || payload?.customerEmail)) {
        const targetEmail = paymentData?.customerEmail || paymentData?.email || payload?.customerEmail;
        const { data: profs } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', targetEmail)
          .limit(1);
        if (profs?.[0]?.id) {
          targetUserId = profs[0].id;
        }
      }

      if (targetUserId) {
        const now = new Date();
        const cycle = targetSub?.billing_cycle || 'MONTHLY';
        const periodDays = cycle === 'WEEKLY' ? 7 : (cycle === 'YEARLY' ? 365 : 30);
        const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

        // Buscar plano Pro para associar caso seja uma nova assinatura
        const { data: proPlan } = await adminClient
          .from('plans')
          .select('id')
          .eq('slug', 'pro')
          .maybeSingle();

        if (targetSub) {
          await adminClient
            .from('subscriptions')
            .update({
              status: 'active',
              plan_id: proPlan?.id || undefined,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString()
            })
            .eq('id', targetSub.id);
        } else {
          // Inserir assinatura ativa para o usuário resolvido
          const { data: newSub } = await adminClient
            .from('subscriptions')
            .upsert({
              user_id: targetUserId,
              plan_id: proPlan?.id || undefined,
              status: 'active',
              billing_cycle: 'MONTHLY',
              gateway_subscription_id: gatewaySubId || gatewayPayId,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString()
            }, { onConflict: 'user_id' })
            .select('id')
            .single();

          if (newSub) {
            targetSub = { id: newSub.id, user_id: targetUserId, billing_cycle: 'MONTHLY' };
          }
        }

        // Sincronizar status do usuário no perfil
        await adminClient
          .from('profiles')
          .update({ is_pro: true, updated_at: now.toISOString() })
          .eq('id', targetUserId);

        // Atualizar Faturas atreladas - APENAS a específica correspondente à cobrança paga!
        await adminClient
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: now.toISOString(),
            subscription_id: targetSub?.id || undefined
          })
          .eq('gateway_invoice_id', gatewayPayId);

        // Atualizar Transações atreladas - APENAS a específica correspondente à transação paga!
        await adminClient
          .from('transactions')
          .update({ status: 'succeeded' })
          .eq('gateway_transaction_id', gatewayPayId);

        // Log de Auditoria do Evento
        await adminClient.from('activity_logs').insert({
          user_id: targetUserId,
          event_type: 'payment_confirmed_webhook',
          metadata: {
            gateway: 'asaas',
            payment_id: gatewayPayId,
            subscription_id: targetSub?.id,
            amount: paymentData?.value
          }
        });
      }
    } else if (eventType === 'PAYMENT_OVERDUE' || eventType === 'PAYMENT_DELETED') {
      const { data: subs } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('gateway_subscription_id', gatewaySubId)
        .limit(1);

      if (subs?.[0]) {
        await adminClient
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', subs[0].id);

        await adminClient
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('gateway_invoice_id', gatewayPayId);
      }
    } else if (eventType === 'SUBSCRIPTION_DELETED' || eventType === 'SUBSCRIPTION_CANCELLED') {
      await adminClient
        .from('subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('gateway_subscription_id', gatewaySubId);
    }

    // Marca o log como processado
    await adminClient
      .from('webhook_logs')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('event_id', eventId);

    return new Response(
      JSON.stringify({ success: true, message: `Evento ${eventType} processado com sucesso` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[billing-webhook] Erro ao processar webhook:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno no servidor de webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
