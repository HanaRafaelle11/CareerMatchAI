import type { InterviewSimulation } from '../../domain/models/types';
import { localDB } from '../../infrastructure/storage/localDatabase';

export class InterviewSimulationService {
  static getSimulation(applicationId: string): InterviewSimulation | null {
    return localDB.getInterviewSimulation(applicationId);
  }

  static startSimulation(applicationId: string): InterviewSimulation {
    const defaultHistory: InterviewSimulation['chatHistory'] = [
      {
        role: 'interviewer',
        text: 'Olá! Seja bem-vindo à entrevista simulada para a vaga de Customer Success. Para começar, conte-me um pouco sobre você e como suas experiências se conectam com o nosso produto SaaS.'
      }
    ];

    const sim: InterviewSimulation = {
      id: `sim-${Date.now()}`,
      applicationId,
      chatHistory: defaultHistory,
      createdAt: new Date().toISOString()
    };

    return localDB.saveInterviewSimulation(sim);
  }

  static addMessage(sim: InterviewSimulation, role: 'interviewer' | 'candidate', text: string): InterviewSimulation {
    const updatedHistory = [...sim.chatHistory, { role, text }];
    const updated = {
      ...sim,
      chatHistory: updatedHistory
    };

    // Se o candidato mandou a segunda resposta, simula a finalização e avaliação para homologar o simulador completo
    if (updatedHistory.filter(h => h.role === 'candidate').length >= 2) {
      updated.evaluations = {
        clarity: 85,
        objectivity: 90,
        adherence: 80,
        strengths: [
          'Destaque claro de indicadores quantitativos (métrica de Churn).',
          'Tom de comunicação profissional e focado em soluções.'
        ],
        improvements: [
          'Tente encurtar a introdução para ser mais direto na ação do STAR.',
          'Destaque mais as ferramentas operacionais (ex: Salesforce).'
        ]
      };
    } else if (role === 'candidate') {
      // Caso contrário, simula a próxima pergunta do entrevistador
      updated.chatHistory.push({
        role: 'interviewer',
        text: 'Excelente. Como você lidaria com um cliente Enterprise irritado reclamando de uma instabilidade no produto?'
      });
    }

    return localDB.saveInterviewSimulation(updated);
  }
}
