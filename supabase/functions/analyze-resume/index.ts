import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.24.1"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { extractText, getDocumentProxy } from "npm:unpdf"
import mammoth from "npm:mammoth"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { rawText, fileName, storagePath, userId, resumeId } = await req.json()
    console.log(`[EDGE FUNCTION] Recebido analyze-resume:`, { fileName, storagePath, userId, resumeId, hasRawText: !!rawText })

    let textToAnalyze = rawText || ''
    let numPages = 1
    let fileSize = rawText ? rawText.length : 0
    let mimeType = rawText ? 'text/plain' : ''

    // Se não tiver texto bruto e tiver o caminho do storage, baixamos e extraímos o texto
    if (!textToAnalyze && storagePath) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
      const authHeader = req.headers.get('Authorization') || ''

      console.log(`[EDGE FUNCTION] Baixando arquivo do Storage: ${storagePath}`)
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('resumes')
        .download(storagePath)

      if (downloadError) {
        console.error(`[EDGE FUNCTION] Erro ao baixar arquivo do storage:`, downloadError)
        throw new Error(`Erro ao baixar arquivo do Storage: ${downloadError.message}`)
      }

      const contentType = fileData.type || ''
      fileSize = fileData.size
      mimeType = contentType
      console.log(`[EDGE FUNCTION] Arquivo baixado. Tamanho: ${fileSize} bytes. Tipo MIME: ${mimeType}`)

      if (contentType.includes('text/plain') || storagePath.endsWith('.txt')) {
        textToAnalyze = await fileData.text()
        console.log(`[EDGE FUNCTION] Texto TXT extraído com sucesso. Caracteres: ${textToAnalyze.length}`)
      } else if (contentType.includes('pdf') || storagePath.endsWith('.pdf')) {
        try {
          console.log(`[EDGE FUNCTION] Extraindo texto de PDF com unpdf...`)
          const arrayBuffer = await fileData.arrayBuffer()
          const pdfProxy = await getDocumentProxy(new Uint8Array(arrayBuffer))
          numPages = pdfProxy.numPages
          const { text } = await extractText(pdfProxy, { mergePages: true })
          textToAnalyze = text
          console.log(`[EDGE FUNCTION] Texto do PDF extraído. Páginas: ${numPages}, Caracteres: ${textToAnalyze.length}`)
        } catch (pdfErr) {
          console.error(`[EDGE FUNCTION] Erro ao extrair PDF:`, pdfErr)
          throw new Error(`Erro ao extrair conteúdo do arquivo PDF: ${pdfErr.message}`)
        }
      } else if (contentType.includes('officedocument.wordprocessingml.document') || storagePath.endsWith('.docx')) {
        try {
          console.log(`[EDGE FUNCTION] Extraindo texto de DOCX com mammoth...`)
          const arrayBuffer = await fileData.arrayBuffer()
          const docxResult = await mammoth.extractRawText({ arrayBuffer: new Uint8Array(arrayBuffer) })
          textToAnalyze = docxResult.value
          console.log(`[EDGE FUNCTION] Texto do DOCX extraído. Caracteres: ${textToAnalyze.length}`)
        } catch (docxErr) {
          console.error(`[EDGE FUNCTION] Erro ao extrair DOCX:`, docxErr)
          throw new Error(`Erro ao extrair conteúdo do arquivo DOCX: ${docxErr.message}`)
        }
      } else {
        // Fallback: tentar ler como texto bruto
        textToAnalyze = await fileData.text()
        console.log(`[EDGE FUNCTION] Formato desconhecido, texto bruto extraído. Caracteres: ${textToAnalyze.length}`)
      }
    }

    textToAnalyze = cleanString(textToAnalyze)
    
    // FASE 2: Diagnóstico e Validação do Texto Extraído
    const charCount = textToAnalyze.length
    const wordCount = textToAnalyze.split(/\s+/).filter(Boolean).length
    const lineCount = textToAnalyze.split(/\r?\n/).length
    const ptCount = (textToAnalyze.match(/\b(e|o|a|de|do|da|em|um|para|com)\b/gi) || []).length
    const enCount = (textToAnalyze.match(/\b(and|the|of|to|in|a|for|with|is|at)\b/gi) || []).length
    const detectedLanguage = ptCount >= enCount ? 'pt-BR' : 'en'
    const encoding = 'UTF-8'
    const first2000 = textToAnalyze.substring(0, 2000)
    const last2000 = textToAnalyze.substring(Math.max(0, textToAnalyze.length - 2000))

    console.log(`[EDGE FUNCTION] === FASE 2: DIAGNÓSTICOS DE TEXTO EXTRAÍDO ===`)
    console.log(`- Tipo MIME: ${mimeType}`)
    console.log(`- Páginas: ${numPages}`)
    console.log(`- Caracteres: ${charCount}`)
    console.log(`- Palavras: ${wordCount}`)
    console.log(`- Linhas: ${lineCount}`)
    console.log(`- Idioma Detectado: ${detectedLanguage}`)
    console.log(`- Encoding: ${encoding}`)
    console.log(`- Primeiros 2000 caracteres:\n${first2000}`)
    console.log(`- Últimos 2000 caracteres:\n${last2000}`)
    console.log(`========================================================`)

    if (!textToAnalyze || !textToAnalyze.trim()) {
      console.error(`[EDGE FUNCTION] Erro de Validação: Nenhum texto legível extraído do currículo.`)
      return new Response(
        JSON.stringify({ error: 'Erro de Validação: Nenhum texto legível pôde ser extraído do currículo fornecido. O arquivo pode estar vazio ou corrompido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error("[EDGE FUNCTION] Erro: OPENAI_API_KEY não está configurada nos segredos do Supabase.")
      return new Response(
        JSON.stringify({ error: 'Configuração ausente: A chave OpenAI (OPENAI_API_KEY) não está configurada no Supabase. Por favor, configure-a executando "supabase secrets set OPENAI_API_KEY=sua_chave" ou pelo painel do Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({ apiKey })

    // FASE 6: Novo Prompt de Engenharia (Consultor Sênior de Carreira)
    const prompt = `
      Você é um consultor sênior de carreira e especialista de parsing para o CareerMatch AI.
      Sua tarefa é ler o texto bruto de um currículo e estruturá-lo estritamente no formato JSON abaixo.

      INSTRUÇÕES CRÍTICAS DE AUDITORIA E TRANSPARÊNCIA:
      - Extraia APENAS dados REAIS que estejam explicitamente declarados ou diretamente inferidos sem especulação no texto.
      - Se um campo ou competência não puder ser atestada no texto, preencha com null.
      - Para cada skill, experiência profissional e certificação mapeada, você DEVE retornar a confiança (confidence de 0.00 a 1.00), a evidência textual literal correspondente (evidence) e o trecho recortado que originou a conclusão (source_text).
      - NUNCA invente siglas, empresas, cargos, ou ferramentas de templates como "Desenvolvedor React", "Vite" ou "TypeScript" se o currículo pertencer a um profissional de Customer Success / Liderança.

      Formato do JSON esperado:
      {
        "fullName": "Nome Completo",
        "headline": "Título Profissional sugerido baseado no perfil real",
        "structuredSummary": "Resumo executivo de até 4 frases do perfil real (mínimo 100 caracteres)",
        "area": "Área de atuação principal (ex: Customer Success, Operações, Vendas, Engenharia de Software)",
        "secondaryArea": "Área secundária (ou null)",
        "seniority": "junior/pleno/senior/lead/director",
        "yearsOfExperience": 10.5,
        "industries": ["SaaS", "Fintech", "Technology"],
        "experiences": [
          {
            "companyName": "Nome da Empresa",
            "role": "Cargo",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD ou null se for o atual",
            "isCurrent": true/false,
            "description": "Descrição sucinta das atividades executadas",
            "highlights": ["Destaque 1", "Destaque 2"],
            "achievements": ["Conquista relevante com métrica se houver no texto"],
            "kpis": ["KPIs ou métricas atingidas (ex: Redução de 2% no churn)"],
            "confidence": 0.99,
            "evidence": "Citação literal da frase contendo o cargo e empresa",
            "source_text": "Trecho exato do currículo"
          }
        ],
        "skills": [
          {
            "name": "Nome exato da competência (ex: Customer Success)",
            "category": "cs_skill/ops_skill/hard_skill/soft_skill/tool/language/leadership_skill/analytical_skill/commercial_skill/product_skill/management_skill/project_skill/data_skill",
            "proficiencyLevel": "básico/intermediário/avançado/fluente",
            "confidence": 0.98,
            "evidence": "Citação literal da frase de evidência",
            "source_text": "Trecho exato do currículo"
          }
        ],
        "education": [
          {
            "institution": "Nome da Instituição",
            "degree": "Título do curso",
            "fieldOfStudy": "Área de Estudo",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD ou null"
          }
        ],
        "mba": "Detalhes de MBA se houver no texto, ou null",
        "certifications": [
          {
            "name": "Nome da certificação",
            "confidence": 0.95,
            "evidence": "Frase de evidência",
            "source_text": "Trecho exato"
          }
        ],
        "courses": ["Curso 1", "Curso 2"],
        "stack": ["Looker", "Salesforce"],
        "methodologies": ["Agile", "Scrum"],
        "frameworks": [],
        "atsKeywords": ["Customer Success", "Churn", "CS Ops", "NPS", "CSAT"],
        "strengths": ["Gestão de equipes", "Automação com IA"],
        "weaknesses": ["Pouco histórico com engenharia de baixo nível"],
        "gaps": ["Falta MBA em Finanças corporativas"],
        "atsApprovalLikelihood": 85,
        "competitiveAreas": ["Operações de CS", "Liderança de times"],
        "nonCompetitiveAreas": ["Desenvolvimento Backend de Alta Escalabilidade"]
      }

      Texto do currículo:
      """
      ${textToAnalyze}
      """
    `

    // FASE 3: Auditoria do Prompt (Imprimir prompt inteiro no console)
    console.log(`[EDGE FUNCTION] === FASE 3: PROMPT COMPLETO ENVIADO À OPENAI ===`)
    console.log(prompt)
    console.log(`==============================================================`)

    console.log(`[EDGE FUNCTION] Enviando prompt para a OpenAI (gpt-4o)...`)
    const startTime = Date.now()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um assistente de IA especialista em recrutamento e análise estruturada de currículos.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
    
    const duration = Date.now() - startTime
    const finishReason = response.choices[0].finish_reason
    const rawContent = response.choices[0].message.content || '{}'
    const cleanedContent = cleanString(rawContent)
    
    // FASE 4: Auditoria de Resposta da OpenAI
    const promptTokens = response.usage?.prompt_tokens || 0
    const completionTokens = response.usage?.completion_tokens || 0
    const totalTokens = response.usage?.total_tokens || 0

    console.log(`[EDGE FUNCTION] === FASE 4: AUDITORIA DA RESPOSTA DA OPENAI ===`)
    console.log(`- Modelo Utilizado: ${response.model}`)
    console.log(`- Duração da Chamada: ${duration}ms`)
    console.log(`- Finish Reason: ${finishReason}`)
    console.log(`- Tokens Usados: Prompt=${promptTokens}, Completion=${completionTokens}, Total=${totalTokens}`)
    console.log(`- JSON Retornado:\n${cleanedContent}`)
    console.log(`================================================================`)

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedContent)
    } catch (parseErr) {
      console.error("[EDGE FUNCTION] FASE 4 ERRO: Falha ao fazer parse do JSON retornado pela OpenAI. Resposta bruta salva nos logs:", cleanedContent)
      return new Response(
        JSON.stringify({ error: `Resposta inválida da IA (não é JSON). Conteúdo bruto: ${cleanedContent}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Executar validações estritas
    const experiences = parsedResult.experiences || []
    const skills = parsedResult.skills || []
    const summary = parsedResult.structuredSummary || ""

    if (experiences.length === 0) {
      console.error("[EDGE FUNCTION] Erro de Validação: Nenhuma experiência profissional estruturada identificada.")
      return new Response(
        JSON.stringify({ error: 'Erro de Validação da IA: Nenhuma experiência profissional foi identificada no currículo.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (summary.length < 100) {
      console.error(`[EDGE FUNCTION] Erro de Validação: Resumo profissional muito curto (${summary.length} caracteres).`)
      return new Response(
        JSON.stringify({ error: `Erro de Validação da IA: O resumo profissional estruturado gerado ficou muito curto (${summary.length} caracteres), necessitando de no mínimo 100 caracteres.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (skills.length === 0) {
      console.error("[EDGE FUNCTION] Erro de Validação: Nenhuma competência ou skill foi mapeada.")
      return new Response(
        JSON.stringify({ error: 'Erro de Validação da IA: Nenhuma competência ou skill foi mapeada no currículo.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyNames = experiences.map((exp: any) => exp.companyName).filter(Boolean)
    if (companyNames.length === 0) {
      console.error("[EDGE FUNCTION] Erro de Validação: Nenhuma empresa identificada.")
      return new Response(
        JSON.stringify({ error: 'Erro de Validação da IA: Nenhuma empresa válida pôde ser identificada no currículo.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // FASE 7: Validação Cruzada (Cross-Validation) contra alucinações
    const validationErrors = crossValidate(parsedResult, textToAnalyze)
    if (validationErrors.length > 0) {
      console.error(`[EDGE FUNCTION] Falha na Validação Cruzada contra alucinações:\n- ${validationErrors.join('\n- ')}`)
      return new Response(
        JSON.stringify({ error: `Erro de Validação Cruzada (Alucinação Detectada): ${validationErrors[0]}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log("[EDGE FUNCTION] Validação Cruzada concluída com sucesso. Zero alucinações detectadas.")

    // Gerar metadados de depuração e auditoria
    const debugTelemetry = {
      fileName,
      storagePath,
      pageCount: numPages,
      charCount: textToAnalyze.length,
      extractedTextPreview: textToAnalyze.substring(0, 2000),
      promptSent: prompt,
      rawOpenAIResponse: rawContent,
      executionTimeMs: duration,
      companiesCount: new Set(companyNames).size,
      experiencesCount: experiences.length,
      hardSkillsCount: skills.filter((s: any) => s.category?.includes('hard_skill')).length,
      softSkillsCount: skills.filter((s: any) => s.category?.includes('soft_skill')).length,
      toolsCount: skills.filter((s: any) => s.category?.includes('tool')).length,
      languagesCount: skills.filter((s: any) => s.category?.includes('language')).length,
    }

    return new Response(
      JSON.stringify({
        ...parsedResult,
        _debug: debugTelemetry
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`[EDGE FUNCTION] Falha no processamento:`, error)
    return new Response(
      JSON.stringify({ error: `Erro no processamento da IA: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function crossValidate(result: any, rawText: string): string[] {
  const errors: string[] = [];
  const textLower = rawText.toLowerCase();

  // 1. Proibir Empresa do Segmento e mocks
  const experiences = result.experiences || [];
  for (const exp of experiences) {
    if (exp.companyName) {
      const coName = exp.companyName.toLowerCase();
      if (coName.includes("empresa do segmento") || coName.includes("empresa demo") || coName.includes("empresa principal")) {
        errors.push("A IA gerou o nome de empresa fictício/template: '" + exp.companyName + "'.");
      }
      if (!textLower.includes(coName)) {
        const parts = coName.split(/\s+/).filter((w: string) => w.length > 2);
        const hasPart = parts.some((p: string) => textLower.includes(p));
        if (!hasPart) {
          errors.push(`A empresa '${exp.companyName}' listada na experiência profissional não consta no currículo.`);
        }
      }
    }
    if (exp.role) {
      const roleLower = exp.role.toLowerCase();
      if (roleLower.includes("desenvolvedor") && !textLower.includes("desenvolvedor") && !textLower.includes("developer")) {
        errors.push(`O cargo '${exp.role}' menciona 'Desenvolvedor' mas não há menção a desenvolvimento no currículo.`);
      }
    }
  }

  // 2. Proibir skills e tecnologias fictícias / inventadas
  const skills = result.skills || [];
  for (const s of skills) {
    const sName = s.name.toLowerCase();
    const forbidden = ["typescript", "react", "node", "javascript", "docker", "kubernetes", "vue"];
    if (forbidden.includes(sName) && !textLower.includes(sName)) {
      errors.push(`A skill/tecnologia '${s.name}' foi extraída mas não está presente no currículo.`);
    }
    if (!textLower.includes(sName)) {
      const parts = sName.split(/\s+/).filter((w: string) => w.length > 3);
      const hasPart = parts.some((p: string) => textLower.includes(p));
      if (!hasPart && parts.length > 0) {
        errors.push(`A competência '${s.name}' não possui evidências textuais no currículo.`);
      }
    }
  }

  return errors;
}

function cleanString(input: string): string {
  if (!input) return '';
  return input
    .replace(/\0/g, '') // Remove actual null bytes
    .replace(/\\u0000/g, '') // Remove string representations of null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Remove non-printable control characters
}
