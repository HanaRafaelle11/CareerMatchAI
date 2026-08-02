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
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      console.warn(`[GEMINI RETRY] Tentativa ${attempt} falhou com erro de rede: ${err.message}. Aguardando ${delays[attempt - 1] || 10000}ms...`);
      await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 10000));
    }
  }
  throw new Error(`Falha no processamento com Gemini após ${maxRetries} tentativas.`);
}

async function callGeminiWithFallback(
  contents: any[],
  geminiApiKey: string
): Promise<{ resJson: any; selectedModel: string }> {
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite'
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
          contents
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

async function logAiUsage(supabaseClient: any, userId: string, feature: string, model: string, inputTokens: number, outputTokens: number) {
  const estimatedCost = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);
  try {
    await supabaseClient
      .from('ai_usage_logs')
      .insert({
        user_id: userId || null,
        feature,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost: estimatedCost
      });
  } catch (err: any) {
    console.error(`[AI LOG] Erro ao salvar log de uso:`, err.message);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não configurada nos segredos do Supabase.");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não autenticado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { message, history = [], context = {} } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mensagem vazia.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Construir prompt do sistema
    const careerProfile = context.careerProfile || null;
    const activeApplications = context.applications || [];
    const activeJobs = context.jobs || [];

    const systemPrompt = `Você é o Copiloto de Carreira IA do Vocentro (uma plataforma inteligente de recolocação e mentoria de carreira).
Seu objetivo é ajudar o usuário com dúvidas sobre carreira, preparação para processos seletivos, preenchimento do perfil, estratégia de candidaturas e uso da plataforma.

Abaixo está o contexto do candidato para te ajudar a dar respostas personalizadas:
- Perfil de Carreira: ${careerProfile ? JSON.stringify(careerProfile) : 'Não informado/vazio'}
- Candidaturas Ativas: ${JSON.stringify(activeApplications)}
- Vagas Recomendadas/Disponíveis: ${JSON.stringify(activeJobs)}

Regras de Resposta:
1. Seja empático, encorajador, prático e profissional.
2. Escreva respostas concisas (máximo de 2-3 parágrafos curtos) para caberem bem em um chat/drawer lateral de tela.
3. Se a pergunta for vaga (como "onde?", "como?", "o que fazer?"), use o contexto do candidato acima para sugerir ações reais.
   - Exemplo: se perguntar "onde?", aponte vagas recomendadas em nosso painel ou recomende que veja o Kanban de vagas na aba 'Estratégia'.
   - Exemplo: se perguntar "como?", sugira que ele treine perguntas de entrevista com a nossa IA usando a aba 'Coach', ou otimize seu currículo para uma vaga específica na aba 'Vagas & Match'.
4. Responda em Português do Brasil.
`;

    // 2. Montar contents para o Gemini, respeitando o histórico
    const contents: any[] = [];
    
    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nEntendido?` }]
    });
    
    contents.push({
      role: 'model',
      parts: [{ text: 'Entendido perfeitamente! Sou o Copiloto de Carreira do Vocentro e vou responder às dúvidas do candidato com base em seu contexto de forma concisa e prática.' }]
    });

    // Adicionar o histórico de chat do usuário
    for (const h of history) {
      if (h.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: h.text || '' }]
        });
      } else if (h.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: h.text || '' }]
        });
      }
    }

    // Adicionar a última mensagem
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 3. Chamar Gemini
    const { resJson, selectedModel } = await callGeminiWithFallback(contents, geminiApiKey);
    const replyText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!replyText) {
      throw new Error("Não foi possível gerar uma resposta coerente com o Gemini.");
    }

    // Registrar consumo de tokens
    const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
    
    await logAiUsage(supabaseClient, user.id, 'copilot-chat', selectedModel, promptTokens, candidatesTokens);

    return new Response(
      JSON.stringify({ success: true, reply: replyText }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error(`[CHAT COPILOT ERROR]`, err.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro no processamento da conversa.',
        details: err.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
