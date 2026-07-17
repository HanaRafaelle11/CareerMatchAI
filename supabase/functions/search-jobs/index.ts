import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Import Connectors
import { AdzunaConnector } from "./connectors/AdzunaConnector.ts";
import { RemotiveConnector } from "./connectors/RemotiveConnector.ts";
import { RemoteOkConnector } from "./connectors/RemoteOkConnector.ts";
import { ArbeitnowConnector } from "./connectors/ArbeitnowConnector.ts";
import { GreenhouseConnector } from "./connectors/GreenhouseConnector.ts";
import { LeverConnector } from "./connectors/LeverConnector.ts";
import { AshbyConnector } from "./connectors/AshbyConnector.ts";
import { SmartRecruitersConnector } from "./connectors/SmartRecruitersConnector.ts";
import { WorkableConnector } from "./connectors/WorkableConnector.ts";
import { RecruiteeConnector } from "./connectors/RecruiteeConnector.ts";
import { TeamtailorConnector } from "./connectors/TeamtailorConnector.ts";
import { BambooHRConnector } from "./connectors/BambooHRConnector.ts";
import { ComeetConnector } from "./connectors/ComeetConnector.ts";
import { GupyConnector } from "./connectors/GupyConnector.ts";
import { 
  ProgramathorConnector, 
  TramposConnector, 
  GeekHunterConnector, 
  ReveloConnector, 
  AblerConnector 
} from "./connectors/BrazilianConnectors.ts";

import { aggregateAndNormalizeJobs } from "./aggregator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Global logger helper for analytics_events
async function logAnalyticsEvent(
  supabaseClient: any, 
  userId: string | null, 
  eventName: string, 
  provider: string, 
  status: string, 
  metadata = {}
) {
  if (!supabaseClient) return;
  try {
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id: userId || null,
        event_name: eventName,
        category: 'job_search',
        metadata: {
          ...metadata,
          service: provider,
          status,
          timestamp: new Date().toISOString()
        }
      });
  } catch (err) {
    console.error(`[EVENT LOG] Erro ao gravar evento ${eventName}:`, err.message);
  }
}

// List of all active connectors
const ACTIVE_CONNECTORS = [
  new AdzunaConnector(),
  new RemotiveConnector(),
  new RemoteOkConnector(),
  new ArbeitnowConnector(),
  new GreenhouseConnector(),
  new LeverConnector(),
  new AshbyConnector(),
  new SmartRecruitersConnector(),
  new WorkableConnector(),
  new RecruiteeConnector(),
  new TeamtailorConnector(),
  new BambooHRConnector(),
  new ComeetConnector(),
  new GupyConnector(),
  new ProgramathorConnector(),
  new TramposConnector(),
  new GeekHunterConnector(),
  new ReveloConnector(),
  new AblerConnector()
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const requestStartTime = Date.now();
  let resolvedUserId: string | null = null;
  let supabaseClient: any = null;

  try {
    const { keyword, location, pageNum = 1, userId } = await req.json();
    const searchKeyword = keyword || 'React';
    const searchLocation = location || 'Brasil';

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization') || '';

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    resolvedUserId = userId || null;
    if (!resolvedUserId && authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) resolvedUserId = user.id;
      } catch (err) {
        console.error("Erro ao resolver usuário no token:", err);
      }
    }

    const queryKey = `${searchKeyword.toLowerCase().trim()}|${searchLocation.toLowerCase().trim()}|${pageNum}`;

    // ── 1. VERIFICAR CACHE (TTL: 5 minutos) ──
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: cached } = await supabaseClient
      .from('job_search_cache')
      .select('results, created_at')
      .eq('query_key', queryKey)
      .gt('created_at', fiveMinutesAgo)
      .maybeSingle();

    if (cached && cached.results) {
      console.log(`[JOB SEARCH CACHE HIT] key: ${queryKey}`);
      await logAnalyticsEvent(supabaseClient, resolvedUserId, 'cache_hit', 'Cache', 'completed', { queryKey });
      return new Response(
        JSON.stringify(cached.results),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'cache_miss', 'Cache', 'completed', { queryKey });

    // ── 2. INICIAR BUSCA PARALELA EM PROVEDORES ──
    let rawJobsList: any[] = [];

    const promises = ACTIVE_CONNECTORS.map(async (connector) => {
      const start = Date.now();
      await logAnalyticsEvent(supabaseClient, resolvedUserId, 'provider_started', connector.platformName, 'started', { keyword: searchKeyword });

      try {
        // Timeout de 3 segundos por conector para evitar travamentos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const connectorResult = await connector.searchJobs(searchKeyword, searchLocation, pageNum);
        clearTimeout(timeoutId);

        const duration = Date.now() - start;
        await logAnalyticsEvent(supabaseClient, resolvedUserId, 'provider_finished', connector.platformName, 'completed', {
          count: connectorResult.length,
          duration_ms: duration
        });

        return { name: connector.platformName, jobs: connectorResult, success: true };
      } catch (err) {
        const duration = Date.now() - start;
        console.error(`[Aggregator] Falha no conector ${connector.platformName}:`, err.message);
        await logAnalyticsEvent(supabaseClient, resolvedUserId, 'provider_failed', connector.platformName, 'failed', {
          error: err.message,
          duration_ms: duration
        });
        return { name: connector.platformName, jobs: [], success: false, error: err.message };
      }
    });

    const settledResults = await Promise.allSettled(promises);
    
    let totalCount = 0;
    settledResults.forEach((r) => {
      if (r.status === 'fulfilled') {
        rawJobsList = [...rawJobsList, ...r.value.jobs];
        totalCount += r.value.jobs.length;
      }
    });

    // ── 3. AGREGADOR INTELIGENTE (NORMALIZAÇÃO, DEDUPLICAÇÃO & SCORING) ──
    const normalizedJobs = aggregateAndNormalizeJobs(rawJobsList);
    const duplicatesRemoved = totalCount - normalizedJobs.length;

    // ── 3.5. FILTRO DE RELEVÂNCIA POR KEYWORD ──
    // APIs externas fazem busca full-text e podem retornar vagas irrelevantes.
    // Filtra para que o keyword apareça no título OU nos primeiros 500 chars da descrição.
    const keywordLower = searchKeyword.toLowerCase().trim();
    const keywordTokens = keywordLower.split(/\s+/).filter(t => t.length >= 3);
    
    let relevantJobs = normalizedJobs;
    if (keywordTokens.length > 0) {
      relevantJobs = normalizedJobs.filter(job => {
        const titleLower = job.title.toLowerCase();
        const descLower = job.description.substring(0, 500).toLowerCase();
        const combined = titleLower + ' ' + descLower;
        
        // Pelo menos metade dos tokens do keyword devem aparecer no título+descrição
        const matchCount = keywordTokens.filter(token => combined.includes(token)).length;
        return matchCount >= Math.ceil(keywordTokens.length / 2);
      });

      // Se após o filtro restam poucas vagas (<3), relaxa para apenas 1 token match
      if (relevantJobs.length < 3) {
        relevantJobs = normalizedJobs.filter(job => {
          const titleLower = job.title.toLowerCase();
          const descLower = job.description.substring(0, 500).toLowerCase();
          const combined = titleLower + ' ' + descLower;
          return keywordTokens.some(token => combined.includes(token));
        });
      }

      // Ordenar por relevância: título match > descrição match
      relevantJobs.sort((a, b) => {
        const aTitleMatch = keywordTokens.filter(t => a.title.toLowerCase().includes(t)).length;
        const bTitleMatch = keywordTokens.filter(t => b.title.toLowerCase().includes(t)).length;
        if (bTitleMatch !== aTitleMatch) return bTitleMatch - aTitleMatch;
        return b.scores.overall - a.scores.overall;
      });
    }

    // ── 3.6. FILTRO GEOGRÁFICO — Priorizar Brasil quando localização brasileira ──
    const locLower = searchLocation.toLowerCase();
    const isBrazilianSearch = /brasil|brazil|br|são paulo|rio de janeiro|belo horizonte|curitiba|porto alegre|recife|salvador|fortaleza|brasília|campinas|goiânia|manaus|belém|florianópolis|sp|rj|mg|pr|rs|sc|ba|pe|ce|df|go|am|pa/i.test(locLower);
    
    let filteredJobs = relevantJobs;
    if (isBrazilianSearch) {
      const nonBrazilPatterns = /\b(germany|deutschland|austria|österreich|schweiz|switzerland|canada|united states|usa|uk|united kingdom|france|spain|netherlands|ireland|australia|india|japan|china|singapore|dubai|qatar|münchen|munich|berlin|hamburg|frankfurt|london|paris|amsterdam|dublin|toronto|vancouver|montreal|new york|san francisco|seattle|chicago|los angeles|sydney|melbourne)\b/i;
      const foreignLangPatterns = /\b(projektmanager|sachbearbeiter|mitarbeiter|leiter|berater|ingénieur|développeur|responsable|gestionnaire|chargé)\b/i;

      filteredJobs = relevantJobs.filter(job => {
        const jobLoc = (job.locationNormalized || job.location || '').toLowerCase();
        const jobTitle = job.title.toLowerCase();
        const jobDesc = job.description.substring(0, 300).toLowerCase();
        
        if (jobLoc.includes('remot') || jobLoc === '' || jobLoc === 'remote' || jobLoc.includes('anywhere') || jobLoc.includes('worldwide')) {
          return true;
        }
        if (nonBrazilPatterns.test(jobLoc) || nonBrazilPatterns.test(jobDesc)) {
          return false;
        }
        if (foreignLangPatterns.test(jobTitle)) {
          return false;
        }
        return true;
      });
    }

    // Log stats
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_normalized', 'Aggregator', 'completed', { count: totalCount });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_deduplicated', 'Aggregator', 'completed', { duplicates_count: duplicatesRemoved });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_keyword_filtered', 'Aggregator', 'completed', { before: normalizedJobs.length, after: relevantJobs.length, keyword: searchKeyword });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_geo_filtered', 'Aggregator', 'completed', { before: relevantJobs.length, after: filteredJobs.length, location: searchLocation });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_ranked', 'Aggregator', 'completed', { ranked_count: filteredJobs.length });

    const finalResponse = {
      count: filteredJobs.length,
      results: filteredJobs
    };

    // ── 4. GRAVAR EM CACHE ──
    try {
      await supabaseClient
        .from('job_search_cache')
        .upsert({
          query_key: queryKey,
          results: finalResponse,
          created_at: new Date().toISOString()
        });
    } catch (dbErr) {
      console.error('[CACHE SAVE ERROR]', dbErr.message);
    }

    return new Response(
      JSON.stringify(finalResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("[JOB SEARCH AGGREGATOR ERROR]", error);
    const durationMs = Date.now() - requestStartTime;
    if (supabaseClient) {
      await logAnalyticsEvent(supabaseClient, resolvedUserId, 'job_search_failed', 'Aggregator', 'failed', { error: error.message, duration_ms: durationMs });
    }
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro na agregação de vagas públicas.",
        errorDetails: { 
          code: "JOB_SEARCH_FAILED", 
          userMessage: "Erro ao unificar buscas de vagas.",
          retryable: true 
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
