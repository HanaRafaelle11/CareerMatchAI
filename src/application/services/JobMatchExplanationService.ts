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
    careerProfileNew?: CareerProfileNew | null
  ): Promise<JobMatchExplanation> {
    if (!userId || !job) {
      throw new Error('Usuário e vaga são obrigatórios para explicação de match.');
    }

    // ── 1. VERIFICAR CACHE EXISTENTE (NUNCA RE-EXECUTAR SE JÁ EXISTIR) ──
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('job_match_explanations')
          .select('*, career_fit_breakdowns(*)')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle();

        if (!error && data) {
          const breakdownData = data.career_fit_breakdowns?.[0];
          return {
            id: data.id,
            userId: data.user_id,
            jobId: data.job_id,
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
        }
      } catch (err) {
        console.warn('[JobMatchExplanationService] Fallback para verificação local de cache:', err);
      }
    }

    const localCached = localDB.getJobExplanation(userId, job.id);
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
        overallMatchReason: 'Faça upload do seu currículo para calcularmos a compatibilidade exata e gerar diagnósticos com IA.',
        strengths: [
          { skill: job.title, reason: 'Vaga identificada pelo motor de busca.' }
        ],
        gaps: [
          { requirement: 'Currículo não cadastrado', impact: 'Alto', suggestion: 'Envie seu currículo em PDF na aba Perfil para liberar o Career Fit Score.' }
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

    // ── 3. CÁLCULO HÍBRIDO DO CAREER FIT SCORE (7 FATORES DETALHADOS) ──
    const jobTitleLower = (job.title || '').toLowerCase();
    const jobDescLower = (job.description || '').toLowerCase();
    const userSkills = (careerProfileNew?.skills || resume?.skills || []).map(s => (typeof s === 'string' ? s : s.name).toLowerCase());
    
    // EDGE CASE 2: Vaga sem requisitos explícitos -> Extrair tokens do título/descrição
    let jobReqs = (job.requirements || [])
      .map(r => r.toLowerCase().trim())
      .filter(r => r && r !== 'geral' && r !== 'geral/outros' && r !== 'geral/outra' && r.length > 2);

    if (jobReqs.length === 0) {
      jobReqs = jobTitleLower.split(/\s+/).filter(w => w.length > 3 && !['para', 'com', 'mais', 'para', 'onde', 'como'].includes(w));
    }

    // Fator 1: Skills (30%)
    let matchedSkillsCount = 0;
    if (jobReqs.length > 0) {
      matchedSkillsCount = jobReqs.filter(req => userSkills.some(us => us.includes(req) || req.includes(us))).length;
    } else {
      matchedSkillsCount = userSkills.filter(s => jobDescLower.includes(s)).length;
    }
    const skillsScore = Math.min(100, Math.max(30, Math.round((matchedSkillsCount / Math.max(1, jobReqs.length)) * 100)));

    // Fator 2: Experience (25%) — usando calcYearsFromExperiences robusto
    const { calcYearsFromExperiences } = await import('./matchingEngine');
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

    // Fator 4: Career Goal (15%)
    const targetRoles = (careerProfileNew?.personal as any)?.preferences?.targetRoles || [];
    const goalMatch = targetRoles.some((tr: string) => jobTitleLower.includes(tr.toLowerCase()));
    const careerGoalScore = goalMatch ? 95 : 65;

    // EDGE CASE 3: Vaga sem salário -> Score neutro de 75%
    const expectedSalary = (careerProfileNew?.personal as any)?.preferences?.salaryExpectationMin || 0;
    const salaryScore = expectedSalary > 0 && job.salaryNumeric ? (job.salaryNumeric >= expectedSalary ? 100 : 50) : 75;

    // Fator 6: Location (5%)
    const prefLocs = (careerProfileNew?.personal as any)?.preferences?.preferredLocations || [];
    const locationScore = (prefLocs.some((l: string) => job.location.toLowerCase().includes(l.toLowerCase())) || job.workMode === 'remote') ? 100 : 65;

    // Fator 7: Semantic Context (5%)
    const semanticScore = (job.scores?.overall ? Math.min(100, job.scores.overall) : 75);

    // Score Composto Ponderado Final
    const careerFitScore = Math.round(
      (skillsScore * 0.30) +
      (experienceScore * 0.25) +
      (seniorityScore * 0.15) +
      (careerGoalScore * 0.15) +
      (salaryScore * 0.05) +
      (locationScore * 0.05) +
      (semanticScore * 0.05)
    );

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
    const matchedSkillsList = userSkills.filter(s => jobDescLower.includes(s) || jobReqs.some(r => r.includes(s))).slice(0, 4);
    const missingSkillsList = jobReqs.filter(r => r !== 'geral' && r !== 'geral/outros' && !userSkills.some(us => us.includes(r))).slice(0, 3);

    let overallMatchReason = '';
    let confidenceScore = 85;

    if (careerFitScore >= 85) {
      overallMatchReason = `Essa vaga combina altamente com você (${careerFitScore}%)! Você possui experiência sólida em ${job.title}, histórico comprovado na área e atende aos principais requisitos estratégicos solicitados.`;
      confidenceScore = 95;
    } else if (careerFitScore >= 65) {
      overallMatchReason = `Boa compatibilidade de ${careerFitScore}%. Seu perfil atende a maior parte dos requisitos essenciais da posição de ${job.title}, necessitando apenas destacar competências complementares no currículo.`;
      confidenceScore = 85;
    } else {
      overallMatchReason = `Compatibilidade moderada de ${careerFitScore}%. O anúncio exige competências ou senioridade específicas que necessitam de maior destaque ou evolução em seu perfil.`;
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
