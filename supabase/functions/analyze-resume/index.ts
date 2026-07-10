import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { extractText, getDocumentProxy } from "npm:unpdf"
import mammoth from "npm:mammoth"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mock-gemini',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

function cleanString(input: string): string {
  if (!input) return '';
  return input
    .replace(/\0/g, '') // Remove actual null bytes
    .replace(/\\u0000/g, '') // Remove string representations of null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Remove non-printable control characters
}

async function computeHash(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  const delays = [2000, 5000, 10000];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429 || response.status >= 500) {
        const delayMs = delays[attempt - 1] || 10000;
        console.warn(`[GEMINI RETRY] Tentativa ${attempt} falhou com status ${response.status}. Aguardando ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delayMs = delays[attempt - 1] || 10000;
      console.warn(`[GEMINI RETRY] Tentativa ${attempt} falhou com erro de rede: ${err.message}. Aguardando ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
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

async function logProcessingStep(supabaseClient: any, resumeVersionId: string, step: string, status: 'running' | 'completed' | 'failed' | 'success' | 'error', errorMessage?: string, metadata = {}, userId?: string) {
  if (status === 'completed' || status === 'success') {
    console.log(`[PIPELINE_LOG] ${step} - SUCESSO`);
  } else if (status === 'running') {
    console.log(`[PIPELINE_LOG] ${step} - INICIANDO`);
  } else {
    console.error(`[PIPELINE_LOG] ${step} - ERRO: ${errorMessage}`);
  }

  if (!resumeVersionId || !supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('resume_processing_logs')
      .insert({
        resume_version_id: resumeVersionId,
        user_id: userId || null,
        step,
        status,
        message: errorMessage || (status === 'completed' || status === 'success' ? `Etapa ${step} finalizada com sucesso.` : status === 'running' ? `Etapa ${step} iniciada.` : `Erro na etapa ${step}.`),
        error_message: errorMessage || null,
        metadata,
        completed_at: status === 'completed' || status === 'success' || status === 'error' || status === 'failed' ? new Date().toISOString() : null
      });

    if (error) {
      console.error(`[LOG STEP DB] Erro ao gravar etapa no banco:`, error);
    }
  } catch (err) {
    console.error(`[LOG STEP DB] Exceção ao gravar log:`, err.message);
  }
}

async function logApplicationEvent(supabaseClient: any, userId: string | null, eventName: string, service: string, status: string, metadata = {}) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient
      .from('application_events')
      .insert({
        user_id: userId || null,
        event_name: eventName,
        service,
        status,
        metadata
      });
    if (error) {
      console.error(`[EVENT LOG] Erro ao gravar evento ${eventName} no banco:`, error);
    }
  } catch (err) {
    console.error(`[EVENT LOG] Exceção ao gravar evento ${eventName}:`, err.message);
  }
}

class ResumeParserService {
  static async extractText(fileData: Blob, contentType: string, storagePath: string): Promise<{ text: string, pageCount: number }> {
    let textToAnalyze = '';
    let numPages = 1;

    try {
      if (contentType.includes('text/plain') || storagePath.endsWith('.txt')) {
        textToAnalyze = await fileData.text()
      } else if (contentType.includes('pdf') || storagePath.endsWith('.pdf')) {
        const arrayBuffer = await fileData.arrayBuffer()
        const pdfProxy = await getDocumentProxy(new Uint8Array(arrayBuffer))
        numPages = pdfProxy.numPages
        const { text } = await extractText(pdfProxy, { mergePages: true })
        textToAnalyze = text
      } else if (contentType.includes('officedocument.wordprocessingml.document') || storagePath.endsWith('.docx')) {
        const arrayBuffer = await fileData.arrayBuffer()
        const docxResult = await mammoth.extractRawText({ arrayBuffer: new Uint8Array(arrayBuffer) })
        textToAnalyze = docxResult.value
      } else {
        textToAnalyze = await fileData.text()
      }
    } catch (parseError) {
      console.error("[PARSER ERROR] Falha ao analisar estrutura do documento:", parseError);
      throw new Error("Arquivo inválido. Envie outro currículo.");
    }

    return { text: cleanString(textToAnalyze), pageCount: numPages };
  }

  static async parseWithGemini(text: string, supabaseClient: any, userId: string, mockEnabled = false): Promise<any> {
    await checkRateLimit(supabaseClient, userId, 'resume-parsing');

    const resumeHash = await computeHash(text);
    const jobHash = 'parsing';

    // Verificar cache se não for mock
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
          console.log("[CACHE SUCCESS] Resolvido via cache para economizar custo no parsing do currículo.");
          // Registrar log de IA do cache com 0 tokens
          await logAiUsage(supabaseClient, userId, 'resume-parsing', 'gemini-2.5-flash-cache', 0, 0);
          return cachedResult.response;
        }
      } catch (cacheErr) {
        console.error("[CACHE ERROR] Erro ao consultar cache de parsing:", cacheErr.message);
      }
    }

    if (mockEnabled) {
      console.log("[GEMINI] Simulação ativa para testes.");
      const isAmanda = text.includes("Amanda");
      
      await logAiUsage(supabaseClient, userId, 'resume-parsing', 'gemini-2.5-flash-mock', 100, 200);

      const mockResponse = {
        career_profile: {
          personal: {
            fullName: isAmanda ? "Amanda Teste da Silva" : "Hana Oliveira de Souza",
            headline: isAmanda ? "Desenvolvedora" : "Gerente de Customer Success",
            email: isAmanda ? "amanda.teste@email.com" : "hana.oliveira@email.com",
            phone: null,
            linkedin: null,
            website: null,
            location: null
          },
          summary: "Resumo mockado de teste.",
          experience: isAmanda ? [] : [
            {
              companyName: "Omie",
              role: "Supervisora de CS",
              startDate: "2021-01-01",
              endDate: null,
              isCurrent: true,
              description: "Retenção de clientes B2B",
              highlights: []
            }
          ],
          education: [],
          skills: [],
          soft_skills: [],
          languages: [],
          certifications: [],
          ats_keywords: {
            existing_keywords: ["Customer Success", "Retention"],
            missing_keywords: ["SQL"],
            recommended_keywords: ["SaaS Metrics"]
          }
        },
        career_insights: {
          seniority_prediction: {
            value: isAmanda ? "Junior" : "Senior",
            confidence: 0.9,
            reason: "Simulação de teste",
            source_type: "inferred"
          },
          industry_prediction: {
            value: "SaaS",
            confidence: 0.9,
            reason: "Simulação de teste",
            source_type: "inferred"
          },
          methodologies: [
            {
              methodology_name: "Scrum",
              confidence: 0.9,
              source_type: "extracted"
            }
          ],
          recommended_keywords: {
            value: ["Churn", "Retention Metrics"],
            confidence: 0.9,
            reason: "Simulação de teste",
            source_type: "recommended"
          },
          missing_skills: {
            value: ["SQL"],
            confidence: 0.9,
            reason: "Simulação de teste",
            source_type: "recommended"
          },
          confidence_scores: {
            value: { personal: 0.9 },
            confidence: 0.9,
            reason: "Simulação de teste",
            source_type: "inferred"
          }
        }
      };

      return mockResponse;
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("Configuração ausente: A chave Gemini (GEMINI_API_KEY) não está configurada nos segredos do Supabase.");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `
      Você é um consultor sênior de recrutamento e estrategista de IA.
      Sua tarefa é analisar o currículo bruto fornecido e gerar duas seções principais:
      1. 'career_profile': Dados puros e extraídos do currículo (fatos reais apenas, sem invenção).
      2. 'career_insights': Predições, recomendações e insights baseados em inferência inteligente.

      REGRAS DE CONFIANÇA E RASTREABILIDADE (MANDATÓRIO):
      - Nunca afirme inferências como fatos absolutos. Use linguagem condicional (ex: 'sugerido', 'provável', 'recomendado') em todas as justificativas.
      - Para cada insight (como seniority_prediction, industry_prediction, recommended_keywords, missing_skills, etc.), você deve retornar o campo 'source_type' contendo estritamente um dos seguintes valores:
        * 'extracted': Encontrado explicitamente escrito no currículo.
        * 'inferred': Deduzido logicamente com base nas evidências factuais presentes.
        * 'recommended': Sugerido como melhoria baseada em padrões do setor.
      - Extração de Empresa: NUNCA infira o nome da empresa baseado no cargo. Se a empresa não constar de forma explícita na experiência, defina companyName = null.
      - Senioridade: Escolha estritamente uma única categoria: Intern, Junior, Mid, Senior, Lead, Manager, Head, Director, VP.

      JSON Schema esperado:
      {
        "career_profile": {
          "personal": {
            "fullName": "Nome Completo do Candidato ou null",
            "headline": "Título Profissional real ou null",
            "email": "E-mail ou null",
            "phone": "Telefone ou null",
            "linkedin": "URL do LinkedIn ou null",
            "website": "Portfólio/Website ou null",
            "location": "Localização (Cidade/Estado) ou null"
          },
          "summary": "Resumo profissional ou objetivo profissional curto em texto corrido",
          "experience": [
            {
              "companyName": "Nome da Empresa real e explícita no texto (NUNCA infira do cargo. Se não constar, use null)",
              "role": "Cargo",
              "startDate": "Data de início",
              "endDate": "Data de término ou null se atual",
              "isCurrent": true/false,
              "description": "Descrição das atividades desenvolvidas",
              "highlights": ["Destaque ou realização"]
            }
          ],
          "education": [
            {
              "institution": "Nome da Instituição",
              "degree": "Curso/Grau",
              "fieldOfStudy": "Área de Estudo",
              "startDate": "Data de início",
              "endDate": "Data de conclusão ou null"
            }
          ],
          "skills": [
            {
              "name": "Nome da Skill Técnica",
              "proficiency": "básico/intermediário/avançado/fluente"
            }
          ],
          "soft_skills": ["Soft Skill 1", "Soft Skill 2"],
          "languages": [
            {
              "language": "Idioma",
              "proficiency": "nível de proficiência"
            }
          ],
          "certifications": ["Certificação 1"],
          "ats_keywords": {
            "existing_keywords": ["competência real mapeada 1"],
            "missing_keywords": ["competência ausente importante baseada no objetivo/perfil"],
            "recommended_keywords": ["palavras-chave recomendadas para otimizar o ATS"]
          }
        },
        "career_insights": {
          "seniority_prediction": {
            "value": "Intern/Junior/Mid/Senior/Lead/Manager/Head/Director/VP (Escolha EXATAMENTE uma categoria)",
            "confidence": 0.95,
            "reason": "Justificativa contendo linguagem de probabilidade (ex: 'Sugerido com base em X').",
            "source_type": "inferred"
          },
          "industry_prediction": {
            "value": "SaaS / Tecnologia / etc",
            "confidence": 0.90,
            "reason": "Justificativa.",
            "source_type": "inferred"
          },
          "methodologies": [
            {
              "methodology_name": "Nome da Metodologia (ex: Scrum, Agile, Lean)",
              "confidence": 0.90,
              "source_type": "extracted ou inferred ou recommended (escolha estritamente um)"
            }
          ],
          "recommended_keywords": {
            "value": ["Churn", "Salesforce"],
            "confidence": 0.90,
            "reason": "Justificativa.",
            "source_type": "recommended"
          },
          "missing_skills": {
            "value": ["SQL"],
            "confidence": 0.80,
            "reason": "Justificativa.",
            "source_type": "recommended"
          },
          "confidence_scores": {
            "value": { "personal": 0.98, "experience": 0.95, "skills": 0.88 },
            "confidence": 0.95,
            "reason": "Cálculo matemático de qualidade estrutural.",
            "source_type": "inferred"
          }
        }
      }

      Texto do Currículo:
      """
      ${text}
      """
    `;

    console.log("[GEMINI] Enviando prompt para Gemini 2.5 Flash...");
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
    await logAiUsage(supabaseClient, userId, 'resume-parsing', 'gemini-2.5-flash', promptTokens, candidatesTokens);

    const parsedData = JSON.parse(extractedText);

    // Salvar no cache
    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseClient
        .from('ai_analysis_cache')
        .insert({
          resume_hash: resumeHash,
          job_hash: jobHash,
          response: parsedData,
          expires_at: expiresAt
        });
    } catch (saveCacheErr) {
      console.error("[CACHE SAVE ERROR] Falha ao salvar no cache:", saveCacheErr.message);
    }

    return parsedData;
  }

  static async saveCareerProfile(supabaseClient: any, userId: string, resumeVersionId: string, profileData: any) {
    const payload = {
      user_id: userId,
      resume_version_id: resumeVersionId,
      personal: profileData.personal || {},
      experience: profileData.experience || [],
      education: profileData.education || [],
      skills: profileData.skills || [],
      soft_skills: profileData.soft_skills || [],
      languages: profileData.languages || [],
      certifications: profileData.certifications || [],
      ats_keywords: profileData.ats_keywords || {},
      summary: profileData.summary || ''
    };

    console.log(`[CAREER PROFILE SAVE] resumeVersionId recebido: ${resumeVersionId}`);

    const { data, error } = await supabaseClient
      .from('career_profiles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar perfil de carreira: ${error.message}`);
    }
    return data;
  }

  static async saveCareerInsights(supabaseClient: any, userId: string, resumeVersionId: string, insightsData: any) {
    const { data, error } = await supabaseClient
      .from('career_insights')
      .insert({
        user_id: userId,
        resume_version_id: resumeVersionId,
        seniority_prediction: insightsData.seniority_prediction || {},
        industry_prediction: insightsData.industry_prediction || {},
        methodologies: insightsData.methodologies || [],
        recommended_keywords: insightsData.recommended_keywords || {},
        missing_skills: insightsData.missing_skills || {},
        confidence_scores: insightsData.confidence_scores || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar insights de carreira: ${error.message}`);
    }
    return data;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  let supabaseClient;
  let resumeVersionIdGlobal;
  let userIdGlobal: string | null = null;

  try {
    const { storagePath, fileName, userId, resumeVersionId, mockGemini } = await req.json()
    resumeVersionIdGlobal = resumeVersionId;
    userIdGlobal = userId;
    console.log(`[EDGE FUNCTION] Processando versão de currículo:`, { storagePath, fileName, userId, resumeVersionId, mockGemini })

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''
    const isMockEnabled = mockGemini === true || req.headers.get('x-mock-gemini') === 'true'

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    if (!resumeVersionId) {
      console.error(`[ANALYZE RESUME] Erro: resumeVersionId está ausente no payload.`);
      return new Response(
        JSON.stringify({ 
          error: "A versão do currículo não foi criada ou não pôde ser identificada no pipeline." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se a versão do currículo existe no banco de dados
    const { data: resumeVersion, error: versionCheckError } = await supabaseClient
      .from('resume_versions')
      .select('*')
      .eq('id', resumeVersionId)
      .maybeSingle();

    if (versionCheckError || !resumeVersion) {
      console.error(`[ANALYZE RESUME] Erro: Versão do currículo com ID ${resumeVersionId} não encontrada no banco.`, versionCheckError);
      return new Response(
        JSON.stringify({ 
          error: "A versão do currículo não foi criada ou não pôde ser identificada no banco de dados." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 1. Registrar evento global de início de processamento
    await logApplicationEvent(supabaseClient, userId, 'resume_upload_started', 'Parser', 'started', { fileName });

    // Atualizar status da versão do currículo para 'processing'
    await supabaseClient
      .from('resume_versions')
      .update({ status: 'processing' })
      .eq('id', resumeVersionId);

    // Etapa 1: uploaded - Concluída logo no início porque o upload do arquivo já aconteceu
    await logProcessingStep(supabaseClient, resumeVersionId, 'uploaded', 'completed', 'Upload recebido com sucesso', { fileName, storagePath }, userId);

    // Etapa 2: extracting_text - Iniciada
    await logProcessingStep(supabaseClient, resumeVersionId, 'extracting_text', 'running', 'Extraindo informações do currículo...', {}, userId);

    // 2. Baixar PDF do Storage
    console.log(`[EDGE FUNCTION] Baixando arquivo: ${storagePath}`)
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('resumes')
      .download(storagePath)

    if (downloadError) {
      await logProcessingStep(supabaseClient, resumeVersionId, 'extracting_text', 'failed', `Erro ao baixar arquivo do Storage: ${downloadError.message}`, {}, userId);
      throw new Error(`Erro ao baixar arquivo do Storage: ${downloadError.message}`);
    }

    // Validar se o arquivo excede o limite permitido de 10MB
    if (fileData.size > 10 * 1024 * 1024) {
      await logProcessingStep(supabaseClient, resumeVersionId, 'extracting_text', 'failed', "Arquivo excede limite permitido.", {}, userId);
      throw new Error("Arquivo excede limite permitido.");
    }

    // Validar content-type — rejeitar tipos perigosos antes da extração
    const contentType = fileData.type || 'application/pdf';
    const dangerousTypes = ['image/svg+xml', 'text/html', 'application/javascript', 'application/x-executable', 'application/x-msdownload'];
    if (dangerousTypes.some(t => contentType.includes(t))) {
      await logProcessingStep(supabaseClient, resumeVersionId, 'extracting_text', 'failed', `Tipo de arquivo não permitido: ${contentType}`, {}, userId);
      throw new Error("Tipo de arquivo não permitido. Envie apenas PDF, DOCX ou TXT.");
    }

    // 3. Extrair texto usando a biblioteca local (unpdf/mammoth)
    console.log(`[EDGE FUNCTION] Extraindo texto...`)
    let textResult;
    try {
      textResult = await ResumeParserService.extractText(fileData, contentType, storagePath);
    } catch (extractErr) {
      await logProcessingStep(supabaseClient, resumeVersionId, 'extracting_text', 'failed', extractErr.message, {}, userId);
      throw extractErr;
    }

    const { text, pageCount } = textResult;

    // Validar se o arquivo é um PDF escaneado (sem texto legível)
    if (!text || text.trim().length < 100) {
      await logProcessingStep(supabaseClient, resumeVersionId, 'extracting_text', 'failed', "Não conseguimos extrair texto automaticamente.", {}, userId);
      throw new Error("Não conseguimos extrair texto automaticamente.");
    }

    // Truncar texto a 30.000 caracteres para prevenir prompt injection via currículo gigante
    const MAX_TEXT_LENGTH = 30000;
    const truncatedText = text.length > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;

    // Etapa 2: extracting_text - Concluída
    await logProcessingStep(supabaseClient, resumeVersionId, 'extracting_text', 'completed', 'Texto extraído com sucesso', { pageCount, textLength: text.length }, userId);

    // Registrar evento global de upload/extração concluído
    await logApplicationEvent(supabaseClient, userId, 'resume_upload_completed', 'Parser', 'completed', { pageCount, textLength: text.length });

    // Etapa 3: analyzing_profile - Iniciada (Gemini análise)
    await logProcessingStep(supabaseClient, resumeVersionId, 'analyzing_profile', 'running', 'IA analisando histórico e competências...', { pageCount, textLength: text.length }, userId);

    // Registrar evento global de início de IA
    await logApplicationEvent(supabaseClient, userId, 'gemini_request_started', 'Gemini', 'started');

    // 4. Enviar texto para Gemini 2.5 Flash (ou obter do cache)
    console.log(`[EDGE FUNCTION] Enviando para Gemini 2.5 Flash...`)
    let parsedData;
    try {
      parsedData = await ResumeParserService.parseWithGemini(truncatedText, supabaseClient, userId, isMockEnabled);
    } catch (geminiErr) {
      await logProcessingStep(supabaseClient, resumeVersionId, 'analyzing_profile', 'failed', geminiErr.message, {}, userId);
      await logApplicationEvent(supabaseClient, userId, 'gemini_request_failed', 'Gemini', 'failed', { error: geminiErr.message });
      throw geminiErr;
    }

    // Validação estrita do perfil retornado pela IA para evitar perfis vazios ou corrompidos
    const profile = parsedData?.career_profile;
    if (
      !profile ||
      !profile.personal ||
      !profile.personal.fullName ||
      profile.personal.fullName === "Profissional" ||
      !profile.experience ||
      profile.experience.length === 0
    ) {
      const invalidMsg = "Resume extraction returned invalid profile: missing name or work experiences.";
      await logProcessingStep(supabaseClient, resumeVersionId, 'analyzing_profile', 'failed', invalidMsg, {}, userId);
      await logApplicationEvent(supabaseClient, userId, 'gemini_request_failed', 'Gemini', 'failed', { reason: invalidMsg });
      throw new Error(invalidMsg);
    }

    // Etapa 3: analyzing_profile - Concluída
    await logProcessingStep(supabaseClient, resumeVersionId, 'analyzing_profile', 'completed', 'Perfil estruturado pela IA com sucesso', {}, userId);

    // Registrar evento de sucesso de IA
    await logApplicationEvent(supabaseClient, userId, 'gemini_request_completed', 'Gemini', 'completed');

    // Etapa 4: identifying_skills - Iniciada e concluída (visto que a identificação é parte da resposta estruturada do Gemini)
    await logProcessingStep(supabaseClient, resumeVersionId, 'identifying_skills', 'running', 'Mapeando competências...', {}, userId);
    await logProcessingStep(supabaseClient, resumeVersionId, 'identifying_skills', 'completed', 'Competências e soft skills mapeadas', {}, userId);

    // Etapa 5: creating_profile - Iniciada
    await logProcessingStep(supabaseClient, resumeVersionId, 'creating_profile', 'running', 'Criando perfil profissional...', {}, userId);

    // 5. Salvar perfil de carreira (dados puros extraídos)
    console.log(`[EDGE FUNCTION] Salvando perfil de carreira...`)
    const careerProfile = await ResumeParserService.saveCareerProfile(
      supabaseClient, 
      userId, 
      resumeVersion.id, 
      parsedData.career_profile || {}
    );

    // 6. Salvar insights de carreira (predições e deduções da IA)
    console.log(`[EDGE FUNCTION] Salvando insights de carreira...`)
    const careerInsights = await ResumeParserService.saveCareerInsights(
      supabaseClient,
      userId,
      resumeVersion.id,
      parsedData.career_insights || {}
    );

    // Etapa 5: creating_profile - Concluída
    await logProcessingStep(supabaseClient, resumeVersionId, 'creating_profile', 'completed', 'Perfil consolidado salvo no banco de dados', {
      careerProfileId: careerProfile.id,
      careerInsightsId: careerInsights.id
    }, userId);

    // Etapa 6: completed - Concluída
    await logProcessingStep(supabaseClient, resumeVersionId, 'completed', 'completed', 'Processamento de currículo finalizado', {}, userId);
    await logProcessingStep(supabaseClient, resumeVersionId, 'save_completed', 'completed', 'Processamento finalizado com sucesso no banco.', {}, userId);

    // 7. Atualizar status para 'completed'
    await supabaseClient
      .from('resume_versions')
      .update({ status: 'completed' })
      .eq('id', resumeVersionId);

    console.log(`[EDGE FUNCTION] Processamento da versão ${resumeVersionId} concluído com sucesso.`)

    return new Response(
      JSON.stringify({
        success: true,
        careerProfile,
        careerInsights,
        pageCount,
        charCount: text.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`[EDGE FUNCTION] Erro ao processar currículo:`, error);

    // Registrar evento global de falha de processamento
    await logApplicationEvent(supabaseClient, userIdGlobal, 'resume_processing_failed', 'Parser', 'failed', { error: error.message });

    // Marcar etapa atual como falha
    if (resumeVersionIdGlobal && supabaseClient) {
      await logProcessingStep(supabaseClient, resumeVersionIdGlobal, 'failed', 'failed', error.message, {}, userIdGlobal);
    }
    
    // Tentar registrar o erro na tabela resume_processing_errors
    if (resumeVersionIdGlobal && supabaseClient) {
      try {
        await supabaseClient
          .from('resume_processing_errors')
          .insert({
            resume_version_id: resumeVersionIdGlobal,
            error_type: error.name || 'ParsingError',
            error_message: error.message || String(error)
          });
      } catch (dbErr) {
        console.error(`[EDGE FUNCTION] Erro ao registrar falha de auditoria:`, dbErr)
      }
    }

    // Tentar atualizar o status para 'failed'
    if (resumeVersionIdGlobal && supabaseClient) {
      try {
        await supabaseClient
          .from('resume_versions')
          .update({ status: 'failed' })
          .eq('id', resumeVersionIdGlobal);
      } catch (dbErr) {
        console.error(`[EDGE FUNCTION] Erro ao marcar falha no banco:`, dbErr)
      }
    }

    let code = "PARSE_ERROR";
    let userMessage = "Não foi possível processar ou extrair as informações do seu currículo. Por favor, verifique se o arquivo PDF está legível e tente novamente.";
    let retryable = true;

    if (error.message?.includes('limite') || error.message?.includes('excede')) {
      code = "RESUME_LIMIT_EXCEEDED";
      userMessage = "Arquivo excede limite permitido.";
      retryable = false;
    } else if (error.message?.includes('inválido') || error.message?.includes('corrompido')) {
      code = "PARSE_ERROR";
      userMessage = "Arquivo inválido. Envie outro currículo.";
      retryable = false;
    } else if (error.message?.includes('extrair texto') || error.message?.includes('automaticamente')) {
      code = "RESUME_EMPTY";
      userMessage = "Não conseguimos extrair texto automaticamente.";
      retryable = false;
    } else if (error.message?.includes('invalid profile') || error.message?.includes('work experiences')) {
      code = "RESUME_INVALID_PROFILE";
      userMessage = "Dados de currículo insuficientes. O currículo analisado não possui histórico profissional ou informações de identificação legíveis.";
      retryable = false;
    } else if (error.message?.includes('Gemini') || error.message?.includes('GEMINI')) {
      code = "GEMINI_SERVICE_UNAVAILABLE";
      userMessage = "O serviço de inteligência artificial está temporariamente indisponível. Tente novamente em instantes.";
    } else if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
      code = "AI_TIMEOUT";
      userMessage = "Nossa inteligência artificial demorou mais que o esperado para estruturar suas experiências. Tente novamente.";
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
