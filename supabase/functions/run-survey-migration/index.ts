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

    console.log('[run-survey-migration] Trancando RLS no banco de dados para segurança por Token Server-Side...');

    // 1. Drop old open policies
    await sql`DROP POLICY IF EXISTS "Allow survey_responses insert" ON public.survey_responses;`;
    await sql`DROP POLICY IF EXISTS "Allow survey_responses select" ON public.survey_responses;`;
    await sql`DROP POLICY IF EXISTS "Allow research_contacts insert_update" ON public.research_contacts;`;
    await sql`DROP POLICY IF EXISTS "Allow giveaway_participants insert" ON public.giveaway_participants;`;
    await sql`DROP POLICY IF EXISTS "Allow survey_email_campaigns update" ON public.survey_email_campaigns;`;
    await sql`DROP POLICY IF EXISTS "Allow survey_events insert" ON public.survey_events;`;

    // 2. Strict RLS Policies
    // survey_responses: Only authenticated owners or service_role via submit-survey Edge Function
    await sql`
      CREATE POLICY "Owner or Service Role survey_responses"
        ON public.survey_responses FOR ALL
        USING (auth.uid() = user_id OR auth.role() = 'service_role')
        WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
    `;

    // research_contacts: Only owner or service_role
    await sql`
      CREATE POLICY "Owner or Service Role research_contacts"
        ON public.research_contacts FOR ALL
        USING (auth.uid() = user_id OR auth.role() = 'service_role')
        WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
    `;

    // giveaway_participants: Only owner or service_role
    await sql`
      CREATE POLICY "Owner or Service Role giveaway_participants"
        ON public.giveaway_participants FOR ALL
        USING (auth.uid() = user_id OR auth.role() = 'service_role')
        WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
    `;

    // survey_email_campaigns: Only service_role or admin
    await sql`
      CREATE POLICY "Admin or Service Role survey_email_campaigns"
        ON public.survey_email_campaigns FOR ALL
        USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        WITH CHECK (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    `;

    // survey_events: Anyone can log telemetry events
    await sql`
      CREATE POLICY "Allow survey_events insert"
        ON public.survey_events FOR INSERT
        WITH CHECK (true);
    `;

    await sql.end();

    return new Response(JSON.stringify({ success: true, message: 'RLS de Produção trancada com sucesso! Submissões públicas agora são protegidas e autorizadas exclusivamente via Edge Function por Token.' }), {
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
