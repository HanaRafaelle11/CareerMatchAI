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
    console.log(`[EDGE FUNCTION] Primeiras 500 letras do texto extraído:\n${textToAnalyze.substring(0, 500)}`)

    if (!textToAnalyze || !textToAnalyze.trim()) {
      console.error(`[EDGE FUNCTION] Erro: Nenhum texto pôde ser extraído do currículo.`)
      return new Response(
        JSON.stringify({ error: 'Erro de Auditoria: Nenhum texto pôde ser extraído do currículo fornecido. O arquivo está vazio ou corrompido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.warn("OPENAI_API_KEY não definida no Supabase Edge. Usando parser local simulado.")
      const mockResult = simulateResumeParsing(textToAnalyze, fileName || 'curriculo.pdf')
      return new Response(
        JSON.stringify(mockResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({ apiKey })

    const prompt = `
      Você é um motor de parsing de currículos de última geração para o CareerMatch AI.
      Sua tarefa é ler o texto bruto de um currículo e extrair as informações estruturadas no formato JSON especificado abaixo.
      INSTRUÇÕES CRÍTICAS DE AUDITORIA:
      - Extraia APENAS informações reais presentes no texto fornecido.
      - NUNCA invente, complete ou assuma dados que não existam (como colocar competências genéricas de desenvolvedor se o currículo for de CS).
      - Se um campo ou informação não puder ser extraída do texto, preencha com null.
      - Classifique as competências (skills) estritamente em categorias: 'hard_skill', 'soft_skill', 'tool' ou 'language'.
      - Estime o tempo total de experiência em anos baseado no histórico profissional (ex: 10.5).

      Formato do JSON esperado:
      {
        "fullName": "Nome Completo do Candidato",
        "headline": "Título Profissional sugerido baseado no perfil real (ex: Supervisor de Customer Success & Operations)",
        "structuredSummary": "Resumo executivo profissional de até 4 frases do perfil real (precisa ter pelo menos 100 caracteres).",
        "yearsOfExperience": 10.5,
        "experiences": [
          {
            "companyName": "Nome da Empresa",
            "role": "Cargo",
            "description": "Descrição sucinta das atividades executadas",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD ou null se for o atual",
            "isCurrent": true/false,
            "highlights": ["Destaque 1 (ex: reduziu churn em 12% usando métricas)", "Destaque 2"],
            "achievements": ["Conquista relevante com métrica se houver no texto"]
          }
        ],
        "skills": [
          { "name": "Nome da competência", "category": "hard_skill/soft_skill/tool/language", "proficiencyLevel": "básico/intermediário/avançado/fluente" }
        ],
        "education": [
          { "institution": "Nome da Instituição", "degree": "Título (Bacharelado/Graduação/etc)", "fieldOfStudy": "Área de Estudo", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }
        ],
        "mba": "MBA caso mencionado, ou null",
        "certifications": ["Certificação 1", "Certificação 2"],
        "atsKeywords": ["palavra-chave1", "palavra-chave2"],
        "seniority": "junior/pleno/senior/lead/director",
        "area": "Área de atuação principal (ex: Customer Success, Vendas, Engenharia de Software)",
        "industry": "Indústria principal (ex: SaaS, Fintech, E-commerce)",
        "atsScore": 85
      }

      Texto do currículo:
      """
      ${textToAnalyze}
      """
    `

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error("[EDGE FUNCTION] Erro: OPENAI_API_KEY não está configurada nos segredos do Supabase.")
      return new Response(
        JSON.stringify({ error: 'Configuração ausente: A chave OpenAI (OPENAI_API_KEY) não está configurada no Supabase. Por favor, configure-a executando "supabase secrets set OPENAI_API_KEY=sua_chave" ou pelo painel do Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({ apiKey })

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
    const rawContent = response.choices[0].message.content || '{}'
    const cleanedContent = cleanString(rawContent)
    const parsedResult = JSON.parse(cleanedContent)

    const promptTokens = response.usage?.prompt_tokens || 0
    const completionTokens = response.usage?.completion_tokens || 0
    const totalTokens = response.usage?.total_tokens || 0
    
    console.log(`[EDGE FUNCTION] Chamada à OpenAI concluída com sucesso em ${duration}ms. Tokens: Prompt=${promptTokens}, Completion=${completionTokens}, Total=${totalTokens}`)

    // Executar validações estritas (Etapa 7)
    const experiences = parsedResult.experiences || []
    const skills = parsedResult.skills || []
    const summary = parsedResult.structuredSummary || ""

    if (experiences.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Erro de Validação da IA: Nenhuma experiência profissional foi identificada no currículo. O pipeline foi interrompido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (summary.length < 100) {
      return new Response(
        JSON.stringify({ error: `Erro de Validação da IA: O resumo profissional estruturado gerado ficou muito curto (${summary.length} caracteres), necessitando de no mínimo 100 caracteres.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (skills.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Erro de Validação da IA: Nenhuma competência ou skill foi mapeada no currículo. O pipeline foi interrompido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyNames = experiences.map((exp: any) => exp.companyName).filter(Boolean)
    if (companyNames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Erro de Validação da IA: Nenhuma empresa válida pôde ser identificada no currículo.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      hardSkillsCount: skills.filter((s: any) => s.category === 'hard_skill').length,
      softSkillsCount: skills.filter((s: any) => s.category === 'soft_skill').length,
      toolsCount: skills.filter((s: any) => s.category === 'tool').length,
      languagesCount: skills.filter((s: any) => s.category === 'language').length,
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

function cleanString(input: string): string {
  if (!input) return '';
  return input
    .replace(/\0/g, '') // Remove actual null bytes
    .replace(/\\u0000/g, '') // Remove string representations of null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Remove non-printable control characters
}
