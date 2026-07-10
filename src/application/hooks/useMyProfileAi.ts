import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface CareerProfileNew {
  id: string;
  userId: string;
  resumeVersionId: string;
  personal: {
    fullName: string | null;
    headline: string | null;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    website: string | null;
    location: string | null;
  };
  summary: string | null;
  experience: Array<{
    companyName: string | null;
    role: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
    highlights: string[];
  }>;
  education: Array<{
    institution: string | null;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
  skills: Array<{
    name: string;
    proficiency?: string;
  }>;
  soft_skills: string[];
  languages: Array<{
    language: string;
    proficiency?: string;
  }>;
  certifications: string[];
  ats_keywords: {
    existing_keywords?: string[];
    missing_keywords?: string[];
    recommended_keywords?: string[];
  };
  createdAt: string;
}

export interface CareerInsight {
  id: string;
  userId: string;
  resumeVersionId: string;
  seniority_prediction: {
    value: string;
    confidence: number;
    reason: string;
    source_type: 'extracted' | 'inferred' | 'recommended';
  };
  industry_prediction: {
    value: string;
    confidence: number;
    reason: string;
    source_type: 'extracted' | 'inferred' | 'recommended';
  };
  methodologies: Array<{
    methodology_name: string;
    confidence: number;
    source_type: 'extracted' | 'inferred' | 'recommended';
  }>;
  recommended_keywords: {
    value: string[];
    confidence: number;
    reason: string;
    source_type: 'extracted' | 'inferred' | 'recommended';
  };
  missing_skills: {
    value: string[];
    confidence: number;
    reason: string;
    source_type: 'extracted' | 'inferred' | 'recommended';
  };
  confidence_scores: {
    value: any;
    confidence: number;
    reason: string;
    source_type: 'extracted' | 'inferred' | 'recommended';
  };
  createdAt: string;
}

export function useMyProfileAi(userId: string | undefined, resumeVersionId?: string | null) {
  const profileQuery = useQuery<{ profile: CareerProfileNew | null; insights: CareerInsight | null }>({
    queryKey: ['my-profile-ai', userId, resumeVersionId],
    queryFn: async () => {
      if (!userId || !isSupabaseConfigured || !supabase) {
        return { profile: null, insights: null };
      }

      // 1. Buscar o perfil de carreira
      let query = supabase
        .from('career_profiles')
        .select('*')
        .eq('user_id', userId);

      if (resumeVersionId) {
        query = query.eq('resume_version_id', resumeVersionId);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data: profileData, error: profileErr } = await query.maybeSingle();

      if (profileErr) throw profileErr;
      if (!profileData) return { profile: null, insights: null };

      const profile: CareerProfileNew = {
        id: profileData.id,
        userId: profileData.user_id,
        resumeVersionId: profileData.resume_version_id,
        personal: profileData.personal || {},
        summary: profileData.summary || '',
        experience: profileData.experience || [],
        education: profileData.education || [],
        skills: profileData.skills || [],
        soft_skills: profileData.soft_skills || [],
        languages: profileData.languages || [],
        certifications: profileData.certifications || [],
        ats_keywords: profileData.ats_keywords || {},
        createdAt: profileData.created_at
      };

      console.log(`[CAREER PROFILE LOAD]
user_id: ${profile.userId}
resume_version_id: ${profile.resumeVersionId}
profile_id: ${profile.id}`);

      // 2. Buscar o insights correspondente da mesma versão de currículo
      const { data: insightsData, error: insightsErr } = await supabase
        .from('career_insights')
        .select('*')
        .eq('resume_version_id', profile.resumeVersionId)
        .maybeSingle();

      if (insightsErr) throw insightsErr;

      let insights: CareerInsight | null = null;
      if (insightsData) {
        insights = {
          id: insightsData.id,
          userId: insightsData.user_id,
          resumeVersionId: insightsData.resume_version_id,
          seniority_prediction: insightsData.seniority_prediction || {},
          industry_prediction: insightsData.industry_prediction || {},
          methodologies: insightsData.methodologies || [],
          recommended_keywords: insightsData.recommended_keywords || {},
          missing_skills: insightsData.missing_skills || {},
          confidence_scores: insightsData.confidence_scores || {},
          createdAt: insightsData.created_at
        };
      }

      return { profile, insights };
    },
    enabled: !!userId && !!resumeVersionId,
  });

  return {
    data: profileQuery.data || { profile: null, insights: null },
    isLoading: profileQuery.isLoading,
    refetch: profileQuery.refetch
  };
}
