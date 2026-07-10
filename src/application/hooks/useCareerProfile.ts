import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { CareerProfile } from '../../domain/models/types';

export function useCareerProfile(userId: string | undefined, resumeVersionId?: string | null) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<CareerProfile | null>({
    queryKey: ['career-profile', userId, resumeVersionId],
    queryFn: async () => {
      if (!userId) return null;
      if (isSupabaseConfigured && supabase) {
        // Buscar o perfil correspondente
        let query = supabase
          .from('career_profiles')
          .select('*')
          .eq('user_id', userId);

        if (resumeVersionId) {
          query = query.eq('resume_version_id', resumeVersionId);
        } else {
          query = query.order('created_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (!data) return null;

        // Buscar insights para predição de senioridade e setor como fallback
        const { data: insightsData } = await supabase
          .from('career_insights')
          .select('*')
          .eq('resume_version_id', data.resume_version_id)
          .maybeSingle();

        const preferences = data.personal?.preferences || {};

        // Extrair fallbacks amigáveis do perfil estruturado
        const fallbackRoles = data.experience?.[0]?.role
          ? [data.experience[0].role]
          : data.personal?.headline
            ? [data.personal.headline]
            : ['Profissional de CS'];

        const fallbackSeniority = insightsData?.seniority_prediction?.value || 'Sênior';
        const fallbackIndustries = insightsData?.industry_prediction?.value
          ? [insightsData.industry_prediction.value]
          : ['SaaS', 'Tecnologia'];

        const fallbackSkills = Array.isArray(data.skills)
          ? data.skills.map((s: any) => typeof s === 'string' ? s : s.name)
          : [];

        const fallbackLanguages = Array.isArray(data.languages)
          ? data.languages.map((l: any) => typeof l === 'string' ? l : l.language)
          : [];

        return {
          id: data.id,
          userId: data.user_id,
          resumeId: data.resume_version_id, // Usar resume_version_id como compatibilidade
          targetRoles: preferences.targetRoles || fallbackRoles,
          seniority: preferences.seniority || fallbackSeniority,
          industries: preferences.industries || fallbackIndustries,
          skills: preferences.skills || fallbackSkills,
          tools: preferences.tools || [],
          languages: preferences.languages || fallbackLanguages,
          preferredLocations: preferences.preferredLocations || [data.personal?.location].filter(Boolean),
          preferredWorkModes: preferences.preferredWorkModes || ['remote'],
          targetCompanies: preferences.targetCompanies || [],
          salaryExpectationMin: Number(preferences.salaryExpectationMin || 0),
          searchKeywords: preferences.searchKeywords || preferences.targetRoles || fallbackRoles,
          isApprovedByUser: preferences.isApprovedByUser || false,
          createdAt: data.created_at,
          updatedAt: data.created_at
        };
      } else {
        return localDB.getCareerProfile(userId);
      }
    },
    enabled: !!userId && !!resumeVersionId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updated: CareerProfile) => {
      if (isSupabaseConfigured && supabase) {
        // Buscar o perfil correspondente a este currículo para mesclar metadados
        let query = supabase
          .from('career_profiles')
          .select('*')
          .eq('user_id', updated.userId);

        if (updated.resumeId && updated.resumeId !== '00000000-0000-0000-0000-000000000000') {
          query = query.eq('resume_version_id', updated.resumeId);
        } else if (resumeVersionId) {
          query = query.eq('resume_version_id', resumeVersionId);
        } else {
          query = query.order('created_at', { ascending: false }).limit(1);
        }

        const { data: latest, error: fetchError } = await query.maybeSingle();

        if (fetchError) throw fetchError;

        if (latest) {
          const updatedPersonal = {
            ...(latest.personal || {}),
            preferences: {
              targetRoles: updated.targetRoles,
              seniority: updated.seniority,
              industries: updated.industries,
              skills: updated.skills,
              tools: updated.tools,
              languages: updated.languages,
              preferredLocations: updated.preferredLocations,
              preferredWorkModes: updated.preferredWorkModes,
              targetCompanies: updated.targetCompanies,
              salaryExpectationMin: updated.salaryExpectationMin,
              searchKeywords: updated.searchKeywords,
              isApprovedByUser: updated.isApprovedByUser
            }
          };

          console.log(`[CAREER PROFILE SAVE]
resumeVersionId recebido: ${latest.resume_version_id}
payload enviado:`, JSON.stringify({ personal: updatedPersonal }));

          const { error } = await supabase
            .from('career_profiles')
            .update({
              personal: updatedPersonal
            })
            .eq('id', latest.id);

          if (error) throw error;
        } else {
          // Se não existir perfil estruturado (caso raro), cria uma casca básica
          if (!updated.resumeId || updated.resumeId === '00000000-0000-0000-0000-000000000000') {
            console.error('[CAREER PROFILE SAVE] Erro: resumeId está vazio ou é inválido.');
            throw new Error('A versão do currículo não foi identificada. Por favor, envie um currículo primeiro.');
          }

          const newProfilePayload = {
            user_id: updated.userId,
            resume_version_id: updated.resumeId,
            personal: {
              fullName: 'Profissional',
              preferences: {
                targetRoles: updated.targetRoles,
                seniority: updated.seniority,
                industries: updated.industries,
                skills: updated.skills,
                tools: updated.tools,
                languages: updated.languages,
                preferredLocations: updated.preferredLocations,
                preferredWorkModes: updated.preferredWorkModes,
                targetCompanies: updated.targetCompanies,
                salaryExpectationMin: updated.salaryExpectationMin,
                searchKeywords: updated.searchKeywords,
                isApprovedByUser: updated.isApprovedByUser
              }
            },
            skills: updated.skills.map(s => ({ name: s })),
            languages: updated.languages.map(l => ({ language: l })),
            experience: [],
            education: [],
            soft_skills: [],
            certifications: [],
            ats_keywords: {},
            summary: ''
          };

          console.log(`[CAREER PROFILE SAVE]
resumeVersionId recebido: ${updated.resumeId}
payload enviado:`, JSON.stringify(newProfilePayload));

          const { error } = await supabase
            .from('career_profiles')
            .insert(newProfilePayload);

          if (error) throw error;
        }
        return updated;
      } else {
        return localDB.saveCareerProfile(updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
    }
  });

  return {
    careerProfile: profileQuery.data || null,
    isLoading: profileQuery.isLoading,
    updateCareerProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending
  };
}
