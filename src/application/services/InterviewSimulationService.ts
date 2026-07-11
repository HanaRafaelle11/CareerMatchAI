import type { InterviewSimulation } from '../../domain/models/types';
import { localDB } from '../../infrastructure/storage/localDatabase';

export class InterviewSimulationService {
  static getSimulation(applicationId: string): InterviewSimulation | null {
    return localDB.getInterviewSimulation(applicationId);
  }

  static startSimulation(applicationId: string): InterviewSimulation {
    const app = localDB.getApplication(applicationId);
    const jobTitle = app?.jobTitle || 'esta vaga';
    const isPharmacy = /farmac|estet|saude|saúde/i.test(jobTitle);

    const defaultHistory: InterviewSimulation['chatHistory'] = [
      {
        role: 'interviewer',
        text: isPharmacy
          ? `Olá! Seja bem-vindo à entrevista simulada para a vaga de ${jobTitle}. Para começar, conte-me um pouco sobre você e como suas qualificações na área de saúde e estética se conectam com o nosso perfil.`
          : `Olá! Seja bem-vindo à entrevista simulada para a vaga de ${jobTitle}. Para começar, conte-me um pouco sobre você e como suas experiências se conectam com os requisitos da vaga.`
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

    const app = localDB.getApplication(sim.applicationId);
    const jobTitle = app?.jobTitle || 'esta vaga';
    const isPharmacy = /farmac|estet|saude|saúde/i.test(jobTitle);

    // Se o candidato mandou a segunda resposta, simula a finalização e avaliação para homologar o simulador completo
    if (updatedHistory.filter(h => h.role === 'candidate').length >= 2) {
      updated.evaluations = {
        clarity: 85,
        objectivity: 90,
        adherence: 80,
        strengths: isPharmacy
          ? [
              'Destaque claro de sua formação técnica/científica.',
              'Alinhamento com os protocolos de segurança e qualidade.'
            ]
          : [
              'Destaque claro de indicadores quantitativos.',
              'Tom de comunicação profissional e focado em soluções.'
            ],
        improvements: isPharmacy
          ? [
              'Tente estruturar a resposta no método STAR (Situação, Ação, Resultado).',
              'Destaque mais as principais técnicas e dermocosméticos manipulados.'
            ]
          : [
              'Tente encurtar a introdução para ser mais direto na ação do STAR.',
              'Destaque mais as ferramentas operacionais recomendadas.'
            ]
      };
    } else if (role === 'candidate') {
      // Caso contrário, simula a próxima pergunta do entrevistador
      updated.chatHistory.push({
        role: 'interviewer',
        text: isPharmacy
          ? 'Excelente. Como você lidaria com uma situação de insatisfação ou reclamação de um paciente após um procedimento estético?'
          : 'Excelente. Como você lidaria com um conflito ou desafio técnico sob pressão no dia a dia da equipe?'
      });
    }

    return localDB.saveInterviewSimulation(updated);
  }
}

