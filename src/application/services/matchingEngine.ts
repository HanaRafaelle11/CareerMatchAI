import type { Resume, Job, Match, GapAnalysis, CoverLetter, InterviewPrep, CareerProfile } from '../../domain/models/types';
import type { CareerProfileNew } from '../hooks/useMyProfileAi';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

// ─────────────────────────────────────────────────────────────────
// Helpers para o perfil consolidado (career_profiles novo)
// ─────────────────────────────────────────────────────────────────

/**
 * Calcula anos de experiência a partir do histórico de experiências do perfil consolidado.
 * Evita contar períodos sobrepostos de cargos simultâneos.
 */
export function calcYearsFromExperiences(
  experiences: CareerProfileNew['experience']
): number {
  if (!experiences || experiences.length === 0) return 0;

  // Coleta todos os intervalos [startMs, endMs]
  const intervals: [number, number][] = experiences.map(exp => {
    let start = exp.startDate ? new Date(exp.startDate).getTime() : new Date('2000-01-01').getTime();
    if (isNaN(start)) {
      start = new Date('2000-01-01').getTime();
    }
    let end = exp.isCurrent || !exp.endDate ? Date.now() : new Date(exp.endDate).getTime();
    if (isNaN(end)) {
      end = Date.now();
    }
    return [Math.min(start, end), Math.max(start, end)];
  });

  // Ordena e mescla intervalos para evitar dupla contagem
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

/**
 * Extrai uma lista plana de nomes de skill a partir do perfil consolidado.
 * Combina skills técnicas, soft skills, ats_keywords e methodologies dos insights.
 */
export function buildFlatSkillsFromProfile(profile: CareerProfileNew): string[] {
  const names: string[] = [];

  // Skills explícitas
  for (const s of profile.skills || []) {
    if (s.name) names.push(s.name.toLowerCase());
  }
  // Soft skills
  for (const ss of profile.soft_skills || []) {
    names.push(ss.toLowerCase());
  }
  // ATS keywords existentes
  for (const kw of profile.ats_keywords?.existing_keywords || []) {
    names.push(kw.toLowerCase());
  }
  // ATS keywords recomendadas (também ajudam no match semântico)
  for (const kw of profile.ats_keywords?.recommended_keywords || []) {
    names.push(kw.toLowerCase());
  }
  // Summary como texto extra para match por substring
  if (profile.summary) {
    names.push(profile.summary.toLowerCase());
  }

  return [...new Set(names)];
}

/**
 * Verifica se uma skill aparece em qualquer texto longo (descrições de experiência).
 */
function skillInExperienceText(skill: string, experiences: CareerProfileNew['experience']): boolean {
  const needle = skill.toLowerCase();
  for (const exp of experiences || []) {
    const haystack = [
      exp.description || '',
      ...(exp.highlights || []),
      exp.role || '',
      exp.companyName || ''
    ].join(' ').toLowerCase();
    if (haystack.includes(needle)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────
// Mapa semântico de sinônimos expandido
// ─────────────────────────────────────────────────────────────────
const SYNONYM_MAP: Record<string, string[]> = {
  // Tecnologia
  'react': ['react.js', 'reactjs', 'next.js', 'nextjs', 'frontend', 'front-end', 'react native'],
  'typescript': ['ts', 'javascript', 'js', 'ecmascript'],
  'node.js': ['nodejs', 'node', 'express', 'nestjs', 'backend', 'back-end'],
  'postgresql': ['postgres', 'sql', 'mysql', 'banco de dados', 'database', 'supabase'],
  'aws': ['amazon web services', 'cloud', 'aws cloud', 's3', 'ec2', 'lambda'],
  'docker': ['kubernetes', 'containers', 'devops', 'k8s'],
  'python': ['py', 'django', 'flask', 'fastapi'],
  // Customer Success & SaaS
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
  // Liderança & Gestão
  'liderança': [
    'gestão de times', 'people management', 'team lead', 'team leader',
    'mentor', 'mentoria', 'lider', 'líder', 'coordenação', 'gerência',
    'gestão de equipe', 'liderou', 'coordenou', 'gerenciou', 'squad lead'
  ],
  'gestão': ['management', 'gerenciamento', 'coordenação', 'administração', 'liderança'],
  // Metodologias
  'agile': ['ágil', 'scrum', 'kanban', 'sprint', 'metodologia ágil'],
  'okr': ['okrs', 'objetivos e resultados-chave', 'metas', 'kpi', 'kpis'],
  // Dados
  'analytics': ['análise de dados', 'data analysis', 'bi', 'business intelligence', 'tableau', 'power bi', 'looker'],
  'sql': ['postgresql', 'mysql', 'banco de dados', 'queries', 'consultas sql', 'database'],
  // Comunicação
  'comunicação': ['communication', 'apresentações', 'presentations', 'stakeholders', 'storytelling'],
  // Vendas
  'vendas': ['sales', 'comercial', 'revenue', 'receita', 'pipeline', 'prospecção'],
  'enterprise': ['enterprise accounts', 'grandes contas', 'b2b enterprise', 'contas enterprise'],
};

/**
 * Verifica se um requisito está coberto pelas skills do candidato,
 * usando matching direto, por sinônimo e por substring nos textos de experiência.
 */
function checkRequirement(
  req: string,
  flatSkills: string[],
  experiences: CareerProfileNew['experience'] | null
): boolean {
  const reqLower = req.toLowerCase().trim();

  // 1. Match direto
  if (flatSkills.some(s => s === reqLower || s.includes(reqLower) || reqLower.includes(s))) {
    return true;
  }

  // 2. Match por sinônimo
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    const allTerms = [key, ...synonyms];
    if (allTerms.includes(reqLower)) {
      if (allTerms.some(t => flatSkills.some(s => s === t || s.includes(t) || t.includes(s)))) {
        return true;
      }
    }
    // Checa se o requisito é uma das chaves e algum sinônimo bate nas skills
    if (reqLower.includes(key) || key.includes(reqLower)) {
      if (synonyms.some(syn => flatSkills.some(s => s.includes(syn) || syn.includes(s)))) {
        return true;
      }
    }
  }

  // 3. Match por texto das experiências (busca substring no histórico)
  if (experiences && skillInExperienceText(reqLower, experiences)) {
    return true;
  }

  return false;
}

export class MatchingEngine {
  /**
   * Auxiliar para inferir perfil de carreira a partir do currículo parseado (legado)
   */
  public static extractProfile(parsedResume: any): Omit<CareerProfile, 'id' | 'userId' | 'resumeId' | 'createdAt' | 'updatedAt'> {
    const tools = (parsedResume.skills || [])
      .filter((s: any) => s.category?.includes('tool'))
      .map((s: any) => s.name);
    const finalSkills = (parsedResume.skills || [])
      .filter((s: any) => s.category?.includes('skill'))
      .map((s: any) => s.name);
    const languages = (parsedResume.skills || [])
      .filter((s: any) => s.category?.includes('language'))
      .map((s: any) => s.name);

    const roles = parsedResume.experiences?.map((e: any) => e.role) || [];

    return {
      targetRoles: parsedResume.headline ? [parsedResume.headline] : roles.slice(0, 3),
      seniority: parsedResume.seniority || 'senior',
      industries: parsedResume.industries || [],
      skills: finalSkills,
      tools: tools,
      languages: languages,
      preferredLocations: ['Remoto'],
      preferredWorkModes: ['remote', 'hybrid'],
      targetCompanies: [],
      salaryExpectationMin: 0,
      searchKeywords: parsedResume.atsKeywords || [],
      isApprovedByUser: false
    };
  }

  /**
   * Simula ou executa a extração do currículo a partir do texto bruto
   */
  static async parseResumeText(rawText: string, fileName: string): Promise<{
    resume: Omit<Resume, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    careerProfile: Omit<CareerProfile, 'id' | 'userId' | 'resumeId' | 'createdAt' | 'updatedAt'>;
  }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { rawText, fileName }
      });
      if (error) {
        throw new Error(error.message || 'Falha ao processar o currículo no Supabase.');
      }
      if (!data || data.error) {
        throw new Error(data?.error || 'Nenhum dado retornado pela análise da IA.');
      }
      return {
        resume: data,
        careerProfile: this.extractProfile(data)
      };
    }
    throw new Error('Supabase não está configurado. O parser de currículos requer conexão ativa com Supabase e OpenAI.');
  }

  /**
   * Calcula a compatibilidade semântica entre um currículo e uma vaga.
   * Quando `consolidatedProfile` é fornecido, ele é usado como fonte primária
   * substituindo resume.skills e resume.yearsOfExperience.
   */
  static async calculateMatch(
    resume: Resume,
    job: Job,
    consolidatedProfile?: CareerProfileNew | null
  ): Promise<{
    match: Match;
    gapAnalysis: GapAnalysis;
    coverLetter: CoverLetter;
    interviewPrep: InterviewPrep;
  }> {
    // Se o Supabase estiver online com OpenAI/Gemini, invoca a Edge Function
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const isE2EUser = user?.email?.includes('.e2e.') || user?.email === 'hardening.e2e@example.com';
        const { data, error } = await supabase.functions.invoke('match-job', {
          body: { 
            resumeVersionId: resume.resumeVersionId,
            jobId: job.id,
            mockGemini: isE2EUser
          }
        });

        if (error) {
          let errorMessage = error.message;
          try {
            if (error.context) {
              const bodyText = await error.context.text();
              const bodyJson = JSON.parse(bodyText);
              if (bodyJson?.errorDetails?.userMessage) {
                errorMessage = bodyJson.errorDetails.userMessage;
              } else if (bodyJson?.error) {
                errorMessage = bodyJson.error;
              }
            }
          } catch (_) {}
          throw new Error(errorMessage || 'Falha ao calcular compatibilidade da vaga.');
        }

        if (!data) {
          throw new Error('Nenhum dado retornado do cálculo de compatibilidade.');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        return {
          match: {
            id: data.id,
            userId: data.user_id,
            resumeId: data.career_profile_id,
            jobId: data.job_id,
            jobTitle: job.title,
            companyName: job.companyName || '',
            scoreOverall: data.match_score,
            scoreTechnical: data.match_score,
            scoreBehavioral: data.match_score,
            scoreSeniority: data.match_score,
            scoreLocation: 100,
            explanation: {
              strengths: data.strengths || [],
              weaknesses: data.weaknesses || [],
              details: {
                technical: data.recommendation || '',
                behavioral: `Probabilidade de entrevista: ${data.interview_probability}%`,
                seniority: '',
                salary: '',
                location: ''
              }
            },
            createdAt: data.created_at
          },
          gapAnalysis: {
            id: data.id,
            matchId: data.id,
            missingSkills: data.missing_keywords || [],
            skillsToLearn: [],
            toIncludeInResume: [],
            toExcludeFromResume: [],
            repetitiveContent: [],
            lowValueContent: []
          },
          coverLetter: { id: data.id, createdAt: data.created_at },
          interviewPrep: {
            id: data.id,
            matchId: data.id,
            questions: [],
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
            questionsToAsk: [],
            createdAt: data.created_at
          }
        };
      } catch (err: any) {
        console.error('Erro ao invocar match-job do Supabase:', err);
        
        // Registrar erro no banco se houver conexão com Supabase
        try {
          await supabase.from('ai_usage_logs').insert({
            user_id: resume.userId || null,
            feature: 'job-matching',
            model: 'gemini-2.5-flash',
            input_tokens: 0,
            output_tokens: 0,
            estimated_cost: 0,
            error_message: err.message || String(err)
          });
        } catch (dbErr) {
          console.error('Erro ao gravar log de falha no banco:', dbErr);
        }

        throw err;
      }
    }

    // Motor local semântico
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ── Fonte de dados: consolidatedProfile > resume.skills legado ──
    const flatSkills = consolidatedProfile
      ? buildFlatSkillsFromProfile(consolidatedProfile)
      : resume.skills.map(s => s.name.toLowerCase());

    const experiences = consolidatedProfile?.experience ?? null;

    // Anos de experiência: calcula a partir do histórico quando disponível
    const yearsOfExperience = consolidatedProfile && consolidatedProfile.experience.length > 0
      ? calcYearsFromExperiences(consolidatedProfile.experience)
      : (resume.yearsOfExperience || 0);

    // 1. Match Técnico
    let matchedCount = 0;
    const matchedSkillsList: string[] = [];
    const missingSkillsList: string[] = [];

    job.requirements.forEach(req => {
      if (checkRequirement(req, flatSkills, experiences)) {
        matchedCount++;
        matchedSkillsList.push(req);
      } else {
        missingSkillsList.push(req);
      }
    });

    const scoreTechnical = Math.round((matchedCount / Math.max(job.requirements.length, 1)) * 100);

    // 2. Match Comportamental
    const softTerms = consolidatedProfile
      ? [...(consolidatedProfile.soft_skills || []).map(s => s.toLowerCase()), ...flatSkills]
      : resume.skills.filter(s => s.category === 'soft_skill').map(s => s.name.toLowerCase());

    const hasLeadership = softTerms.some(s =>
      s.includes('lider') || s.includes('mentor') || s.includes('liderança') ||
      s.includes('gestão') || s.includes('team lead') || s.includes('management')
    );
    const hasAgile = softTerms.some(s =>
      s.includes('ágil') || s.includes('agile') || s.includes('scrum') || s.includes('kanban')
    );
    const hasComms = softTerms.some(s =>
      s.includes('comun') || s.includes('equipe') || s.includes('trabalho') ||
      s.includes('stakeholder') || s.includes('apresent')
    );

    let scoreBehavioral = 70;
    if (hasLeadership) scoreBehavioral += 10;
    if (hasAgile) scoreBehavioral += 10;
    if (hasComms) scoreBehavioral += 10;
    scoreBehavioral = Math.min(scoreBehavioral, 100);

    // 3. Match de Senioridade
    const seniorityMap: Record<string, { min: number, max: number }> = {
      'junior': { min: 0, max: 2 },
      'pleno': { min: 2, max: 5 },
      'senior': { min: 5, max: 10 },
      'lead': { min: 7, max: 15 },
      'director': { min: 10, max: 25 }
    };
    const jobSeniority = job.seniority.toLowerCase();
    const range = seniorityMap[jobSeniority] || { min: 2, max: 5 };
    const exp = yearsOfExperience;

    let scoreSeniority = 100;
    if (exp < range.min) {
      scoreSeniority = Math.max(50, 100 - (range.min - exp) * 20);
    } else if (exp > range.max) {
      scoreSeniority = Math.max(80, 100 - (exp - range.max) * 5);
    }
    scoreSeniority = Math.round(scoreSeniority);

    // 4. Match de Localização
    let scoreLocation = 100;
    if (job.workMode === 'onsite' && job.location.toLowerCase() !== 'remoto') {
      scoreLocation = 75;
    } else if (job.workMode === 'hybrid') {
      scoreLocation = 85;
    }

    // 5. Match Salarial
    let scoreSalary = 90;
    const salaryExpectation = (consolidatedProfile
      ? Number((consolidatedProfile.personal as any)?.preferences?.salaryExpectationMin || 0)
      : 0) || 11000;

    if (job.salaryMin && salaryExpectation > 0) {
      if (salaryExpectation > job.salaryMax!) {
        scoreSalary = Math.max(50, Math.round(100 - ((salaryExpectation - job.salaryMax!) / job.salaryMax!) * 100));
      } else if (salaryExpectation < job.salaryMin) {
        scoreSalary = 100;
      } else {
        scoreSalary = 95;
      }
    }

    // 6. Score Geral
    let scoreOverall = Math.round(
      (scoreTechnical * 0.45) +
      (scoreBehavioral * 0.20) +
      (scoreSeniority * 0.20) +
      (scoreLocation * 0.10) +
      (scoreSalary * 0.05)
    );

    if (scoreTechnical === 0) {
      scoreOverall = Math.round(scoreOverall * 0.15);
    } else if (scoreTechnical < 20) {
      scoreOverall = Math.round(scoreOverall * 0.40);
    }

    const matchId = `match-dynamic-${job.id}`;

    // Construção de explicações conscientes e construtivas
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (scoreTechnical > 80) {
      strengths.push(`Excelente compatibilidade técnica: encontramos ${matchedSkillsList.length} das ${job.requirements.length} competências solicitadas, incluindo ${matchedSkillsList.slice(0, 4).join(', ')}.`);
    } else if (scoreTechnical > 50) {
      strengths.push(`Boa aderência técnica: ${matchedSkillsList.length} de ${job.requirements.length} competências mapeadas no seu perfil, como ${matchedSkillsList.slice(0, 3).join(', ')}.`);
      if (missingSkillsList.length > 0) {
        weaknesses.push(`Para aumentar ainda mais a aderência, vale destacar ou desenvolver: ${missingSkillsList.slice(0, 3).join(', ')}.`);
      }
    } else {
      if (matchedSkillsList.length > 0) {
        strengths.push(`Identificamos ${matchedSkillsList.length} competência(s) compatível(is): ${matchedSkillsList.join(', ')}.`);
      }
      weaknesses.push(`A vaga requer competências adicionais: ${missingSkillsList.slice(0, 4).join(', ')}.`);
    }

    if (exp >= range.min) {
      strengths.push(`Experiência de ${exp} anos é ideal para o nível ${job.seniority} buscado pela vaga.`);
    } else if (exp > 0) {
      weaknesses.push(`Sua experiência (${exp} anos) está levemente abaixo do esperado para nível ${job.seniority}. Isso raramente é bloqueador quando a aderência técnica é alta.`);
    }

    if (job.workMode === 'remote') {
      strengths.push(`Vaga 100% remota, compatível com seu modelo de trabalho preferido.`);
    }

    const candidateName = consolidatedProfile?.personal?.fullName || resume.fileName?.split('_')[1] || 'Candidato';

    const explanation = {
      strengths,
      weaknesses,
      details: {
        technical: `Você atende a ${matchedSkillsList.length} dos ${job.requirements.length} requisitos técnicos da vaga.${matchedSkillsList.length > 0 ? ` Competências confirmadas: ${matchedSkillsList.slice(0, 5).join(', ')}.` : ''} ${missingSkillsList.length > 0 ? `Não identificadas no perfil: ${missingSkillsList.join(', ')}.` : 'Perfil técnico plenamente alinhado!'}`,
        behavioral: `As soft skills e experiências extraídas do seu histórico indicam perfil altamente alinhado com a cultura de ${job.companyName}.`,
        seniority: `Com ${exp} anos de experiência, você se enquadra como perfil ${exp >= 10 ? 'Sênior/Especialista' : exp >= 5 ? 'Sênior' : 'Pleno'}. A vaga busca ${job.seniority}, representando um match de ${scoreSeniority}%.`,
        salary: job.salaryMin ? `A faixa salarial de ${job.currency} ${job.salaryMin?.toLocaleString('pt-BR')} - ${job.salaryMax?.toLocaleString('pt-BR')} é condizente com o mercado para este perfil.` : 'Vaga com salário a combinar.',
        location: `Modelo de trabalho ${job.workMode} — ${job.location}.`
      }
    };

    const match: Match = {
      id: matchId,
      userId: resume.userId,
      resumeId: resume.id,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      scoreOverall,
      scoreTechnical,
      scoreBehavioral,
      scoreSeniority,
      scoreSalary,
      scoreLocation,
      explanation,
      createdAt: new Date().toISOString()
    };

    const gapAnalysis: GapAnalysis = {
      id: `gap-dynamic-${job.id}`,
      matchId,
      missingSkills: missingSkillsList,
      skillsToLearn: missingSkillsList.map(s => `${s} — Aprofundar com projetos práticos e certificações relevantes`),
      toIncludeInResume: missingSkillsList.slice(0, 3).map(s =>
        `Destacar resultados mensuráveis relacionados a ${s} nas experiências mais recentes.`
      ),
      toExcludeFromResume: ['Remover menções redundantes a tecnologias muito antigas sem contexto de uso recente.'],
      repetitiveContent: ['Evitar repetir as mesmas tarefas operacionais em múltiplos cargos sem destacar resultados.'],
      lowValueContent: ['Omitir cursos muito básicos já implícitos na senioridade e experiência atual.']
    };

    const coverLetter: CoverLetter = {
      id: `cl-dynamic-${job.id}`,
      matchId,
      content: `Prezada equipe de Atração de Talentos da ${job.companyName},

Escrevo para expressar meu forte interesse na vaga de ${job.title}. Com ${exp} anos de experiência e competências como ${matchedSkillsList.slice(0, 4).join(', ')}, acredito que posso contribuir de forma significativa para os desafios da posição.

Em minha trajetória profissional, atuei na ${consolidatedProfile?.experience?.[0]?.companyName || 'empresa anterior'} como ${consolidatedProfile?.experience?.[0]?.role || 'profissional da área'}, entregando resultados com foco em qualidade e impacto de negócio. Admiro a reputação da ${job.companyName} no mercado e estou entusiasmado com a possibilidade de contribuir com meu histórico para acelerar o crescimento da equipe.

Fico à disposição para um contato inicial.

Atenciosamente,
${candidateName}`,
      createdAt: new Date().toISOString()
    };

    const interviewPrep: InterviewPrep = {
      id: `ip-dynamic-${job.id}`,
      matchId,
      strengths,
      weaknesses,
      questionsToAsk: [
        `Como a equipe da ${job.companyName} organiza o ciclo de desenvolvimento e evolução do produto/serviço?`,
        `Qual o principal desafio que a pessoa ocupando a cadeira de ${job.title} precisará endereçar nos primeiros 90 dias?`
      ],
      questions: [
        {
          question: `Como você aplicaria sua experiência em ${matchedSkillsList[0] || 'suas principais competências'} em um cenário real da vaga de ${job.title}?`,
          suggestedAnswer: `Partindo do meu histórico prático, eu iniciaria mapeando os requisitos principais, garantindo que a solução gerasse valor mensurável e alinhamento com os stakeholders.`,
          type: 'technical'
        },
        {
          question: missingSkillsList.length > 0
            ? `A vaga menciona ${missingSkillsList[0]}. Como você se posiciona em relação a essa competência?`
            : `Qual competência do seu perfil você considera mais relevante para esta vaga?`,
          suggestedAnswer: missingSkillsList.length > 0
            ? `Estou em processo de desenvolvimento nessa área, com estudos práticos em andamento. Minha rápida curva de aprendizado, comprovada em experiências anteriores, me permite atingir proficiência rapidamente.`
            : `Destaco minha experiência em ${matchedSkillsList[0] || 'Customer Success'}, com resultados concretos em projetos anteriores.`,
          type: 'technical'
        },
        {
          question: 'Conte sobre um momento em que você enfrentou um desafio complexo e como o resolveu.',
          suggestedAnswer: 'Analise o contexto (S), identifique as ações específicas que tomei (A) e compartilhe o resultado mensurável obtido (R), preferencialmente com métricas ou impacto de negócio.',
          type: 'behavioral'
        }
      ],
      createdAt: new Date().toISOString()
    };

    return { match, gapAnalysis, coverLetter, interviewPrep };
  }

  /**
   * Cálculo síncrono para listagens em lote.
   * Aceita consolidatedProfile como fonte primária.
   */
  static calculateMatchSync(
    resume: Resume,
    job: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | Job,
    consolidatedProfile?: CareerProfileNew | null
  ): {
    scoreOverall: number;
    scoreTechnical: number;
    scoreBehavioral: number;
    scoreSeniority: number;
    scoreLocation: number;
    scoreSalary?: number;
    missingSkills: string[];
    matchedSkills: string[];
    yearsOfExperience: number;
  } {
    const flatSkills = consolidatedProfile
      ? buildFlatSkillsFromProfile(consolidatedProfile)
      : resume.skills.map(s => s.name.toLowerCase());

    const experiences = consolidatedProfile?.experience ?? null;

    const yearsOfExperience = consolidatedProfile && consolidatedProfile.experience.length > 0
      ? calcYearsFromExperiences(consolidatedProfile.experience)
      : (resume.yearsOfExperience || 0);

    let matchedCount = 0;
    const missingSkills: string[] = [];
    const matchedSkills: string[] = [];

    job.requirements.forEach(req => {
      if (checkRequirement(req, flatSkills, experiences)) {
        matchedCount++;
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });

    const scoreTechnical = Math.round((matchedCount / Math.max(job.requirements.length, 1)) * 100);

    // Behavioral
    const softTerms = consolidatedProfile
      ? [...(consolidatedProfile.soft_skills || []).map(s => s.toLowerCase()), ...flatSkills]
      : resume.skills.filter(s => s.category === 'soft_skill').map(s => s.name.toLowerCase());

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
    const jobSeniority = (job as Job).seniority?.toLowerCase() || 'senior';
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
    if ((job as Job).workMode === 'onsite' && (job as Job).location?.toLowerCase() !== 'remoto') {
      scoreLocation = 75;
    } else if ((job as Job).workMode === 'hybrid') {
      scoreLocation = 85;
    }

    // Salary
    let scoreSalary = 90;
    const salaryExpectation = (consolidatedProfile
      ? Number((consolidatedProfile.personal as any)?.preferences?.salaryExpectationMin || 0)
      : 0) || 11000;

    if (job.salaryMin && salaryExpectation > 0) {
      if (salaryExpectation > job.salaryMax!) {
        scoreSalary = Math.max(50, Math.round(100 - ((salaryExpectation - job.salaryMax!) / job.salaryMax!) * 100));
      } else if (salaryExpectation < job.salaryMin) {
        scoreSalary = 100;
      } else {
        scoreSalary = 95;
      }
    }

    let scoreOverall = Math.round(
      (scoreTechnical * 0.45) +
      (scoreBehavioral * 0.20) +
      (scoreSeniority * 0.20) +
      (scoreLocation * 0.10) +
      (scoreSalary * 0.05)
    );

    if (scoreTechnical === 0) {
      scoreOverall = Math.round(scoreOverall * 0.15);
    } else if (scoreTechnical < 20) {
      scoreOverall = Math.round(scoreOverall * 0.40);
    }

    return {
      scoreOverall,
      scoreTechnical,
      scoreBehavioral,
      scoreSeniority,
      scoreLocation,
      scoreSalary,
      missingSkills,
      matchedSkills,
      yearsOfExperience
    };
  }
}
