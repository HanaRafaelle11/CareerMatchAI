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

    console.log('[run-survey-migration] Atualizando RLS Policies e permissões para acesso público via Token...');

    // 1. Drop old restrictive policies if exist
    await sql`DROP POLICY IF EXISTS "Users can insert their own survey response" ON public.survey_responses;`;
    await sql`DROP POLICY IF EXISTS "Users can view their own survey response" ON public.survey_responses;`;
    await sql`DROP POLICY IF EXISTS "Allow survey_responses insert" ON public.survey_responses;`;
    await sql`DROP POLICY IF EXISTS "Allow survey_responses select" ON public.survey_responses;`;

    await sql`DROP POLICY IF EXISTS "Users can insert/update their own research contacts" ON public.research_contacts;`;
    await sql`DROP POLICY IF EXISTS "Allow research_contacts insert_update" ON public.research_contacts;`;

    await sql`DROP POLICY IF EXISTS "Users can insert/view their own giveaway entry" ON public.giveaway_participants;`;
    await sql`DROP POLICY IF EXISTS "Allow giveaway_participants insert" ON public.giveaway_participants;`;

    await sql`DROP POLICY IF EXISTS "Allow survey_email_campaigns update" ON public.survey_email_campaigns;`;

    // 2. Create permissive RLS policies for token-based public survey submissions
    // Survey Responses
    await sql`
      CREATE POLICY "Allow survey_responses insert"
        ON public.survey_responses FOR INSERT
        WITH CHECK (true);
    `;
    await sql`
      CREATE POLICY "Allow survey_responses select"
        ON public.survey_responses FOR SELECT
        USING (true);
    `;

    // Research Contacts (LGPD)
    await sql`
      CREATE POLICY "Allow research_contacts insert_update"
        ON public.research_contacts FOR ALL
        USING (true)
        WITH CHECK (true);
    `;

    // Giveaway Participants
    await sql`
      CREATE POLICY "Allow giveaway_participants insert"
        ON public.giveaway_participants FOR ALL
        USING (true)
        WITH CHECK (true);
    `;

    // Survey Email Campaigns
    await sql`
      CREATE POLICY "Allow survey_email_campaigns update"
        ON public.survey_email_campaigns FOR ALL
        USING (true)
        WITH CHECK (true);
    `;

    // Survey Events
    await sql`
      CREATE POLICY "Allow survey_events insert"
        ON public.survey_events FOR ALL
        USING (true)
        WITH CHECK (true);
    `;

    // Grants for anon and authenticated roles
    await sql`GRANT ALL ON public.survey_responses TO anon, authenticated, service_role;`;
    await sql`GRANT ALL ON public.research_contacts TO anon, authenticated, service_role;`;
    await sql`GRANT ALL ON public.giveaway_participants TO anon, authenticated, service_role;`;
    await sql`GRANT ALL ON public.survey_email_campaigns TO anon, authenticated, service_role;`;
    await sql`GRANT ALL ON public.survey_events TO anon, authenticated, service_role;`;

    await sql.end();

    return new Response(JSON.stringify({ success: true, message: 'RLS Policies atualizadas com sucesso para acesso via Token Público!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[run-survey-migration] Erro ao atualizar RLS:', err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
