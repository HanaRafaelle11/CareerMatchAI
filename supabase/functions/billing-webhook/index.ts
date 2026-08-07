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
        const periodDays = cycle === 'WEEKLY' ? 7 : 30;
        const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

        // Buscar plano Pro para associar caso seja uma nova assinatura
        const { data: proPlan } = await adminClient
          .from('plans')
          .select('id')
          .eq('slug', 'pro')
          .maybeSingle();

        // Buscar a assinatura mais recente do usuário se targetSub ainda não tiver sido resolvida
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
          // Inserir nova assinatura ativa para o usuário resolvido (sem upsert/onConflict)
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

        // Disparo Automatizado de E-mail de Confirmação de Compra via Resend
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
                      <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Plano:</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2563eb;">VoCentro PRO (${targetSub?.billing_cycle === 'WEEKLY' ? 'Semanal' : 'Mensal'})</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Valor:</td>
                        <td style="padding: 6px 0; text-align: right;">${amountFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-weight: bold;">Válido até:</td>
                        <td style="padding: 6px 0; text-align: right;">${periodEnd.toLocaleDateString('pt-BR')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-weight: bold;">ID da Transação:</td>
                        <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 12px;">${gatewayPayId}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="https://vocentro.com.br" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px; display: inline-block;">
                      🚀 Acessar o VoCentro PRO Agora
                    </a>
                  </div>

                  <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 24px;">
                    Se tiver qualquer dúvida, responda a este e-mail ou entre em contato via <a href="mailto:suporte@vocentro.com.br" style="color: #2563eb;">suporte@vocentro.com.br</a>.
                  </p>
                </div>
              `;

              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: fromEmail,
                  to: [recipientEmail],
                  subject: '🎉 Confirmação de Compra - Assinatura VoCentro PRO Ativa!',
                  html: emailHtml,
                }),
              });

              if (resendRes.ok) {
                console.log(`[billing-webhook] E-mail de confirmação de compra enviado com sucesso para ${recipientEmail}`);
              } else {
                console.warn(`[billing-webhook] Erro ao enviar e-mail via Resend:`, await resendRes.text());
              }
            }
          } catch (emailErr: any) {
            console.error('[billing-webhook] Falha não bloqueante ao enviar e-mail de confirmação:', emailErr.message);
          }
        }
      }
    } else if (eventType === 'PAYMENT_OVERDUE' || eventType === 'PAYMENT_DELETED') {
      const { data: subs } = await adminClient
        .from('subscriptions')
        .select('id, current_period_end, status')
        .eq('gateway_subscription_id', gatewaySubId)
        .limit(1);

      if (subs?.[0]) {
        await adminClient
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('gateway_invoice_id', gatewayPayId);

        const hasActivePeriod = Boolean(subs[0].current_period_end && new Date(subs[0].current_period_end) > new Date());
        if (!hasActivePeriod) {
          await adminClient
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('id', subs[0].id);
        }
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
