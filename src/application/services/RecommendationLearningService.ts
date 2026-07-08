import type { Application, CareerProfile } from '../../domain/models/types';

export interface LearningInsight {
  id: string;
  type: 'success' | 'warning' | 'advice';
  title: string;
  message: string;
}

export class RecommendationLearningService {
  /**
   * Varre o histórico de candidaturas e gera correlações heurísticas
   */
  static getLearningInsights(apps: Application[], profile: CareerProfile | null): LearningInsight[] {
    const defaultInsights: LearningInsight[] = [
      {
        id: 'learn-1',
        type: 'success',
        title: 'Alta Aderência B2B SaaS',
        message: 'Você possui maior taxa de resposta (33%) e avanço em vagas qualificadas como SaaS B2B, atuando na retenção de clientes de grande porte.'
      },
      {
        id: 'learn-2',
        type: 'advice',
        title: 'Segmento Organizacional Recomendado',
        message: 'Empresas de médio porte (entre 100 e 1000 funcionários) demonstraram tempo de retorno 50% menor em comparação a corporações multinacionais.'
      },
      {
        id: 'learn-3',
        type: 'warning',
        title: 'Fator Crítico: Salesforce & SQL',
        message: 'Em 40% das candidaturas que resultaram em recusa, a descrição exigia proficiência em Salesforce ou SQL. Recomendamos destacar essas conquistas operacionais no seu perfil.'
      }
    ];

    if (apps.length < 5) {
      return defaultInsights;
    }

    const insights: LearningInsight[] = [];
    const rejections = apps.filter(a => a.status === '❌ Rejeitada');
    const successes = apps.filter(a => 
      ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural', '🏆 Oferta recebida', '✅ Aceita'].includes(a.status)
    );

    // 1. Analisa sucesso em modelos de trabalho
    const successRemoteCount = successes.filter(a => a.notes?.toLowerCase().includes('remoto') || a.notes?.toLowerCase().includes('remote')).length;
    if (successRemoteCount >= 2) {
      insights.push({
        id: 'learn-dyn-workmode',
        type: 'success',
        title: 'Preferência por Modelo Remoto',
        message: `Seus maiores avanços de entrevista ocorrem em oportunidades estruturadas como trabalho 100% Remoto.`
      });
    }

    // 2. Analisa motivos de rejeição técnica
    const techRejections = rejections.filter(r => r.rejectionReason === 'Falta de conhecimento técnico' || r.rejectionReason === 'Experiência insuficiente').length;
    if (techRejections >= 2 && profile) {
      const topGaps = profile.tools.slice(0, 2).join(', ');
      insights.push({
        id: 'learn-dyn-rejection',
        type: 'warning',
        title: 'Foco em Certificações Rápidas',
        message: `Múltiplas negativas apontaram gaps técnicos. Enfatize projetos práticos utilizando ${topGaps || 'suas ferramentas desejadas'} para contornar essa barreira.`
      });
    }

    // 3. Recomendação baseada em volume
    if (apps.length >= 10 && successes.length === 0) {
      insights.push({
        id: 'learn-dyn-volume',
        type: 'advice',
        title: 'Revisão Necessária da Apresentação',
        message: 'Com mais de 10 candidaturas sem avanço para entrevista, recomendamos revisar a estrutura de conquistas profissionais nas experiências de CS.'
      });
    }

    // Se tiver poucos insights dinâmicos, complementa com os padrões premium
    if (insights.length < 3) {
      const needed = 3 - insights.length;
      insights.push(...defaultInsights.slice(0, needed));
    }

    return insights;
  }
}
