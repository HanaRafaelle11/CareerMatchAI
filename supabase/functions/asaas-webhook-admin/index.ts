import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const WEBHOOK_ID = 'e265492f-6132-4800-8a24-e50c938a7573';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 🛡️ CAMADA OBRIGATÓRIA DE SEGURANÇA E AUTENTICAÇÃO
  // Bloqueia qualquer chamada pública sem a chave secreta de admin ou Service Role Key
  const adminSecret = Deno.env.get('ADMIN_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const reqSecret = req.headers.get('x-admin-secret') || '';
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!adminSecret || (reqSecret !== adminSecret && bearerToken !== adminSecret)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Access denied. Valid admin secret header or authorization token required.' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const asaasApiKey = Deno.env.get('ASAAS_API_KEY') || '';
  const asaasApiUrl = (Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3').replace(/\/+$/, '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const asaasHeaders = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': asaasApiKey
  };

  // 1. GET estado atual do webhook Asaas
  const getRes = await fetch(`${asaasApiUrl}/webhooks/${WEBHOOK_ID}`, { headers: asaasHeaders });
  const getResText = await getRes.text();
  let currentState: any = {};
  try { currentState = JSON.parse(getResText); } catch { currentState = { rawText: getResText }; }

  // 2. Se ainda interrompido, tentar reativar
  let reactivateResult: any = { skipped: 'already_active' };
  if (currentState.interrupted === true) {
    const putBody = {
      name: currentState.name || 'Vocentr',
      url: currentState.url || 'https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/billing-webhook',
      email: 'hanarafaelle11@gmail.com',
      enabled: true,
      interrupted: false,
      apiVersion: 3,
      sendType: currentState.sendType || 'NON_SEQUENTIALLY',
      events: currentState.events || ["PAYMENT_RESTORED","PAYMENT_OVERDUE","PAYMENT_CONFIRMED","SUBSCRIPTION_DELETED","PAYMENT_DELETED","PAYMENT_RECEIVED"]
    };
    const putRes = await fetch(`${asaasApiUrl}/webhooks/${WEBHOOK_ID}`, {
      method: 'PUT', headers: asaasHeaders, body: JSON.stringify(putBody)
    });
    const putText = await putRes.text();
    try { reactivateResult = JSON.parse(putText); } catch { reactivateResult = { status: putRes.status, rawText: putText }; }
  }

  // 3. Consultar estado DB com service role
  const { data: webhookLogs } = await adminClient
    .from('webhook_logs')
    .select('id, event_id, event_type, status, gateway_name, processed_at, payload')
    .order('id', { ascending: false })
    .limit(10);

  const { data: subscriptions } = await adminClient
    .from('subscriptions')
    .select('id, user_id, status, gateway_subscription_id, current_period_end, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: activityLogs } = await adminClient
    .from('activity_logs')
    .select('id, user_id, event_type, metadata, created_at')
    .eq('event_type', 'payment_confirmed_webhook')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email, full_name, plan, is_pro')
    .limit(5);

  return new Response(JSON.stringify({
    asaasWebhookState: {
      id: currentState.id,
      name: currentState.name,
      url: currentState.url,
      interrupted: currentState.interrupted,
      enabled: currentState.enabled,
      penalizedRequestsCount: currentState.penalizedRequestsCount
    },
    reactivateResult,
    db: {
      webhookLogs: webhookLogs || [],
      subscriptions: subscriptions || [],
      activityLogs: activityLogs || [],
      profiles: profiles || []
    }
  }, null, 2), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
