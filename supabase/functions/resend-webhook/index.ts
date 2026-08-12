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

    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Find profile by email (case-insensitive)
    let { data: profile } = await supabase.from('profiles').select('id').ilike('email', cleanEmail).maybeSingle();
    let userId = profile?.id || null;

    // 2. Fallback: Find user_id from survey_events matching resend_message_id
    if (!userId && messageId) {
      const { data: sentEvt } = await supabase
        .from('survey_events')
        .select('user_id')
        .filter('metadata->>resend_message_id', 'eq', messageId)
        .maybeSingle();
      if (sentEvt?.user_id) userId = sentEvt.user_id;
    }

    // 3. Fallback: Find user_id from survey_email_campaigns
    if (!userId && cleanEmail) {
      const { data: camp } = await supabase.from('survey_email_campaigns').select('user_id').ilike('email', cleanEmail).maybeSingle();
      if (camp?.user_id) userId = camp.user_id;
    }

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
        metadata: { resend_message_id: messageId, email: cleanEmail, eventType, timestamp: new Date().toISOString() }
      });

      // 2. Update status in survey_email_campaigns
      let campaignStatus = 'sent';
      if (eventType === 'email.delivered') campaignStatus = 'delivered';
      if (eventType === 'email.opened') campaignStatus = 'opened';
      if (eventType === 'email.clicked') campaignStatus = 'clicked';

      if (userId) {
        await supabase.from('survey_email_campaigns').update({
          status: campaignStatus,
          last_activity_at: new Date().toISOString()
        }).eq('user_id', userId);
      } else if (cleanEmail) {
        await supabase.from('survey_email_campaigns').update({
          status: campaignStatus,
          last_activity_at: new Date().toISOString()
        }).ilike('email', cleanEmail);
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
