import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { CareerProfile } from '../../domain/models/types';

export function useCareerProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<CareerProfile | null>({
    queryKey: ['career-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('career_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        return {
          id: data.id,
          userId: data.user_id,
          resumeId: data.resume_id,
          targetRoles: data.target_roles,
          seniority: data.seniority,
          industries: data.industries,
          skills: data.skills,
          tools: data.tools || [],
          languages: data.languages || [],
          preferredLocations: data.preferred_locations,
          preferredWorkModes: data.preferred_work_modes,
          targetCompanies: data.target_companies || [],
          salaryExpectationMin: Number(data.salary_expectation_min || 0),
          searchKeywords: data.search_keywords,
          isApprovedByUser: data.is_approved_by_user,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } else {
        return localDB.getCareerProfile(userId);
      }
    },
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updated: CareerProfile) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('career_profiles')
          .upsert({
            id: updated.id,
            user_id: updated.userId,
            resume_id: updated.resumeId,
            target_roles: updated.targetRoles,
            seniority: updated.seniority,
            industries: updated.industries,
            skills: updated.skills,
            tools: updated.tools,
            languages: updated.languages,
            preferred_locations: updated.preferredLocations,
            preferred_work_modes: updated.preferredWorkModes,
            target_companies: updated.targetCompanies,
            salary_expectation_min: updated.salaryExpectationMin,
            search_keywords: updated.searchKeywords,
            is_approved_by_user: updated.isApprovedByUser,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        return updated;
      } else {
        return localDB.saveCareerProfile(updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
    }
  });

  return {
    careerProfile: profileQuery.data || null,
    isLoading: profileQuery.isLoading,
    updateCareerProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending
  };
}
