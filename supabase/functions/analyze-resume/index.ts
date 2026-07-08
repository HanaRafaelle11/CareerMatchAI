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

async function fetchWithRetry(url: string, options: any, maxRetries = 3, initialDelay = 1000): Promise<Response> {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Se for rate limit (429) ou erro temporário de servidor (5xx), aplicar backoff
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
    return; // Não bloqueia caso o banco falhe
  }

  // Limite de 10 chamadas de IA por hora por usuário
  if (count && count >= 10) {
    throw new Error(`Limite de requisições excedido. Você pode fazer no máximo 10 chamadas para '${feature}' por hora.`);
  }
}

async function logAiUsage(supabaseClient: any, userId: string, feature: string, model: string, inputTokens: number, outputTokens: number) {
  // Custo estimado para o Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
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

class ResumeParserService {
  static async extractText(fileData: Blob, contentType: string, storagePath: string): Promise<{ text: string, pageCount: number }> {
    let textToAnalyze = '';
    let numPages = 1;

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

    return { text: cleanString(textToAnalyze), pageCount: numPages };
  }

  static async parseWithGemini(text: string, supabaseClient: any, userId: string, mockEnabled = false): Promise<any> {
    // Verificar Rate Limit antes de chamar a IA
    await checkRateLimit(supabaseClient, userId, 'resume-parsing');

    if (mockEnabled) {
      console.log("[GEMINI] Simulação ativa para testes.");
      const isAmanda = text.includes("Amanda");
      
      // Registrar log de IA mockado
      await logAiUsage(supabaseClient, userId, 'resume-parsing', 'gemini-2.5-flash-mock', 100, 200);

      return {
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
          ats_keywords: []
        },
        career_insights: {
          seniority_prediction: {
            value: isAmanda ? "junior" : "senior",
            confidence: 0.9,
            reason: "Simulação de teste"
          },
          industry_prediction: {
            value: "SaaS",
            confidence: 0.9,
            reason: "Simulação de teste"
          },
          methodologies: {
            value: [],
            confidence: 0.9,
            reason: "Simulação de teste"
          },
          recommended_keywords: {
            value: [],
            confidence: 0.9,
            reason: "Simulação de teste"
          },
          missing_skills: {
            value: [],
            confidence: 0.9,
            reason: "Simulação de teste"
          },
          confidence_scores: {
            value: { personal: 0.9 },
            confidence: 0.9,
            reason: "Simulação de teste"
          }
        }
      };
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

      IMPORTANTE:
      - Nunca misture dados puros e extraídos com inferências de inteligência artificial.
      - Cada campo em 'career_insights' (como seniority_prediction, industry_prediction, methodologies, recommended_keywords, missing_skills e confidence_scores) deve ser estruturado estritamente como um objeto contendo:
        - 'value': O valor deduzido (uma string, ou um array de strings dependendo do campo).
        - 'confidence': O nível de certeza numérica de 0.00 a 1.00.
        - 'reason': A justificativa descritiva resumida da sua inferência.

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
              "companyName": "Nome da Empresa",
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
          "ats_keywords": ["ATS Keyword 1"]
        },
        "career_insights": {
          "seniority_prediction": {
            "value": "junior/pleno/senior/lead/director",
            "confidence": 0.95,
            "reason": "Exemplo: Mais de 10 anos de experiência em cargos de gestão."
          },
          "industry_prediction": {
            "value": "SaaS / Tecnologia",
            "confidence": 0.90,
            "reason": "Exemplo: Histórico consolidado em empresas de software e B2B."
          },
          "methodologies": {
            "value": ["Agile", "Scrum", "Lean"],
            "confidence": 0.85,
            "reason": "Exemplo: Projetos anteriores liderados sob estruturas de time ágil."
          },
          "recommended_keywords": {
            "value": ["Churn Rate", "Health Score", "CSAT", "NPS"],
            "confidence": 0.90,
            "reason": "Exemplo: Termos ideais para otimização ATS em vagas seniores de Customer Success."
          },
          "missing_skills": {
            "value": ["PowerBI", "SQL Avançado"],
            "confidence": 0.80,
            "reason": "Exemplo: Habilidades técnicas comumente exigidas para vagas CS Ops que não aparecem no texto."
          },
          "confidence_scores": {
            "value": { "personal": 0.98, "experience": 0.95, "skills": 0.88 },
            "confidence": 0.95,
            "reason": "Exemplo: Nome, e-mail e histórico profissional perfeitamente formatados."
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

    // Registra custos do Gemini nos logs
    const promptTokens = resJson.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = resJson.usageMetadata?.candidatesTokenCount || 0;
    await logAiUsage(supabaseClient, userId, 'resume-parsing', 'gemini-2.5-flash', promptTokens, candidatesTokens);

    return JSON.parse(extractedText);
  }

  static async saveCareerProfile(supabaseClient: any, userId: string, resumeVersionId: string, profileData: any) {
    const { data, error } = await supabaseClient
      .from('career_profiles')
      .insert({
        user_id: userId,
        resume_version_id: resumeVersionId,
        personal: profileData.personal || {},
        experience: profileData.experience || [],
        education: profileData.education || [],
        skills: profileData.skills || [],
        soft_skills: profileData.soft_skills || [],
        languages: profileData.languages || [],
        certifications: profileData.certifications || [],
        ats_keywords: profileData.ats_keywords || [],
        summary: profileData.summary || ''
      })
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
        methodologies: insightsData.methodologies || {},
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

  try {
    const { storagePath, fileName, userId, resumeVersionId, mockGemini } = await req.json()
    resumeVersionIdGlobal = resumeVersionId;
    console.log(`[EDGE FUNCTION] Processando versão de currículo:`, { storagePath, fileName, userId, resumeVersionId, mockGemini })

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''
    const isMockEnabled = mockGemini === true || req.headers.get('x-mock-gemini') === 'true'

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 1. Atualizar status para 'processing'
    await supabaseClient
      .from('resume_versions')
      .update({ status: 'processing' })
      .eq('id', resumeVersionId);

    // 2. Baixar PDF do Storage
    console.log(`[EDGE FUNCTION] Baixando arquivo: ${storagePath}`)
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('resumes')
      .download(storagePath)

    if (downloadError) {
      throw new Error(`Erro ao baixar arquivo do Storage: ${downloadError.message}`);
    }

    const contentType = fileData.type || 'application/pdf';

    // 3. Extrair texto usando a biblioteca local (unpdf/mammoth)
    console.log(`[EDGE FUNCTION] Extraindo texto...`)
    const { text, pageCount } = await ResumeParserService.extractText(fileData, contentType, storagePath);

    if (!text || !text.trim()) {
      throw new Error("Nenhum texto legível pôde ser extraído do documento.");
    }

    // 4. Enviar texto para Gemini 2.5 Flash
    console.log(`[EDGE FUNCTION] Enviando para Gemini 2.5 Flash...`)
    const parsedData = await ResumeParserService.parseWithGemini(text, supabaseClient, userId, isMockEnabled);

    // 5. Salvar perfil de carreira (dados puros extraídos)
    console.log(`[EDGE FUNCTION] Salvando perfil de carreira...`)
    const careerProfile = await ResumeParserService.saveCareerProfile(
      supabaseClient, 
      userId, 
      resumeVersionId, 
      parsedData.career_profile || {}
    );

    // 6. Salvar insights de carreira (predições e deduções da IA)
    console.log(`[EDGE FUNCTION] Salvando insights de carreira...`)
    const careerInsights = await ResumeParserService.saveCareerInsights(
      supabaseClient,
      userId,
      resumeVersionId,
      parsedData.career_insights || {}
    );

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
    console.error(`[EDGE FUNCTION] Falha no processamento:`, error)
    
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

    return new Response(
      JSON.stringify({ error: `Erro no pipeline do parser: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
