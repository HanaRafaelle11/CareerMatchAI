import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.24.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resume, job } = await req.json()

    if (!resume || !job) {
      return new Response(
        JSON.stringify({ error: 'Os dados do currículo e da vaga são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.warn("OPENAI_API_KEY não definida. Usando motor de match local simulado.")
      const mockResult = simulateMatch(resume, job)
      return new Response(
        JSON.stringify(mockResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({ apiKey })

    const prompt = `
      Você é o motor de match semântico proprietário do CareerMatch AI.
      Sua tarefa é comparar um currículo estruturado com a descrição e requisitos de uma vaga de emprego.
      Analise semanticamente (não apenas por palavras chaves idênticas). Por exemplo, entenda que Next.js implica noções avançadas de React, ou que liderar squads equivale a liderança ágil.

      Calcule quatro scores de 0 a 100:
      1. Score Técnico (Aderência de ferramentas, linguagens e frameworks)
      2. Score Comportamental (Alinhamento de soft skills deduzidas ou explícitas)
      3. Score de Senioridade (Comparação do nível da vaga com os anos e conquistas do candidato)
      4. Score Geral (Média ponderada: 50% Técnico, 25% Senioridade, 25% Comportamental)

      Além disso, forneça uma análise detalhada dos Gaps (competências ausentes, o que adicionar ao currículo, o que remover ou enxugar) e uma explicação qualitativa dos pontos fortes e fracos.

      Retorne estritamente um objeto JSON com esta estrutura:
      {
        "scoreOverall": 85,
        "scoreTechnical": 90,
        "scoreBehavioral": 80,
        "scoreSeniority": 85,
        "explanation": {
          "strengths": ["Ponto forte 1", "Ponto forte 2"],
          "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
          "details": {
            "technical": "Explicação técnica detalhada...",
            "behavioral": "Explicação comportamental...",
            "seniority": "Explicação da senioridade..."
          }
        },
        "gapAnalysis": {
          "missingSkills": ["Docker", "Kubernetes"],
          "skillsToLearn": ["Aprender Docker básico para microsserviços"],
          "toIncludeInResume": ["Mencionar projetos em que utilizou APIs REST"],
          "toExcludeFromResume": ["Remover experiências antigas não correlatas"],
          "repetitiveContent": ["Evitar repetir a palavra 'desenvolvimento' em todas as conquistas"],
          "lowValueContent": ["Curso de digitação rápida dos anos 2010"]
        }
      }

      Dados do Currículo:
      ${JSON.stringify(resume, null, 2)}

      Dados da Vaga:
      Título: ${job.title}
      Descrição: ${job.description}
      Requisitos: ${JSON.stringify(job.requirements)}
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um Tech Lead e Recrutador especialista em avaliar compatibilidade técnica e comportamental de candidatos a vagas de tecnologia.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })

    const parsedResult = JSON.parse(response.choices[0].message.content || '{}')

    return new Response(
      JSON.stringify(parsedResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Função auxiliar de simulação local de match semântico
function simulateMatch(resume: any, job: any) {
  const resumeSkills = (resume.skills || []).map((s: any) => s.name.toLowerCase());
  const jobRequirements = (job.requirements || []).map((r: string) => r.toLowerCase());

  let matchedCount = 0;
  const matchedList: string[] = [];
  const missingList: string[] = [];

  jobRequirements.forEach((req: string) => {
    // Checagem semântica básica em JS
    const hasDirect = resumeSkills.includes(req);
    const hasPartial = resumeSkills.some((s: string) => s.includes(req) || req.includes(s));
    
    if (hasDirect || hasPartial) {
      matchedCount++;
      matchedList.push(req);
    } else {
      missingList.push(req);
    }
  });

  const scoreTechnical = Math.round((matchedCount / Math.max(jobRequirements.length, 1)) * 100);
  const scoreBehavioral = 85;
  const scoreSeniority = resume.yearsOfExperience >= 5 ? 90 : 75;
  const scoreOverall = Math.round((scoreTechnical * 0.5) + (scoreSeniority * 0.25) + (scoreBehavioral * 0.25));

  return {
    scoreOverall,
    scoreTechnical,
    scoreBehavioral,
    scoreSeniority,
    explanation: {
      strengths: [
        `Domínio de competências essenciais como: ${matchedList.slice(0, 3).join(', ') || 'React'}.`,
        `Tempo de experiência condizente com a senioridade exigida.`
      ],
      weaknesses: missingList.length > 0 ? [
        `Ausência de menção clara às seguintes competências: ${missingList.slice(0, 3).join(', ')}.`
      ] : [`Nenhum gap crítico de tecnologia foi identificado.`],
      details: {
        technical: `Você domina cerca de ${matchedList.length} de um total de ${jobRequirements.length} stacks indicadas na vaga de ${job.title}.`,
        behavioral: `As soft skills mapeadas no currículo condizem com o perfil de liderança e comunicação necessários para a vaga.`,
        seniority: `Você possui ${resume.yearsOfExperience} anos de experiência. A vaga demanda nível intermediário/sênior, tornando seu perfil altamente competitivo.`
      }
    },
    gapAnalysis: {
      missingSkills: missingList,
      skillsToLearn: missingList.map(s => `Aprender conceitos fundamentais e aplicar em projetos práticos de ${s}`),
      toIncludeInResume: missingList.slice(0, 2).map(s => `Incluir menção ao estudo ou uso básico de ${s} nas descrições de projetos`),
      toExcludeFromResume: ['Reduzir descrições redundantes em experiências profissionais de curta duração'],
      repetitiveContent: ['Evitar repetir competências técnicas redundantes em múltiplos cargos listados'],
      lowValueContent: ['Remover hobbies ou certificações muito antigas que não agregam valor técnico ao cargo de desenvolvedor']
    }
  };
}
