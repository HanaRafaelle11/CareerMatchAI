import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mock-gemini',
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

async function logMatchStep(supabaseClient: any, userId: string, jobId: string, step: string, status: 'running' | 'completed' | 'failed' | 'success' | 'error', durationMs: number) {
  if (!supabaseClient || !userId) return;
  try {
    await supabaseClient
      .from('career_match_logs')
      .insert({
        user_id: userId,
        job_id: jobId || null,
        step,
        duration_ms: durationMs,
        status
      });
  } catch (err) {
    console.error(`[MATCH STEP LOG] Erro ao gravar etapa ${step}:`, err.message);
  }
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

async function computeHash(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
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

async function callGeminiWithFallback(
  prompt: string,
  geminiApiKey: string,
  responseMimeType: string | undefined = undefined
): Promise<{ resJson: any; selectedModel: string }> {
  // Cadeia de modelos Gemini ativos (verificada em agosto/2026).
  // Ordem: primário mais capaz → fallbacks progressivamente mais leves.
  const modelsToTry = [
    'gemini-2.5-flash',       // Modelo Primário (mais capaz e custo-eficiente)
    'gemini-2.0-flash',       // Fallback Secundário
    'gemini-1.5-flash'        // Fallback Terciário (maior disponibilidade)
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
          contents: [{
            parts: [{ text: prompt }]
          }],
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

function calcYearsFromExperiences(experiences: any[]): number {
  if (!experiences || experiences.length === 0) return 0;
  const intervals: [number, number][] = experiences.map(exp => {
    const startVal = exp.startDate ? new Date(exp.startDate).getTime() : new Date('2000-01-01').getTime();
    const endVal = exp.isCurrent || !exp.endDate ? Date.now() : new Date(exp.endDate).getTime();
    const start = isNaN(startVal) ? Date.now() : startVal;
    const end = isNaN(endVal) ? Date.now() : endVal;
    return [start, Math.max(start, end)];
  });
  intervals.sort((a, b) => a[0] - b[0]);
  let merged = 0;
  let curStart = intervals[0][0];
  let curEnd = intervals[0][1];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      merged += curEnd - curStart;
      curStart = s;
      curEnd = e;
    }
  }
  merged += curEnd - curStart;
  const years = Math.round(merged / (1000 * 60 * 60 * 24 * 365));
  return isNaN(years) ? 0 : Math.max(0, years);
}

function buildFlatSkillsFromProfile(profile: any): string[] {
  const names: string[] = [];
  for (const s of profile.skills || []) {
    if (typeof s === 'string') {
      names.push(s.toLowerCase());
    } else if (s && typeof s === 'object' && s.name) {
      names.push(s.name.toLowerCase());
    }
  }
  for (const ss of profile.soft_skills || []) {
    names.push(ss.toLowerCase());
  }
  if (profile.ats_keywords?.existing_keywords) {
    for (const kw of profile.ats_keywords.existing_keywords) {
      names.push(kw.toLowerCase());
    }
  }
  if (profile.ats_keywords?.recommended_keywords) {
    for (const kw of profile.ats_keywords.recommended_keywords) {
      names.push(kw.toLowerCase());
    }
  }
  if (profile.summary) {
    names.push(profile.summary.toLowerCase());
  }
  return [...new Set(names)];
}

const SYNONYM_MAP: Record<string, string[]> = {
  'react': ['react.js', 'reactjs', 'next.js', 'nextjs', 'frontend', 'front-end', 'react native'],
  'typescript': ['ts', 'javascript', 'js', 'ecmascript'],
  'node.js': ['nodejs', 'node', 'express', 'nestjs', 'backend', 'back-end'],
  'postgresql': ['postgres', 'sql', 'mysql', 'banco de dados', 'database', 'supabase'],
  'aws': ['amazon web services', 'cloud', 'aws cloud', 's3', 'ec2', 'lambda'],
  'docker': ['kubernetes', 'containers', 'devops', 'k8s'],
  'python': ['py', 'django', 'flask', 'fastapi'],
  'customer success': [
    'cs', 'customer success management', 'customer success manager', 'csm',
    'customer success operations', 'retenção', 'churn', 'nps', 'csat',
    'health score', 'onboarding', 'customer journey', 'customer experience',
    'cx', 'gestão de contas', 'account management', 'renewals', 'expansion',
    'upsell', 'cross-sell', 'customer retention', 'client success',
    'sucesso do cliente', 'fidelização'
  ],
  'saas': ['software as a service', 'b2b saas', 'enterprise saas', 'plataforma saas', 'produto saas'],
  'nps': ['net promoter score', 'satisfação do cliente', 'pesquisa de satisfação'],
  'churn': ['churn rate', 'taxa de cancelamento', 'retenção', 'retention'],
  'crm': ['salesforce', 'hubspot', 'pipedrive', 'zoho crm', 'dynamics'],
  'gainsight': ['totango', 'planhat', 'churnzero', 'cs platform'],
  'liderança': [
    'gestão de times', 'people management', 'team lead', 'team leader',
    'mentor', 'mentoria', 'lider', 'líder', 'coordenação', 'gerência',
    'gestão de equipe', 'liderou', 'coordenou', 'gerenciou', 'squad lead'
  ],
  'gestão': ['management', 'gerenciamento', 'coordenação', 'administração', 'liderança'],
  'agile': ['ágil', 'scrum', 'kanban', 'sprint', 'metodologia ágil'],
  'okr': ['okrs', 'objetivos e resultados-chave', 'metas', 'kpi', 'kpis'],
  'analytics': ['análise de dados', 'data analysis', 'bi', 'business intelligence', 'tableau', 'power bi', 'looker'],
  'sql': ['postgresql', 'mysql', 'banco de dados', 'queries', 'consultas sql', 'database'],
  'comunicação': ['communication', 'apresentações', 'presentations', 'stakeholders', 'storytelling'],
  'vendas': ['sales', 'comercial', 'revenue', 'receita', 'pipeline', 'prospecção'],
  'enterprise': ['enterprise accounts', 'grandes contas', 'b2b enterprise', 'contas enterprise'],
};

const isValidUUID = (uuid: string) => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
};

class JobMatchingEngine {
  static async matchWithGemini(careerProfile: any, jobTitle: string, jobDescription: string, supabaseClient: any, userId: string, jobId: string, mockEnabled = false, parentStartTime: number): Promise<any> {
    await logMatchStep(supabaseClient, userId, jobId, 'comparing_job', 'running', Date.now() - parentStartTime);
    await checkRateLimit(supabaseClient, userId, 'job-matching');

    const resumeHash = await computeHash(JSON.stringify(careerProfile));
    const jobHash = await computeHash(jobTitle + "\n" + jobDescription);

    if (!mockEnabled) {
      try {
        const nowIso = new Date().toISOString();
        const { data: cachedResult, error: cacheError } = await supabaseClient
          .from('ai_analysis_cache')
          .select('*')
          .eq('resume_hash', resumeHash)
          .eq('job_hash', jobHash)
          .gt('expires_at', nowIso)
          .maybeSingle();

        if (!cacheError && cachedResult) {
          console.log("[CACHE SUCCESS] Resolvido via cache para economizar custo.");
          await logAiUsage(supabaseClient, userId, 'job-matching', 'gemini-2.5-flash-cache', 0, 0);
          await logMatchStep(supabaseClient, userId, jobId, 'comparing_job', 'completed', Date.now() - parentStartTime);
          await logMatchStep(supabaseClient, userId, jobId, 'generating_score', 'completed', Date.now() - parentStartTime);
          return cachedResult.response;
        }
      } catch (cacheErr) {
        console.error("[CACHE ERROR] Erro ao consultar cache de compatibilidade:", cacheErr.message);
      }
    }

    if (mockEnabled) {
      console.log("[GEMINI] Simulação ativa para testes.");
      await logAiUsage(supabaseClient, userId, 'job-matching', 'gemini-2.5-flash-mock', 100, 200);

      const mockResponse = {
        match_score: 85,
        strengths: ["Ponto forte técnico ou comportamental mock"],
        weaknesses: ["Ponto fraco ou gap identificado mock"],
        missing_keywords: ["SQL", "Data Analysis"],
        interview_probability: 75,
        recommendation: "Recomendação mock de preparação para entrevista.",
        to_include: ["Destacar sua experiência prática com análise de dados no resumo.", "Incluir certificação relevante no portfólio."],
        to_exclude: ["Remover competências genéricas como Microsoft Word.", "Reduzir a descrição de projetos muito antigos."],
        skills_to_learn: ["Estudar modelagem relacional de banco de dados.", "Praticar consultas avançadas de SQL."]
      };

      await logMatchStep(supabaseClient, userId, jobId, 'comparing_job', 'completed', Date.now() - parentStartTime);
      await logMatchStep(supabaseClient, userId, jobId, 'generating_score', 'completed', Date.now() - parentStartTime);
      return mockResponse;
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não configurada nos segredos do Supabase.");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `
      Você é o motor de match semântico e recrutador automatizado do Vocentro.
      Sua tarefa é analisar a compatibilidade (Match) entre o Perfil de Carreira (CareerProfile) do candidato e os requisitos da vaga (Job Description).
      
      INSTRUÇÕES IMPORTANTES:
      - Realize uma análise semântica robusta de adequação técnica, comportamental e de nível de experiência.
      - NÃO INVENTE softwares, ferramentas, plataformas ou certificações (ex: Gainsight, HubSpot, Salesforce) que NÃO foram explicitamente citados no texto da vaga. A lista "missing_keywords", "weaknesses" e "skills_to_learn" DEVE se basear ESTRITAMENTE em requisitos expressos no texto da vaga que estão ausentes no perfil do candidato.
      - NÃO atribua scores genéricos de média (como 46% ou 50%) para perfis incompatíveis. Se a área profissional do candidato (ex: Farmácia/Estética) não tiver nenhuma afinidade com a vaga (ex: Software Engineer, Gari, Motorista), o "match_score" DEVE ser muito baixo, entre 0% e 15%.
      - A recomendação verbal ("recommendation"), os pontos fortes ("strengths") e os pontos fracos ("weaknesses") devem estar em total coerência matemática com o "match_score" atribuído. Se a nota de match for baixa (menor que 50%), a lista de pontos fracos/atenção ("weaknesses") DEVE conter mais itens e detalhes do que a lista de pontos fortes. Se a nota for alta (maior que 70%), os pontos fortes ("strengths") devem ser amplamente dominantes.
      - Retorne estritamente um objeto JSON válido correspondente ao JSON Schema especificado abaixo.

      JSON Schema de Saída:
      {
        "match_score": 85,
        "strengths": ["Ponto forte técnico ou comportamental 1", "Ponto forte 2"],
        "weaknesses": ["Ponto fraco ou gap identificado 1", "Ponto fraco 2"],
        "missing_keywords": ["Palavra-chave ou competência ausente 1", "Palavra-chave 2"],
        "interview_probability": 75,
        "recommendation": "Recomendação detalhada de como o candidato pode otimizar seu currículo ou se preparar para a entrevista.",
        "to_include": ["Recomendação 1 de o que destacar ou incluir no currículo"],
        "to_exclude": ["Recomendação 1 de o que excluir ou reduzir do currículo"],
        "skills_to_learn": ["Habilidade 1 que o candidato deve aprender/estudar"]
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

    const { resJson, selectedModel } = await callGeminiWithFallback(prompt, geminiApiKey, 'application/json');

    await logMatchStep(supabaseClient, userId, jobId, 'comparing_job', 'completed', Date.now() - parentStartTime);
    await logMatchStep(supabaseClient, userId, jobId, 'generating_score', 'running', Date.now() - parentStartTime);

    const extractedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) {
      throw new Error("Resposta do Gemini vazia ou em formato incorreto.");
    }

    const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
    await logAiUsage(supabaseClient, userId, 'job-matching', selectedModel, promptTokens, candidatesTokens);

    const matchJson = JSON.parse(extractedText);

    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseClient
        .from('ai_analysis_cache')
        .insert({
          resume_hash: resumeHash,
          job_hash: jobHash,
          response: matchJson,
          expires_at: expiresAt
        });
    } catch (saveCacheErr) {
      console.error("[CACHE SAVE ERROR] Falha ao salvar no cache:", saveCacheErr.message);
    }

    await logMatchStep(supabaseClient, userId, jobId, 'generating_score', 'completed', Date.now() - parentStartTime);
    return matchJson;
  }

  static async saveJobMatch(supabaseClient: any, userId: string, resumeId: string, resumeVersionId: string, jobId: string, matchResult: any, processingTimeMs?: number) {
    const gapAnalysis = {
      missingSkills: matchResult.missing_keywords || [],
      skillsToLearn: matchResult.skills_to_learn || ["Aprofundar os conhecimentos técnicos exigidos na vaga."],
      toIncludeInResume: matchResult.to_include || ["Demonstrar maior relevância em projetos anteriores."],
      toExcludeFromResume: matchResult.to_exclude || ["Evitar dados pessoais excessivos ou informações de cargos irrelevantes."]
    };

    const { data, error } = await supabaseClient
      .from('matches')
      .insert({
        resume_id: resumeId,
        job_id: jobId,
        score_overall: matchResult.match_score,
        score_technical: matchResult.match_score,
        score_behavioral: matchResult.match_score,
        score_seniority: matchResult.match_score,
        explanation: {
          strengths: matchResult.strengths || [],
          weaknesses: matchResult.weaknesses || [],
          details: {
            technical: matchResult.recommendation || '',
            behavioral: `Probabilidade de entrevista: ${matchResult.interview_probability}%`,
            seniority: '',
            salary: '',
            location: ''
          }
        },
        gap_analysis: gapAnalysis,
        processing_time_ms: processingTimeMs
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar match de vaga: ${error.message}`);
    }

    try {
      await supabaseClient
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
          recommendation: matchResult.recommendation,
          processing_time_ms: processingTimeMs
        });
    } catch (dbErr) {
      console.warn("[BACKWARD COMPATIBILITY] Não foi possível espelhar na tabela job_matches:", dbErr.message);
    }

    return data;
  }

  static async optimizeResumeWithGemini(careerProfile: any, jobTitle: string, jobDescription: string, supabaseClient: any, userId: string, resumeId: string, jobId: string, mockEnabled = false): Promise<any> {
    await checkRateLimit(supabaseClient, userId, 'resume-optimization');

    if (mockEnabled) {
      return {
        optimized_summary: "Profissional sênior e estratégico, atuando diretamente em projetos complexos relacionados a " + jobTitle,
        key_experiences: (careerProfile.experience || []).map((exp: any) => ({
          role: exp.role,
          company: exp.companyName || exp.company || "Empresa",
          description: exp.description + " Foco em entregar impacto alinhado a " + jobTitle
        })),
        missing_keywords: ["Desenvolvimento", "Metodologia Ágil"],
        redundant_info: ["Cursos antigos não correlacionados"]
      };
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY não configurada nos segredos do Supabase.");

    const prompt = `
      Você é um especialista em recrutamento executivo e otimização de currículos para ATS (Applicant Tracking Systems).
      Sua tarefa é otimizar o resumo profissional e a reestruturação de experiências do candidato para a vaga-alvo abaixo.

      INSTRUÇÕES ESTRITAS:
      1. RESUMO PROFISSIONAL: Reescreva o resumo profissional destacando alinhamento com a vaga-alvo ("${jobTitle}").
      2. REESTRUTURAÇÃO DE EXPERIÊNCIAS ("key_experiences"): Para CADA experiência listada no perfil do candidato, reescreva a descrição adaptando o vocabulário, terminologia técnica, verbos de ação e foco para a área/domínio da vaga-alvo ("${jobTitle}"). Destaque competências transferíveis relevantes.
      3. REGRA DE INTEGRIDADE: NUNCA invente mentiras, empresas falsas, datas falsas ou cargos falsos. Reframe e reescreva apenas os fatos reais apresentados.

      JSON Schema de Saída:
      {
        "optimized_summary": "Resumo profissional reescrito de forma premium e alinhado à vaga...",
        "key_experiences": [
          {
            "role": "Cargo original real",
            "company": "Empresa original real",
            "description": "Descrição reestruturada com vocabulário e métricas adaptados ao domínio da vaga-alvo"
          }
        ],
        "missing_keywords": ["competência 1 da vaga a destacar", "competência 2"],
        "redundant_info": ["informação irrelevante ao domínio da vaga a reduzir"]
      }

      Perfil do Candidato:
      ${JSON.stringify(careerProfile, null, 2)}

      Vaga-Alvo:
      Título: ${jobTitle}
      Descrição: ${jobDescription}
    `;

    const { resJson, selectedModel } = await callGeminiWithFallback(prompt, geminiApiKey, 'application/json');

    const extractedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) throw new Error("Resposta do Gemini vazia.");

    await logAiUsage(supabaseClient, userId, 'resume-optimization', selectedModel, resJson.usageMetadata?.promptTokenCount || 0, resJson.usageMetadata?.candidatesTokenCount || 0);
    return JSON.parse(extractedText);
  }

  static async generateCoverLetterWithGemini(careerProfile: any, jobTitle: string, companyName: string, jobDescription: string, supabaseClient: any, userId: string, mockEnabled = false): Promise<any> {
    await checkRateLimit(supabaseClient, userId, 'cover-letter');

    if (mockEnabled) {
      return {
        text_formal: `Prezada equipe da ${companyName},\n\nGostaria de expressar meu interesse na vaga de ${jobTitle}...`,
        text_direct: `Olá time da ${companyName},\n\nEstou me candidatando para a vaga de ${jobTitle}...`,
        text_executive: `Prezados executivos da ${companyName},\n\nSubmeto minha candidatura ao cargo de ${jobTitle}...`
      };
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY não configurada nos segredos do Supabase.");

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `
      Você é um redator profissional de carreiras.
      Escreva 3 cartas de apresentação personalizadas (Formal, Direta e Executiva) para a vaga e empresa especificadas abaixo.
      Use o nome real da empresa e do cargo. Se o nome da empresa for genérico ou nulo, use "Equipe de Recrutamento".

      JSON Schema de Saída:
      {
        "text_formal": "Texto formal da carta...",
        "text_direct": "Texto direto e moderno da carta...",
        "text_executive": "Texto executivo e focado em impacto..."
      }

      Perfil do Candidato:
      ${JSON.stringify(careerProfile, null, 2)}

      Vaga:
      Título: ${jobTitle}
      Empresa: ${companyName}
      Descrição: ${jobDescription}
    `;

    const { resJson, selectedModel } = await callGeminiWithFallback(prompt, geminiApiKey, 'application/json');

    const extractedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) throw new Error("Resposta do Gemini vazia.");

    await logAiUsage(supabaseClient, userId, 'cover-letter', selectedModel, resJson.usageMetadata?.promptTokenCount || 0, resJson.usageMetadata?.candidatesTokenCount || 0);
    return JSON.parse(extractedText);
  }

  static async generateInterviewPrepWithGemini(careerProfile: any, jobTitle: string, jobDescription: string, supabaseClient: any, userId: string, mockEnabled = false): Promise<any> {
    await checkRateLimit(supabaseClient, userId, 'interview-prep');

    if (mockEnabled) {
      return {
        introduction: "O método STAR é um padrão comportamental para estruturar respostas em entrevistas.",
        questions: [
          {
            question: "Conte sobre um desafio técnico superado.",
            type: "tecnica",
            expectation: "Espera-se entender sua lógica de resolução.",
            answerStar: {
              context: "Contexto mock...",
              action: "Ação mock...",
              result: "Resultado mock..."
            }
          }
        ]
      };
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY não configurada nos segredos do Supabase.");

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `
      Você é um preparador profissional de entrevistas de emprego.
      Gere 4 perguntas de entrevista (uma de RH, uma Técnica, uma de Gestor e uma de Fit Cultural) para a vaga especificada.
      Adicione uma introdução detalhada explicando a importância do método STAR e como estruturar as respostas.
      Para cada pergunta, adicione o que o entrevistador espera ouvir (expectation) e uma resposta de exemplo realista no formato STAR baseada nas experiências reais do candidato.

      JSON Schema de Saída:
      {
        "introduction": "Introdução detalhada sobre o método STAR e por que os recrutadores utilizam...",
        "questions": [
          {
            "question": "Pergunta...",
            "type": "RH" | "tecnica" | "gestor" | "cultura",
            "expectation": "O que o entrevistador realmente quer avaliar com esta pergunta...",
            "answerStar": {
              "context": "Contexto do seu histórico...",
              "action": "Ação que você tomou...",
              "result": "Resultado quantitativo..."
            }
          }
        ]
      }

      Perfil do Candidato:
      ${JSON.stringify(careerProfile, null, 2)}

      Vaga:
      Título: ${jobTitle}
      Descrição: ${jobDescription}
    `;

    const { resJson, selectedModel } = await callGeminiWithFallback(prompt, geminiApiKey, 'application/json');

    const extractedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) throw new Error("Resposta do Gemini vazia.");

    await logAiUsage(supabaseClient, userId, 'interview-prep', selectedModel, resJson.usageMetadata?.promptTokenCount || 0, resJson.usageMetadata?.candidatesTokenCount || 0);
    return JSON.parse(extractedText);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const requestStartTime = Date.now();
  let resolvedUserId: string | null = null;
  let resolvedJobId: string | null = null;
  let supabaseClient: any = null;

  try {
    const reqBody = await req.json()
    const { resumeId, resumeVersionId, jobId, applicationId, userId: requestUserId, mockGemini, operation = 'match' } = reqBody
    console.log("[MATCH JOB REQUEST] Recebido pedido:", { resumeId, resumeVersionId, jobId, applicationId, mockGemini, operation })
    
    resolvedJobId = jobId;
    const resolvedVersionId = resumeVersionId || resumeId;

    if ((!resumeId && !resumeVersionId) || (!jobId && operation !== 'cover-letter') || (operation === 'cover-letter' && !applicationId)) {
      return new Response(
        JSON.stringify({ error: 'Os parâmetros obrigatórios estão ausentes.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''
    const isMockEnabled = mockGemini === true || req.headers.get('x-mock-gemini') === 'true'

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    resolvedUserId = requestUserId || user?.id;

    if (!resolvedUserId) {
      throw new Error("Usuário não pôde ser autenticado.");
    }

    let resolvedResumeId = resumeId;

    // Se resumeId não foi fornecido mas temos a versão, busca o correspondente na tabela resumes
    if (!resolvedResumeId && resolvedVersionId) {
      console.log(`[MATCH JOB] Tentando resolver resumeId automaticamente para a versão: ${resolvedVersionId}`);
      
      const { data: rvData, error: rvErr } = await supabaseClient
        .from('resume_versions')
        .select('file_url, file_name')
        .eq('id', resolvedVersionId)
        .maybeSingle();

      if (rvErr) {
        throw new Error(`Erro ao buscar versão do currículo: ${rvErr.message}`);
      }

      if (rvData) {
        const { data: resumesList, error: rErr } = await supabaseClient
          .from('resumes')
          .select('id, file_url, file_path')
          .eq('user_id', resolvedUserId);

        if (rErr) {
          throw new Error(`Erro ao mapear currículo pai na tabela resumes: ${rErr.message}`);
        }

        const matchedResume = (resumesList || []).find((r: any) => 
          (r.file_url && r.file_url === rvData.file_url) || 
          (r.file_path && r.file_path === rvData.file_url) || 
          (r.file_path && r.file_path === rvData.file_name)
        );

        if (matchedResume) {
          resolvedResumeId = matchedResume.id;
          console.log(`[MATCH JOB] Mapeamento bem-sucedido! resumeId resolvido: ${resolvedResumeId}`);
        } else {
          if (resumesList && resumesList.length === 1) {
            resolvedResumeId = resumesList[0].id;
            console.log(`[MATCH JOB] Apenas um currículo encontrado. Usando fallback resumeId: ${resolvedResumeId}`);
          } else {
            throw new Error(`Currículo correspondente não encontrado na tabela 'resumes' para a versão ${resolvedVersionId}.`);
          }
        }
      } else {
        throw new Error(`Versão do currículo ${resolvedVersionId} não encontrada na tabela 'resume_versions'.`);
      }
    }

    // 1. Obter o perfil de carreira estruturado do candidato
    let careerProfile = null;
    if (resolvedVersionId) {
      const { data, error } = await supabaseClient
        .from('career_profiles')
        .select('*')
        .eq('resume_version_id', resolvedVersionId)
        .maybeSingle();
      if (error) throw error;
      careerProfile = data;
    }

    if (!careerProfile && resolvedResumeId) {
      const { data: resume, error: resumeErr } = await supabaseClient
        .from('resumes')
        .select('file_name, file_url, user_id')
        .eq('id', resolvedResumeId)
        .maybeSingle();
      
      if (!resumeErr && resume) {
        const { data: rv } = await supabaseClient
          .from('resume_versions')
          .select('id')
          .eq('user_id', resume.user_id)
          .eq('file_url', resume.file_url || '')
          .maybeSingle();
        
        let rvId = rv?.id;
        if (!rvId) {
          const { data: rv2 } = await supabaseClient
            .from('resume_versions')
            .select('id')
            .eq('user_id', resume.user_id)
            .eq('file_name', resume.file_name || '')
            .maybeSingle();
          rvId = rv2?.id;
        }

        if (rvId) {
          const { data: cp, error: cpErr } = await supabaseClient
            .from('career_profiles')
            .select('*')
            .eq('resume_version_id', rvId)
            .maybeSingle();
          if (!cpErr && cp) {
            careerProfile = cp;
          }
        }
      }
    }

    if (!careerProfile) {
      return new Response(
        JSON.stringify({ error: 'Perfil de carreira não encontrado. Por favor, reenvie seu currículo.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Resolver dados da vaga (se aplicável)
    let jobData = null;
    let actualJobId = jobId;

    if (operation === 'cover-letter' && applicationId && !jobId) {
      const { data: appData } = await supabaseClient
        .from('applications')
        .select('job_id, company_name, job_title')
        .eq('id', applicationId)
        .maybeSingle();
      
      if (appData) {
        actualJobId = appData.job_id;
        jobData = {
          title: appData.job_title,
          company_name: appData.company_name,
          description: "Gere uma carta alinhada à empresa."
        };
      }
    }

    // Allow passing job payload directly in request body for transient/discovered jobs
    const bodyJob = reqBody.job || reqBody.jobData || null;

    if (actualJobId && !jobData) {
      const { data, error } = await supabaseClient
        .from('jobs')
        .select('*')
        .eq('id', actualJobId)
        .maybeSingle();
      
      if (data) {
        jobData = data;
      } else if (bodyJob) {
        jobData = {
          id: actualJobId,
          title: bodyJob.title || bodyJob.jobTitle || 'Vaga Sem Título',
          company_name: bodyJob.companyName || bodyJob.company_name || 'Empresa Confidencial',
          description: bodyJob.description || 'Sem descrição detalhada.',
          requirements: bodyJob.requirements || []
        };
      } else {
        throw new Error(`Vaga não encontrada no sistema. Por favor, selecione uma vaga válida.`);
      }
    } else if (!jobData && bodyJob) {
      jobData = {
        title: bodyJob.title || bodyJob.jobTitle || 'Vaga Sem Título',
        company_name: bodyJob.companyName || bodyJob.company_name || 'Empresa Confidencial',
        description: bodyJob.description || 'Sem descrição detalhada.',
        requirements: bodyJob.requirements || []
      };
    }

    if (!jobData && operation !== 'cover-letter') {
      throw new Error("Dados da vaga são necessários para esta operação.");
    }

    // 3. Roteamento por operação
    if (operation === 'match') {
      await logApplicationEvent(supabaseClient, resolvedUserId, 'gemini_request_started', 'Gemini', 'started', { jobId: actualJobId });
      await logMatchStep(supabaseClient, resolvedUserId, actualJobId, 'preparing', 'running', Date.now() - requestStartTime);
      await logMatchStep(supabaseClient, resolvedUserId, actualJobId, 'preparing', 'completed', Date.now() - requestStartTime);
      await logMatchStep(supabaseClient, resolvedUserId, actualJobId, 'analyzing_resume', 'running', Date.now() - requestStartTime);
      await logMatchStep(supabaseClient, resolvedUserId, actualJobId, 'analyzing_resume', 'completed', Date.now() - requestStartTime);

      const matchResult = await JobMatchingEngine.matchWithGemini(
        careerProfile,
        jobData.title,
        jobData.description,
        supabaseClient,
        resolvedUserId,
        actualJobId,
        isMockEnabled,
        requestStartTime
      );

      const savedMatch = await JobMatchingEngine.saveJobMatch(
        supabaseClient,
        resolvedUserId,
        resolvedResumeId,
        careerProfile.resume_version_id || resolvedVersionId,
        actualJobId,
        matchResult,
        Date.now() - requestStartTime
      );

      await logMatchStep(supabaseClient, resolvedUserId, actualJobId, 'completed', 'completed', Date.now() - requestStartTime);
      await logApplicationEvent(supabaseClient, resolvedUserId, 'gemini_request_completed', 'Gemini', 'completed', { jobId: actualJobId, score: matchResult.match_score });

      return new Response(JSON.stringify(savedMatch), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else if (operation === 'optimize-cv') {
      const result = await JobMatchingEngine.optimizeResumeWithGemini(
        careerProfile,
        jobData.title,
        jobData.description,
        supabaseClient,
        resolvedUserId,
        resolvedResumeId,
        actualJobId,
        isMockEnabled
      );

      const toSave = {
        resume_id: resolvedResumeId,
        job_id: actualJobId || null,
        optimized_summary: result.optimized_summary,
        key_experiences: result.key_experiences || [],
        missing_keywords: result.missing_keywords || [],
        redundant_info: result.redundant_info || []
      };

      let savedRecord = null;
      if (isValidUUID(resolvedResumeId)) {
        const { data, error } = await supabaseClient
          .from('resume_optimizations')
          .insert(toSave)
          .select()
          .single();
        if (error) console.error("[OPTIMIZE CV SAVE ERROR]", error.message);
        savedRecord = data;
      }

      return new Response(
        JSON.stringify(savedRecord || { id: "opt-preview-" + Date.now(), resumeId: careerProfile.resume_id, jobId: actualJobId, optimizedSummary: result.optimized_summary, keyExperiences: result.key_experiences, missingKeywords: result.missing_keywords, redundantInfo: result.redundant_info }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (operation === 'cover-letter') {
      const result = await JobMatchingEngine.generateCoverLetterWithGemini(
        careerProfile,
        jobData ? jobData.title : "Vaga",
        jobData ? (jobData.company_name || jobData.companyName || "Empresa") : "Empresa",
        jobData ? jobData.description : "Gere uma carta de apresentação.",
        supabaseClient,
        resolvedUserId,
        isMockEnabled
      );

      const toSave = {
        application_id: applicationId,
        text_formal: result.text_formal,
        text_direct: result.text_direct,
        text_executive: result.text_executive
      };

      let savedRecord = null;
      if (applicationId && isValidUUID(applicationId)) {
        const { data, error } = await supabaseClient
          .from('cover_letters')
          .insert(toSave)
          .select()
          .single();
        if (error) console.error("[COVER LETTER SAVE ERROR]", error.message);
        savedRecord = data;
      }

      return new Response(
        JSON.stringify(savedRecord || { id: "letter-preview-" + Date.now(), applicationId, textFormal: result.text_formal, textDirect: result.text_direct, textExecutive: result.text_executive }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (operation === 'interview-prep') {
      const result = await JobMatchingEngine.generateInterviewPrepWithGemini(
        careerProfile,
        jobData.title,
        jobData.description,
        supabaseClient,
        resolvedUserId,
        isMockEnabled
      );

      const toSave = {
        job_id: actualJobId,
        questions: result
      };

      let savedRecord = null;
      if (actualJobId && isValidUUID(actualJobId)) {
        const { data, error } = await supabaseClient
          .from('interview_preparations')
          .insert(toSave)
          .select()
          .single();
        if (error) console.error("[INTERVIEW PREP SAVE ERROR]", error.message);
        savedRecord = data;
      }

      return new Response(
        JSON.stringify(savedRecord || { id: "prep-preview-" + Date.now(), jobId: actualJobId, questions: result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Operação não suportada: ${operation}`);

  } catch (error) {
    console.error(`[EDGE FUNCTION] Erro geral:`, error)
    
    if (supabaseClient && resolvedUserId) {
      await logApplicationEvent(supabaseClient, resolvedUserId, 'gemini_request_failed', 'Gemini', 'failed', { error: error.message, jobId: resolvedJobId });
    }

    let code = "AI_ERROR";
    let userMessage = "Ocorreu um erro no processamento da IA.";
    let retryable = true;
    
    if (error.message?.includes('Limit') || error.message?.includes('excedido')) {
      code = "RATE_LIMIT_EXCEEDED";
      userMessage = "Limite de requisições excedido. Você pode fazer no máximo 10 chamadas para este recurso por hora.";
      retryable = false;
    } else if (error.message?.includes('GEMINI_API_KEY')) {
      code = "GEMINI_SERVICE_UNAVAILABLE";
      userMessage = "O motor de inteligência artificial Gemini não está configurado.";
      retryable = false;
    } else if (error.message?.includes('timeout') || error.message?.includes('fetch') || error.message?.includes('network')) {
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
