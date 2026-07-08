import type { Job, Resume, InterviewPreparation } from '../../domain/models/types';
import { localDB } from '../../infrastructure/storage/localDatabase';

export class InterviewPreparationService {
  /**
   * Sugere perguntas prováveis para entrevistas estruturadas no modelo STAR
   */
  static getPreparation(_resume: Resume | null, job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): InterviewPreparation {
    const jobId = (job as any).id || 'mock-job-id';
    const cached = localDB.getInterviewPreparation(jobId);
    if (cached) return cached;

    const prep: InterviewPreparation = {
      id: `prep-${Date.now()}`,
      jobId,
      questions: [
        {
          question: 'Conte sobre um momento em que você gerenciou Churn elevado e reverteu a situação.',
          type: 'gestor',
          answerStar: {
            context: 'Na minha experiência anterior como Customer Success Manager...',
            action: 'Eu analisei a causa raiz das saídas, implementei playbooks rápidos de engajamento baseados em alertas do Salesforce e treinei o time.',
            result: 'Como resultado direto, reduzimos o Churn trimestral de 12% para menos de 4.2% em 6 meses.'
          }
        },
        {
          question: 'Por que você deseja trabalhar nesta empresa?',
          type: 'RH',
          answerStar: {
            context: 'Acompanho o crescimento de mercado da empresa e percebo excelente sinergia cultural...',
            action: 'Posso aplicar meus conhecimentos em produtos SaaS e processos corporativos para escalar os resultados de CS.',
            result: 'Aumentar a retenção global de clientes e melhorar o NPS operacional.'
          }
        },
        {
          question: 'Como você utiliza dados para guiar decisões de Customer Success?',
          type: 'tecnica',
          answerStar: {
            context: 'No monitoramento diário do portfólio de grandes clientes...',
            action: 'Eu executo consultas SQL básicas para auditar taxas de adoção de recursos críticos da plataforma.',
            result: 'Antecipamos o risco de evasão em até 90 dias, aumentando a retenção ativa.'
          }
        },
        {
          question: 'Como você lida com divergências de expectativas em relação ao time de Produto?',
          type: 'cultura',
          answerStar: {
            context: 'Muitas vezes os clientes solicitam melhorias imediatas que não estão no roadmap de produto...',
            action: 'Eu organizo reuniões quinzenais baseadas em impacto de receita para ponderar prioridades.',
            result: 'Entregamos soluções mitigadoras e mantivemos o cliente satisfeito.'
          }
        }
      ],
      createdAt: new Date().toISOString()
    };

    localDB.saveInterviewPreparation(prep);
    return prep;
  }
}
