import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const INHIRE_SEED_TENANTS = [
  'radix', 'vitru', 'v4company', 'deloitte', 'semantix', 'alun', 'matera',
  'appmax', 'cielo', 'turbi', 'floki', 'bionexo', 'stone', 'dock', 'farm',
  'zup', 'dasa', 'vtex', 'picpay', 'quintoandar', 'loft', 'olist', 'neon',
  'hashdex', 'warren', 'nomad', 'solfacio', 'isaac', 'soma', 'creditas'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const urlObj = new URL(req.url);
    const mode = urlObj.searchParams.get('mode') || 'ingest'; // 'ingest' (diário) ou 'discover' (semanal)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[ingest-inhire-jobs] Executando em modo: ${mode.toUpperCase()}...`);

    let tenantsToProcess: string[] = [];

    if (mode === 'discover') {
      // MODO DESCOBERTA SEMANAL: Processa lista expandida de harvesting
      tenantsToProcess = INHIRE_SEED_TENANTS;
    } else {
      // MODO INGESTÃO DIÁRIA: Carrega apenas tenants ativos já validados no banco
      const { data: dbTenants } = await supabase
        .from('inhire_tenants')
        .select('slug')
        .eq('is_active', true);

      if (dbTenants && dbTenants.length > 0) {
        tenantsToProcess = dbTenants.map((t: any) => t.slug);
      } else {
        tenantsToProcess = INHIRE_SEED_TENANTS; // fallback
      }
    }

    let discoveredTenantsCount = 0;
    let ingestedJobsCount = 0;
    const diagnostics: any[] = [];

    // 1. Processar cada tenant selecionado
    for (const slug of tenantsToProcess) {
      try {
        const apiUrl = 'https://api.inhire.app/job-posts/public/pages';
        const res = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'X-Tenant': slug,
            'Accept': 'application/json'
          }
        });

        if (!res.ok) {
          console.warn(`[ingest-inhire] Tenant '${slug}' respondeu com HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        const tenantName = data.tenantName || slug.toUpperCase();

        // Gravar/Atualizar Tenant na tabela inhire_tenants
        await supabase
          .from('inhire_tenants')
          .upsert({
            slug,
            company_name: tenantName,
            is_active: true,
            last_validated_at: new Date().toISOString()
          }, { onConflict: 'slug' });

        discoveredTenantsCount++;

        // Extrair vagas do array jobsPage
        const jobs = Array.isArray(data.jobsPage) ? data.jobsPage : 
                    Array.isArray(data.jobs) ? data.jobs : [];

        for (let idx = 0; idx < jobs.length; idx++) {
          const j = jobs[idx];
          const externalId = `inhire_${slug}_${j.id || idx}`;
          const title = j.title || j.name || `Oportunidade na ${tenantName}`;
          const description = j.description || j.about || `Vaga publicada por ${tenantName} via plataforma InHire.`;
          const location = j.city ? `${j.city || ''}, ${j.state || 'BR'}` : (j.location || 'Brasil');
          const workMode = j.isRemoteWork || j.isRemote ? 'remote' : 'onsite';
          const jobUrl = j.jobUrl || j.applyUrl || `https://${slug}.inhire.app/job/${j.id || ''}`;

          const { error: upsertErr } = await supabase
            .from('ingested_jobs')
            .upsert({
              external_id: externalId,
              source_platform: 'inhire',
              title,
              company_name: tenantName,
              location,
              work_mode: workMode,
              url: jobUrl,
              description,
              is_active: true,
              last_seen_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'external_id,source_platform' });

          if (!upsertErr) {
            ingestedJobsCount++;
          }
        }

        diagnostics.push({ slug, tenantName, jobsCount: jobs.length });
      } catch (err: any) {
        console.error(`[ingest-inhire] Erro ao processar tenant '${slug}':`, err.message);
      }
    }

    console.log(`[ingest-inhire] Concluído modo ${mode.toUpperCase()}! Tenants: ${discoveredTenantsCount} | Vagas: ${ingestedJobsCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        tenantsProcessed: tenantsToProcess.length,
        tenantsValidated: discoveredTenantsCount,
        jobsIngested: ingestedJobsCount,
        diagnostics
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error("[ingest-inhire] Erro no agendamento de ingestão:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
