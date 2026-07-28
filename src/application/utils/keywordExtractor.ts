// src/application/utils/keywordExtractor.ts

/**
 // Extrai palavras-chave técnicas e estratégicas reais de títulos e descrições de vagas.
 // Remove termos genéricos como "Geral", "Vaga", "Outros", etc.
 */
export function extractKeywordsFromText(text: string, title?: string): string[] {
  if (!text) return title ? [title] : [];

  const combined = ((title || '') + ' ' + text).toLowerCase();
  
  // Dicionário de habilidades técnicas e termos de mercado reconhecidos
  const knownKeywordsMap: Record<string, string> = {
    'customer success': 'Customer Success',
    'csm': 'Customer Success',
    'gestão de kpis': 'Gestão de KPIs',
    'kpi': 'KPIs',
    'churn': 'Retenção & Churn',
    'nps': 'NPS',
    'ltv': 'LTV',
    'crm': 'CRM',
    'hubspot': 'HubSpot',
    'salesforce': 'Salesforce',
    'zendesk': 'Zendesk',
    'pipedrive': 'Pipedrive',
    'onboarding': 'Onboarding de Clientes',
    'csat': 'CSAT',
    'sql': 'SQL',
    'excel': 'Excel Avançado',
    'power bi': 'Power BI',
    'python': 'Python',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'react': 'React',
    'node': 'Node.js',
    'aws': 'AWS',
    'gcp': 'Google Cloud',
    'gestão de equipes': 'Gestão de Equipes',
    'liderança': 'Liderança',
    'agile': 'Metodologias Ágeis',
    'scrum': 'Scrum',
    'kanban': 'Kanban',
    'ui/ux': 'UI/UX Design',
    'figma': 'Figma',
    'marketing digital': 'Marketing Digital',
    'seo': 'SEO',
    'sem': 'Google Ads/SEM',
    'growth': 'Growth Hacking',
    'b2b': 'Vendas B2B',
    'saas': 'SaaS',
    'inglês': 'Inglês',
    'espanhol': 'Espanhol',
  };

  const extracted = new Set<string>();

  for (const [key, label] of Object.entries(knownKeywordsMap)) {
    if (combined.includes(key)) {
      extracted.add(label);
    }
  }

  // Se o título contiver palavras estratégicas que não caíram no mapa
  if (title) {
    const cleanTitle = title.replace(/\(remoto\)|\(híbrido\)|\(presencial\)|sênior|pleno|júnior|lead|head|gerente|analista/gi, '').trim();
    if (cleanTitle && cleanTitle.length > 2 && extracted.size < 3) {
      extracted.add(cleanTitle);
    }
  }

  const results = Array.from(extracted).filter(k => 
    k.toLowerCase() !== 'geral' && 
    k.toLowerCase() !== 'geral/outros' &&
    k.toLowerCase() !== 'outros'
  );

  return results.length > 0 ? results : (title ? [title] : ['Gestão Analítica', 'Comunicação Estratégica']);
}
