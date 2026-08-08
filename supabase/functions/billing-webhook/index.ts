import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Função assíncrona isolada para envio de alertas críticos de checkout via Resend (NUNCA trava a resposta HTTP)
async function sendCriticalCheckoutAlert(params: {
  eventId: string;
  userId?: string | null;
  paymentId?: string | null;
  eventType: string;
  errorMessage: string;
}) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) return;

    const fromEmail = Deno.env.get('DIGEST_FROM_EMAIL') || 'VoCentro Suporte <noreply@vocentro.com.br>';
    const recipients = ['suporte@vocentro.com.br', 'hanarafaelle11@gmail.com'];
    const timestamp = new Date().toISOString();

    const alertHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 12px; background-color: #fef2f2;">
        <h2 style="color: #dc2626; margin-top: 0; font-size: 18px;">⚠️ ALERTA CRÍTICO: Falha no Processamento de Pagamento</h2>
        <p style="font-size: 14px; color: #7f1d1d; margin-bottom: 16px;">
          Uma falha crítica ou recusada foi capturada durante o processamento do webhook de pagamento.
        </p>
        <table style="width: 100%; font-size: 13px; color: #1e293b; border-collapse: collapse; background-color: #ffffff; padding: 12px; border-radius: 8px;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 140px; border-bottom: 1px solid #f1f5f9;">Evento:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #dc2626;">${params.eventType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Event ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${params.eventId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Payment ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${params.paymentId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">User ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${params.userId || 'Não identificado'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Timestamp:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${timestamp}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Mensagem / Erro:</td>
            <td style="padding: 8px; color: #b91c1c; font-family: monospace;">${params.errorMessage}</td>
          </tr>
        </table>
        <p style="font-size: 11px; color: #991b1b; text-align: center; margin-top: 16px;">
          Notificação gerada automaticamente pela Edge Function billing-webhook (VoCentro Platform).
        </p>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: `[ALERTA CRÍTICO - CHECKOUT] Falha no Processamento de Pagamento`,
        html: alertHtml
      })
    });
  } catch (alertErr: any) {
    console.error('[billing-webhook] Erro ao disparar alerta crítico de checkout:', alertErr?.message || alertErr);
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let globalEventId = 'evt_unknown';
  let globalPaymentId: string | null = null;
  let globalEventType = 'UNKNOWN';
  let globalUserId: string | null = null;

  try {
    const webhookSecret = Deno.env.get('ASAAS_WEBHOOK_SECRET');
    const tokenHeader = req.headers.get('asaas-access-token') || req.headers.get('Asaas-Access-Token');

    // 1. Validação de Segurança do Token do Asaas (se configurado)
    if (webhookSecret && tokenHeader !== webhookSecret) {
      console.warn('[billing-webhook] Requisição rejeitada: token de acesso inválido ou ausente.');
      return new Response(
        JSON.stringify({ error: 'Token de acesso do webhook inválido ou ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    const eventType = payload.event || payload.eventType || 'UNKNOWN';
    const paymentData = payload.payment || payload.subscription || payload;
    const paymentId = paymentData?.id || payload.id || 'evt_unknown';
    const eventId = `${paymentId}_${eventType}`;

    globalEventId = eventId;
    globalPaymentId = paymentId;
    globalEventType = eventType;

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

      if (targetUserId) globalUserId = targetUserId;

      if (!targetUserId && paymentData?.customer) {
        const { data: customers } = await adminClient
          .from('payment_customers')
          .select('user_id')
          .eq('gateway_customer_id', paymentData.customer)
          .limit(1);
        if (customers?.[0]?.user_id) {
          targetUserId = customers[0].user_id;
          globalUserId = targetUserId;
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
          globalUserId = targetUserId;
        }
      }

      if (targetUserId) {
        const now = new Date();
        const cycle = targetSub?.billing_cycle || 'MONTHLY';
        const periodDays = cycle === 'WEEKLY' ? 7 : 30;
        const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

        const { data: proPlan } = await adminClient
          .from('plans')
          .select('id')
          .eq('slug', 'pro')
          .maybeSingle();

        if (!targetSub) {
          const { data: existingUserSubs } = await adminClient
            .from('subscriptions')
            .select('id, user_id, billing_cycle')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(1);

          targetSub = existingUserSubs?.[0];
        }

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
          const { data: newSub } = await adminClient
            .from('subscriptions')
            .insert({
              user_id: targetUserId,
              plan_id: proPlan?.id || undefined,
              status: 'active',
              billing_cycle: 'MONTHLY',
              gateway_subscription_id: gatewaySubId || gatewayPayId,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString()
            })
            .select('id')
            .single();

          if (newSub) {
            targetSub = { id: newSub.id, user_id: targetUserId, billing_cycle: 'MONTHLY' };
          }
        }

        await adminClient
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: now.toISOString(),
            subscription_id: targetSub?.id || undefined
          })
          .eq('gateway_invoice_id', gatewayPayId);

        await adminClient
          .from('transactions')
          .update({ status: 'succeeded' })
          .eq('gateway_transaction_id', gatewayPayId);

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

        // Envio do E-mail de Confirmação de Compra
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey && targetUserId) {
          try {
            const { data: userProfile } = await adminClient
              .from('profiles')
              .select('full_name, email')
              .eq('id', targetUserId)
              .maybeSingle();

            const recipientEmail = userProfile?.email || paymentData?.customerEmail || paymentData?.email || payload?.customerEmail;
            const recipientName = userProfile?.full_name || recipientEmail?.split('@')[0] || 'Assinante VoCentro';
            const amountFormatted = paymentData?.value ? Number(paymentData.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 29,90';
            const fromEmail = Deno.env.get('DIGEST_FROM_EMAIL') || 'VoCentro Suporte <noreply@vocentro.com.br>';

            if (recipientEmail) {
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                  <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold;">VoCentro</h1>
                    <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Plataforma de Carreira com IA</p>
                  </div>
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">🎉 Sua Assinatura PRO foi Confirmada!</h2>
                  <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                    Olá, <strong>${recipientName}</strong>! Confirmamos o pagamento da sua assinatura do <strong>VoCentro PRO</strong>. Seu acesso ilimitado a todos os recursos já está liberado.
                  </p>
                  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 12px; margin: 20px 0;">
                    <h3 style="margin-top: 0; font-size: 14px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">📋 Resumo do Pedido</h3>
                    <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
                      <tr><td style="padding: 6px 0; font-weight: bold;">Plano:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2563eb;">VoCentro PRO (${targetSub?.billing_cycle === 'WEEKLY' ? 'Semanal' : 'Mensal'})</td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold;">Valor:</td><td style="padding: 6px 0; text-align: right;">${amountFormatted}</td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold;">Válido até:</td><td style="padding: 6px 0; text-align: right;">${periodEnd.toLocaleDateString('pt-BR')}</td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold;">ID da Transação:</td><td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 12px;">${gatewayPayId}</td></tr>
                    </table>
                  </div>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="https://vocentro.com.br" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px; display: inline-block;">🚀 Acessar o VoCentro PRO Agora</a>
                  </div>
                  <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 24px;">
                    Se tiver qualquer dúvida, entre em contato via <a href="mailto:suporte@vocentro.com.br" style="color: #2563eb;">suporte@vocentro.com.br</a>.
                  </p>
                </div>
              `;

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: fromEmail, to: [recipientEmail], subject: '🎉 Confirmação de Compra - Assinatura VoCentro PRO Ativa!', html: emailHtml })
              });
            }
          } catch (emailErr: any) {
            console.error('[billing-webhook] Falha ao enviar e-mail de confirmação:', emailErr.message);
          }
        }
      }
    } else if (eventType === 'PAYMENT_OVERDUE' || eventType === 'PAYMENT_REFUSED') {
      // PAYMENT_OVERDUE: pagamento venceu sem ser pago (PIX sem pagamento, boleto expirado)
      // PAYMENT_REFUSED: cobrança recorrente de cartão recusada pelo emissor
      // Ambos aplicam o mesmo tratamento: grace period de 1 dia antes de revogar o acesso Pro.

      const { data: subs } = await adminClient
        .from('subscriptions')
        .select('id, current_period_end, status, user_id, billing_cycle')
        .or(`gateway_subscription_id.eq.${gatewaySubId},gateway_subscription_id.eq.${gatewayPayId}`)
        .limit(1);

      if (subs?.[0]) {
        const sub = subs[0];
        globalUserId = sub.user_id;

        // 1. Marcar invoice como vencida
        await adminClient
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('gateway_invoice_id', gatewayPayId);

        const now = new Date();
        const GRACE_PERIOD_DAYS = 1; // Grace period definido pela operação: 1 dia
        const gracePeriodEnd = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

        // 2. Se o status já é past_due ou canceled, não aplica grace period novamente
        if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'grace_period') {
          await adminClient
            .from('subscriptions')
            .update({
              status: 'grace_period',
              grace_period_end: gracePeriodEnd.toISOString(),
              overdue_at: now.toISOString()
            })
            .eq('id', sub.id);

          console.log(`[billing-webhook] Assinatura ${sub.id} do usuário ${sub.user_id} entrou em grace_period. Acesso Pro mantido até: ${gracePeriodEnd.toISOString()}`);

          // 3. Notificar o usuário sobre o vencimento e o grace period
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey && sub.user_id) {
            try {
              const { data: userProfile } = await adminClient
                .from('profiles')
                .select('full_name, email')
                .eq('id', sub.user_id)
                .maybeSingle();

              const recipientEmail = userProfile?.email || paymentData?.customerEmail || paymentData?.email;
              if (recipientEmail) {
                const recipientName = userProfile?.full_name || recipientEmail.split('@')[0] || 'Assinante VoCentro';
                const graceDateFormatted = gracePeriodEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const fromEmail = Deno.env.get('DIGEST_FROM_EMAIL') || 'VoCentro Suporte <noreply@vocentro.com.br>';

                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #f59e0b; border-radius: 16px; background-color: #fffbeb;">
                    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #fde68a;">
                      <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold;">VoCentro</h1>
                      <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Plataforma de Carreira com IA</p>
                    </div>
                    <h2 style="color: #92400e; margin-top: 0; font-size: 18px;">⚠️ Pagamento Vencido — Você tem 1 dia para regularizar</h2>
                    <p style="font-size: 14px; color: #78350f; line-height: 1.6;">
                      Olá, <strong>${recipientName}</strong>! Identificamos que o pagamento da sua assinatura <strong>VoCentro PRO</strong> não foi confirmado.
                    </p>
                    <p style="font-size: 14px; color: #78350f; line-height: 1.6;">
                      Seu acesso PRO está mantido até <strong>${graceDateFormatted}</strong>. Após essa data, os recursos exclusivos serão suspensos até a regularização do pagamento.
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="https://vocentro.com.br" target="_blank" style="background-color: #f59e0b; color: #1c1917; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px; display: inline-block;">💳 Regularizar Pagamento</a>
                    </div>
                    <p style="font-size: 12px; color: #92400e; line-height: 1.5; text-align: center; margin-top: 24px;">
                      Dúvidas? Entre em contato via <a href="mailto:suporte@vocentro.com.br" style="color: #2563eb;">suporte@vocentro.com.br</a>.
                    </p>
                  </div>
                `;

                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    from: fromEmail,
                    to: [recipientEmail],
                    subject: '⚠️ Pagamento Vencido — Seu acesso VoCentro PRO expira em 1 dia',
                    html: emailHtml
                  })
                });
              }
            } catch (emailErr: any) {
              console.error('[billing-webhook] Falha ao enviar e-mail de aviso de grace period:', emailErr.message);
            }
          }
        } else {
          // Já estava em past_due ou similar — apenas registrar no log de atividade
          await adminClient.from('activity_logs').insert({
            user_id: sub.user_id,
            event_type: 'payment_overdue_already_past_due',
            metadata: { gateway: 'asaas', payment_id: gatewayPayId, event_type: eventType }
          });
          console.log(`[billing-webhook] Assinatura ${sub.id} já estava em status ${sub.status}. Nenhuma ação adicional.`);
        }

        // 4. Log de atividade
        await adminClient.from('activity_logs').insert({
          user_id: sub.user_id,
          event_type: 'payment_overdue_webhook',
          metadata: {
            gateway: 'asaas',
            payment_id: gatewayPayId,
            event_type: eventType,
            grace_period_end: gracePeriodEnd.toISOString()
          }
        });
      } else {
        console.warn(`[billing-webhook] ${eventType}: nenhuma assinatura encontrada para gateway_subscription_id=${gatewaySubId} ou ${gatewayPayId}`);
      }

      // 5. Alerta interno crítico
      sendCriticalCheckoutAlert({
        eventId,
        userId: globalUserId,
        paymentId: gatewayPayId,
        eventType,
        errorMessage: `Pagamento recusado ou vencido no Asaas (Status: ${eventType}). Grace period de 1 dia aplicado.`
      });

    } else if (eventType === 'PAYMENT_DELETED') {
      // PAYMENT_DELETED: pagamento foi excluído manualmente — cancelamento imediato, sem grace period.
      const { data: subs } = await adminClient
        .from('subscriptions')
        .select('id, user_id')
        .or(`gateway_subscription_id.eq.${gatewaySubId},gateway_subscription_id.eq.${gatewayPayId}`)
        .limit(1);

      if (subs?.[0]) {
        globalUserId = subs[0].user_id;
        await adminClient
          .from('subscriptions')
          .update({
            status: 'past_due',
            overdue_at: new Date().toISOString(),
            grace_period_end: null
          })
          .eq('id', subs[0].id);

        await adminClient
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('gateway_invoice_id', gatewayPayId);

        console.log(`[billing-webhook] PAYMENT_DELETED: assinatura ${subs[0].id} marcada como past_due imediatamente (sem grace period).`);

        await adminClient.from('activity_logs').insert({
          user_id: subs[0].user_id,
          event_type: 'payment_deleted_webhook',
          metadata: { gateway: 'asaas', payment_id: gatewayPayId }
        });
      }

    } else if (eventType === 'SUBSCRIPTION_DELETED' || eventType === 'SUBSCRIPTION_CANCELLED') {
      await adminClient
        .from('subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString(), grace_period_end: null })
        .or(`gateway_subscription_id.eq.${gatewaySubId},gateway_subscription_id.eq.${gatewayPayId}`);

      console.log(`[billing-webhook] ${eventType}: assinatura cancelada para gateway_subscription_id=${gatewaySubId}`);

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

    // Disparar Alerta Crítico isolado no Resend em caso de exceção no webhook
    sendCriticalCheckoutAlert({
      eventId: globalEventId,
      userId: globalUserId,
      paymentId: globalPaymentId,
      eventType: globalEventType,
      errorMessage: err?.message || String(err)
    });

    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno no servidor de webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
