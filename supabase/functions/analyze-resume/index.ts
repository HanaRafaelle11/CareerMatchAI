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
    const { rawText, fileName, storagePath } = await req.json()
    console.log(`[EDGE FUNCTION] Recebido analyze-resume:`, { fileName, storagePath, hasRawText: !!rawText })

    let textToAnalyze = rawText || ''

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
      console.log(`[EDGE FUNCTION] Arquivo baixado. Tamanho: ${fileData.size} bytes. Tipo MIME: ${contentType}`)

      if (contentType.includes('text/plain') || storagePath.endsWith('.txt')) {
        textToAnalyze = await fileData.text()
      } else if (contentType.includes('pdf') || storagePath.endsWith('.pdf')) {
        try {
          console.log(`[EDGE FUNCTION] Extraindo texto de PDF com unpdf...`)
          const arrayBuffer = await fileData.arrayBuffer()
          const pdfProxy = await getDocumentProxy(new Uint8Array(arrayBuffer))
          const { text } = await extractText(pdfProxy, { mergePages: true })
          textToAnalyze = text
          console.log(`[EDGE FUNCTION] Texto do PDF extraído. Caracteres: ${textToAnalyze.length}`)
        } catch (pdfErr) {
          console.error(`[EDGE FUNCTION] Erro ao extrair PDF:`, pdfErr)
          throw new Error(`Erro ao extrair conteúdo do arquivo PDF: ${pdfErr.message}`)
        }
      } else if (contentType.includes('officedocument.wordprocessingml.document') || storagePath.endsWith('.docx')) {
        try {
          console.log(`[EDGE FUNCTION] Extraindo texto de DOCX...`)
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
      }
    }

    textToAnalyze = cleanString(textToAnalyze)

    if (!textToAnalyze || !textToAnalyze.trim()) {
      return new Response(
        JSON.stringify({ error: 'Nenhum texto pôde ser extraído do currículo fornecido.' }),
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
      Não invente dados, extraia apenas o que puder ser inferido com segurança do texto.
      Classifique as competências (skills) estritamente em categorias: 'hard_skill', 'soft_skill', 'tool' ou 'language'.
      Estime o tempo total de experiência em anos baseado no histórico profissional (ex: 3.5).
      Se houver idiomas, extraia seu nível de proficiência apropriado.

      Formato do JSON esperado:
      {
        "fullName": "Nome Completo",
        "headline": "Título Profissional sugerido baseado no perfil",
        "structuredSummary": "Resumo executivo profissional de até 4 frases.",
        "yearsOfExperience": 5.5,
        "experiences": [
          {
            "companyName": "Nome da Empresa",
            "role": "Cargo",
            "description": "Descrição sucinta das atividades executadas",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD ou null se atual",
            "isCurrent": true/false,
            "highlights": ["Destaque 1 (ex: reduziu churn em 12%)", "Destaque 2"]
          }
        ],
        "skills": [
          { "name": "Nome da skill", "category": "hard_skill/soft_skill/tool/language", "proficiencyLevel": "básico/intermediário/avançado/fluente" }
        ],
        "education": [
          { "institution": "Nome da Instituição", "degree": "Título do curso (Bacharelado/Pós/etc)", "fieldOfStudy": "Área de Estudo", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }
        ]
      }

      Texto do currículo:
      """
      ${textToAnalyze}
      """
    `

    console.log(`[EDGE FUNCTION] Enviando prompt para a OpenAI...`)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um assistente de IA especialista em recrutamento e análise estruturada de currículos.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })

    const rawContent = response.choices[0].message.content || '{}'
    const parsedResult = JSON.parse(cleanString(rawContent))
    console.log(`[EDGE FUNCTION] Resposta recebida da OpenAI com sucesso.`)

    return new Response(
      JSON.stringify(parsedResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`[EDGE FUNCTION] Falha no processamento:`, error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function simulateResumeParsing(rawText: string, fileName: string) {
  const words = rawText.toLowerCase();
  const nameLine = rawText.split('\n')[0]?.trim() || 'Candidato CareerMatch';
  
  const detectedSkills = [];
  const skillOptions = [
    { name: 'React', category: 'hard_skill', match: ['react', 'next.js', 'nextjs'] },
    { name: 'Node.js', category: 'hard_skill', match: ['node', 'express', 'nest'] },
    { name: 'TypeScript', category: 'hard_skill', match: ['typescript', 'ts'] },
    { name: 'Tailwind CSS', category: 'tool', match: ['tailwind', 'css'] },
    { name: 'Docker', category: 'tool', match: ['docker', 'container'] },
    { name: 'PostgreSQL', category: 'hard_skill', match: ['postgres', 'sql', 'database'] },
    { name: 'Inglês', category: 'language', match: ['inglês', 'english', 'advanced'] },
    { name: 'Comunicação', category: 'soft_skill', match: ['comunicação', 'teamwork', 'colaboração'] }
  ];

  skillOptions.forEach(opt => {
    if (opt.match.some(m => words.includes(m))) {
      detectedSkills.push({
        name: opt.name,
        category: opt.category,
        proficiencyLevel: 'avançado'
      });
    }
  });

  if (detectedSkills.length === 0) {
    detectedSkills.push(
      { name: 'React', category: 'hard_skill', proficiencyLevel: 'avançado' },
      { name: 'JavaScript', category: 'hard_skill', proficiencyLevel: 'avançado' },
      { name: 'Comunicação', category: 'soft_skill', proficiencyLevel: 'avançado' }
    );
  }

  return {
    fullName: nameLine,
    headline: `Software Engineer especializado em ${detectedSkills[0]?.name || 'Tecnologia'}`,
    structuredSummary: `Profissional de tecnologia com competências em desenvolvimento. Focado em boas práticas, qualidade de código e evolução contínua.`,
    yearsOfExperience: 3.5,
    experiences: [
      {
        companyName: 'Empresa do Segmento',
        role: 'Desenvolvedor Pleno',
        description: 'Desenvolvimento e manutenção de sistemas web responsivos e escaláveis.',
        startDate: '2023-01-01',
        isCurrent: true,
        highlights: [
          'Entregou rotinas integradas com qualidade de código.',
          'Colaborou na estruturação de testes automatizados.'
        ]
      }
    ],
    skills: detectedSkills,
    education: [
      {
        institution: 'Universidade de Tecnologia',
        degree: 'Tecnólogo',
        fieldOfStudy: 'Análise e Desenvolvimento de Sistemas',
        startDate: '2020-01-01',
        endDate: '2022-12-31'
      }
    ]
  };
}

function cleanString(input: string): string {
  if (!input) return '';
  return input
    .replace(/\0/g, '') // Remove actual null bytes
    .replace(/\\u0000/g, '') // Remove string representations of null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Remove non-printable control characters, keeping tabs, newlines, carriage returns
}
