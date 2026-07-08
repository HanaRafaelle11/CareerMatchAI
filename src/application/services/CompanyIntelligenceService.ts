import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { CompanyProfile } from '../../domain/models/types';

export class CompanyIntelligenceService {
  async getCompanyProfiles(userId: string): Promise<CompanyProfile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('company_name', { ascending: true });

      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        userId: d.user_id,
        companyName: d.company_name,
        industry: d.industry || undefined,
        size: d.size || undefined,
        glassdoorRating: d.glassdoor_rating ? parseFloat(d.glassdoor_rating) : undefined,
        interviewProcess: d.interview_process || undefined,
        benefits: d.benefits || [],
        remotePolicy: d.remote_policy || undefined,
        salaryRange: d.salary_range || undefined,
        userNotes: d.user_notes || undefined,
        wouldApplyAgain: d.would_apply_again === null ? undefined : d.would_apply_again,
        cultureScore: d.culture_score || undefined,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));
    } else {
      return localDB.getCompanyProfiles().filter(c => c.userId === userId);
    }
  }

  async saveCompanyProfile(userId: string, profile: CompanyProfile): Promise<CompanyProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('company_profiles')
        .upsert({
          id: profile.id.startsWith('cp-') ? undefined : profile.id,
          user_id: userId,
          company_name: profile.companyName,
          industry: profile.industry || null,
          size: profile.size || null,
          glassdoor_rating: profile.glassdoorRating || null,
          interview_process: profile.interviewProcess || null,
          benefits: profile.benefits || null,
          remote_policy: profile.remotePolicy || null,
          salary_range: profile.salaryRange || null,
          user_notes: profile.userNotes || null,
          would_apply_again: profile.wouldApplyAgain === undefined ? null : profile.wouldApplyAgain,
          culture_score: profile.cultureScore || null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        userId: data.user_id,
        companyName: data.company_name,
        industry: data.industry || undefined,
        size: data.size || undefined,
        glassdoorRating: data.glassdoor_rating ? parseFloat(data.glassdoor_rating) : undefined,
        interviewProcess: data.interview_process || undefined,
        benefits: data.benefits || [],
        remotePolicy: data.remote_policy || undefined,
        salaryRange: data.salary_range || undefined,
        userNotes: data.user_notes || undefined,
        wouldApplyAgain: data.would_apply_again === null ? undefined : data.would_apply_again,
        cultureScore: data.culture_score || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      return localDB.saveCompanyProfile({ ...profile, userId });
    }
  }

  async deleteCompanyProfile(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('company_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } else {
      localDB.deleteCompanyProfile(id);
    }
  }
}

export const companyIntelligenceService = new CompanyIntelligenceService();
