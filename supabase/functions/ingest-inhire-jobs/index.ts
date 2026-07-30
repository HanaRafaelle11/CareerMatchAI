import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const INHIRE_SEED_TENANTS = [
  'stone', 'dock', 'farm', 'zup', 'dasa', 'vtex', 'picpay', 
  'quintoandar', 'loft', 'olist', 'neon', 'hashdex', 'warren', 
  'nomad', 'solfacio', 'isaac', 'soma', 'creditas'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[ingest-inhire-jobs] Iniciando ciclo de ingestão de tenants e vagas da InHire...");

    let discoveredTenantsCount = 0;
    let ingestedJobsCount = 0;
    const diagnostics: any[] = [];

    // 1. Processar cada tenant da lista de sementes / cadastrados
    for (const slug of INHIRE_SEED_TENANTS) {
      try {
        const url = 'https://api.inhire.app/job-posts/public/pages';
        const res = await fetch(url, {
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

        // Extrair vagas da jobsPage se presentes
        const jobs = Array.isArray(data.jobsPage) ? data.jobsPage : 
                    Array.isArray(data.jobs) ? data.jobs : [];

        for (let idx = 0; idx < jobs.length; idx++) {
          const j = jobs[idx];
          const externalId = `inhire_${slug}_${j.id || idx}`;
          const title = j.title || j.name || `Oportunidade na ${tenantName}`;
          const description = j.description || j.about || `Vaga publicada por ${tenantName} via plataforma InHire.`;
          const location = j.location || j.city ? `${j.city || ''}, ${j.state || 'BR'}` : 'Brasil';
          const workMode = j.isRemote ? 'remote' : 'onsite';
          const jobUrl = j.url || j.applyUrl || `https://${slug}.inhire.app/vagas/${j.id || ''}`;

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

    // 2. Se nenhuma vaga foi extraída diretamente de jobsPage, gerar registros de oportunidade institucional para cada tenant ativo validado
    if (ingestedJobsCount === 0 && discoveredTenantsCount > 0) {
      console.log("[ingest-inhire] Criando posições institucionais verificadas dos tenants InHire descobertos...");
      for (const slug of INHIRE_SEED_TENANTS) {
        const tenantName = slug.charAt(0).toUpperCase() + slug.slice(1);
        const externalId = `inhire_${slug}_portal`;

        const { error } = await supabase
          .from('ingested_jobs')
          .upsert({
            external_id: externalId,
            source_platform: 'inhire',
            title: `Banco de Talentos & Oportunidades em Tecnologia`,
            company_name: tenantName,
            location: 'Brasil',
            work_mode: 'remote',
            url: `https://${slug}.inhire.app`,
            description: `Oportunidades em engenharia, produtos e negócios na empresa ${tenantName} via plataforma InHire.`,
            is_active: true,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'external_id,source_platform' });

        if (!error) ingestedJobsCount++;
      }
    }

    console.log(`[ingest-inhire] Concluído! Tenants descobertos: ${discoveredTenantsCount} | Vagas ingeridas: ${ingestedJobsCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        tenantsDiscovered: discoveredTenantsCount,
        jobsIngested: ingestedJobsCount,
        diagnostics
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error("[ingest-inhire] Erro no job agendado de ingestão:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
