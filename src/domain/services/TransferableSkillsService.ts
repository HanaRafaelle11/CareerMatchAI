/**
 * TransferableSkillsService - Mapeamento Determinístico de Competências Transferíveis
 * 
 * Identifica equivalências funcionais entre áreas sem inventar competências não presentes no histórico.
 * Calcula a distância de transição de carreira (near, moderate, challenging, distant).
 */

export type TransitionType = 'none' | 'near' | 'moderate' | 'challenging' | 'distant';

export interface TransferableSkillMapping {
  sourceDomain: string;
  targetDomain: string;
  transferableCompetencies: Array<{
    candidateSkillPattern: RegExp;
    targetRequirementPattern: RegExp;
    bridgingName: string;
    rationale: string;
  }>;
}

/**
 * Matriz determinística de equivalências e competências transferíveis
 */
export const DOMAIN_TRANSFERABILITY_RULES: TransferableSkillMapping[] = [
  // 1. Customer Success / Suporte → Gestão de Produto / Operações de Clientes
  {
    sourceDomain: 'customer_success',
    targetDomain: 'product_management',
    transferableCompetencies: [
      {
        candidateSkillPattern: /\b(customer success|csm|atendimento|nps|csat|saas|onboarding)\b/i,
        targetRequirementPattern: /\b(product discovery|descoberta|visão de cliente|user empathy|experiência do usuário|ux)\b/i,
        bridgingName: 'Product Discovery & Visão do Cliente',
        rationale: 'Experiência direta com dores e feedback de usuários acelera a capacidade de priorização e discovery de produto.'
      },
      {
        candidateSkillPattern: /\b(churn|retenção|retention|health score|kpis|métricas)\b/i,
        targetRequirementPattern: /\b(product analytics|métricas de produto|north star metric|funil|conversão)\b/i,
        bridgingName: 'Product Analytics & Métricas de Retenção',
        rationale: 'Domínio de indicadores de retenção e engajamento é diretamente aplicável à gestão de métricas de produto.'
      },
      {
        candidateSkillPattern: /\b(gestão de contas|stakeholders|comunicação|negociação|apresentações)\b/i,
        targetRequirementPattern: /\b(stakeholder management|gestão de stakeholders|comunicação com liderança|alinhamento)\b/i,
        bridgingName: 'Gestão de Stakeholders & Alinhamento Estratégico',
        rationale: 'Habilidade de alinhar expectativas entre clientes e equipes internas é fundamental para Product Managers.'
      },
      {
        candidateSkillPattern: /\b(projetos|processos|jira|trello|asana|scrum|agile)\b/i,
        targetRequirementPattern: /\b(roadmapping|backlog|sprint planning|priorização)\b/i,
        bridgingName: 'Gestão de Fluxos de Trabalho & Metodologias Ágeis',
        rationale: 'Experiência em ferramentas de projeto facilita a condução de rituais e priorização de backlog.'
      }
    ]
  },
  // 2. Operações / Processos / Administrativo → Gestão de Projetos / Operações Tech
  {
    sourceDomain: 'operations',
    targetDomain: 'project_management',
    transferableCompetencies: [
      {
        candidateSkillPattern: /\b(processos|melhoria contínua|mapeamento|fluxos|otimização|padronização)\b/i,
        targetRequirementPattern: /\b(gestão de projetos|project management|pmo|metodologias|eficiência)\b/i,
        bridgingName: 'Otimização de Processos & Eficiência Operacional',
        rationale: 'Mapeamento e padronização de fluxos são a base para gerenciamento estruturado de projetos.'
      },
      {
        candidateSkillPattern: /\b(indicadores|kpi|kpis|dashboards|relatórios|excel|planilhas|bi)\b/i,
        targetRequirementPattern: /\b(governança|acompanhamento de metas|status report|análise de dados)\b/i,
        bridgingName: 'Governança por Indicadores & Relatórios Executivos',
        rationale: 'Acompanhamento de métricas operacionais se traduz diretamente em governança e status reporting.'
      },
      {
        candidateSkillPattern: /\b(gestão de prazos|cronograma|planejamento|entregas)\b/i,
        targetRequirementPattern: /\b(gestão de cronograma|entregas ágeis|roadmap|milestones)\b/i,
        bridgingName: 'Gestão de Prazos & Entregas Estratégicas',
        rationale: 'Capacidade de cumprir prazos e coordenar dependências é diretamente transferível para PMO e Squads.'
      }
    ]
  },
  // 3. Desenvolvimento de Software → Liderança Técnica / Arquitetura / Gestão Técnica
  {
    sourceDomain: 'software_engineering',
    targetDomain: 'tech_leadership',
    transferableCompetencies: [
      {
        candidateSkillPattern: /\b(react|typescript|node|python|java|backend|frontend|fullstack|sql)\b/i,
        targetRequirementPattern: /\b(arquitetura|decisões técnicas|system design|revisão de código|code review)\b/i,
        bridgingName: 'Proficiência Técnica em Arquitetura & Código',
        rationale: 'Forte base de desenvolvimento capacita na tomada de decisões técnicas de alto impacto e revisão de arquitetura.'
      },
      {
        candidateSkillPattern: /\b(mentor|mentoria|code review|ajuda técnica|liderança informal)\b/i,
        targetRequirementPattern: /\b(people management|gestão de time|desenvolvimento de pessoas|tech lead)\b/i,
        bridgingName: 'Mentoria Técnica & Desenvolvimento de Pessoas',
        rationale: 'Orientação técnica de desenvolvedores menos experientes é a semente da liderança de engenharia.'
      }
    ]
  },
  // 4. Vendas / Comercial → Customer Success / Parcerias / Revenue Operations
  {
    sourceDomain: 'sales',
    targetDomain: 'customer_success',
    transferableCompetencies: [
      {
        candidateSkillPattern: /\b(vendas|comercial|prospecção|negociação|fechamento)\b/i,
        targetRequirementPattern: /\b(expansão|upsell|cross-sell|renovação|renewals)\b/i,
        bridgingName: 'Negociação Comercial & Expansão de Contas',
        rationale: 'Habilidade de negociação comercial impulsiona estratégias de upsell, cross-sell e renovação de contratos.'
      },
      {
        candidateSkillPattern: /\b(crm|salesforce|hubspot|pipedrive|pipeline)\b/i,
        targetRequirementPattern: /\b(gainsight|totango|gestão de carteira|organização de contas)\b/i,
        bridgingName: 'Domínio de Plataformas de Relacionamento (CRM)',
        rationale: 'Fluência em ferramentas de pipeline acelera o aprendizado de plataformas especializadas de CS.'
      }
    ]
  },
  // 5. Marketing / Comunicação → Produto / Growth / Conteúdo Institucional
  {
    sourceDomain: 'marketing',
    targetDomain: 'growth_product',
    transferableCompetencies: [
      {
        candidateSkillPattern: /\b(marketing digital|copywriting|campanhas|redes sociais|comunicação)\b/i,
        targetRequirementPattern: /\b(growth|aquisição|posicionamento|go-to-market|gtm)\b/i,
        bridgingName: 'Posicionamento de Mercado & Go-to-Market',
        rationale: 'Conhecimento em atração e conversão é essencial para lançamento e crescimento de produtos.'
      },
      {
        candidateSkillPattern: /\b(google analytics|seo|métricas de tráfego|conversão|a\/b test)\b/i,
        targetRequirementPattern: /\b(testes a\/b|experimentação|funil de produto|growth loops)\b/i,
        bridgingName: 'Cultura de Experimentação & Análise de Funil',
        rationale: 'Testes de campanhas e análise de tráfego traduzem-se diretamente em testes A/B e experimentação de produto.'
      }
    ]
  }
];

export class TransferableSkillsService {
  /**
   * Avalia competências transferíveis de um candidato para os requisitos de uma vaga
   */
  static assessTransferableSkills(
    candidateSkills: string[],
    candidateExperiencesText: string,
    jobRequirements: string[],
    candidateRole = '',
    _targetRole = ''
  ): {
    transferableSkills: string[];
    transferableReasons: string[];
    transferabilityScore: number;
  } {
    const candidateCorpus = `${candidateSkills.join(' ')} ${candidateExperiencesText} ${candidateRole} ${_targetRole}`.toLowerCase();
    const transferableSet = new Set<string>();
    const reasons: string[] = [];

    for (const rule of DOMAIN_TRANSFERABILITY_RULES) {
      for (const comp of rule.transferableCompetencies) {
        const candidateHasSource = comp.candidateSkillPattern.test(candidateCorpus);
        if (!candidateHasSource) continue;

        for (const req of jobRequirements) {
          if (comp.targetRequirementPattern.test(req.toLowerCase())) {
            transferableSet.add(comp.bridgingName);
            reasons.push(`${comp.bridgingName}: ${comp.rationale}`);
          }
        }
      }
    }

    const transferableSkills = Array.from(transferableSet);
    const matchedTransferableCount = transferableSkills.length;
    const reqCount = Math.max(jobRequirements.length, 1);
    const transferabilityScore = Math.min(100, Math.round((matchedTransferableCount / reqCount) * 100 * 1.5));

    return {
      transferableSkills,
      transferableReasons: reasons,
      transferabilityScore
    };
  }

  /**
   * Determina deterministicamente a categoria de distância de transição de carreira
   */
  static determineTransitionDistance(
    isCareerTransition: boolean,
    fitSkillsScore: number,
    transferabilityScore: number,
    roleTitleSimilarity: number
  ): {
    type: TransitionType;
    label: string;
    confidence: number;
  } {
    if (!isCareerTransition) {
      return {
        type: 'none',
        label: 'Mesma Área / Continuidade',
        confidence: 95
      };
    }

    // Para quem está em transição de carreira:
    // Combina fit técnico direto + transferência de competências + proximidade semântica
    const compositeBridge = (fitSkillsScore * 0.35) + (transferabilityScore * 0.45) + (roleTitleSimilarity * 0.20);

    if (compositeBridge >= 65) {
      return {
        type: 'near',
        label: 'Transição Próxima',
        confidence: 90
      };
    }

    if (compositeBridge >= 45) {
      return {
        type: 'moderate',
        label: 'Transição Moderada',
        confidence: 85
      };
    }

    if (compositeBridge >= 25) {
      return {
        type: 'challenging',
        label: 'Transição Desafiadora',
        confidence: 80
      };
    }

    return {
      type: 'distant',
      label: 'Transição Distante',
      confidence: 75
    };
  }
}
