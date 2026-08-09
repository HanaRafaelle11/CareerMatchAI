export interface ProfileCompletenessItem {
  id: string;
  label: string;
  weight: number;
  completed: boolean;
  description: string;
}

export interface ProfileCompletenessResult {
  score: number; // 0 to 100
  isComplete: boolean;
  items: ProfileCompletenessItem[];
  missingItems: ProfileCompletenessItem[];
}

/**
 * Single Source of Truth (SSOT) service for calculating Profile Completeness.
 * Used identically across Profile page, Dashboard, and Sidebar (Navbar).
 */
export function calculateProfileCompleteness(params: {
  hasResume?: boolean;
  hasLinkedin?: boolean;
  hasSkills?: boolean;
  hasExperiences?: boolean;
  profile?: any;
  resume?: any;
  careerProfile?: any;
}): ProfileCompletenessResult {
  const hasResume = params.hasResume ?? (Boolean(params.profile?.primary_resume_id) || Boolean(params.resume));
  
  const linkedinUrl = params.profile?.linkedin_url || params.careerProfile?.personal?.linkedin || '';
  const hasLinkedin = params.hasLinkedin ?? Boolean(linkedinUrl && linkedinUrl.trim().length > 5);

  const skillsCount = params.careerProfile?.skills?.length || params.resume?.skills?.length || 0;
  const hasSkills = params.hasSkills ?? (skillsCount > 0);

  const experiencesCount = params.careerProfile?.experience?.length || params.resume?.experience?.length || 0;
  const hasExperiences = params.hasExperiences ?? (experiencesCount > 0);

  const items: ProfileCompletenessItem[] = [
    {
      id: 'resume',
      label: 'Enviar Currículo (PDF/TXT)',
      weight: 30,
      completed: hasResume,
      description: hasResume ? 'Currículo processado pela IA' : 'Upload de currículo no perfil (+30%)'
    },
    {
      id: 'experiences',
      label: 'Histórico Profissional',
      weight: 20,
      completed: hasExperiences,
      description: hasExperiences ? 'Experiências profissionais mapeadas' : 'Adicionar histórico de experiências (+20%)'
    },
    {
      id: 'skills',
      label: 'Habilidades & Competências',
      weight: 20,
      completed: hasSkills,
      description: hasSkills ? 'Habilidades técnicas extraídas' : 'Adicionar competências chave (+20%)'
    },
    {
      id: 'linkedin',
      label: 'Link do Perfil LinkedIn',
      weight: 20,
      completed: hasLinkedin,
      description: hasLinkedin ? 'Perfil LinkedIn vinculado' : 'Adicionar URL do LinkedIn nas configurações (+20%)'
    }
  ];

  let score = 10; // Base score for account registration
  items.forEach(item => {
    if (item.completed) {
      score += item.weight;
    }
  });

  score = Math.min(100, score);
  const missingItems = items.filter(item => !item.completed);

  return {
    score,
    isComplete: score === 100,
    items,
    missingItems
  };
}
