import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Import Connectors
import { AdzunaConnector } from "./connectors/AdzunaConnector.ts";
import { JoobleConnector } from "./connectors/JoobleConnector.ts";
import { SerpApiConnector } from "./connectors/SerpApiConnector.ts";
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
import { DbIngestedJobsConnector } from "./connectors/DbIngestedJobsConnector.ts";
import { 
  ProgramathorConnector, 
  TramposConnector, 
  GeekHunterConnector, 
  ReveloConnector, 
  AblerConnector 
} from "./connectors/BrazilianConnectors.ts";

import { aggregateAndNormalizeJobs } from "./aggregator.ts";
import { type JobIntent } from "./connectors/BaseJobConnector.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// ── TIER SYSTEM ──
// Tier A: Major ATS platforms + Brazilian platforms with high volume
// Tier B: Secondary aggregators
// Tier C: Niche / low-volume sources (only queried when needed)
interface TieredConnector {
  connector: any;
  tier: 'A' | 'B' | 'C';
}

const TIERED_CONNECTORS: TieredConnector[] = [
  // Tier A — Priority platforms
  { connector: new GupyConnector(), tier: 'A' },
  { connector: new AdzunaConnector(), tier: 'A' },
  { connector: new GreenhouseConnector(), tier: 'A' },
  { connector: new LeverConnector(), tier: 'A' },
  { connector: new WorkableConnector(), tier: 'A' },
  { connector: new SmartRecruitersConnector(), tier: 'A' },
  { connector: new TeamtailorConnector(), tier: 'A' },
  { connector: new AshbyConnector(), tier: 'A' },
  { connector: new RecruiteeConnector(), tier: 'A' },
  
  // Tier B — Secondary aggregators
  { connector: new RemotiveConnector(), tier: 'B' },
  { connector: new RemoteOkConnector(), tier: 'B' },
  { connector: new JoobleConnector(), tier: 'B' },
  { connector: new SerpApiConnector(), tier: 'B' },
  { connector: new ArbeitnowConnector(), tier: 'B' },
  
  // Tier C — Brazilian niche platforms
  { connector: new ProgramathorConnector(), tier: 'C' },
  { connector: new TramposConnector(), tier: 'C' },
  // { connector: new GeekHunterConnector(), tier: 'C' }, // Descontinuado pela plataforma
  // { connector: new ReveloConnector(), tier: 'C' },     // Descontinuado pela plataforma
  // { connector: new AblerConnector(), tier: 'C' },      // Descontinuado pela plataforma
  { connector: new BambooHRConnector(), tier: 'C' },
  { connector: new ComeetConnector(), tier: 'C' },
];

// ── Provider Diagnostic ──
interface ProviderDiagnostic {
  name: string;
  tier: 'A' | 'B' | 'C';
  status: 'ok' | 'skipped' | 'failed' | 'timeout' | 'no_results' | 'no_key';
  apiKeyPresent: boolean;
  httpStatus: number | null;
  responseTimeMs: number;
  rawJobsReturned: number;
  errorType: string | null;
  errorMessage: string | null;
}

// Resilient fetch with exponential backoff
async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  const delays = [2000, 4000, 8000];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[GEMINI RETRY] Attempt ${attempt} failed with status ${response.status}. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 5000));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[GEMINI RETRY] Attempt ${attempt} failed with network error: ${err.message}. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 5000));
    }
  }
  throw new Error(`Failed to contact Gemini API after ${maxRetries} attempts.`);
}

// Classify query intent using Gemini with strict 1.5s timeout & instant fallback
async function classifyIntentWithGemini(
  keyword: string,
  geminiApiKey: string
): Promise<JobIntent> {
  const systemPrompt = `You are a career search intent parser. Analyze the user's search query and output a JSON object classifying the intent.
The response must be valid JSON matching this schema:
{
  "family": "The job family or category name",
  "primary_titles": ["The most common exact titles"],
  "secondary_titles": ["Alternative titles"],
  "negative_titles": ["Unrelated roles"],
  "skills": ["Key skills"],
  "preferred_skills": ["Secondary skills"],
  "negative_keywords": ["Keywords indicating mismatch"]
}
Raw JSON only.`;

  const prompt = `${systemPrompt}\n\nQuery: "${keyword}"\nOutput JSON:`;
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Gemini status ${response.status}`);
    const resJson = await response.json();
    const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('No candidate text');
    
    return JSON.parse(candidateText) as JobIntent;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[INTENT CLASSIFIER] Fast fallback used (${err.message})`);
    return getFallbackIntent(keyword);
  }
}


function getFallbackIntent(keyword: string): JobIntent {
  return {
    family: keyword,
    primary_titles: [keyword],
    secondary_titles: [],
    negative_titles: [],
    skills: [],
    preferred_skills: [],
    negative_keywords: []
  };
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

// ── Classify HTTP errors ──
function classifyHttpError(status: number): string {
  if (status === 401 || status === 403) return 'AUTH_FAILED';
  if (status === 429) return 'QUOTA_EXCEEDED';
  if (status >= 500) return 'SERVER_ERROR';
  if (status === 408) return 'TIMEOUT';
  return 'HTTP_ERROR';
}

// ── Execute connector with REAL timeout and diagnostics ──
async function executeConnectorWithDiag(
  tieredConn: TieredConnector,
  keyword: string,
  location: string,
  pageNum: number,
  timeoutMs: number = 3500
): Promise<{ diagnostic: ProviderDiagnostic; jobs: any[] }> {
  const { connector, tier } = tieredConn;
  const start = Date.now();
  const name = connector.platformName;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const searchPromise = connector.searchJobs(keyword, location, pageNum, controller.signal);
    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')));
    });

    const jobs = await Promise.race([searchPromise, timeoutPromise]);
    clearTimeout(timeoutId);
    
    const duration = Date.now() - start;
    const jobCount = Array.isArray(jobs) ? jobs.length : 0;

    return {
      diagnostic: {
        name,
        tier,
        status: jobCount > 0 ? 'ok' : 'no_results',
        apiKeyPresent: true,
        httpStatus: 200,
        responseTimeMs: duration,
        rawJobsReturned: jobCount,
        validJobsAfterNorm: jobCount,
        discardedCount: 0,
        discardReasons: {},
        errorType: null,
        errorMessage: null
      },
      jobs: jobs || []
    };
  } catch (err: any) {
    const duration = Date.now() - start;
    const isTimeout = err.message === 'TIMEOUT' || err.name === 'AbortError';
    
    // Try to extract HTTP status from error message
    let httpStatus: number | null = null;
    let errorType = isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';
    const statusMatch = err.message?.match(/status\s+(\d{3})/i);
    if (statusMatch) {
      httpStatus = parseInt(statusMatch[1]);
      errorType = classifyHttpError(httpStatus);
    }

    // Check if it's a missing API key or deprecated feed
    const isNoKey = err.message?.toLowerCase().includes('não configurad') || 
                    err.message?.toLowerCase().includes('not configured') ||
                    err.message?.toLowerCase().includes('key');
    const isDeprecated = err.message?.includes('ENDPOINT_DEPRECATED');
    const isAuthRequired = err.message?.includes('AUTH_REQUIRED');

    return {
      diagnostic: {
        name,
        tier,
        status: isNoKey ? 'no_key' : isDeprecated ? 'deprecated' : isAuthRequired ? 'auth_required' : isTimeout ? 'timeout' : 'failed',
        apiKeyPresent: !isNoKey && !isAuthRequired,
        httpStatus: httpStatus || (isDeprecated ? 404 : isAuthRequired ? 401 : null),
        responseTimeMs: duration,
        rawJobsReturned: 0,
        validJobsAfterNorm: 0,
        discardedCount: 0,
        discardReasons: {},
        errorType: isDeprecated ? 'ENDPOINT_DEPRECATED' : isAuthRequired ? 'AUTH_REQUIRED' : errorType,
        errorMessage: err.message?.substring(0, 200) || 'Unknown error'
      },
      jobs: []
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const requestStartTime = Date.now();
  let resolvedUserId: string | null = null;
  let supabaseClient: any = null;

  try {
    const { keyword, location, pageNum = 1, userId, provider } = await req.json();
    const searchKeyword = keyword || 'React';
    const searchLocation = location || 'Brasil';
    const cleanedKeyword = (searchKeyword || '').replace(/<\/?[^>]+(>|$)/g, "").trim();

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

    const providerPrefix = provider ? provider.toLowerCase().trim() : 'aggregated';
    const queryKey = `${providerPrefix}|${searchKeyword.toLowerCase().trim()}|${searchLocation.toLowerCase().trim()}|${pageNum}`;

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

    // ── 1.5. GEMINI INTENT CLASSIFICATION ──
    let intent: JobIntent;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.warn("[search-jobs] GEMINI_API_KEY is not set. Falling back to simple keyword matching.");
      intent = getFallbackIntent(cleanedKeyword);
    } else {
      try {
        intent = await classifyIntentWithGemini(cleanedKeyword, geminiApiKey);
      } catch (geminiErr) {
        console.error("[search-jobs] Gemini classification failed:", geminiErr.message);
        intent = getFallbackIntent(cleanedKeyword);
      }
    }

    // ── 2. SELECT CONNECTORS TO RUN ──
    let connectorsToRun: TieredConnector[] = [];
    
    if (provider) {
      // Legacy: specific provider requested
      connectorsToRun = TIERED_CONNECTORS.filter(tc => 
        tc.connector.platformName.toUpperCase().includes(provider.toUpperCase())
      );
      if (connectorsToRun.length === 0) {
        connectorsToRun = TIERED_CONNECTORS; // fallback to all
      }
    } else {
      // Unified aggregated mode: run Tier A + B always, Tier C only for Brazilian searches
      const locLower = searchLocation.toLowerCase();
      const isBrazilianSearch = /brasil|brazil|br|são paulo|sao paulo|rio|belo horizonte|curitiba|porto alegre|sp|rj|mg/i.test(locLower);
      
      connectorsToRun = TIERED_CONNECTORS.filter(tc => {
        if (tc.tier === 'A' || tc.tier === 'B') return true;
        // Tier C only runs for Brazilian searches or when explicitly requested
        if (tc.tier === 'C' && isBrazilianSearch) return true;
        return false;
      });
      // Injetar conector do banco local de vagas ingeridas (InHire / Crons)
      connectorsToRun.push({ connector: new DbIngestedJobsConnector(supabaseClient), tier: 'A' });
    }

    console.log(`[AGGREGATOR] Running ${connectorsToRun.length} connectors for "${cleanedKeyword}" in "${searchLocation}"`);
    console.log(`[AGGREGATOR] Connectors: ${connectorsToRun.map(tc => `${tc.connector.platformName} (${tc.tier})`).join(', ')}`);

    // ── 3. EXECUTE ALL CONNECTORS IN PARALLEL WITH KEYWORD EXPANSION ──
    const diagnostics: ProviderDiagnostic[] = [];
    let rawJobsList: any[] = [];

    // Tier A gets 4.5s max, Tier B gets 3.5s, Tier C gets 2.5s -> Entire search completes in under 5 seconds!
    const tierTimeouts: Record<string, number> = { A: 4500, B: 3500, C: 2500 };

    console.log(`[PARALLEL SEARCH] Querying ${connectorsToRun.length} providers in parallel for "${cleanedKeyword}"`);

    // Disparar buscas em paralelo — 1 única chamada por conector (evita saturação de sockets e latência >5s)
    const promises: Promise<any>[] = connectorsToRun.map(tc => 
      executeConnectorWithDiag(tc, cleanedKeyword, searchLocation, pageNum, tierTimeouts[tc.tier])
    );


    const results = await Promise.allSettled(promises);

    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        diagnostics.push(r.value.diagnostic);
        if (r.value.jobs.length > 0) {
          rawJobsList = [...rawJobsList, ...r.value.jobs];
        }

        // Log analytics event per provider
        const diag = r.value.diagnostic;
        const eventName = diag.status === 'ok' ? 'provider_finished' : 
                          diag.status === 'no_key' ? 'provider_skipped' : 'provider_failed';
        
        logAnalyticsEvent(supabaseClient, resolvedUserId, eventName, diag.name, diag.status, {
          tier: diag.tier,
          count: diag.rawJobsReturned,
          duration_ms: diag.responseTimeMs,
          http_status: diag.httpStatus,
          api_key_present: diag.apiKeyPresent,
          error_type: diag.errorType,
          error_message: diag.errorMessage
        });
      } else {
        console.error(`[AGGREGATOR] Promise rejected:`, r.reason);
      }
    });

    const totalCount = rawJobsList.length;
    console.log(`[AGGREGATOR] Total raw jobs: ${totalCount} from ${diagnostics.filter(d => d.status === 'ok').length} successful providers`);

    // ── 4. AGGREGATE, NORMALIZE, DEDUPLICATE & RANK ──
    const normalizedJobs = aggregateAndNormalizeJobs(rawJobsList, intent, searchLocation);
    const duplicatesRemoved = totalCount - normalizedJobs.length;

    // ── 4.5. GEO FILTER ──
    const locLower = searchLocation.toLowerCase();
    const isBrazilianSearch = /brasil|brazil|br|são paulo|rio de janeiro|belo horizonte|curitiba|porto alegre|recife|salvador|fortaleza|brasília|campinas|goiânia|manaus|belém|florianópolis|sp|rj|mg|pr|rs|sc|ba|pe|ce|df|go|am|pa/i.test(locLower);
    
    let filteredJobs = normalizedJobs;
    if (isBrazilianSearch) {
      const nonBrazilPatterns = /\b(germany|deutschland|austria|österreich|schweiz|switzerland|canada|united states|usa|uk|united kingdom|france|spain|netherlands|ireland|australia|india|japan|china|singapore|dubai|qatar|münchen|munich|berlin|hamburg|frankfurt|london|paris|amsterdam|dublin|toronto|vancouver|montreal|new york|san francisco|seattle|chicago|los angeles|sydney|melbourne)\b/i;
      const foreignLangPatterns = /\b(projektmanager|sachbearbeiter|mitarbeiter|leiter|berater|ingénieur|développeur|responsable|gestionnaire|chargé)\b/i;

      filteredJobs = normalizedJobs.filter(job => {
        const jobLoc = (job.locationNormalized || job.location || '').toLowerCase();
        const jobTitle = job.title.toLowerCase();
        const jobDesc = job.description.substring(0, 300).toLowerCase();
        
        if (jobLoc.includes('remot') || jobLoc === '' || jobLoc === 'remote' || jobLoc.includes('anywhere') || jobLoc.includes('worldwide')) {
          return true;
        }
        if (nonBrazilPatterns.test(jobLoc)) return false;
        if (foreignLangPatterns.test(jobTitle)) return false;
        return true;
      });
    }

    // ── 4.6. ENRICH DIAGNOSTICS WITH EXACT VALID & DISCARD COUNTS PER PROVIDER ──
    const validCountByProvider: Record<string, number> = {};
    filteredJobs.forEach(j => {
      const src = j.sourcePlatform || j.provider || 'Desconhecido';
      validCountByProvider[src] = (validCountByProvider[src] || 0) + 1;
    });

    diagnostics.forEach(diag => {
      const valid = validCountByProvider[diag.name] || 0;
      diag.validJobsAfterNorm = valid;
      diag.discardedCount = Math.max(0, diag.rawJobsReturned - valid);
      diag.discardReasons = {
        duplicates: Math.max(0, diag.rawJobsReturned - valid),
        staleOrEmpty: 0
      };
    });

    // ── 5. LOG DIAGNOSTICS SUMMARY ──
    console.log(`
========== AGGREGATOR DIAGNOSTICS ==========
Connectors executed: ${diagnostics.length}
Successful: ${diagnostics.filter(d => d.status === 'ok').length}
No results: ${diagnostics.filter(d => d.status === 'no_results').length}
No key: ${diagnostics.filter(d => d.status === 'no_key').length}
Failed: ${diagnostics.filter(d => d.status === 'failed').length}
Timeout: ${diagnostics.filter(d => d.status === 'timeout').length}

Per provider:
${diagnostics.map(d => `  ${d.status === 'ok' ? '✔' : '✖'} ${d.name} (${d.tier}): ${d.status} | ${d.rawJobsReturned} raw | ${d.validJobsAfterNorm} valid | ${d.discardedCount} discarded | ${d.responseTimeMs}ms${d.errorType ? ` | ${d.errorType}` : ''}`).join('\n')}

Raw jobs: ${totalCount}
After normalization: ${normalizedJobs.length} (${duplicatesRemoved} duplicates removed)
After geo filter: ${filteredJobs.length}
Total time: ${Date.now() - requestStartTime}ms
=============================================
    `);

    // Log aggregated stats
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'aggregator_completed', 'Aggregator', 'completed', {
      connectors_run: diagnostics.length,
      connectors_ok: diagnostics.filter(d => d.status === 'ok').length,
      connectors_failed: diagnostics.filter(d => d.status === 'failed' || d.status === 'timeout').length,
      connectors_no_key: diagnostics.filter(d => d.status === 'no_key').length,
      raw_jobs: totalCount,
      normalized_jobs: normalizedJobs.length,
      duplicates_removed: duplicatesRemoved,
      geo_filtered: normalizedJobs.length - filteredJobs.length,
      final_jobs: filteredJobs.length,
      total_time_ms: Date.now() - requestStartTime,
      intent_family: intent.family
    });

    const finalResponse = {
      count: filteredJobs.length,
      results: filteredJobs,
      diagnostics
    };

    // ── 6. SAVE TO CACHE ──
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
