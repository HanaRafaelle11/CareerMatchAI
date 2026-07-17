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
import { type JobIntent } from "./connectors/BaseJobConnector.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

// Classify query intent using Gemini
async function classifyIntentWithGemini(
  keyword: string,
  geminiApiKey: string
): Promise<JobIntent> {
  const systemPrompt = `You are a career search intent parser. Analyze the user's search query and output a JSON object classifying the intent.
The response must be valid JSON matching this schema:
{
  "family": "The job family or category name (e.g., 'Customer Success', 'Software Engineering')",
  "primary_titles": ["The most common/standard exact titles for this role (e.g., ['Customer Success Manager', 'Customer Success Specialist'])"],
  "secondary_titles": ["Alternative titles, synonyms, related roles, abbreviations, or specialized variants (e.g., ['CSM', 'Client Success', 'Onboarding Specialist', 'Implementation Consultant', 'Customer Success Engineer'])"],
  "skills": ["Key skills, tags, tools, or methodologies associated with this role (e.g., ['CRM', 'NPS', 'CSAT', 'Retention', 'Onboarding'])"]
}
Do not include any explanation, backticks, or markdown formatting, just the raw JSON.`;

  const prompt = `${systemPrompt}\n\nQuery: "${keyword}"\nOutput JSON:`;

  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[INTENT GEMINI] Trying model: ${model}...`);
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      
      const response = await fetchWithRetry(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const resJson = await response.json();
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");

      const intent: JobIntent = JSON.parse(text.trim());
      console.log(`[INTENT GEMINI] Resolved job family: ${intent.family}`);
      return intent;
    } catch (err: any) {
      console.warn(`[INTENT GEMINI] Model ${model} failed:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`Failed to classify intent with Gemini: ${lastError?.message || lastError}`);
}

// Fallback classifier in case of Gemini failures
function getFallbackIntent(keyword: string): JobIntent {
  return {
    family: keyword,
    primary_titles: [keyword],
    secondary_titles: [],
    skills: []
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

    // ── 1.5. ENVIAR KEYWORD AO GEMINI PARA MAPEAMENTO DE INTENÇÃO SEMÂNTICA ──
    let intent: JobIntent;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.warn("[search-jobs] GEMINI_API_KEY is not set. Falling back to simple keyword matching.");
      intent = getFallbackIntent(searchKeyword);
    } else {
      try {
        intent = await classifyIntentWithGemini(searchKeyword, geminiApiKey);
      } catch (geminiErr) {
        console.error("[search-jobs] Gemini classification failed:", geminiErr.message);
        intent = getFallbackIntent(searchKeyword);
      }
    }

    // ── 2. INICIAR BUSCA PARALELA EM PROVEDORES ──
    let rawJobsList: any[] = [];

    const promises = ACTIVE_CONNECTORS.map(async (connector) => {
      const start = Date.now();
      await logAnalyticsEvent(supabaseClient, resolvedUserId, 'provider_started', connector.platformName, 'started', { keyword: searchKeyword });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

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

    // ── 3. AGREGADOR INTELIGENTE (NORMALIZAÇÃO, DEDUPLICAÇÃO & SCORING SEMÂNTICO) ──
    const normalizedJobs = aggregateAndNormalizeJobs(rawJobsList, intent, searchLocation);
    const duplicatesRemoved = totalCount - normalizedJobs.length;

    // ── 3.5. FILTRO GEOGRÁFICO — Priorizar Brasil quando localização brasileira ──
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
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_intent_classified', 'Aggregator', 'completed', { family: intent.family });
    await logAnalyticsEvent(supabaseClient, resolvedUserId, 'jobs_geo_filtered', 'Aggregator', 'completed', { before: normalizedJobs.length, after: filteredJobs.length, location: searchLocation });
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
