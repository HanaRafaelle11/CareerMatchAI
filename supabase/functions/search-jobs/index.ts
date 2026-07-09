import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { keyword, location, pageNum = 1 } = await req.json();

    const appId = Deno.env.get('ADZUNA_APP_ID');
    const appKey = Deno.env.get('ADZUNA_APP_KEY');

    if (!appId || !appKey) {
      console.error("[JOB SEARCH] Erro: ADZUNA_APP_ID ou ADZUNA_APP_KEY não configurada nos segredos do Supabase.");
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

    const url = `https://api.adzuna.com/v1/api/jobs/br/search/${pageNum}?app_id=${appId}&app_key=${appKey}&results_per_page=15&what=${encodeURIComponent(searchKeyword)}&where=${encodeURIComponent(searchLocation)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao consultar API do Adzuna com status: ${response.status}`);
    }

    const data = await response.json();
    const resultsCount = data.results?.length || 0;

    console.log(`[JOB SEARCH]
query: ${searchKeyword}
location: ${searchLocation}
results: ${resultsCount}`);

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("[JOB SEARCH] Exceção na busca de vagas:", error);
    const msg = "O serviço de busca de vagas está temporariamente fora de serviço. Tente novamente mais tarde.";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: msg, 
        errorDetails: { 
          code: "JOB_SEARCH_UNAVAILABLE", 
          userMessage: msg, 
          retryable: true,
          details: error.message 
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
