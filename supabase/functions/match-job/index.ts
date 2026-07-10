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

function calcYearsFromExperiences(experiences: any[]): number {
  if (!experiences || experiences.length === 0) return 0;
  const intervals: [number, number][] = experiences.map(exp => {
    const start = exp.startDate ? new Date(exp.startDate).getTime() : new Date('2000-01-01').getTime();
    const end = exp.isCurrent || !exp.endDate ? Date.now() : new Date(exp.endDate).getTime();
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
  return Math.max(0, years);
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

function checkRequirement(req: string, flatSkills: string[], experiences: any[] | null): boolean {
  const reqLower = req.toLowerCase().trim();
  if (flatSkills.includes(reqLower)) return true;
  
  const syns = SYNONYM_MAP[reqLower];
  if (syns && syns.some(s => flatSkills.includes(s.toLowerCase()))) return true;
  
  for (const s of flatSkills) {
    if (s.includes(reqLower) || reqLower.includes(s)) return true;
  }
  
  if (experiences) {
    const needle = reqLower;
    for (const exp of experiences) {
      const haystack = [
        exp.description || '',
        ...(exp.highlights || []),
        exp.role || '',
        exp.companyName || ''
      ].join(' ').toLowerCase();
      if (haystack.includes(needle)) return true;
    }
  }
  return false;
}

function calculateRuleBasedScore(careerProfile: any, job: any): number {
  const flatSkills = buildFlatSkillsFromProfile(careerProfile);
  const experiences = careerProfile.experience ?? null;
  const yearsOfExperience = calcYearsFromExperiences(careerProfile.experience || []);

  let matchedCount = 0;
  const reqs = job.requirements || [];
  reqs.forEach((req: string) => {
    if (checkRequirement(req, flatSkills, experiences)) {
      matchedCount++;
    }
  });

  const scoreTechnical = Math.round((matchedCount / Math.max(reqs.length, 1)) * 100);

  // Behavioral
  const softTerms = [
    ...(careerProfile.soft_skills || []).map((s: string) => s.toLowerCase()),
    ...flatSkills
  ];
  const hasLeadership = softTerms.some(s =>
    s.includes('lider') || s.includes('mentor') || s.includes('liderança') ||
    s.includes('gestão') || s.includes('team lead')
  );
  const hasAgile = softTerms.some(s =>
    s.includes('ágil') || s.includes('agile') || s.includes('scrum')
  );
  const hasComms = softTerms.some(s =>
    s.includes('comun') || s.includes('equipe') || s.includes('trabalho') || s.includes('stakeholder')
  );

  let scoreBehavioral = 70;
  if (hasLeadership) scoreBehavioral += 10;
  if (hasAgile) scoreBehavioral += 10;
  if (hasComms) scoreBehavioral += 10;
  scoreBehavioral = Math.min(scoreBehavioral, 100);

  // Seniority
  const seniorityMap: Record<string, { min: number, max: number }> = {
    'junior': { min: 0, max: 2 },
    'pleno': { min: 2, max: 5 },
    'senior': { min: 5, max: 10 },
    'lead': { min: 7, max: 15 },
    'director': { min: 10, max: 25 }
  };
  const jobSeniority = job.seniority?.toLowerCase() || 'senior';
  const range = seniorityMap[jobSeniority] || { min: 2, max: 5 };
  const exp = yearsOfExperience;

  let scoreSeniority = 100;
  if (exp < range.min) {
    scoreSeniority = Math.max(50, 100 - (range.min - exp) * 20);
  } else if (exp > range.max) {
    scoreSeniority = Math.max(80, 100 - (exp - range.max) * 5);
  }
  scoreSeniority = Math.round(scoreSeniority);

  // Location
  let scoreLocation = 100;
  const workMode = job.work_mode || job.workMode || 'onsite';
  if (workMode === 'onsite' && job.location?.toLowerCase() !== 'remoto') {
    scoreLocation = 75;
  } else if (workMode === 'hybrid') {
    scoreLocation = 85;
  }

  // Salary
  let scoreSalary = 90;
  const salaryExpectation = Number(careerProfile.personal?.preferences?.salaryExpectationMin || 0) || 11000;
  const salaryMin = job.salary_min || job.salaryMin;
  const salaryMax = job.salary_max || job.salaryMax;
  if (salaryMin && salaryExpectation > 0) {
    if (salaryExpectation > salaryMax) {
      scoreSalary = Math.max(50, Math.round(100 - ((salaryExpectation - salaryMax) / salaryMax) * 100));
    } else if (salaryExpectation < salaryMin) {
      scoreSalary = 100;
    } else {
      scoreSalary = 95;
    }
  }

  const scoreOverall = Math.round(
    (scoreTechnical * 0.45) +
    (scoreBehavioral * 0.20) +
    (scoreSeniority * 0.20) +
    (scoreLocation * 0.10) +
    (scoreSalary * 0.05)
  );

  return scoreOverall;
}

class JobMatchingEngine {
  static async matchWithGemini(careerProfile: any, jobTitle: string, jobDescription: string, supabaseClient: any, userId: string, jobId: string, mockEnabled = false, parentStartTime: number): Promise<any> {
    
    // Etapa anterior finalizada e nova iniciada: comparing_job
    await logMatchStep(supabaseClient, userId, jobId, 'comparing_job', 'running', Date.now() - parentStartTime);

    await checkRateLimit(supabaseClient, userId, 'job-matching');

    // 1. Calcular hashes para o Cache
    const resumeHash = await computeHash(JSON.stringify(careerProfile));
    const jobHash = await computeHash(jobTitle + "\n" + jobDescription);

    // 2. Verificar cache se não for mock
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
          
          // Registrar log de IA do cache com 0 tokens
          await logAiUsage(supabaseClient, userId, 'job-matching', 'gemini-2.5-flash-cache', 0, 0);

          // Completar etapas com base no cache
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
      
      // Registrar log de IA mockado
      await logAiUsage(supabaseClient, userId, 'job-matching', 'gemini-2.5-flash-mock', 100, 200);

      const mockResponse = {
        match_score: 85,
        strengths: ["Ponto forte técnico ou comportamental mock"],
        weaknesses: ["Ponto fraco ou gap identificado mock"],
        missing_keywords: ["SQL", "Data Analysis"],
        interview_probability: 75,
        recommendation: "Recomendação mock de preparação para entrevista."
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

    // Completar comparing_job e iniciar generating_score
    await logMatchStep(supabaseClient, userId, jobId, 'comparing_job', 'completed', Date.now() - parentStartTime);
    await logMatchStep(supabaseClient, userId, jobId, 'generating_score', 'running', Date.now() - parentStartTime);

    const resJson = await response.json();
    const extractedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) {
      throw new Error("Resposta do Gemini vazia ou em formato incorreto.");
    }

    const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
    await logAiUsage(supabaseClient, userId, 'job-matching', 'gemini-2.5-flash', promptTokens, candidatesTokens);

    const matchJson = JSON.parse(extractedText);

    // Salvar no cache
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

    // Completar generating_score
    await logMatchStep(supabaseClient, userId, jobId, 'generating_score', 'completed', Date.now() - parentStartTime);

    return matchJson;
  }

  static async saveJobMatch(supabaseClient: any, userId: string, resumeVersionId: string, jobId: string, matchResult: any, processingTimeMs?: number) {
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
        recommendation: matchResult.recommendation,
        processing_time_ms: processingTimeMs
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

  const requestStartTime = Date.now();
  let resolvedUserId: string | null = null;
  let resolvedJobId: string | null = null;
  let supabaseClient: any = null;

  try {
    const { resumeId, resumeVersionId, jobId, userId: requestUserId, mockGemini } = await req.json()
    console.log("[MATCH JOB REQUEST] Recebido pedido:", { resumeId, resumeVersionId, jobId, mockGemini })
    
    resolvedJobId = jobId;
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

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Resolver ID de usuário
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    resolvedUserId = requestUserId || user?.id;

    if (!resolvedUserId) {
      throw new Error("Usuário não pôde ser autenticado no Match.");
    }

    // Registrar inicio de request Gemini
    await logApplicationEvent(supabaseClient, resolvedUserId, 'gemini_request_started', 'Gemini', 'started', { jobId });

    // Etapa: preparing - Iniciada
    await logMatchStep(supabaseClient, resolvedUserId, jobId, 'preparing', 'running', Date.now() - requestStartTime);

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
      
      // Fallback
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
      await logMatchStep(supabaseClient, resolvedUserId, jobId, 'preparing', 'failed', Date.now() - requestStartTime);
      return new Response(
        JSON.stringify({ error: 'Perfil de carreira (CareerProfile) correspondente não encontrado. Certifique-se de que o currículo foi analisado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Etapa: preparing - Concluída e Etapa: analyzing_resume - Iniciada
    await logMatchStep(supabaseClient, resolvedUserId, jobId, 'preparing', 'completed', Date.now() - requestStartTime);
    await logMatchStep(supabaseClient, resolvedUserId, jobId, 'analyzing_resume', 'running', Date.now() - requestStartTime);

    // 2. Obter a descrição da vaga
    const { data: jobData, error: jobErr } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobErr || !jobData) {
      await logMatchStep(supabaseClient, resolvedUserId, jobId, 'analyzing_resume', 'failed', Date.now() - requestStartTime);
      return new Response(
        JSON.stringify({ error: `Vaga não encontrada: ${jobErr?.message || 'ID inválido'}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Etapa: analyzing_resume - Concluída
    await logMatchStep(supabaseClient, resolvedUserId, jobId, 'analyzing_resume', 'completed', Date.now() - requestStartTime);

    // 3. Executar o match semântico no Gemini 2.5 Flash
    const matchResult = await JobMatchingEngine.matchWithGemini(
      careerProfile,
      jobData.title,
      jobData.description,
      supabaseClient,
      resolvedUserId,
      jobId,
      isMockEnabled,
      requestStartTime
    );

    console.log("[MATCH JOB RESULT] Match calculated:", matchResult);

    // Substituir a pontuação com a mesma lógica determinística do frontend
    const finalCalculatedScore = calculateRuleBasedScore(careerProfile, jobData);
    matchResult.match_score = finalCalculatedScore;
    matchResult.interview_probability = finalCalculatedScore;

    // 4. Salvar o resultado na tabela job_matches
    const savedMatch = await JobMatchingEngine.saveJobMatch(
      supabaseClient,
      resolvedUserId,
      careerProfile.resume_version_id || resolvedVersionId,
      jobId,
      matchResult,
      Date.now() - requestStartTime
    );

    // Etapa: completed - Concluída
    await logMatchStep(supabaseClient, resolvedUserId, jobId, 'completed', 'completed', Date.now() - requestStartTime);

    // Registrar sucesso Gemini
    await logApplicationEvent(supabaseClient, resolvedUserId, 'gemini_request_completed', 'Gemini', 'completed', { jobId, score: matchResult.match_score });

    console.log(`[EDGE FUNCTION] Match concluído e salvo com sucesso. Score: ${matchResult.match_score}%`);

    return new Response(
      JSON.stringify(savedMatch),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`[EDGE FUNCTION] Erro ao calcular match:`, error)
    
    // Registrar falha Gemini
    if (supabaseClient && resolvedUserId) {
      await logApplicationEvent(supabaseClient, resolvedUserId, 'gemini_request_failed', 'Gemini', 'failed', { error: error.message, jobId: resolvedJobId });
      await logMatchStep(supabaseClient, resolvedUserId, resolvedJobId || '', 'failed', 'failed', Date.now() - requestStartTime);
    }

    let code = "AI_ERROR";
    let userMessage = "Ocorreu um erro no cálculo de compatibilidade da vaga.";
    let retryable = true;
    
    if (error.message?.includes('Limit') || error.message?.includes('excedido')) {
      code = "RATE_LIMIT_EXCEEDED";
      userMessage = "Limite de requisições excedido. Você pode fazer no máximo 10 chamadas para 'job-matching' por hora.";
      retryable = false;
    } else if (error.message?.includes('GEMINI_API_KEY')) {
      code = "GEMINI_SERVICE_UNAVAILABLE";
      userMessage = "O motor de inteligência artificial Gemini não está configurado nos segredos do Supabase.";
      retryable = false;
    } else if (error.message?.includes('timeout') || error.message?.includes('fetch') || error.message?.includes('network')) {
      code = "AI_TIMEOUT";
      userMessage = "A requisição para o Gemini demorou mais do que o esperado. Tente novamente.";
    } else if (error.message?.includes('indisponível') || error.message?.includes('tentativas') || error.message?.includes('Gemini')) {
      code = "GEMINI_SERVICE_UNAVAILABLE";
      userMessage = "Nossa IA está temporariamente indisponível. Tente novamente em alguns minutos.";
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
