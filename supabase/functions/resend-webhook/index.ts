// supabase/functions/resend-webhook/index.ts
// Recebe webhooks do Resend (email.sent, email.delivered, email.opened, email.clicked, email.bounced)
// e registra os eventos no public.activity_logs associados ao usuário.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('[resend-webhook] Webhook recebido:', payload.type, payload.data?.email_id || payload.data?.id);

    const eventType = payload.type; // ex: email.delivered, email.opened, email.clicked, email.bounced
    const data = payload.data || {};
    const resendId = data.email_id || data.id;
    const recipientRaw = Array.isArray(data.to) ? data.to[0] : data.to;
    const recipientEmail = recipientRaw ? String(recipientRaw).toLowerCase().trim() : null;

    if (!eventType) {
      return new Response(JSON.stringify({ error: 'Payload sem eventType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Tentar localizar o user_id via profile pelo e-mail
    let userId: string | null = null;
    if (recipientEmail) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', recipientEmail)
        .limit(1);

      if (profiles && profiles.length > 0) {
        userId = profiles[0].id;
      }
    }

    // 2. Se não achou por e-mail, tenta localizar pelo resend_id nos activity_logs anteriores
    if (!userId && resendId) {
      const { data: previousLogs } = await supabase
        .from('activity_logs')
        .select('user_id')
        .eq('event_type', 'reengagement_email_sent')
        .filter('metadata->>resend_id', 'eq', resendId)
        .limit(1);

      if (previousLogs && previousLogs.length > 0) {
        userId = previousLogs[0].user_id;
      }
    }

    // Mapeamento limpo do event_type para activity_logs
    let normalizedEvent = `resend_${eventType.replace('.', '_')}`; // ex: resend_email_delivered, resend_email_opened
    if (eventType === 'email.delivered') normalizedEvent = 'email_delivered';
    else if (eventType === 'email.opened') normalizedEvent = 'email_opened';
    else if (eventType === 'email.clicked') normalizedEvent = 'email_clicked';
    else if (eventType === 'email.bounced') normalizedEvent = 'email_bounced';
    else if (eventType === 'email.complained') normalizedEvent = 'email_complained';

    // 3. Inserir log de engajamento no activity_logs
    const { error: insertErr } = await supabase.from('activity_logs').insert({
      user_id: userId,
      event_type: normalizedEvent,
      entity: 'email_campaign',
      entity_id: resendId || 'unknown',
      metadata: {
        resend_id: resendId,
        email: recipientEmail,
        raw_event: eventType,
        subject: data.subject,
        created_at: payload.created_at || new Date().toISOString(),
        click_url: data.click?.url,
        bounce_type: data.bounce?.type
      }
    });

    if (insertErr) {
      console.error('[resend-webhook] Erro ao registrar log:', insertErr);
      throw insertErr;
    }

    console.log(`[resend-webhook] Evento registrado com sucesso: ${normalizedEvent} para ${recipientEmail || 'desconhecido'}`);

    return new Response(
      JSON.stringify({ status: 'success', event: normalizedEvent, email: recipientEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[resend-webhook] Erro no processamento:', err);
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
