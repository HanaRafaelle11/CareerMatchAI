import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  const delays = [2000, 5000, 10000];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[ADZUNA RETRY] Tentativa ${attempt} falhou com status ${response.status}. Aguardando ${delays[attempt - 1] || 10000}ms...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 10000));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[ADZUNA RETRY] Tentativa ${attempt} falhou com erro: ${err.message}. Aguardando ${delays[attempt - 1] || 10000}ms...`);
      await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 10000));
    }
  }
  throw new Error(`Falha ao conectar à API do Adzuna após ${maxRetries} tentativas.`);
}

async function logApplicationEvent(supabaseClient: any, userId: string | null, eventName: string, service: string, status: string, metadata = {}) {
  if (!supabaseClient) return;
  try {
    await supabaseClient
      .from('application_events')
      .insert({
        user_id: userId || null,
        event_name: eventName,
        service,
        status,
        metadata
      });
  } catch (err) {
    console.error(`[EVENT LOG] Erro ao gravar evento ${eventName}:`, err.message);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  let resolvedUserId: string | null = null;
  let supabaseClient: any = null;

  try {
    const { keyword, location, pageNum = 1, userId } = await req.json();

    const appId = Deno.env.get('ADZUNA_APP_ID');
    const appKey = Deno.env.get('ADZUNA_APP_KEY');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    resolvedUserId = userId || null;
    if (!resolvedUserId && authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) resolvedUserId = user.id;
      } catch (err) {
        console.error("Erro ao resolver usuário no token:", err);
      }
    }

    if (!appId || !appKey) {
      console.error("[JOB SEARCH] Erro: ADZUNA_APP_ID ou ADZUNA_APP_KEY não configurada.");
      
      await logApplicationEvent(supabaseClient, resolvedUserId, 'job_search_failed', 'Adzuna', 'failed', { error: 'API_NOT_CONFIGURED' });

      const msg = "O provedor de busca de vagas Adzuna não está configurado. Configure as credenciais no cofre do Supabase para ativar as buscas.";
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: msg, 
          errorDetails: { 
            code: "API_NOT_CONFIGURED", 
            userMessage: msg, 
            retryable: false 
          } 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchKeyword = keyword || 'React';
    const searchLocation = location || 'Brasil';

    // Registrar início do request de vagas
    await logApplicationEvent(supabaseClient, resolvedUserId, 'job_search_started', 'Adzuna', 'started', { searchKeyword, searchLocation });

    const url = `https://api.adzuna.com/v1/api/jobs/br/search/${pageNum}?app_id=${appId}&app_key=${appKey}&results_per_page=15&what=${encodeURIComponent(searchKeyword)}&where=${encodeURIComponent(searchLocation)}`;

    const response = await fetchWithRetry(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Falha ao consultar API do Adzuna com status: ${response.status}`);
    }

    const data = await response.json();
    const resultsCount = data.results?.length || 0;

    console.log(`[JOB SEARCH SUCCESS] query: ${searchKeyword} | results: ${resultsCount}`);

    // Registrar sucesso da busca de vagas
    await logApplicationEvent(supabaseClient, resolvedUserId, 'job_search_completed', 'Adzuna', 'completed', { searchKeyword, searchLocation, resultsCount });

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("[JOB SEARCH] Exceção na busca de vagas:", error);

    // Registrar falha da busca de vagas
    if (supabaseClient) {
      await logApplicationEvent(supabaseClient, resolvedUserId, 'job_search_failed', 'Adzuna', 'failed', { error: error.message });
    }

    let code = "JOB_SEARCH_UNAVAILABLE";
    let userMessage = "O serviço de busca de vagas está temporariamente fora de serviço. Tente novamente mais tarde.";

    if (error.message?.includes('timeout') || error.message?.includes('fetch') || error.message?.includes('network')) {
      code = "ADZUNA_TIMEOUT";
      userMessage = "A busca de vagas no Adzuna expirou por lentidão da rede. Tente novamente.";
    } else if (error.message?.includes('429') || error.message?.includes('limite') || error.message?.includes('Rate')) {
      code = "ADZUNA_RATE_LIMIT";
      userMessage = "O limite de consultas na API do Adzuna foi atingido. Aguarde alguns instantes.";
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userMessage, 
        errorDetails: { 
          code, 
          userMessage, 
          retryable: true,
          details: error.message 
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
