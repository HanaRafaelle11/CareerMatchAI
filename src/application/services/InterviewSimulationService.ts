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
      const candidateReplies = updatedHistory.filter(h => h.role === 'candidate').map(h => h.text);
      let totalLength = 0;
      let hasInappropriateWords = false;
      let usesStarWords = false;

      const badWords = [/xingar/i, /ofender/i, /bater/i, /gritar/i, /palavrão/i, /ofensa/i, /agredir/i, /insultar/i, /ignorar/i];
      const starWords = [/resultado/i, /ação/i, /acao/i, /situação/i, /situacao/i, /meta/i, /objetivo/i, /consegui/i, /resolvi/i, /aprendi/i, /indicador/i];

      for (const reply of candidateReplies) {
        totalLength += reply.length;
        if (badWords.some(r => r.test(reply))) hasInappropriateWords = true;
        if (starWords.some(r => r.test(reply))) usesStarWords = true;
      }

      const avgLength = candidateReplies.length > 0 ? totalLength / candidateReplies.length : 0;
      let clarity = 75;
      let objectivity = 75;
      let adherence = 75;
      let strengths: string[] = [];
      let improvements: string[] = [];

      if (hasInappropriateWords) {
        clarity = 10;
        objectivity = 15;
        adherence = 0;
        strengths = ['Nenhum ponto forte identificado. Comportamento e linguajar inadequados.'];
        improvements = [
          'COMPORTAMENTO INACEITÁVEL: Respostas agressivas, violentas ou contendo xingamentos/ameaças resultam em reprovação imediata.',
          'Mantenha a inteligência emocional sob pressão e responda de maneira profissional.',
          'Pratique a resolução diplomática de conflitos através de comunicação assertiva.'
        ];
      } else {
        if (avgLength < 15) {
          clarity -= 35;
          objectivity += 15;
          adherence -= 30;
          improvements.push('Respostas extremamente superficiais. Desenvolva mais suas respostas com exemplos reais.');
        } else if (avgLength > 150) {
          clarity += 10;
          objectivity -= 20;
          improvements.push('Sua resposta foi muito longa e pode dispersar o entrevistador. Seja mais conciso e focado.');
        } else {
          clarity += 10;
          objectivity += 10;
          strengths.push('Boa extensão de resposta, mantendo-se focado no assunto sem prolixidade.');
        }

        if (usesStarWords) {
          adherence += 15;
          clarity += 5;
          strengths.push('Demonstrou uso de estrutura clara de causa, ação e resultados (Método STAR).');
        } else {
          adherence -= 10;
          improvements.push('Tente estruturar suas respostas usando o método STAR (Situação, Desafio, Ação e Resultados obtidos).');
        }

        if (isPharmacy) {
          strengths.push('Alinhamento satisfatório com diretrizes de atendimento ao paciente e biossegurança.');
        } else {
          strengths.push('Demonstrou senso prático para lidar com desafios operacionais corporativos.');
        }
      }

      updated.evaluations = {
        clarity: Math.max(0, Math.min(100, clarity)),
        objectivity: Math.max(0, Math.min(100, objectivity)),
        adherence: Math.max(0, Math.min(100, adherence)),
        strengths,
        improvements
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

