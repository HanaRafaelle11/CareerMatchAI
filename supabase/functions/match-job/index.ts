import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mock-gemini',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

async function fetchWithRetry(url: string, options: any, maxRetries = 3, initialDelay = 1000): Promise<Response> {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[GEMINI RETRY] Tentativa ${attempt} falhou com status ${response.status}. Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[GEMINI RETRY] Tentativa ${attempt} falhou com erro de rede: ${err.message}. Aguardando ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error(`Falha no processamento com Gemini após ${maxRetries} tentativas.`);
}

async function checkRateLimit(supabaseClient: any, userId: string, feature: string) {
  if (!userId) return;
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

class JobMatchingEngine {
  static async matchWithGemini(careerProfile: any, jobTitle: string, jobDescription: string, supabaseClient: any, userId: string, mockEnabled = false): Promise<any> {
    await checkRateLimit(supabaseClient, userId, 'job-matching');

    if (mockEnabled) {
      console.log("[GEMINI] Simulação ativa para testes.");
      
      // Registrar log de IA mockado
      await logAiUsage(supabaseClient, userId, 'job-matching', 'gemini-2.5-flash-mock', 100, 200);

      return {
        match_score: 85,
        strengths: ["Ponto forte técnico ou comportamental mock"],
        weaknesses: ["Ponto fraco ou gap identificado mock"],
        missing_keywords: ["SQL", "Data Analysis"],
        interview_probability: 75,
        recommendation: "Recomendação mock de preparação para entrevista."
      };
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não configurada nos segredos do Supabase.");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `
      Você é o motor de match semântico e recrutador automatizado do CareerMatch AI.
      Sua tarefa é analisar a compatibilidade (Match) entre o Perfil de Carreira (CareerProfile) do candidato e os requisitos da vaga (Job Description).
      
      INSTRUÇÕES IMPORTANTES:
      - Realize uma análise semântica robusta de adequação técnica, comportamental e de nível de experiência.
      - Retorne estritamente um objeto JSON válido correspondente ao JSON Schema especificado abaixo.

      JSON Schema de Saída:
      {
        "match_score": 85,
        "strengths": ["Ponto forte técnico ou comportamental 1", "Ponto forte 2"],
        "weaknesses": ["Ponto fraco ou gap identificado 1", "Ponto fraco 2"],
        "missing_keywords": ["Palavra-chave ou competência ausente 1", "Palavra-chave 2"],
        "interview_probability": 75,
        "recommendation": "Recomendação detalhada de como o candidato pode otimizar seu currículo ou se preparar para a entrevista."
      }

      Perfil do Candidato:
      ${JSON.stringify(careerProfile, null, 2)}

      Dados da Vaga:
      Título: ${jobTitle}
      Descrição/Requisitos:
      """
      ${jobDescription}
      """
    `;

    console.log("[GEMINI] Comparando currículo e vaga com Gemini 2.5 Flash...");
    const response = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na chamada da API do Gemini: ${response.statusText} - ${errText}`);
    }

    const resJson = await response.json();
    const extractedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) {
      throw new Error("Resposta do Gemini vazia ou em formato incorreto.");
    }

    const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
    await logAiUsage(supabaseClient, userId, 'job-matching', 'gemini-2.5-flash', promptTokens, candidatesTokens);

    return JSON.parse(extractedText);
  }

  static async saveJobMatch(supabaseClient: any, userId: string, resumeVersionId: string, jobId: string, matchResult: any) {
    const { data, error } = await supabaseClient
      .from('job_matches')
      .insert({
        user_id: userId,
        resume_version_id: resumeVersionId,
        job_id: jobId,
        match_score: matchResult.match_score,
        strengths: matchResult.strengths || [],
        weaknesses: matchResult.weaknesses || [],
        missing_keywords: matchResult.missing_keywords || [],
        interview_probability: matchResult.interview_probability,
        recommendation: matchResult.recommendation
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar match de vaga: ${error.message}`);
    }
    return data;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { resumeId, resumeVersionId, jobId, userId: requestUserId, mockGemini } = await req.json()
    console.log("[MATCH JOB REQUEST] Recebido pedido:", { resumeId, resumeVersionId, jobId, mockGemini })
    
    const resolvedVersionId = resumeVersionId || resumeId;
    console.log("[MATCH JOB RESUME VERSION] Resolving for resume version ID:", resolvedVersionId);

    if ((!resumeId && !resumeVersionId) || !jobId) {
      return new Response(
        JSON.stringify({ error: 'Os parâmetros resumeId (ou resumeVersionId) e jobId são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''
    const isMockEnabled = mockGemini === true || req.headers.get('x-mock-gemini') === 'true'

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 1. Obter o perfil de carreira estruturado do candidato
    let careerProfile = null;
    if (resumeVersionId) {
      const { data, error } = await supabaseClient
        .from('career_profiles')
        .select('*')
        .eq('resume_version_id', resumeVersionId)
        .maybeSingle();
      if (error) throw error;
      careerProfile = data;
    } else if (resumeId) {
      const { data, error } = await supabaseClient
        .from('career_profiles')
        .select('*')
        .eq('id', resumeId)
        .maybeSingle();
      if (error) throw error;
      careerProfile = data;
      
      // Fallback: tentar buscar por resume_version_id igual ao resumeId
      if (!careerProfile) {
        const { data: fbData } = await supabaseClient
          .from('career_profiles')
          .select('*')
          .eq('resume_version_id', resumeId)
          .maybeSingle();
        careerProfile = fbData;
      }
    }

    if (!careerProfile) {
      return new Response(
        JSON.stringify({ error: 'Perfil de carreira (CareerProfile) correspondente não encontrado. Certifique-se de que o currículo foi analisado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("[MATCH JOB PROFILE FOUND] Profile ID:", careerProfile.id, "Resume Version ID:", careerProfile.resume_version_id);

    // 2. Obter a descrição da vaga
    const { data: jobData, error: jobErr } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobErr || !jobData) {
      return new Response(
        JSON.stringify({ error: `Vaga não encontrada: ${jobErr?.message || 'ID inválido'}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Executar o match semântico no Gemini 2.5 Flash
    const userId = requestUserId || careerProfile.user_id;
    const matchResult = await JobMatchingEngine.matchWithGemini(
      careerProfile,
      jobData.title,
      jobData.description,
      supabaseClient,
      userId,
      isMockEnabled
    );

    console.log("[MATCH JOB RESULT] Match calculated:", matchResult);

    // 4. Salvar o resultado na tabela job_matches
    const savedMatch = await JobMatchingEngine.saveJobMatch(
      supabaseClient,
      userId,
      careerProfile.resume_version_id || resolvedVersionId,
      jobId,
      matchResult
    );

    console.log(`[EDGE FUNCTION] Match concluído e salvo com sucesso. Score: ${matchResult.match_score}%`);

    return new Response(
      JSON.stringify(savedMatch),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`[EDGE FUNCTION] Erro ao calcular match:`, error)
    
    let code = "AI_ERROR";
    let userMessage = "Ocorreu um erro no cálculo de compatibilidade da vaga.";
    let retryable = true;
    
    if (error.message?.includes('Limit') || error.message?.includes('excedido')) {
      code = "RATE_LIMIT_EXCEEDED";
      userMessage = "Limite de requisições excedido. Você pode fazer no máximo 10 chamadas para 'job-matching' por hora.";
      retryable = false;
    } else if (error.message?.includes('GEMINI_API_KEY')) {
      code = "API_NOT_CONFIGURED";
      userMessage = "O motor de inteligência artificial Gemini não está configurado nos segredos do Supabase.";
      retryable = false;
    } else if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
      code = "AI_TIMEOUT";
      userMessage = "A requisição para o Gemini demorou mais do que o esperado. Tente novamente.";
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userMessage, 
        errorDetails: { 
          code, 
          userMessage, 
          retryable, 
          details: error.message 
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
