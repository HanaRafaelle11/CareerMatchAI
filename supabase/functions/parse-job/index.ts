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
        console.warn(`[GEMINI RETRY] Tentativa ${attempt} falhou com status ${response.status}. Aguardando ${delays[attempt - 1] || 10000}ms...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 10000));
        continue;
      }
      return response;
      
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[GEMINI RETRY] Tentativa ${attempt} falhou com erro de rede: ${err.message}. Aguardando ${delays[attempt - 1] || 10000}ms...`);
      await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 10000));
    }
  }
  throw new Error(`Falha no processamento com Gemini após ${maxRetries} tentativas.`);
}

async function logAiUsage(supabaseClient: any, userId: string, feature: string, model: string, inputTokens: number, outputTokens: number) {
  const estimatedCost = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);
  const { error } = await supabaseClient
    .from('ai_usage_logs')
    .insert({
      user_id: userId || null,
      feature,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimatedCost
    });

  if (error) {
    console.error(`[AI LOG] Erro ao salvar log de uso:`, error);
  }
}

async function callGeminiWithFallback(
  contents: any[],
  geminiApiKey: string,
  responseMimeType: string | undefined = undefined
): Promise<{ resJson: any; selectedModel: string }> {
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[GEMINI FALLBACK HELPER] Tentando modelo: ${model}...`);
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      const response = await fetchWithRetry(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            ...(responseMimeType ? { responseMimeType } : {})
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro na API (${response.status} ${response.statusText}): ${errText}`);
      }

      const resJson = await response.json();
      console.log(`[GEMINI FALLBACK HELPER] Sucesso com o modelo: ${model}!`);
      return { resJson, selectedModel: model };
    } catch (err: any) {
      console.warn(`[GEMINI FALLBACK HELPER] Falha ao usar modelo ${model}:`, err.message || err);
      lastError = err;
    }
  }
  throw new Error(`Falha em todos os modelos do Gemini. Último erro: ${lastError?.message || lastError}`);
}

function cleanHTML(html: string): string {
  // Remoção agressiva de scripts, estilos e tags de navegação para manter o corpo pequeno
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Strip all HTML tags but keep basic text structure
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // Colapsar espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Limitar a 8000 caracteres para evitar overflow de tokens
  if (cleaned.length > 8000) {
    cleaned = cleaned.substring(0, 8000) + '... [conteúdo truncado]';
  }
  
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  let resolvedUserId: string | null = null;
  let supabaseClient: any = null;

  try {
    const { type, url, fileBase64 } = await req.json()
    console.log("[PARSE JOB REQUEST] Recebido pedido:", { type, url: url ? url.substring(0, 50) : null })

    if (!type || (type === 'url' && !url) || (type === 'pdf' && !fileBase64)) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não está configurada.");
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    resolvedUserId = user?.id;

    if (!resolvedUserId) {
      throw new Error("Usuário não pôde ser autenticado.");
    }

    let contents = [];
    let promptText = "";

    if (type === 'url') {
      // Baixar conteúdo do HTML no servidor (CORS-free)
      console.log(`[PARSE JOB] Baixando HTML da URL: ${url}`);
      
      const fetchResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      if (!fetchResponse.ok) {
        throw new Error(`Falha ao baixar conteúdo da URL: Código ${fetchResponse.status}`);
      }

      const html = await fetchResponse.text();
      const text = cleanHTML(html);

      promptText = `Você é uma inteligência artificial especialista em recrutamento e seleção de tecnologia. Seu papel é analisar o conteúdo textual de uma vaga de emprego e extrair todas as informações de forma estruturada.

Extraia as seguintes informações:
- title (Título do cargo)
- company_name (Nome da empresa. Se não encontrar, retorne "Inserida Manualmente" ou "Não Informada")
- description (Descrição geral da vaga, responsabilidades e atribuições)
- requirements (Array de strings contendo stacks técnicas, ferramentas e requisitos essenciais)
- benefits (Array de strings contendo benefícios do plano de contratação)
- location (Localização da vaga. Ex: "São Paulo, SP" ou "Remoto")
- work_mode (String literal de preferência: "remote", "hybrid" ou "onsite")
- seniority (String literal: "junior", "pleno", "senior", "lead" ou "director")
- salary (Descrição textual simples da remuneração)
- salary_numeric (Valor numérico estimado mensal, caso aplicável. Ex: R$ 15000 -> 15000)

Retorne OBRIGATORIAMENTE um objeto JSON correspondente a esta estrutura de forma limpa, sem tags de markdown adicionais ou formatações como \`\`\`json.

Conteúdo da vaga extraído:
${text}`;

      contents = [{
        parts: [{ text: promptText }]
      }];

    } else if (type === 'pdf') {
      console.log("[PARSE JOB] Enviando documento PDF para extração via Gemini API...");
      
      promptText = `Você é uma inteligência artificial especialista em recrutamento e seleção de tecnologia. Analise este documento PDF de vaga e extraia todas as informações de forma estruturada.

Extraia as seguintes informações:
- title (Título do cargo)
- company_name (Nome da empresa. Se não encontrar, retorne "Inserida Manualmente")
- description (Descrição geral da vaga, responsabilidades e atribuições)
- requirements (Array de strings contendo stacks técnicas, ferramentas e requisitos essenciais)
- benefits (Array de strings contendo benefícios do plano de contratação)
- location (Localização da vaga. Ex: "São Paulo, SP" ou "Remoto")
- work_mode (String literal de preferência: "remote", "hybrid" ou "onsite")
- seniority (String literal: "junior", "pleno", "senior", "lead" ou "director")
- salary (Descrição textual simples da remuneração)
- salary_numeric (Valor numérico estimado mensal, caso aplicável)

Retorne OBRIGATORIAMENTE um objeto JSON correspondente a esta estrutura de forma limpa, sem tags de markdown adicionais ou formatações como \`\`\`json.`;

      contents = [{
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: fileBase64
            }
          },
          { text: promptText }
        ]
      }];
    }

    const { resJson, selectedModel } = await callGeminiWithFallback(contents, geminiApiKey, 'application/json');
    const resultText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("Gemini retornou um resultado vazio.");
    }

    let parsedResult;
    try {
      // Limpeza de possíveis marcadores markdown adicionais inseridos
      const cleanJsonText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJsonText);
    } catch (parseErr) {
      console.error("[PARSE JOB JSON ERROR] Falha ao parsear retorno do Gemini:", resultText);
      throw new Error("Falha ao estruturar a resposta do Gemini em formato JSON válido.");
    }

    // Logar uso de tokens no cost center
    const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
    const outputTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
    await logAiUsage(supabaseClient, resolvedUserId, 'parse-job', selectedModel, promptTokens, outputTokens);

    return new Response(
      JSON.stringify(parsedResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[EDGE FUNCTION parse-job] Erro geral:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Falha ao processar a importação de vaga.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
