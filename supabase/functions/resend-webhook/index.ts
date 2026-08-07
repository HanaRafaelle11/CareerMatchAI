import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    const body = await req.json();
    const eventType = body.type; // email.sent, email.delivered, email.opened, email.clicked, email.bounced
    const data = body.data || {};
    const email = data.to?.[0] || data.email;
    const messageId = data.email_id || data.id;

    if (!eventType || !email) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find profile
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    const userId = profile?.id || null;

    const eventNameMap: Record<string, string> = {
      'email.sent': 'email_sent',
      'email.delivered': 'email_delivered',
      'email.opened': 'email_opened',
      'email.clicked': 'email_clicked',
      'email.bounced': 'email_bounced'
    };

    const mappedEventName = eventNameMap[eventType] || eventType;

    // Idempotency Check on survey_events using messageId + mappedEventName
    const { data: existingEvent } = await supabase
      .from('survey_events')
      .select('id')
      .eq('event_name', mappedEventName)
      .filter('metadata->>resend_message_id', 'eq', messageId)
      .maybeSingle();

    if (!existingEvent) {
      // 1. Log event in survey_events
      await supabase.from('survey_events').insert({
        user_id: userId,
        event_name: mappedEventName,
        metadata: { resend_message_id: messageId, email, eventType, timestamp: new Date().toISOString() }
      });

      // 2. Update status in survey_email_campaigns if user exists
      if (userId) {
        let campaignStatus = 'sent';
        if (eventType === 'email.delivered') campaignStatus = 'delivered';
        if (eventType === 'email.opened') campaignStatus = 'opened';
        if (eventType === 'email.clicked') campaignStatus = 'clicked';

        await supabase.from('survey_email_campaigns').update({
          status: campaignStatus,
          last_activity_at: new Date().toISOString()
        }).eq('user_id', userId);
      }
    }

    return new Response(JSON.stringify({ success: true, event: mappedEventName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[resend-webhook] Erro:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
