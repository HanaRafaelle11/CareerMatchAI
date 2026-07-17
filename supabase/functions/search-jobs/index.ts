import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Importar Conectores de Origem (somente vagas brasileiras / PT-BR)
import { AdzunaConnector } from "./connectors/AdzunaConnector.ts";
import { GupyConnector } from "./connectors/GupyConnector.ts";
import { 
  ProgramathorConnector, 
  TramposConnector, 
  GeekHunterConnector, 
  ReveloConnector, 
  AblerConnector 
} from "./connectors/BrazilianConnectors.ts";

import { aggregateAndNormalizeJobs } from "./aggregator.ts";
import { resolveSearchIntent } from "./intent-resolver.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Helper global para gravação de telemetria analítica no Supabase
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

// Conectores ativos — somente fontes brasileiras em português
const ACTIVE_CONNECTORS = [
  new AdzunaConnector(),
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
    const { keyword, location, pageNum = 1, userId, debug = false } = await req.json();
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

    // ── 1. VERIFICAR CACHE CENTRAL DE CONSULTAS (TTL: 5 minutos) — Somente se não for modo debug ──
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: cached } = !debug ? await supabaseClient
      .from('job_search_cache')
      .select('results, created_at')
      .eq('query_key', queryKey)
      .gt('created_at', fiveMinutesAgo)
      .maybeSingle() : { data: null };

    if (cached && cached.results) {
      console.log(`[JOB SEARCH CACHE HIT] key: ${queryKey}`);
      await logAnalyticsEvent(supabaseClient, resolvedUserId, 'cache_hit', 'Cache', 'completed', { queryKey });
      return new Response(
        JSON.stringify(cached.results),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'cache_miss', 'Cache', 'completed', { queryKey });

    // ── 2. EXTRAÇÃO DE INTENÇÃO DA BUSCA (RESOLVER ADAPTER E RETRIEVERS COORDENADOS) ──
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || undefined;
    const { intent, geminiUsed } = await resolveSearchIntent(searchKeyword, geminiApiKey);

    if (intent) {
      intent.raw_query = searchKeyword;
    }

    // ── 3. CONSULTA PARALELA AOS CONECTORES DE VAGAS ──
    let rawJobsList: any[] = [];

    const promises = ACTIVE_CONNECTORS.map(async (connector) => {
      const start = Date.now();
      await logAnalyticsEvent(supabaseClient, resolvedUserId, 'provider_started', connector.platformName, 'started', { keyword: searchKeyword });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        // Use raw search keyword to prevent query translation losing local matches on regional platforms
        const apiQuery = searchKeyword;

        const connectorResult = await connector.searchJobs(apiQuery, searchLocation, pageNum);
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
    const connectorLogs: any[] = [];
    settledResults.forEach((r) => {
      if (r.status === 'fulfilled') {
        rawJobsList = [...rawJobsList, ...r.value.jobs];
        totalCount += r.value.jobs.length;
        connectorLogs.push({
          name: r.value.name,
          success: r.value.success,
          count: r.value.jobs.length,
          error: r.value.error || null
        });
      } else {
        connectorLogs.push({
          status: 'rejected',
          reason: String(r.reason)
        });
      }
    });

    // ── 4. ORQUESTRADOR CENTRAL DE PIPELINE (NORMALIZAÇÃO, FILTROS, RANKING E METRICAS) ──
    const normalizedJobs = aggregateAndNormalizeJobs(rawJobsList, intent, searchLocation, searchKeyword, geminiUsed, debug);
    const duplicatesRemoved = totalCount - normalizedJobs.length;

    // Gravar telemetria analítica no banco Supabase
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_normalized', 'Aggregator', 'completed', { count: totalCount });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_deduplicated', 'Aggregator', 'completed', { duplicates_count: duplicatesRemoved });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_intent_classified', 'Aggregator', 'completed', { family: intent.family });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_ranked', 'Aggregator', 'completed', { ranked_count: normalizedJobs.length });

    const finalResponse = {
      count: normalizedJobs.length,
      results: normalizedJobs,
      ...(debug ? { connectorLogs, rawCount: totalCount } : {})
    };

    // ── 6. PERSISTIR EM CACHE (Somente se não for debug) ──
    if (!debug) {
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
