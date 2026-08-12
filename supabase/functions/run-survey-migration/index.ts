import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') || Deno.env.get('POSTGRES_URL') || Deno.env.get('SUPABASE_DIRECT_URL');
    
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: 'DB connection string env variable missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sql = postgres(dbUrl, { ssl: 'require' });

    console.log('[run-survey-migration] Adicionando Constraints de Unicidade e Índices no Postgres...');

    // Add unique constraint on survey_responses (user_id + survey_version)
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_survey_version'
        ) THEN
          ALTER TABLE public.survey_responses ADD CONSTRAINT unique_user_survey_version UNIQUE (user_id, survey_version);
        END IF;
      END $$;
    `;

    // Add unique constraint on giveaway_participants (user_id)
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_giveaway'
        ) THEN
          ALTER TABLE public.giveaway_participants ADD CONSTRAINT unique_user_giveaway UNIQUE (user_id);
        END IF;
      END $$;
    `;

    // Remove FK constraints that block survey_events & survey_email_campaigns for non-logged-in email tokens
    await sql`
      DO $$ 
      BEGIN
        ALTER TABLE public.survey_events DROP CONSTRAINT IF EXISTS survey_events_user_id_fkey;
        ALTER TABLE public.survey_email_campaigns DROP CONSTRAINT IF EXISTS survey_email_campaigns_user_id_fkey;
        ALTER TABLE public.survey_responses DROP CONSTRAINT IF EXISTS survey_responses_user_id_fkey;
        ALTER TABLE public.giveaway_participants DROP CONSTRAINT IF EXISTS giveaway_participants_user_id_fkey;
        ALTER TABLE public.research_contacts DROP CONSTRAINT IF EXISTS research_contacts_user_id_fkey;

        -- survey_email_campaigns
        ALTER TABLE public.survey_email_campaigns ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for survey_email_campaigns" ON public.survey_email_campaigns;
        CREATE POLICY "Allow all for survey_email_campaigns" ON public.survey_email_campaigns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

        -- survey_events
        ALTER TABLE public.survey_events ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for survey_events" ON public.survey_events;
        CREATE POLICY "Allow all for survey_events" ON public.survey_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

        -- survey_responses
        ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for survey_responses" ON public.survey_responses;
        CREATE POLICY "Allow all for survey_responses" ON public.survey_responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

        -- giveaway_participants
        ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for giveaway_participants" ON public.giveaway_participants;
        CREATE POLICY "Allow all for giveaway_participants" ON public.giveaway_participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

        -- research_contacts
        ALTER TABLE public.research_contacts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for research_contacts" ON public.research_contacts;
        CREATE POLICY "Allow all for research_contacts" ON public.research_contacts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
      END $$;
    `;

    await sql.end();

    // 2. Consultar e Reativar Webhook no Asaas via API
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY') || '';
    const rawAsaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://www.asaas.com/api/v3';
    const cleanAsaasUrl = rawAsaasApiUrl.replace(/\/+$/, '');

    let asaasResult: any = null;

    if (asaasApiKey) {
      try {
        console.log(`[run-survey-migration] Consultando webhooks na API do Asaas em ${cleanAsaasUrl}...`);
        
        // Tentar endpoint de webhooks
        let listRes = await fetch(`${cleanAsaasUrl}/webhooks`, {
          headers: { 'accept': 'application/json', 'access_token': asaasApiKey }
        });

        if (!listRes.ok && cleanAsaasUrl.includes('www.asaas.com')) {
          const altUrl = cleanAsaasUrl.replace('www.asaas.com', 'api.asaas.com');
          console.log(`[run-survey-migration] Tentando URL alternativa ${altUrl}...`);
          listRes = await fetch(`${altUrl}/webhooks`, {
            headers: { 'accept': 'application/json', 'access_token': asaasApiKey }
          });
        }

        const resText = await listRes.text();
        let listData: any = {};
        try { listData = JSON.parse(resText); } catch { listData = { rawText: resText }; }

        const webhooks = Array.isArray(listData.data) ? listData.data : (listData.id ? [listData] : []);
        
        let targetWebhook = webhooks.find((w: any) => 
          (w.name && w.name.toLowerCase().includes('vocentr')) ||
          (w.url && w.url.includes('billing-webhook'))
        ) || webhooks[0] || listData;

        let reactivateResData: any = null;

        if (targetWebhook && targetWebhook.id) {
          const webhookId = targetWebhook.id;
          const updateUrl = `${cleanAsaasUrl}/webhooks/${webhookId}`;

          console.log(`[run-survey-migration] Enviando POST com interrupted: false para ${updateUrl}...`);
          
          const patchBody = {
            name: targetWebhook.name || 'Vocentr',
            url: targetWebhook.url || 'https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/billing-webhook',
            email: 'hanarafaelle11@gmail.com',
            enabled: true,
            interrupted: false,
            apiVersion: 3,
            sendType: targetWebhook.sendType || 'NON_SEQUENTIALLY',
            events: targetWebhook.events || [
              "PAYMENT_RESTORED",
              "PAYMENT_OVERDUE",
              "PAYMENT_CONFIRMED",
              "SUBSCRIPTION_DELETED",
              "PAYMENT_DELETED",
              "PAYMENT_RECEIVED"
            ]
          };

          const patchRes = await fetch(updateUrl, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'access_token': asaasApiKey
            },
            body: JSON.stringify(patchBody)
          });

          const patchText = await patchRes.text();
          try { reactivateResData = JSON.parse(patchText); } catch { reactivateResData = { status: patchRes.status, rawText: patchText }; }
        }

        asaasResult = {
          apiUrl: cleanAsaasUrl,
          listStatus: listRes.status,
          listData,
          targetWebhook,
          reactivateResult: reactivateResData
        };
      } catch (asaasErr: any) {
        console.error('[run-survey-migration] Erro ao comunicar com API do Asaas:', asaasErr);
        asaasResult = { error: asaasErr.message || String(asaasErr) };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Migration e Reativação Asaas executadas.',
      asaasResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[run-survey-migration] Erro:', err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
