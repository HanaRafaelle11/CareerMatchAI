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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

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
      // PROMPT DE ABERTURA
      const prompt = `
        Você é o entrevistador inteligente do Vocentro.
        Sua tarefa é iniciar uma entrevista simulada personalizada no formato STAR.
        
        Vaga de interesse:
        ${JSON.stringify(contextJob, null, 2)}
        
        Currículo do candidato:
        ${JSON.stringify(contextResume, null, 2)}
        
        Gere uma mensagem amigável de boas-vindas ao candidato, citando o nome dele (caso conste no currículo: ${profile?.personal?.fullName || ''}), a vaga de interesse e faça a PRIMEIRA PERGUNTA com foco nos requisitos da vaga e no perfil do candidato.
        
        Retorne estritamente o JSON Schema especificado:
        {
          "nextQuestion": "Pergunta de abertura..."
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

      const { resJson, selectedModel } = await callGeminiWithFallback(contents, geminiApiKey, "application/json", responseSchema);
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta de início vazia do Gemini.");

      const result = JSON.parse(text);

      const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
      const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
      if (simulationId) {
        await updateSimulationMetrics(supabaseClient, simulationId, promptTokens, candidatesTokens);
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'next') {
      // PROMPT DE AVALIAÇÃO DE TURNO + PRÓXIMA PERGUNTA
      const prompt = `
        Você é o entrevistador inteligente do Vocentro conduzindo uma entrevista simulada.
        O candidato acabou de responder à pergunta anterior. Sua missão é:
        1. Avaliar a resposta do candidato no formato STAR (Situação, Tarefa, Ação e Resultado).
        2. Gerar pontuações numéricas honestas de 0 a 100 de conformidade técnica, comunicação, confiança e clareza.
        3. Formular a próxima pergunta adaptando-se às respostas anteriores e focando em outros aspectos da vaga e currículo.
        
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
          "nextQuestion": "A próxima pergunta que você fará ao candidato...",
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

      const { resJson, selectedModel } = await callGeminiWithFallback(contents, geminiApiKey, "application/json", responseSchema);
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta de turno vazia do Gemini.");

      const result = JSON.parse(text);

      const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
      const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
      if (simulationId) {
        await updateSimulationMetrics(supabaseClient, simulationId, promptTokens, candidatesTokens);
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'finalize') {
      // PROMPT DE CONSOLIDAÇÃO / RELATÓRIO FINAL
      const prompt = `
        Você é o entrevistador inteligente do Vocentro.
        A simulação de entrevista terminou. Sua tarefa é analisar todo o histórico e compilar um relatório final completo.
        
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
          "strengths": ["Ponto forte consolidado 1", "Ponto forte consolidado 2"],
          "weaknesses": ["Gap estrutural 1", "Gap estrutural 2"],
          "bestAnswers": ["Resumo da pergunta onde o candidato se saiu melhor e o porquê"],
          "worstAnswers": ["Resumo da pergunta onde houve maior lacuna de informações"],
          "improvementPlan": ["Dica 1 de estudo/comportamento", "Dica 2 para futuras entrevistas"],
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
          approvalProbability: { type: "INTEGER" }
        },
        required: [
          "scoreOverall", "jobAdherence", "starAnalysis", "technicalAnalysis",
          "communicationAnalysis", "postureAnalysis", "clarityAnalysis",
          "objectivityAnalysis", "confidenceAnalysis", "strengths", "weaknesses",
          "bestAnswers", "worstAnswers", "improvementPlan", "approvalProbability"
        ]
      };

      const { resJson, selectedModel } = await callGeminiWithFallback(contents, geminiApiKey, "application/json", responseSchema);
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta de relatório final vazia do Gemini.");

      const result = JSON.parse(text);

      const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
      const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
      if (simulationId) {
        // Calcula a duração total
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
