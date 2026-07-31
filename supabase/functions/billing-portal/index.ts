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

    // ── Ação 3: Obter Detalhes da Assinatura e Histórico de Faturas ──
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
