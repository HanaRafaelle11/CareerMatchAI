import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Job, Resume, ResumeAdaptation, AdaptedSection } from '../../domain/models/types';


export class AdaptiveResumeService {
  /**
   * Gera sugestões de adaptação de currículo específicas para a vaga (com status PENDING)
   */
  static async generateAdaptationSuggestions(
    userId: string,
    job: Job,
    resume?: Resume | null
  ): Promise<ResumeAdaptation> {
    if (!userId || !job) {
      throw new Error('Usuário e vaga são obrigatórios para gerar adaptações de currículo.');
    }

    // Verificar cache existente no Supabase/localStorage
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('resume_adaptations')
          .select('*')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            jobId: data.job_id,
            originalResumeId: data.original_resume_id,
            adaptedSections: data.adapted_sections || [],
            keywordsAdded: data.keywords_added || [],
            atsImprovements: data.ats_improvements || [],
            status: data.status || 'PENDING',
            createdAt: data.created_at
          };
        }
      } catch (_) {}
    }

    const localCached = localDB.getResumeAdaptation(userId, job.id);
    if (localCached) return localCached;

    // Gerar sugestões seguras baseadas nas exigências da vaga
    const userSkills = (resume?.skills || []).map(s => s.name.toLowerCase());
    const missingKeywords = (job.requirements || []).filter(req => !userSkills.some(us => us.includes(req.toLowerCase())));

    const adaptedSections: AdaptedSection[] = [
      {
        sectionName: 'Resumo Profissional',
        originalText: resume?.structuredSummary || 'Profissional com vasta experiência na área.',
        suggestedText: `${resume?.structuredSummary || 'Profissional especialista'} com foco direto em metas de ${job.title} na empresa ${job.companyName}, destacando gestão analítica e resultados mensuráveis.`,
        reasoning: 'Alinha os primeiros 3 segundos de leitura dos recrutadores ao título exato da vaga.'
      }
    ];

    if (resume?.experiences && resume.experiences.length > 0) {
      const exp = resume.experiences[0];
      adaptedSections.push({
        sectionName: `Experiência — ${exp.companyName}`,
        originalText: exp.description || 'Responsável pelas atividades operacionais da equipe.',
        suggestedText: `${exp.description || 'Liderança e execução de processos'} com utilização de indicadores-chave de desempenho alinhados a ${job.requirements?.[0] || 'gestão estratégica'}.`,
        reasoning: 'Insere os termos técnicos exigidos no contexto das conquistas passadas.'
      });
    }

    const keywordsAdded = missingKeywords.length > 0 ? missingKeywords.slice(0, 5) : ['KPIs', 'Metodologias Ágeis', 'Visão Analítica'];

    const atsImprovements = [
      'Remover tabelas e colunas duplas para garantir 100% de leitura pelos robôs ATS (Greenhouse, Workday, Gupy).',
      `Substituir sinônimos genéricos pela palavra-chave exata "${job.requirements?.[0] || job.title}".`,
      'Incluir formato padrão de data (MM/AAAA) em todas as experiências.'
    ];

    const adaptation: ResumeAdaptation = {
      id: `adapt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      jobId: job.id,
      originalResumeId: resume?.id,
      adaptedSections,
      keywordsAdded,
      atsImprovements,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: inserted } = await supabase
          .from('resume_adaptations')
          .insert({
            user_id: userId,
            job_id: job.id,
            original_resume_id: resume?.id || null,
            adapted_sections: adaptation.adaptedSections,
            keywords_added: adaptation.keywordsAdded,
            ats_improvements: adaptation.atsImprovements,
            status: 'PENDING'
          })
          .select('id')
          .single();

        if (inserted) adaptation.id = inserted.id;
      } catch (_) {}
    }

    localDB.saveResumeAdaptation(adaptation);

    tracker.track('resume_adaptation_created', 'CareerIntelligence', {
      job_id: job.id,
      keywords_count: keywordsAdded.length
    });

    return adaptation;
  }

  /**
   * Atualiza o status da sugestão (APPLIED para aceitar, DISMISSED para descartar)
   */
  static async updateStatus(
    adaptationId: string,
    status: 'PENDING' | 'APPLIED' | 'DISMISSED'
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('resume_adaptations')
          .update({ status })
          .eq('id', adaptationId);
      } catch (_) {}
    }
    localDB.updateResumeAdaptationStatus(adaptationId, status);
  }
}
