import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { companyIntelligenceService } from '../services/CompanyIntelligenceService';
import type { CompanyProfile, WeeklyPlanner, WeeklyGoal, CareerGoal } from '../../domain/models/types';

export function useRoadmapServices(userId: string | undefined) {
  const queryClient = useQueryClient();

  // ==========================================
  // 1. COMPANY PROFILES
  // ==========================================
  const companyProfilesQuery = useQuery<CompanyProfile[]>({
    queryKey: ['company-profiles', userId],
    queryFn: async () => {
      if (!userId) return [];
      return companyIntelligenceService.getCompanyProfiles(userId);
    },
    enabled: !!userId,
  });

  const saveCompanyProfileMutation = useMutation({
    mutationFn: async (profile: CompanyProfile) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      return companyIntelligenceService.saveCompanyProfile(userId, profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles', userId] });
    }
  });

  const deleteCompanyProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return companyIntelligenceService.deleteCompanyProfile(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles', userId] });
    }
  });

  // ==========================================
  // 2. WEEKLY PLANNERS
  // ==========================================
  const getWeeklyPlannerQuery = (weekNumber: number) => {
    return useQuery<WeeklyPlanner | null>({
      queryKey: ['weekly-planner', userId, weekNumber],
      queryFn: async () => {
        if (!userId) return null;
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('weekly_planners')
            .select('*')
            .eq('user_id', userId)
            .eq('week_number', weekNumber)
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            // Retorna um planner vazio padrão para evitar telas em branco
            return {
              id: 'wp-default-' + weekNumber,
              userId: userId,
              weekNumber: weekNumber,
              plannerData: {
                'Segunda-feira': { tasks: [] },
                'Terça-feira': { tasks: [] },
                'Quarta-feira': { tasks: [] },
                'Quinta-feira': { tasks: [] },
                'Sexta-feira': { tasks: [] },
                'Sábado': { tasks: [] },
                'Domingo': { tasks: [] }
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return {
            id: data.id,
            userId: data.user_id,
            weekNumber: data.week_number,
            plannerData: data.planner_data,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        } else {
          return localDB.getWeeklyPlanner(userId, weekNumber) || {
            id: 'wp-default-' + weekNumber,
            userId: userId,
            weekNumber: weekNumber,
            plannerData: {
              'Segunda-feira': { tasks: [] },
              'Terça-feira': { tasks: [] },
              'Quarta-feira': { tasks: [] },
              'Quinta-feira': { tasks: [] },
              'Sexta-feira': { tasks: [] },
              'Sábado': { tasks: [] },
              'Domingo': { tasks: [] }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      },
      enabled: !!userId && !!weekNumber,
    });
  };

  const saveWeeklyPlannerMutation = useMutation({
    mutationFn: async (planner: WeeklyPlanner) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('weekly_planners')
          .upsert({
            id: planner.id.startsWith('wp-') ? undefined : planner.id,
            user_id: userId,
            week_number: planner.weekNumber,
            planner_data: planner.plannerData,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        return localDB.saveWeeklyPlanner({ ...planner, userId });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-planner', userId, variables.weekNumber] });
    }
  });

  // ==========================================
  // 3. WEEKLY GOALS
  // ==========================================
  const getWeeklyGoalQuery = (weekNumber: number) => {
    return useQuery<WeeklyGoal | null>({
      queryKey: ['weekly-goal', userId, weekNumber],
      queryFn: async () => {
        if (!userId) return null;
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('weekly_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('week_number', weekNumber)
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            // Retorna meta padrão para evitar erros e carregar o form
            return {
              id: 'wg-default-' + weekNumber,
              userId: userId,
              weekNumber: weekNumber,
              targetApplications: 5,
              targetInterviewsRh: 2,
              targetInterviewsManager: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return {
            id: data.id,
            userId: data.user_id,
            weekNumber: data.week_number,
            targetApplications: data.target_applications,
            targetInterviewsRh: data.target_interviews_rh,
            targetInterviewsManager: data.target_interviews_manager,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        } else {
          return localDB.getWeeklyGoal(userId, weekNumber) || {
            id: 'wg-default-' + weekNumber,
            userId: userId,
            weekNumber: weekNumber,
            targetApplications: 5,
            targetInterviewsRh: 2,
            targetInterviewsManager: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      },
      enabled: !!userId && !!weekNumber,
    });
  };

  const saveWeeklyGoalMutation = useMutation({
    mutationFn: async (goal: WeeklyGoal) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('weekly_goals')
          .upsert({
            id: goal.id.startsWith('wg-') ? undefined : goal.id,
            user_id: userId,
            week_number: goal.weekNumber,
            target_applications: goal.targetApplications,
            target_interviews_rh: goal.targetInterviewsRh,
            target_interviews_manager: goal.targetInterviewsManager,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        return localDB.saveWeeklyGoal({ ...goal, userId });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-goal', userId, variables.weekNumber] });
    }
  });

  // ==========================================
  // 4. CAREER GOALS (GOAL TRACKER)
  // ==========================================
  const careerGoalsQuery = useQuery<CareerGoal[]>({
    queryKey: ['career-goals', userId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('career_goals')
          .select('*')
          .eq('user_id', userId)
          .order('target_date', { ascending: true });

        if (error) throw error;
        return (data || []).map(d => ({
          id: d.id,
          userId: d.user_id,
          title: d.title,
          targetDate: d.target_date,
          isActive: d.is_active,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
      } else {
        return localDB.getCareerGoals(userId);
      }
    },
    enabled: !!userId,
  });

  const saveCareerGoalMutation = useMutation({
    mutationFn: async (goal: CareerGoal) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('career_goals')
          .upsert({
            id: goal.id.startsWith('cg-') ? undefined : goal.id,
            user_id: userId,
            title: goal.title,
            target_date: goal.targetDate,
            is_active: goal.isActive,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        return localDB.saveCareerGoal({ ...goal, userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-goals', userId] });
    }
  });

  const deleteCareerGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('career_goals')
          .delete()
          .eq('id', goalId);

        if (error) throw error;
      } else {
        localDB.deleteCareerGoal(goalId);
      }
      return goalId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-goals', userId] });
    }
  });

  return {
    companyProfiles: companyProfilesQuery.data || [],
    isLoadingCompanyProfiles: companyProfilesQuery.isLoading,
    saveCompanyProfile: saveCompanyProfileMutation.mutateAsync,
    deleteCompanyProfile: deleteCompanyProfileMutation.mutateAsync,

    getWeeklyPlannerQuery,
    saveWeeklyPlanner: saveWeeklyPlannerMutation.mutateAsync,

    getWeeklyGoalQuery,
    saveWeeklyGoal: saveWeeklyGoalMutation.mutateAsync,

    careerGoals: careerGoalsQuery.data || [],
    isLoadingCareerGoals: careerGoalsQuery.isLoading,
    saveCareerGoal: saveCareerGoalMutation.mutateAsync,
    deleteCareerGoal: deleteCareerGoalMutation.mutateAsync
  };
}
