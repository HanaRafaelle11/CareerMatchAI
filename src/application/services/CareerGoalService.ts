import type { CareerGoal, CareerGoalIntentType } from '../../domain/models/types';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

/**
 * Vocentro - CareerGoalService
 * Gerencia a intenção futura e o objetivo profissional do usuário,
 * desacoplando a intenção futura do histórico do currículo.
 */

// Lista de competências universais transferíveis entre ocupações
export const COMMON_TRANSFERABLE_SKILLS = [
  'Comunicação interpessoal',
  'Resolução de problemas',
  'Organização e planejamento',
  'Trabalho em equipe',
  'Gestão de tempo',
  'Liderança de projetos',
  'Atendimento ao cliente',
  'Negociação',
  'Adaptabilidade e resiliência',
  'Pensamento crítico',
  'Análise de processos',
  'Orientação a resultados'
];

export class CareerGoalService {
  async getGoal(userId: string): Promise<CareerGoal | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('career_goals')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            intentType: (data.intent_type as CareerGoalIntentType) || 'same_area_continue',
            targetArea: data.target_area || undefined,
            targetRoles: data.target_roles || [],
            targetSeniority: data.target_seniority || undefined,
            targetLocation: data.target_location || undefined,
            targetWorkModes: data.target_work_modes || [],
            targetIndustries: data.target_industries || [],
            desiredSalaryMin: data.desired_salary_min || undefined,
            desiredSalaryMax: data.desired_salary_max || undefined,
            salaryCurrency: data.salary_currency || 'BRL',
            desiredSalary: data.desired_salary || undefined,
            transferableSkills: data.transferable_skills || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (_) {
        // Fallback para localDB se a tabela não existir ou erro de rede
      }
    }

    const localGoals = localDB.getCareerGoals(userId);
    return localGoals.length > 0 ? localGoals[0] : null;
  }

  async saveGoal(goal: CareerGoal): Promise<CareerGoal> {
    const updatedGoal: CareerGoal = {
      ...goal,
      updatedAt: new Date().toISOString()
    };

    // Sempre persistir no banco local para resiliência offline e navegação instantânea
    localDB.saveCareerGoal(updatedGoal);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('career_goals')
          .upsert({
            id: updatedGoal.id,
            user_id: updatedGoal.userId,
            intent_type: updatedGoal.intentType,
            target_area: updatedGoal.targetArea,
            target_roles: updatedGoal.targetRoles,
            target_seniority: updatedGoal.targetSeniority,
            target_location: updatedGoal.targetLocation,
            target_work_modes: updatedGoal.targetWorkModes,
            target_industries: updatedGoal.targetIndustries,
            desired_salary_min: updatedGoal.desiredSalaryMin,
            desired_salary_max: updatedGoal.desiredSalaryMax,
            salary_currency: updatedGoal.salaryCurrency || 'BRL',
            desired_salary: updatedGoal.desiredSalary,
            transferable_skills: updatedGoal.transferableSkills,
            updated_at: updatedGoal.updatedAt
          });
      } catch (_) {
        // Falha no Supabase absorvida para não quebrar a UX local
      }
    }

    return updatedGoal;
  }

  /**
   * Extrai e calcula competências transferíveis a partir do perfil atual
   * em relação a uma nova área ou cargo de destino.
   */
  extractTransferableSkills(userSkills: string[] = [], userSummary: string = ''): string[] {
    const normalizedText = [
      ...userSkills,
      userSummary
    ].join(' ').toLowerCase();

    const identified = COMMON_TRANSFERABLE_SKILLS.filter(skill => {
      const keywords = skill.toLowerCase().split(' ');
      return keywords.some(kw => kw.length > 3 && normalizedText.includes(kw));
    });

    // Se identificou poucas no texto mas o usuário tem habilidades, fornece as mais universais
    if (identified.length === 0 && userSkills.length > 0) {
      return ['Comunicação interpessoal', 'Resolução de problemas', 'Organização e planejamento', 'Adaptabilidade e resiliência'];
    }

    return identified.length > 0 ? identified : ['Comunicação interpessoal', 'Organização e planejamento'];
  }
}

export const careerGoalService = new CareerGoalService();
