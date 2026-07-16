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

async function callGeminiWithFallback(
  contents: any[],
  geminiApiKey: string,
  responseMimeType: string | undefined = undefined,
  responseSchema: any | undefined = undefined
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
            ...(responseMimeType ? { responseMimeType } : {}),
            ...(responseSchema ? { responseSchema } : {})
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

async function updateSimulationMetrics(
  supabaseClient: any,
  simulationId: string,
  promptTokens: number,
  candidatesTokens: number,
  durationSeconds?: number
) {
  const cost = (promptTokens * 0.000000075) + (candidatesTokens * 0.0000003);

  // Busca valores antigos
  const { data: current } = await supabaseClient
    .from('interview_simulations')
    .select('tokens_used, estimated_cost')
    .eq('id', simulationId)
    .single();

  const totalTokens = (current?.tokens_used || 0) + promptTokens + candidatesTokens;
  const totalCost = Number(current?.estimated_cost || 0) + cost;

  const updatePayload: any = {
    tokens_used: totalTokens,
    estimated_cost: totalCost
  };

  if (durationSeconds !== undefined) {
    updatePayload.duration_seconds = durationSeconds;
  }

  await supabaseClient
    .from('interview_simulations')
    .update(updatePayload)
    .eq('id', simulationId);
}

async function logAiTelemetryAndActivity(
  supabaseClient: any,
  userId: string,
  actionType: string,
  promptTokens: number,
  candidatesTokens: number,
  durationMs: number,
  edgeFunctionName: string,
  errorOccurred = false
) {
  const cost = (promptTokens * 0.000000075) + (candidatesTokens * 0.0000003);

  try {
    // 1. Inserir na tabela ai_telemetry
    await supabaseClient
      .from('ai_telemetry')
      .insert({
        user_id: userId,
        action_type: actionType,
        duration_ms: durationMs,
        latency_ms: durationMs,
        input_tokens: promptTokens,
        output_tokens: candidatesTokens,
        estimated_cost: cost,
        edge_function_name: edgeFunctionName,
        failures_count: errorOccurred ? 1 : 0,
        retries_count: 0
      });

    // 2. Inserir na tabela ai_usage_logs (para compatibilidade com créditos da IA)
    await supabaseClient
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        feature: actionType === 'finalize' ? 'simulation' : 'simulation_turn',
        model: 'gemini-1.5-flash',
        input_tokens: promptTokens,
        output_tokens: candidatesTokens,
        estimated_cost: cost
      });

    // 3. Inserir na timeline global (activity_logs)
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        event_type: actionType === 'finalize' ? 'simulation_completed' : 'simulation_started',
        entity: 'interview_simulations',
        metadata: {
          detail: actionType === 'finalize' 
            ? 'Entrevista simulada concluída com relatório consolidado.' 
            : 'Simulação de entrevista com a Mariana iniciada.',
          tokens: promptTokens + candidatesTokens,
          cost
        }
      });
  } catch (e) {
    console.error('[Telemetry Deno] Falha ao registrar telemetria:', e.message || e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    const { action, applicationId, simulationId, chatHistory, candidateResponse } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não configurada nos segredos do Supabase.");
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // 1. Carrega dados de contexto (Candidatura, Vaga, Currículo/Perfil do Usuário)
    const { data: app, error: appError } = await supabaseClient
      .from('applications')
      .select('job_id, user_id')
      .eq('id', applicationId)
      .single();

    if (appError || !app) {
      throw new Error(`Candidatura não localizada: ${appError?.message || 'id inexistente'}`);
    }

    // Busca Vaga
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', app.job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Dados da vaga não localizados: ${jobError?.message || 'id inexistente'}`);
    }

    // Busca Perfil de Carreira (Novo)
    const { data: profile } = await supabaseClient
      .from('career_profiles')
      .select('*')
      .eq('user_id', app.user_id)
      .maybeSingle();

    const contextResume = profile ? {
      summary: profile.summary,
      skills: profile.skills || [],
      soft_skills: profile.soft_skills || [],
      experience: profile.experience || [],
      education: profile.education || [],
      certifications: profile.certifications || []
    } : null;

    const contextJob = {
      title: job.title,
      company: job.company_name || 'Empresa Confidencial',
      description: job.description,
      requirements: job.requirements || [],
      seniority: job.seniority || 'Sênior',
      workMode: job.work_mode || 'Remoto'
    };

    if (action === 'start') {
      const prompt = `
        Você é **Mariana**, uma recrutadora sênior com mais de 12 anos de experiência em processos seletivos de grandes empresas como Google, Nubank, Amazon e Mercado Livre. Você conduz entrevistas no estilo STAR (Situação, Tarefa, Ação, Resultado) com naturalidade e empatia.
        
        **Seu comportamento:**
        - Fale como uma pessoa real, não como um chatbot ou avaliador automático.
        - Use linguagem profissional mas calorosa. O candidato deve esquecer que está falando com uma IA.
        - Faça perguntas de acompanhamento naturais quando a resposta for vaga.
        - Adapte o nível de dificuldade ao perfil do candidato.
        - NUNCA mencione que você é uma IA, modelo de linguagem ou simulador.
        
        Vaga de interesse:
        ${JSON.stringify(contextJob, null, 2)}
        
        Currículo do candidato:
        ${JSON.stringify(contextResume, null, 2)}
        
        Gere uma mensagem de boas-vindas pessoal e calorosa, apresentando-se como Mariana, especialista em recrutamento para a área da vaga. Cite o nome do candidato (${profile?.personal?.fullName || 'Candidato(a)'}), a vaga de interesse e faça a PRIMEIRA PERGUNTA focada nos requisitos da vaga e no perfil do candidato.
        
        Retorne estritamente o JSON Schema especificado:
        {
          "nextQuestion": "Mensagem de boas-vindas + primeira pergunta..."
        }
      `;

      const contents = [{ parts: [{ text: prompt }] }];
      const responseSchema = {
        type: "OBJECT",
        properties: {
          nextQuestion: { type: "STRING" }
        },
        required: ["nextQuestion"]
      };

      const { resJson } = await callGeminiWithFallback(contents, geminiApiKey, "application/json", responseSchema);
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta de início vazia do Gemini.");

      const result = JSON.parse(text);

      const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
      const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
      
      const durationMs = Date.now() - startTime;
      
      if (simulationId) {
        await updateSimulationMetrics(supabaseClient, simulationId, promptTokens, candidatesTokens);
      }
      await logAiTelemetryAndActivity(supabaseClient, app.user_id, 'start', promptTokens, candidatesTokens, durationMs, 'simulate-interview');

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'next') {
      const prompt = `
        Você é **Mariana**, uma recrutadora sênior conduzindo uma entrevista simulada no formato STAR. Mantenha seu personagem: fale como uma pessoa real, profissional mas calorosa. NUNCA mencione que é uma IA.
        
        **Comportamento Adaptativo & Memória:**
        - Mantenha a memória completa dos turnos e do contexto do candidato.
        - Ajuste a dificuldade:
          * Resposta excelente/técnica avançada ➔ Pergunta futura de maior dificuldade (stakeholders, cenários reais de conflito).
          * Resposta superficial/evasiva ➔ Faça probing, reformule a pergunta ou solicite exemplos práticos reais do método STAR.
          * Se o candidato falar sobre gestão, explore conflitos. Se sobre produto, explore métricas. Se sobre Customer Success, explore churn/NPS.
        - Na "nextQuestion", reaja à resposta anterior de forma natural antes de fazer a próxima pergunta.
        
        Vaga:
        ${JSON.stringify(contextJob, null, 2)}
        
        Perfil do Candidato:
        ${JSON.stringify(contextResume, null, 2)}
        
        Histórico completo da entrevista até agora:
        ${JSON.stringify(chatHistory, null, 2)}
        
        Resposta submetida pelo candidato agora:
        "${candidateResponse}"
        
        Retorne estritamente o seguinte JSON Schema:
        {
          "score": 85,
          "star": {
            "situation": "Mapeamento se explicou a Situação ou se foi omitido",
            "task": "Mapeamento se explicou a Tarefa/Desafio ou se foi omitido",
            "action": "Mapeamento se descreveu as Ações diretas tomadas",
            "result": "Mapeamento dos Resultados mensuráveis/métricas obtidas"
          },
          "technicalScore": 80,
          "communicationScore": 85,
          "confidenceScore": 90,
          "clarityScore": 80,
          "positives": ["Ponto forte 1", "Ponto forte 2"],
          "improvements": ["Oportunidade de melhoria 1"],
          "feedback": "Feedback verbal curto, construtivo sobre a resposta",
          "nextQuestion": "Reação natural à resposta anterior + próxima pergunta...",
          "difficulty": "easy ou medium ou hard",
          "interviewerNotes": "Observações internas do recrutador sobre postura ou fit"
        }
      `;

      const contents = [{ parts: [{ text: prompt }] }];
      const responseSchema = {
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          star: {
            type: "OBJECT",
            properties: {
              situation: { type: "STRING" },
              task: { type: "STRING" },
              action: { type: "STRING" },
              result: { type: "STRING" }
            },
            required: ["situation", "task", "action", "result"]
          },
          technicalScore: { type: "INTEGER" },
          communicationScore: { type: "INTEGER" },
          confidenceScore: { type: "INTEGER" },
          clarityScore: { type: "INTEGER" },
          positives: { type: "ARRAY", "items": { type: "STRING" } },
          improvements: { type: "ARRAY", "items": { type: "STRING" } },
          feedback: { type: "STRING" },
          nextQuestion: { type: "STRING" },
          difficulty: { type: "STRING" },
          interviewerNotes: { type: "STRING" }
        },
        required: [
          "score", "star", "technicalScore", "communicationScore", "confidenceScore",
          "clarityScore", "positives", "improvements", "feedback", "nextQuestion",
          "difficulty", "interviewerNotes"
        ]
      };

      const { resJson } = await callGeminiWithFallback(contents, geminiApiKey, "application/json", responseSchema);
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta de turno vazia do Gemini.");

      const result = JSON.parse(text);

      const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
      const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
      const durationMs = Date.now() - startTime;

      if (simulationId) {
        await updateSimulationMetrics(supabaseClient, simulationId, promptTokens, candidatesTokens);
      }
      await logAiTelemetryAndActivity(supabaseClient, app.user_id, 'next', promptTokens, candidatesTokens, durationMs, 'simulate-interview');

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'finalize') {
      const prompt = `
        Você é **Mariana**, recrutadora sênior da Vocentro, e acabou de conduzir uma entrevista completa. Agora precisa compilar um relatório final detalhado, completo e adaptativo para o candidato.
        
        **Diretrizes do relatório:**
        - Seja honesta, técnica e construtiva.
        - Forneça análises de senioridade percebida (junior, pleno, senior, lead).
        - Elabore um Gap Analysis detalhando requisitos da vaga não atendidos e um plano de estudos focado.
        
        Vaga:
        ${JSON.stringify(contextJob, null, 2)}
        
        Histórico completo da entrevista:
        ${JSON.stringify(chatHistory, null, 2)}
        
        Retorne estritamente o seguinte JSON Schema:
        {
          "scoreOverall": 85,
          "jobAdherence": 80,
          "starAnalysis": "Análise consolidada sobre o uso do método STAR pelo candidato...",
          "technicalAnalysis": "Análise de domínio das ferramentas e requisitos técnicos...",
          "communicationAnalysis": "Feedback sobre eloquência, prolixidade ou concisão...",
          "postureAnalysis": "Avaliação comportamental e fit cultural...",
          "clarityAnalysis": "Sobre a clareza na exposição de ideias...",
          "objectivityAnalysis": "Sobre ir direto ao ponto nas respostas...",
          "confidenceAnalysis": "Sobre a segurança ao expor os fatos...",
          "strengths": ["Ponto forte 1", "Ponto forte 2"],
          "weaknesses": ["Gap estrutural 1", "Gap estrutural 2"],
          "bestAnswers": ["Resumo da pergunta onde o candidato se saiu melhor"],
          "worstAnswers": ["Resumo da pergunta onde houve maior lacuna"],
          "improvementPlan": ["Dica 1 de estudo", "Dica 2 para futuras entrevistas"],
          "gapAnalysis": ["Falta de experiência com métrica X", "Conhecimento superficial em Y"],
          "recommendedQuestions": ["Como você lidaria com churn no caso Z?"],
          "seniorityPerceived": "junior ou pleno ou senior ou lead",
          "riskAnalysis": "Mapeamento de riscos de contratação",
          "jobFitComparison": "Comparação direta candidato vs vaga",
          "approvalProbability": 75
        }
      `;

      const contents = [{ parts: [{ text: prompt }] }];
      const responseSchema = {
        type: "OBJECT",
        properties: {
          scoreOverall: { type: "INTEGER" },
          jobAdherence: { type: "INTEGER" },
          starAnalysis: { type: "STRING" },
          technicalAnalysis: { type: "STRING" },
          communicationAnalysis: { type: "STRING" },
          postureAnalysis: { type: "STRING" },
          clarityAnalysis: { type: "STRING" },
          objectivityAnalysis: { type: "STRING" },
          confidenceAnalysis: { type: "STRING" },
          strengths: { type: "ARRAY", "items": { type: "STRING" } },
          weaknesses: { type: "ARRAY", "items": { type: "STRING" } },
          bestAnswers: { type: "ARRAY", "items": { type: "STRING" } },
          worstAnswers: { type: "ARRAY", "items": { type: "STRING" } },
          improvementPlan: { type: "ARRAY", "items": { type: "STRING" } },
          gapAnalysis: { type: "ARRAY", "items": { type: "STRING" } },
          recommendedQuestions: { type: "ARRAY", "items": { type: "STRING" } },
          seniorityPerceived: { type: "STRING" },
          riskAnalysis: { type: "STRING" },
          jobFitComparison: { type: "STRING" },
          approvalProbability: { type: "INTEGER" }
        },
        required: [
          "scoreOverall", "jobAdherence", "starAnalysis", "technicalAnalysis",
          "communicationAnalysis", "postureAnalysis", "clarityAnalysis",
          "objectivityAnalysis", "confidenceAnalysis", "strengths", "weaknesses",
          "bestAnswers", "worstAnswers", "improvementPlan", "gapAnalysis",
          "recommendedQuestions", "seniorityPerceived", "riskAnalysis",
          "jobFitComparison", "approvalProbability"
        ]
      };

      const { resJson } = await callGeminiWithFallback(contents, geminiApiKey, "application/json", responseSchema);
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta de relatório final vazia do Gemini.");

      const result = JSON.parse(text);

      const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
      const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
      const durationMs = Date.now() - startTime;

      if (simulationId) {
        const { data: sim } = await supabaseClient
          .from('interview_simulations')
          .select('created_at')
          .eq('id', simulationId)
          .single();
          
        let duration = 0;
        if (sim?.created_at) {
          duration = Math.round((Date.now() - new Date(sim.created_at).getTime()) / 1000);
        }
        await updateSimulationMetrics(supabaseClient, simulationId, promptTokens, candidatesTokens, duration);
      }
      await logAiTelemetryAndActivity(supabaseClient, app.user_id, 'finalize', promptTokens, candidatesTokens, durationMs, 'simulate-interview');

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Ação inválida ou não especificada: ${action}`);

  } catch (err: any) {
    console.error("[SIMULATE INTERVIEW ERROR]", err.message || err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
