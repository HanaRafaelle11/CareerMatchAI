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
      return new Response(
        JSON.stringify({ error: "API_NOT_CONFIGURED: As credenciais da API do Adzuna não estão configuradas no Supabase." }),
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
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
