import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { callGeminiWithFallbackShared } from "../_shared/geminiModels.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

async function callGeminiWithFallback(
  contents: any[],
  geminiApiKey: string
): Promise<{ resJson: any; selectedModel: string }> {
  return await callGeminiWithFallbackShared(contents, geminiApiKey);
}

async function logAiUsage(supabaseClient: any, userId: string | null, feature: string, model: string, inputTokens: number, outputTokens: number, errorMessage?: string) {
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
        estimated_cost: estimatedCost,
        error_message: errorMessage || null
      });
  } catch (err: any) {
    console.error(`[AI LOG] Erro ao salvar log de uso:`, err.message);
  }
}

async function checkRateLimit(supabaseClient: any, userId: string, feature: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseClient
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error(`[RATE LIMIT] Erro ao verificar limite:`, error);
    return;
  }

  if (count && count >= 10) {
    throw new Error(`Limite de requisições excedido. Você pode fazer no máximo 10 chamadas para '${feature}' por hora.`);
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

    // 1. Verificar Assinatura Premium (Entitlements)
    const { data: sub, error: subErr } = await supabaseClient
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    if (subErr) {
      console.error("[CHAT COPILOT] Erro ao verificar assinatura:", subErr.message);
    }

    const isUserPro = Boolean(sub && (sub.status === 'active' || sub.status === 'trialing'));
    if (!isUserPro) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Acesso negado. Esta funcionalidade é exclusiva para assinantes Premium.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar Rate Limit (máximo 10 chamadas/hora)
    try {
      await checkRateLimit(supabaseClient, user.id, 'copilot-chat');
    } catch (limitErr: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: limitErr.message
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Limitar o histórico aos últimos 12 turnos (6 perguntas do usuário + 6 respostas da IA = 12 mensagens)
    // para evitar crescimento descontrolado de tokens e custos.
    const maxHistoryTurns = 12;
    const historySlice = history.slice(-maxHistoryTurns);

    // Adicionar o histórico de chat do usuário
    for (const h of historySlice) {
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
