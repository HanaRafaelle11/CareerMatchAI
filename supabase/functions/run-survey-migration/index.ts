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

    await sql.end();

    return new Response(JSON.stringify({ success: true, message: 'Constraints de Unicidade (unique_user_survey_version e unique_user_giveaway) aplicadas com sucesso!' }), {
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
