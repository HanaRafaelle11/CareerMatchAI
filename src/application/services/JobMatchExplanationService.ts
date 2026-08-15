import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Job, JobMatchExplanation, CareerFitBreakdown, Resume } from '../../domain/models/types';
import type { CareerProfileNew } from '../hooks/useMyProfileAi';

export class JobMatchExplanationService {
  /**
   * Obtém a explicação da vaga (Lazy On-Demand) com Cache + Snapshots + Score Híbrido (7 Fatores)
   * Trata todos os edge cases de ausência de dados e loga métricas de produto.
   */
  static async getOrGenerateExplanation(
    userId: string,
    job: Job,
    resume?: Resume | null,
    careerProfileNew?: CareerProfileNew | null,
    resumeVersionId?: string
  ): Promise<JobMatchExplanation> {
    if (!userId || !job) {
      throw new Error('Usuário e vaga são obrigatórios para explicação de match.');
    }

    const activeVersionId = resumeVersionId || resume?.resumeVersionId || resume?.id;

    // ── 1. VERIFICAR CACHE EXISTENTE (APENAS SE PERTENCER AO CURRÍCULO ATIVO) ──
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('job_match_explanations')
          .select('*, career_fit_breakdowns(*), career_profile_snapshots(resume_version_id)')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle();

        if (!error && data) {
          const snapshotVersionId = (data.career_profile_snapshots as any)?.resume_version_id;
          const isSameVersion = !activeVersionId || !snapshotVersionId || snapshotVersionId === activeVersionId;

          if (isSameVersion) {
            const breakdownData = data.career_fit_breakdowns?.[0];
            return {
              id: data.id,
              userId: data.user_id,
              jobId: data.job_id,
              resumeVersionId: snapshotVersionId || activeVersionId,
              careerProfileSnapshotId: data.career_profile_snapshot_id,
              overallMatchReason: data.overall_match_reason,
              strengths: data.strengths || [],
              gaps: data.gaps || [],
              recommendation: data.recommendation,
              confidenceScore: data.confidence_score || 85,
              careerFitScore: data.career_fit_score || 80,
              breakdown: breakdownData ? {
                skillsScore: breakdownData.skills_score,
                experienceScore: breakdownData.experience_score,
                seniorityScore: breakdownData.seniority_score,
                careerGoalScore: breakdownData.career_goal_score,
                salaryScore: breakdownData.salary_score,
                locationScore: breakdownData.location_score,
                semanticScore: breakdownData.semantic_score,
              } : undefined,
              createdAt: data.created_at
            };
          } else {
            console.log('[JobMatchExplanationService] Cache de explicação pertence a outro currículo. Ignorando e recalculando.');
          }
        }
      } catch (err) {
        console.warn('[JobMatchExplanationService] Fallback para verificação local de cache:', err);
      }
    }

    const localCached = localDB.getJobExplanation(userId, job.id, activeVersionId);
    if (localCached) {
      return localCached;
    }

    // ── EDGE CASE 1: SEM CURRÍCULO OU PERFIL CADASTRADO ──
    const hasProfileData = !!resume || !!careerProfileNew;
    if (!hasProfileData) {
      const fallbackExplanation: JobMatchExplanation = {
        id: `exp-empty-${Date.now()}`,
        userId,
        jobId: job.id,
        overallMatchReason: 'Faça upload do seu currículo para calcularmos o Match da vaga e gerar diagnósticos com IA.',
        strengths: [
          { skill: job.title, reason: 'Vaga identificada pelo motor de busca.' }
        ],
        gaps: [
          { requirement: 'Currículo não cadastrado', impact: 'Alto', suggestion: 'Envie seu currículo em PDF na aba Perfil para liberar o Match da vaga.' }
        ],
        recommendation: 'Cadastre seu currículo primário para que o Copiloto identifique seus pontos fortes e sugira estratégias de candidatura.',
        confidenceScore: 40,
        careerFitScore: 45,
        breakdown: {
          skillsScore: 40,
          experienceScore: 40,
          seniorityScore: 50,
          careerGoalScore: 50,
          salaryScore: 75,
          locationScore: 75,
          semanticScore: 50
        },
        createdAt: new Date().toISOString()
      };
      return fallbackExplanation;
    }

    // ── 2. CRIAR SNAPSHOT DO PERFIL NO MOMENTO DA ANÁLISE ──
    let snapshotId: string | undefined = undefined;
    const profileSnapshotData = {
      profile: careerProfileNew || null,
      resumeSummary: resume?.structuredSummary || null,
      skills: resume?.skills || careerProfileNew?.skills || [],
      experiencesCount: resume?.experiences?.length || careerProfileNew?.experience?.length || 0,
      timestamp: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: snap } = await supabase
          .from('career_profile_snapshots')
          .insert({
            user_id: userId,
            resume_version_id: resume?.resumeVersionId || null,
            profile_data: profileSnapshotData
          })
          .select('id')
          .single();

        if (snap) snapshotId = snap.id;
      } catch (_) {}
    }

    // ── 3. CÁLCULO AUTÊNTICO DO CAREER FIT SCORE (7 FATORES DETALHADOS) ──
    const { calcYearsFromExperiences, buildFlatSkillsFromProfile } = await import('./matchingEngine');
    const jobTitleLower = (job.title || '').toLowerCase();
    const jobDescLower = (job.description || '').toLowerCase();
    
    // Extrai lista completa de competências e corpus do candidato
    const flatUserSkills = careerProfileNew ? buildFlatSkillsFromProfile(careerProfileNew) : [];
    const directResumeSkills = (resume?.skills || []).map(s => (typeof s === 'string' ? s : s.name).toLowerCase());
    const userSkills = [...new Set([...flatUserSkills, ...directResumeSkills])];
    
    // Constrói corpus abrangente do candidato (experiências, formação, resumo e competências)
    const candidateCorpusParts: string[] = [
      jobTitleLower,
      careerProfileNew?.personal?.headline || '',
      careerProfileNew?.summary || '',
      ...userSkills,
      ...(careerProfileNew?.soft_skills || []),
      ...(careerProfileNew?.ats_keywords?.existing_keywords || []),
      ...(careerProfileNew?.ats_keywords?.recommended_keywords || []),
      ...(careerProfileNew?.experience || []).map(e => `${e.role || ''} ${e.companyName || ''} ${e.description || ''} ${(e.highlights || []).join(' ')}`),
      ...(careerProfileNew?.education || []).map(e => `${e.fieldOfStudy || ''} ${e.institution || ''} ${e.degree || ''}`),
      ...(resume?.experiences || []).map(e => `${e.role || ''} ${(e as any).companyName || (e as any).company || ''} ${e.description || ''}`)
    ];
    const candidateCorpus = candidateCorpusParts.join(' ').toLowerCase();

    // Filtro estrito de requisitos não-técnicos (escalas, benefícios, disponibilidade e termos burocráticos)
    const isTechnicalOrDomainReq = (req: string): boolean => {
      const clean = req.trim().toLowerCase();
      if (clean.length < 3) return false;
      const nonTechnicalPatterns = [
        /\b(5x2|6x1|12x36|escala|rotativa|turno|tarde|manh[ãa]|noite|madrugada|per[íi]odo|integral|meio per[íi]odo)\b/i,
        /\b(disponibilidade|hor[áa]rio|finais de semana|feriados|flex[íi]vel)\b/i,
        /\b(sal[áa]rio|a combinar|benef[íi]cios|vt|vr|va|vale|refei[çc][ãa]o|alimenta[çc][ãa]o|plano|m[ée]dica|odontol[óo]gico|seguro|gympass|cesta|bonifica[çc][ãa]o|plr|comiss[ãa]o)\b/i,
        /\b(ensino m[ée]dio|ensino fundamental|maior de 18|documentos|f[áa]cil acesso|residir|comprovante|vaga efetiva|clt|pj|tempor[áa]rio|est[áa]gio)\b/i,
        /\b(pcd|pcds|defici[êe]ncia|deficiente|afirmativa pcd|exclusiv[ao] pcd|cota pcd|laudo|laudo m[ée]dico)\b/i,
        /^(geral|outros|outra|requisitos)$/i
      ];
      for (const p of nonTechnicalPatterns) {
        if (p.test(clean)) return false;
      }
      return true;
    };

    // Requisitos técnicos filtrados da vaga
    const rawJobReqs = (job.requirements || []).map(r => r.trim()).filter(Boolean);
    const technicalJobReqs = rawJobReqs.filter(isTechnicalOrDomainReq);
    const hasExplicitTechnicalReqs = technicalJobReqs.length > 0;

    // Sinônimos semânticos e termos de domínio para validação de competências
    const DOMAIN_SYNONYMS: Record<string, string[]> = {
      'cozinha': ['culinária', 'gastronomia', 'preparo', 'alimentos', 'buffet', 'refeições', 'pratos', 'cardápio', 'cozinheiro', 'cozinheira', 'ajudante de cozinha', 'auxiliar de cozinha'],
      'preparo de alimentos': ['cozinha', 'buffet', 'culinária', 'gastronomia', 'manipulação', 'alimentos', 'refeições', 'tapiocas', 'omeletes'],
      'atendimento': ['suporte', 'customer', 'sac', 'atendimento ao cliente', 'pós-venda', 'helpdesk', 'service desk', 'cx', 'client'],
      'estoque': ['peps', 'armazenamento', 'câmaras frias', 'conferência', 'materiais', 'inventário', 'almoxarifado'],
      'gestão de processos': ['jira', 'zendesk', 'pops', 'procedimentos padronizados', 'rotinas', 'fluxos', 'kpi']
    };

    const checkReqMatch = (req: string): boolean => {
      const rLower = req.toLowerCase().trim();
      if (candidateCorpus.includes(rLower)) return true;
      if (userSkills.some(s => s.includes(rLower) || rLower.includes(s))) return true;

      const tokens = rLower.split(/[\s,./()\-+]+/).filter(t => t.length > 3);
      if (tokens.length > 0 && tokens.every(t => candidateCorpus.includes(t))) return true;

      for (const [key, synonyms] of Object.entries(DOMAIN_SYNONYMS)) {
        const isRelated = rLower.includes(key) || key.includes(rLower) || tokens.some(t => key.includes(t));
        if (isRelated) {
          if (candidateCorpus.includes(key) || synonyms.some(syn => candidateCorpus.includes(syn))) {
            return true;
          }
        }
      }

      if (tokens.length > 1) {
        const matchedTokens = tokens.filter(t => candidateCorpus.includes(t));
        if ((matchedTokens.length / tokens.length) >= 0.5) return true;
      }

      return false;
    };

    /**
     * Fator 1: Skills (30%) — Cálculo Independente e Autêntico
     */
    let skillsScore = 0;
    let matchedSkillsCount = 0;

    if (hasExplicitTechnicalReqs) {
      matchedSkillsCount = technicalJobReqs.filter(checkReqMatch).length;
      skillsScore = Math.round((matchedSkillsCount / Math.max(1, technicalJobReqs.length)) * 100);
      
      // Se possui experiência direta comprovada no cargo, assegura que o score reflita a vivência prática
      const hasDirectRoleExperience = (careerProfileNew?.experience || []).some(e => {
        const roleLower = (e.role || '').toLowerCase();
        return jobTitleLower.includes(roleLower) || roleLower.includes(jobTitleLower);
      });
      if (hasDirectRoleExperience && skillsScore < 60) {
        skillsScore = Math.max(skillsScore, 75);
      }
    } else {
      // Vaga sem requisitos técnicos explícitos em tópicos: avalia termos-chave da descrição e título
      const descTokens = (jobTitleLower + ' ' + jobDescLower)
        .split(/[\s,./()\-+]+/)
        .filter(w => w.length > 4 && !['sobre', 'empresa', 'estamos', 'buscando', 'profissionais', 'trabalhar', 'equipe', 'responsabilidades', 'atividades'].includes(w));
      
      const uniqueTokens = Array.from(new Set(descTokens)).slice(0, 15);
      const matchedDescTokens = uniqueTokens.filter(t => candidateCorpus.includes(t)).length;
      const tokenRatio = uniqueTokens.length > 0 ? (matchedDescTokens / uniqueTokens.length) : 0.7;
      skillsScore = Math.min(100, Math.max(40, Math.round(tokenRatio * 100)));
    }

    // Fator 2: Experience (25%) — usando calcYearsFromExperiences robusto
    const currentRole = careerProfileNew?.experience?.[0]?.role || (resume?.structured_data?.experience?.[0]?.role);
    const userYears = calcYearsFromExperiences(
      careerProfileNew?.experience ?? [],
      resume?.yearsOfExperience,
      currentRole
    );
    const reqYears = jobTitleLower.includes('senior') || jobTitleLower.includes('sênior') ? 6
      : (jobTitleLower.includes('lead') || jobTitleLower.includes('head') || jobTitleLower.includes('diretor')) ? 10
      : jobTitleLower.includes('pleno') ? 3 : 1;
    const experienceScore = Math.min(100, Math.max(35, Math.round((userYears / Math.max(1, reqYears)) * 85)));

    // Fator 3: Seniority (15%) — Inferência multi-fonte
    const inferredSeniorityFromYears = userYears >= 10 ? 'liderança'
      : userYears >= 7 ? 'senior'
      : userYears >= 3 ? 'pleno'
      : 'junior';
    const userSeniority = (careerProfileNew?.personal as any)?.seniority || inferredSeniorityFromYears;
    let seniorityScore = 75;
    if (userSeniority === job.seniority) seniorityScore = 100;
    else if (userSeniority === 'junior' && (job.seniority === 'senior' || job.seniority === 'lead')) seniorityScore = 35;
    else if (userSeniority === 'senior' && job.seniority === 'junior') seniorityScore = 80;
    else if ((userSeniority === 'liderança' || userSeniority === 'lead') && job.seniority === 'senior') seniorityScore = 90;

    // Fator 4: Career Goal & Domain Alignment (15%) — Avaliação Contínua de Alinhamento de Cargo e Área
    const candidateTargetRoles: string[] = (careerProfileNew?.personal as any)?.preferences?.targetRoles || [];
    const recentExpRole = (careerProfileNew?.experience?.[0]?.role || (resume?.structured_data?.experience?.[0]?.role) || '').toLowerCase();
    const candidateHeadline = (careerProfileNew?.personal?.headline || '').toLowerCase();
    
    let careerGoalScore = 60;
    const directTargetMatch = candidateTargetRoles.some((tr: string) => {
      const trLower = tr.toLowerCase().trim();
      return trLower.length > 2 && (jobTitleLower.includes(trLower) || trLower.includes(jobTitleLower));
    });
    const recentRoleMatch = recentExpRole.length > 2 && (jobTitleLower.includes(recentExpRole) || recentExpRole.includes(jobTitleLower));
    const headlineMatch = candidateHeadline.length > 2 && (jobTitleLower.includes(candidateHeadline) || candidateHeadline.includes(jobTitleLower));

    if (directTargetMatch) {
      careerGoalScore = 95;
    } else if (recentRoleMatch || headlineMatch) {
      careerGoalScore = 85;
    } else {
      // Comparação por tokens de cargo
      const jobTokens = jobTitleLower.split(/[\s,./()\-+]+/).filter(t => t.length > 3);
      const roleTokens = [
        ...candidateTargetRoles.flatMap((r: string) => r.toLowerCase().split(/[\s,./()\-+]+/)),
        ...recentExpRole.split(/[\s,./()\-+]+/),
        ...candidateHeadline.split(/[\s,./()\-+]+/)
      ].filter(t => t.length > 3);

      const commonTokens = jobTokens.filter(t => roleTokens.includes(t));
      if (commonTokens.length > 0) {
        careerGoalScore = Math.min(80, 50 + (commonTokens.length * 15));
      } else {
        // Checa se há dissonância de domínio (ex: profissional de escritório/gestão/tech vs funções operacionais manuais)
        const isOperationalJob = /gari|coletor|limpeza|auxiliar de servicos gerais|serviços gerais|porteiro|copa|cozinheiro|cozinheira|garçom|garçonete|barista/i.test(jobTitleLower);
        const isOfficeBackground = userSkills.some((s: string) => 
          /react|typescript|node|javascript|python|java|sql|customer success|cs|salesforce|gerência|gerente|diretor|lead|liderança|marketing|agile|atendimento/i.test(s)
        ) || candidateTargetRoles.some((r: string) => /success|cs|dev|manager|eng|soft|lider|analista|customer|marketing|design/i.test(r.toLowerCase()));

        if (isOperationalJob && isOfficeBackground) {
          careerGoalScore = 20;
        } else if (candidateTargetRoles.length > 0) {
          careerGoalScore = 40;
        } else {
          careerGoalScore = 55;
        }
      }
    }

    // Fator 5: Salary (5%)
    const expectedSalary = (careerProfileNew?.personal as any)?.preferences?.salaryExpectationMin || 0;
    const salaryScore = expectedSalary > 0 && job.salaryNumeric ? (job.salaryNumeric >= expectedSalary ? 100 : 50) : 75;

    // Fator 6: Location (5%)
    const prefLocs = (careerProfileNew?.personal as any)?.preferences?.preferredLocations || [];
    const locationScore = (prefLocs.some((l: string) => job.location.toLowerCase().includes(l.toLowerCase())) || job.workMode === 'remote') ? 100 : 65;

    // Fator 7: Semantic Context (5%)
    const semanticScore = (job.scores?.overall ? Math.min(100, job.scores.overall) : 75);

    // Score Composto Ponderado Oficial dos 7 Fatores (Soma exata de 100%)
    const calculatedFitScore = Math.round(
      (skillsScore * 0.30) +
      (experienceScore * 0.25) +
      (careerGoalScore * 0.15) +
      (seniorityScore * 0.15) +
      (salaryScore * 0.05) +
      (locationScore * 0.05) +
      (semanticScore * 0.05)
    );

    // FONTE ÚNICA DA VERDADE — Baseada estritamente nos 7 fatores reais
    const careerFitScore = calculatedFitScore;

    const breakdown: CareerFitBreakdown = {
      skillsScore,
      experienceScore,
      seniorityScore,
      careerGoalScore,
      salaryScore,
      locationScore,
      semanticScore
    };

    // ── 4. DIFERENCIAÇÃO CLARA DE FAIXAS DE COMPATIBILIDADE ──
    const matchedTechnicalList = technicalJobReqs.filter(checkReqMatch);
    const missingTechnicalList = technicalJobReqs.filter(req => !checkReqMatch(req));

    const matchedSkillsList = matchedTechnicalList.length > 0 
      ? matchedTechnicalList.slice(0, 4)
      : userSkills.filter(s => jobDescLower.includes(s) || jobTitleLower.includes(s)).slice(0, 4);

    const missingSkillsList = missingTechnicalList.slice(0, 3);

    let overallMatchReason = '';
    let confidenceScore = 85;

    if (careerFitScore >= 80) {
      overallMatchReason = `Essa vaga combina altamente com seu perfil (${careerFitScore}%)! Você possui histórico relevante para ${job.title} e atende aos principais requisitos desta oportunidade.`;
      confidenceScore = 95;
    } else if (careerFitScore >= 60) {
      overallMatchReason = `Match sólido com a vaga (${careerFitScore}%)! Seu perfil atende a maior parte dos requisitos essenciais da posição de ${job.title}, podendo destacar competências complementares no currículo.`;
      confidenceScore = 85;
    } else {
      overallMatchReason = `Match em desenvolvimento com a vaga (${careerFitScore}%). A posição de ${job.title} possui requisitos específicos que podem ser fortalecidos no seu currículo.`;
      confidenceScore = 70;
    }

    const strengths = matchedSkillsList.map(skill => ({
      skill: skill.toUpperCase(),
      reason: `Domínio prático de ${skill} aderente aos requisitos estratégicos da vaga.`
    }));
    if (strengths.length === 0) {
      strengths.push({ skill: job.title, reason: 'Vivência profissional relevante em projetos de escopo similar.' });
    }

    const gaps: Array<{ requirement: string; impact: 'Baixo' | 'Médio' | 'Alto'; suggestion: string }> = missingSkillsList.map(req => ({
      requirement: req.toUpperCase(),
      impact: careerFitScore < 65 ? 'Alto' : 'Médio',
      suggestion: `Destacar vivências similares ou projetos práticos com ${req} no resumo profissional.`
    }));

    if (gaps.length === 0) {
      gaps.push({ requirement: 'Ferramentas Específicas da Vaga', impact: 'Baixo', suggestion: 'Reforçar domínio de ferramentas de produtividade e capacidade de aprendizado rápido na entrevista.' });
    }

    const recommendation = careerFitScore >= 85
      ? `Recomendamos submeter sua candidatura imediatamente. Seu fit de ${careerFitScore}% coloca você no grupo de alta prioridade de recrutadores.`
      : careerFitScore >= 65
      ? `Recomendamos adaptar o resumo e adicionar as palavras-chave ${matchedSkillsList.slice(0, 2).join(', ') || 'da vaga'} antes de se candidatar.`
      : `Sugerimos fortalecer os pontos de atenção identificados ou focar em vagas mais aderentes ao seu nível atual de senioridade.`;

    const explanation: JobMatchExplanation = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      jobId: job.id,
      careerProfileSnapshotId: snapshotId,
      overallMatchReason,
      strengths,
      gaps,
      recommendation,
      confidenceScore,
      careerFitScore,
      breakdown,
      createdAt: new Date().toISOString()
    };

    // ── 5. PERSISTIR E REGISTRAR MÉTRICA DE PRODUTO ──
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: insertedExp } = await supabase
          .from('job_match_explanations')
          .insert({
            user_id: userId,
            job_id: job.id,
            career_profile_snapshot_id: snapshotId,
            overall_match_reason: explanation.overallMatchReason,
            strengths: explanation.strengths,
            gaps: explanation.gaps,
            recommendation: explanation.recommendation,
            confidence_score: explanation.confidenceScore,
            career_fit_score: explanation.careerFitScore
          })
          .select('id')
          .single();

        if (insertedExp) {
          explanation.id = insertedExp.id;
          await supabase.from('career_fit_breakdowns').insert({
            job_match_explanation_id: insertedExp.id,
            skills_score: skillsScore,
            experience_score: experienceScore,
            seniority_score: seniorityScore,
            career_goal_score: careerGoalScore,
            salary_score: salaryScore,
            location_score: locationScore,
            semantic_score: semanticScore
          });
        }
      } catch (err) {
        console.warn('[JobMatchExplanationService] Falha ao persistir no Supabase, mantendo localDB:', err);
      }
    }

    (explanation as any).resumeVersionId = activeVersionId;
    localDB.saveJobExplanation(explanation);

    // Métrica de produto: career_analysis_generated
    tracker.track('career_analysis_generated', 'CareerIntelligence', {
      job_id: job.id,
      career_fit_score: careerFitScore,
      confidence_score: confidenceScore,
      strengths_count: strengths.length,
      gaps_count: gaps.length
    });

    return explanation;
  }
}
