import type { CareerProfile } from '../../domain/models/types';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export class CareerProfileService {
  async getProfile(userId: string): Promise<CareerProfile | null> {
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
        tools: data.tools,
        languages: data.languages,
        preferredLocations: data.preferred_locations,
        preferredWorkModes: data.preferred_work_modes,
        targetCompanies: data.target_companies,
        salaryExpectationMin: Number(data.salary_expectation_min),
        searchKeywords: data.search_keywords,
        isApprovedByUser: data.is_approved_by_user,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      return localDB.getCareerProfile(userId);
    }
  }

  async saveProfile(profile: CareerProfile): Promise<CareerProfile> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('career_profiles')
        .upsert({
          id: profile.id,
          user_id: profile.userId,
          resume_id: profile.resumeId,
          target_roles: profile.targetRoles,
          seniority: profile.seniority,
          industries: profile.industries,
          skills: profile.skills,
          tools: profile.tools,
          languages: profile.languages,
          preferred_locations: profile.preferredLocations,
          preferred_work_modes: profile.preferredWorkModes,
          target_companies: profile.targetCompanies,
          salary_expectation_min: profile.salaryExpectationMin,
          search_keywords: profile.searchKeywords,
          is_approved_by_user: profile.isApprovedByUser,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return profile;
    } else {
      return localDB.saveCareerProfile(profile);
    }
  }
}

export const careerProfileService = new CareerProfileService();
