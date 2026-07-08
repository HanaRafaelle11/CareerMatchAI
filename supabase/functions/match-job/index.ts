import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

class JobMatchingEngine {
  static async matchWithGemini(careerProfile: any, jobTitle: string, jobDescription: string): Promise<any> {
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
    const response = await fetch(geminiUrl, {
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

    return JSON.parse(extractedText);
  }

  static async saveJobMatch(supabaseClient: any, userId: string, careerProfileId: string, jobId: string, matchResult: any) {
    const { data, error } = await supabaseClient
      .from('job_matches')
      .insert({
        user_id: userId,
        career_profile_id: careerProfileId,
        job_id: jobId,
        match_score: matchResult.match_score,
        strengths: matchResult.strengths || [],
        weaknesses: matchResult.weaknesses || [],
        missing_keywords: matchResult.missing_keywords || [],
        interview_probability: matchResult.interview_probability,
        recommendation: matchResult.recommendation
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

  try {
    const { resumeId, resumeVersionId, jobId, userId: requestUserId } = await req.json()
    console.log(`[EDGE FUNCTION] Recebido pedido de match:`, { resumeId, resumeVersionId, jobId })

    if ((!resumeId && !resumeVersionId) || !jobId) {
      return new Response(
        JSON.stringify({ error: 'Os parâmetros resumeId (ou resumeVersionId) e jobId são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

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
      
      // Fallback: tentar buscar por resume_version_id igual ao resumeId
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
      return new Response(
        JSON.stringify({ error: 'Perfil de carreira (CareerProfile) correspondente não encontrado. Certifique-se de que o currículo foi analisado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Obter a descrição da vaga
    const { data: jobData, error: jobErr } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobErr || !jobData) {
      return new Response(
        JSON.stringify({ error: `Vaga não encontrada: ${jobErr?.message || 'ID inválido'}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Executar o match semântico no Gemini 2.5 Flash
    const matchResult = await JobMatchingEngine.matchWithGemini(
      careerProfile,
      jobData.title,
      jobData.description
    );

    // 4. Salvar o resultado na tabela job_matches
    const userId = requestUserId || careerProfile.user_id;
    const savedMatch = await JobMatchingEngine.saveJobMatch(
      supabaseClient,
      userId,
      careerProfile.id,
      jobId,
      matchResult
    );

    console.log(`[EDGE FUNCTION] Match concluído e salvo com sucesso. Score: ${matchResult.match_score}%`);

    return new Response(
      JSON.stringify(savedMatch),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`[EDGE FUNCTION] Erro ao calcular match:`, error)
    return new Response(
      JSON.stringify({ error: `Erro no pipeline do match: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
