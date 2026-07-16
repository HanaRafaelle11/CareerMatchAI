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
          ? `Olá! Sou a **Mariana**, recrutadora sênior da Vocentro. Fico muito feliz em conversar com você hoje para a vaga de **${jobTitle}**.\n\nPara iniciarmos, gostaria que você contasse um pouco sobre sua trajetória profissional recente na área da saúde e estética. Quais foram seus maiores desafios de atendimento ou técnicos e como você os solucionou?`
          : `Olá! Sou a **Mariana**, recrutadora sênior da Vocentro. É um prazer falar com você hoje para a vaga de **${jobTitle}**.\n\nVamos começar? Gostaria que você fizesse uma breve apresentação pessoal, destacando suas experiências mais recentes e como elas se conectam com o escopo e requisitos dessa vaga.`
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
    const originalHistory = sim.chatHistory || [];
    
    // Se for o candidato respondendo, adicionamos a mensagem com avaliação fictícia condizente com a resposta
    let msgToAdd: any = { role, text };
    
    if (role === 'candidate') {
      const textLower = text.toLowerCase().trim();
      const length = textLower.length;
      
      // Heurística de score baseada no tamanho e conteúdo
      let score = 75;
      if (length < 20) score = 45;
      else if (length > 150) score = 88;
      
      const usesStar = /resultado|ação|acao|desafio|consegui|meta|métrica|resultado/i.test(textLower);
      if (usesStar) score += 10;
      score = Math.max(10, Math.min(100, score));

      msgToAdd.evaluation = {
        score,
        difficulty: 'medium',
        star: {
          situation: length > 30 ? 'Descreveu bem o contexto situacional inicial.' : 'Situação descrita de forma muito sucinta.',
          task: length > 50 ? 'Explicou a meta ou problema principal a ser resolvido.' : 'A definição do desafio foi omitida.',
          action: usesStar ? 'Detalhou as ações práticas implementadas.' : 'Faltou detalhar as ações tomadas.',
          result: usesStar ? 'Apresentou resultados e desdobramentos da ação.' : 'Não apresentou métricas ou impacto final.'
        },
        technicalScore: score - 5 > 0 ? score - 5 : score,
        clarityScore: score,
        communicationScore: score + 5 <= 100 ? score + 5 : score,
        confidenceScore: length > 50 ? 85 : 60,
        feedback: length > 50 
          ? 'Boa articulação de ideias e contextualização profissional.' 
          : 'Sua resposta foi muito curta. Tente elaborar utilizando o método STAR (Situação, Tarefa, Ação e Resultado).',
        positives: length > 55 ? ['Elaboração', 'Vocabulário profissional'] : ['Objetividade'],
        improvements: length < 55 ? ['Fornecer mais contexto', 'Descrever resultados obtidos'] : []
      };
    }

    const updatedHistory = [...originalHistory, msgToAdd];
    const updated: any = {
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
      let usesStarWords = false;

      const starWords = [/resultado/i, /ação/i, /acao/i, /situação/i, /situacao/i, /meta/i, /objetivo/i, /consegui/i, /resolvi/i, /indicador/i];

      for (const reply of candidateReplies) {
        totalLength += reply.length;
        if (starWords.some(r => r.test(reply))) usesStarWords = true;
      }

      const avgLength = candidateReplies.length > 0 ? totalLength / candidateReplies.length : 0;
      
      let overallScore = 75;
      if (avgLength < 30) overallScore = 50;
      else if (usesStarWords) overallScore = 88;

      updated.evaluations = {
        scoreOverall: overallScore,
        jobAdherence: overallScore - 2 > 0 ? overallScore - 2 : overallScore,
        approvalProbability: overallScore > 80 ? 85 : overallScore > 60 ? 60 : 30,
        starAnalysis: usesStarWords 
          ? 'Demonstrou excelente familiaridade com a estrutura STAR, conectando ações a resultados de forma lógica.'
          : 'Falta um pouco de ênfase na entrega e resultados. As respostas se concentraram muito nas atividades sem citar o impacto gerado.',
        technicalAnalysis: 'O candidato possui conhecimento das competências básicas, mas pode aprofundar nas ferramentas estratégicas citadas na descrição da vaga.',
        communicationAnalysis: avgLength > 120 
          ? 'Comunicação muito descritiva e detalhada, com boa eloquência.' 
          : 'Comunicação direta, mas que peca pela falta de profundidade em momentos críticos.',
        postureAnalysis: 'Demonstrou segurança nas respostas e profissionalismo na escolha do vocabulário.',
        clarityAnalysis: 'Boas conexões de frases e raciocínio fluido.',
        objectivityAnalysis: avgLength > 150 ? 'Dispersou um pouco em detalhes secundários.' : 'Excelente poder de síntese e clareza de ideias.',
        confidenceAnalysis: 'Transmitiu propriedade ao falar de suas experiências operacionais.',
        strengths: [
          'Experiência prática demonstrável', 
          usesStarWords ? 'Uso de métricas e desfechos' : 'Foco em soluções de problemas',
          isPharmacy ? 'Orientação a normas de biossegurança' : 'Trabalho sob pressão e resolução ágil'
        ],
        weaknesses: [
          avgLength < 50 ? 'Respostas excessivamente resumidas' : 'Detalhamento excessivo de processos operacionais',
          !usesStarWords ? 'Omissão de resultados quantificáveis' : 'Falta de menção a ferramentas avançadas'
        ],
        bestAnswers: ['Apresentação inicial com link para desafios anteriores.'],
        worstAnswers: ['Segunda resposta com pouca elaboração técnica.'],
        improvementPlan: [
          'Utilize a estrutura Situação -> Tarefa -> Ação -> Resultado em todas as perguntas comportamentais.',
          'Quantifique seus resultados: mencione percentuais, prazos ou economia gerada.',
          'Aprofunde-se nos termos técnicos chaves da vaga durante suas respostas.'
        ],
        gapAnalysis: [
          'Falta de detalhamento de indicadores chaves de performance (KPIs) de projetos.',
          'Foco excessivamente prático com pouca fundamentação metodológica nas respostas.'
        ],
        recommendedQuestions: [
          'Como você lidaria com uma divergência técnica com um colega de mesmo nível hierárquico?',
          'Quais seriam os primeiros três passos que você tomaria ao notar um gargalo no processo?'
        ],
        seniorityPerceived: avgLength > 120 ? 'senior' : 'pleno',
        riskAnalysis: 'Risco baixo. O candidato demonstra boa adaptabilidade e raciocínio prático de resolução de problemas.',
        jobFitComparison: 'Aderência moderada a alta. Suas competências essenciais coincidem em 80% com as exigidas para o perfil.',
        tokens_used: 1250,
        estimated_cost: 0.0003,
        duration_seconds: 145
      };
    } else if (role === 'candidate') {
      // Caso contrário, simula a próxima pergunta do entrevistador
      const textLower = text.toLowerCase().trim();
      const isUninformative = textLower.length < 12 || 
                              textLower.includes('não sei') || 
                              textLower.includes('nao sei') || 
                              textLower.includes('não faço ideia') || 
                              textLower.includes('nao faco ideia');

      const intro = isUninformative
        ? 'Entendo. Não há problemas em não lembrar de um caso específico de imediato. Vamos tentar outro cenário:'
        : 'Muito interessante esse seu ponto de vista.';

      updated.chatHistory.push({
        role: 'interviewer',
        text: isPharmacy
          ? `${intro} Me conta: como você lidaria com uma situação de insatisfação ou reclamação de um paciente após um procedimento ou atendimento estético na clínica?`
          : `${intro} Pensando em desafios do dia a dia, como você costuma lidar com prazos apertados e conflitos técnicos sob pressão no ambiente de equipe?`
      });
    }

    return localDB.saveInterviewSimulation(updated);
  }
}
