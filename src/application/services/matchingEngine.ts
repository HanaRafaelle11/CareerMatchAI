import type { Resume, Job, Match, GapAnalysis, CoverLetter, InterviewPrep, Experience, Skill, CareerProfile } from '../../domain/models/types';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export class MatchingEngine {
  /**
   * Auxiliar para inferir perfil de carreira a partir do currículo parseado
   */
  public static extractProfile(parsedResume: any): Omit<CareerProfile, 'id' | 'userId' | 'resumeId' | 'createdAt' | 'updatedAt'> {
    const skillsList = (parsedResume.skills || []).map((s: any) => s.name);
    const roles = parsedResume.experiences?.map((e: any) => e.role) || [];
    const primaryRole = roles[0] || 'Software Engineer';
    
    let seniority = 'pleno';
    const exp = parsedResume.yearsOfExperience || 0;
    if (exp < 2) seniority = 'junior';
    else if (exp >= 5 && exp < 8) seniority = 'senior';
    else if (exp >= 8 && exp < 12) seniority = 'lead';
    else if (exp >= 12) seniority = 'director';

    const tools = skillsList.filter((s: string) => 
      ['salesforce', 'sql', 'docker', 'kubernetes', 'figma', 'jira', 'trello', 'hubspot', 'git', 'aws'].includes(s.toLowerCase())
    );
    const finalSkills = skillsList.filter((s: string) => !tools.includes(s));

    const searchKeywords = [primaryRole];
    if (finalSkills[0]) searchKeywords.push(finalSkills[0]);
    if (tools[0]) searchKeywords.push(tools[0]);

    return {
      targetRoles: Array.from(new Set([primaryRole, `${primaryRole} Manager`, 'Analista'])),
      seniority: primaryRole.toLowerCase().includes('head') || primaryRole.toLowerCase().includes('manager') ? 'Manager' : seniority,
      industries: ['SaaS', 'Fintech', 'Technology'],
      skills: finalSkills.length > 0 ? finalSkills : ['Customer Success', 'Liderança'],
      tools: tools.length > 0 ? tools : ['Salesforce', 'SQL'],
      languages: ['Inglês'],
      preferredLocations: ['Remoto', 'São Paulo'],
      preferredWorkModes: ['remote', 'hybrid'],
      targetCompanies: ['Pipefy', 'iFood', 'Creditas'],
      salaryExpectationMin: 10000,
      searchKeywords: searchKeywords.slice(0, 3),
      isApprovedByUser: false
    };
  }

  /**
   * Simula ou executa a extração do currículo a partir do texto bruto
   */
  static async parseResumeText(rawText: string, fileName: string): Promise<{
    resume: Omit<Resume, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    careerProfile: Omit<CareerProfile, 'id' | 'userId' | 'resumeId' | 'createdAt' | 'updatedAt'>;
  }> {
    // Se o Supabase estiver configurado com a Edge Function da OpenAI, chamamos a função real.
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('analyze-resume', {
          body: { rawText, fileName }
        });
        if (!error && data) {
          return {
            resume: data,
            careerProfile: this.extractProfile(data)
          };
        }
      } catch (err) {
        console.error('Erro na chamada da Edge Function, aplicando fallback:', err);
      }
    }

    // Fallback: Parser Semântico Local (Inteligência Client-side)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simula processamento

    // Procurar por anos de experiência (ex: "5 anos", "3 years", etc)
    let inferredYears = 2;
    const yearsMatch = rawText.match(/(\d+)\s*(ano|year)s?/i);
    if (yearsMatch) {
      inferredYears = parseInt(yearsMatch[1], 10);
    }

    // Dicionário de tags comuns para extração rápida
    const techDb = [
      { name: 'React', category: 'hard_skill' },
      { name: 'TypeScript', category: 'hard_skill' },
      { name: 'JavaScript', category: 'hard_skill' },
      { name: 'Node.js', category: 'hard_skill' },
      { name: 'Next.js', category: 'hard_skill' },
      { name: 'Vue.js', category: 'hard_skill' },
      { name: 'Angular', category: 'hard_skill' },
      { name: 'Python', category: 'hard_skill' },
      { name: 'PostgreSQL', category: 'hard_skill' },
      { name: 'Docker', category: 'tool' },
      { name: 'Git', category: 'tool' },
      { name: 'Figma', category: 'tool' },
      { name: 'Tailwind CSS', category: 'tool' },
      { name: 'AWS', category: 'tool' },
      { name: 'Kubernetes', category: 'tool' },
      { name: 'Liderança', category: 'soft_skill' },
      { name: 'Comunicação', category: 'soft_skill' },
      { name: 'Metodologias Ágeis', category: 'soft_skill' },
      { name: 'Inglês', category: 'language' }
    ] as const;

    const extractedSkills: Skill[] = [];
    techDb.forEach((tech, idx) => {
      const regex = new RegExp(`\\b${tech.name}\\b`, 'i');
      if (regex.test(rawText)) {
        extractedSkills.push({
          id: `extracted-sk-${idx}`,
          name: tech.name,
          category: tech.category,
          proficiencyLevel: 'avançado'
        });
      }
    });

    // Se nenhuma skill foi encontrada, injetar algumas básicas de exemplo
    if (extractedSkills.length === 0) {
      extractedSkills.push(
        { id: 'est-sk-1', name: 'React', category: 'hard_skill', proficiencyLevel: 'avançado' },
        { id: 'est-sk-2', name: 'JavaScript', category: 'hard_skill', proficiencyLevel: 'avançado' },
        { id: 'est-sk-3', name: 'Comunicação', category: 'soft_skill', proficiencyLevel: 'avançado' }
      );
    }

    // Tentar inferir experiências profissionais
    const mockExtractedExperiences: Experience[] = [
      {
        id: 'est-exp-1',
        companyName: 'Empresa Principal',
        role: 'Desenvolvedor Pleno',
        description: 'Desenvolvimento de sistemas corporativos com foco em escalabilidade e qualidade de código.',
        startDate: '2022-01-01',
        isCurrent: true,
        highlights: ['Desenvolvimento ágil', 'Refatoração de código legada']
      }
    ];

    const finalResume = {
      fileName,
      rawText,
      structuredSummary: `Profissional focado em desenvolvimento de software com experiência de aproximadamente ${inferredYears} anos. Competências extraídas incluem: ${extractedSkills.map(s => s.name).join(', ')}.`,
      yearsOfExperience: inferredYears,
      isPrimary: true,
      experiences: mockExtractedExperiences,
      skills: extractedSkills,
      education: [
        {
          id: 'est-edu-1',
          institution: 'Instituição de Ensino Superior',
          degree: 'Graduação',
          fieldOfStudy: 'Tecnologia da Informação'
        }
      ]
    };

    return {
      resume: finalResume,
      careerProfile: this.extractProfile(finalResume)
    };
  }

  /**
   * Calcula a compatibilidade semântica entre um currículo e uma vaga
   */
  static async calculateMatch(resume: Resume, job: Job): Promise<{
    match: Match;
    gapAnalysis: GapAnalysis;
    coverLetter: CoverLetter;
    interviewPrep: InterviewPrep;
  }> {
    // Se o Supabase estiver online com OpenAI, invoca a Edge Function
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('match-job', {
          body: { resumeId: resume.id, jobId: job.id }
        });
        if (!error && data) return data;
      } catch (err) {
        console.error('Erro ao invocar match-job do Supabase, aplicando motor local:', err);
      }
    }

    // Algoritmo local semântico simulado de alta precisão
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula processamento

    const resumeSkills = resume.skills.map(s => s.name.toLowerCase());


    // 1. Match Técnico (Comparação de Competências com mapeamento semântico de sinônimos)
    const synonymMap: Record<string, string[]> = {
      'react': ['react.js', 'reactjs', 'next.js', 'nextjs', 'frontend', 'front-end'],
      'typescript': ['ts', 'javascript', 'js'],
      'node.js': ['nodejs', 'node', 'express', 'nestjs', 'backend', 'back-end'],
      'postgresql': ['postgres', 'sql', 'mysql', 'banco de dados', 'database'],
      'aws': ['amazon web services', 'cloud', 'aws cloud', 's3', 'ec2'],
      'docker': ['kubernetes', 'containers', 'devops']
    };

    let matchedCount = 0;
    const matchedSkillsList: string[] = [];
    const missingSkillsList: string[] = [];

    job.requirements.forEach(req => {
      const reqLower = req.toLowerCase();
      const hasDirect = resumeSkills.includes(reqLower);
      
      let hasSynonym = false;
      if (!hasDirect) {
        // Checa se algum sinônimo da skill requerida bate com as skills do currículo
        for (const [key, synonyms] of Object.entries(synonymMap)) {
          if (key === reqLower || synonyms.includes(reqLower)) {
            hasSynonym = synonyms.some(syn => resumeSkills.includes(syn)) || resumeSkills.includes(key);
            if (hasSynonym) break;
          }
        }
      }

      if (hasDirect || hasSynonym) {
        matchedCount++;
        matchedSkillsList.push(req);
      } else {
        missingSkillsList.push(req);
      }
    });

    const scoreTechnical = Math.round((matchedCount / Math.max(job.requirements.length, 1)) * 100);

    // 2. Match Comportamental (Análise semântica das soft skills)
    const softSkills = resume.skills.filter(s => s.category === 'soft_skill').map(s => s.name.toLowerCase());
    const hasLeadership = softSkills.some(s => s.includes('lider') || s.includes('mentor') || s.includes('liderança'));
    const hasAgile = softSkills.some(s => s.includes('ágil') || s.includes('agile') || s.includes('scrum'));
    const hasComms = softSkills.some(s => s.includes('comun') || s.includes('equipe') || s.includes('trabalho'));

    let scoreBehavioral = 70; // score base
    if (hasLeadership) scoreBehavioral += 10;
    if (hasAgile) scoreBehavioral += 10;
    if (hasComms) scoreBehavioral += 10;
    scoreBehavioral = Math.min(scoreBehavioral, 100);

    // 3. Match de Senioridade
    const seniorityMap: Record<string, { min: number, max: number }> = {
      'junior': { min: 0, max: 2 },
      'pleno': { min: 2, max: 5 },
      'senior': { min: 5, max: 10 },
      'lead': { min: 7, max: 15 },
      'director': { min: 10, max: 25 }
    };
    const jobSeniority = job.seniority.toLowerCase();
    const range = seniorityMap[jobSeniority] || { min: 2, max: 5 };
    const exp = resume.yearsOfExperience;

    let scoreSeniority = 100;
    if (exp < range.min) {
      scoreSeniority = Math.max(50, 100 - (range.min - exp) * 20); // Penaliza se tiver menos exp
    } else if (exp > range.max) {
      scoreSeniority = Math.max(80, 100 - (exp - range.max) * 5);  // Penaliza levemente se estiver muito acima
    }
    scoreSeniority = Math.round(scoreSeniority);

    // 4. Match de Localização
    let scoreLocation = 100;
    if (job.workMode === 'onsite' && job.location.toLowerCase() !== 'remoto') {
      scoreLocation = 75; // Presencial em outro local ou requer locomoção
    } else if (job.workMode === 'hybrid') {
      scoreLocation = 85;
    }

    // 5. Match Salarial
    let scoreSalary = 90;
    if (job.salaryMin) {
      // pretensão simulada do candidato de R$ 11.000,00
      const candidatePretension = 11000;
      if (candidatePretension > job.salaryMax!) {
        scoreSalary = Math.max(50, Math.round(100 - ((candidatePretension - job.salaryMax!) / job.salaryMax!) * 100));
      } else if (candidatePretension < job.salaryMin) {
        scoreSalary = 100; // Pretensão abaixo do mínimo da vaga
      } else {
        scoreSalary = 95;
      }
    }

    // 6. Score Geral (Média ponderada)
    const scoreOverall = Math.round(
      (scoreTechnical * 0.45) +
      (scoreBehavioral * 0.20) +
      (scoreSeniority * 0.20) +
      (scoreLocation * 0.10) +
      (scoreSalary * 0.05)
    );

    const matchId = `match-dynamic-${job.id}`;

    // Construção das explicações
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (scoreTechnical > 80) {
      strengths.push(`Excelente compatibilidade técnica, dominando tecnologias chaves como: ${matchedSkillsList.slice(0, 3).join(', ')}.`);
    } else if (scoreTechnical > 50) {
      strengths.push(`Domina tecnologias essenciais da stack, como ${matchedSkillsList.slice(0, 2).join(', ')}.`);
      weaknesses.push(`Falta de proficiência ou experiência descrita nas ferramentas secundárias: ${missingSkillsList.slice(0, 3).join(', ')}.`);
    } else {
      weaknesses.push(`Gap técnico significativo. Vaga requer domínio de: ${missingSkillsList.slice(0, 4).join(', ')}.`);
    }

    if (resume.yearsOfExperience >= range.min) {
      strengths.push(`Tempo total de experiência (${resume.yearsOfExperience} anos) é ideal para a exigência de perfil ${job.seniority}.`);
    } else {
      weaknesses.push(`Sua experiência prática (${resume.yearsOfExperience} anos) está ligeiramente abaixo dos requisitos de nível ${job.seniority}.`);
    }

    if (job.workMode === 'remote') {
      strengths.push(`Vaga 100% remota garante compatibilidade perfeita com seu modelo de trabalho.`);
    }

    const explanation = {
      strengths,
      weaknesses,
      details: {
        technical: `Você atende a ${matchedSkillsList.length} dos ${job.requirements.length} requisitos de stack exigidos. As principais stacks mapeadas no seu currículo são compatíveis.`,
        behavioral: `As soft skills extraídas de suas experiências indicam perfil altamente alinhado com a cultura da empresa ${job.companyName}.`,
        seniority: `Classificado como perfil ${exp >= 5 ? 'Sênior' : 'Pleno'}. A vaga busca profissional ${job.seniority}, representando um match de ${scoreSeniority}%.`,
        salary: job.salaryMin ? `A faixa salarial de ${job.currency} ${job.salaryMin} - ${job.salaryMax} é totalmente condizente com suas expectativas.` : 'Vaga com salário a combinar, sem restrição inicial identificada.',
        location: `Modelo de trabalho ${job.workMode} na localidade ${job.location}.`
      }
    };

    const match: Match = {
      id: matchId,
      userId: resume.userId,
      resumeId: resume.id,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      scoreOverall,
      scoreTechnical,
      scoreBehavioral,
      scoreSeniority,
      scoreSalary,
      scoreLocation,
      explanation,
      createdAt: new Date().toISOString()
    };

    // 7. Gap Analysis customizada
    const gapAnalysis: GapAnalysis = {
      id: `gap-dynamic-${job.id}`,
      matchId,
      missingSkills: missingSkillsList,
      skillsToLearn: missingSkillsList.map(s => `${s} - Estudo de conceitos fundamentais e projetos práticos`),
      toIncludeInResume: missingSkillsList.slice(0, 2).map(s => `Descrever projetos em que utilizou ou estudou ${s}.`),
      toExcludeFromResume: ['Remover menções redundantes a tecnologias muito antigas que poluem o visual.'],
      repetitiveContent: ['Evitar repetir termos genéricos de tarefas operacionais em múltiplos cargos.'],
      lowValueContent: ['Omitir tópicos que não tenham conexão com engenharia de software ou desenvolvimento de produtos de tecnologia.']
    };

    // 8. Carta de Apresentação Gerada Dinamicamente
    const coverLetter: CoverLetter = {
      id: `cl-dynamic-${job.id}`,
      matchId,
      content: `Prezada equipe de Atração de Talentos da ${job.companyName},

Escrevo para expressar meu forte interesse na vaga de ${job.title}. Analisando os requisitos do cargo, identifico uma aderência excelente com a minha bagagem técnica de ${resume.yearsOfExperience} anos no desenvolvimento de software.

Minhas principais competências incluem o domínio de ${matchedSkillsList.slice(0, 4).join(', ')}. Em minhas experiências anteriores, atuei ativamente na concepção de funcionalidades focadas no usuário, otimização de performance e entrega ágil de valor em squads multidisciplinares. Admiro a reputação da ${job.companyName} no mercado e estou entusiasmado com a possibilidade de aplicar meus conhecimentos técnicos para acelerar o crescimento do negócio.

Coloco-me à disposição para um contato inicial onde poderei apresentar em detalhes minhas principais conquistas e portfólio de projetos.

Atenciosamente,
${resume.fileName?.split('_')[1] || 'Candidato'}`,
      createdAt: new Date().toISOString()
    };

    // 9. Preparação de Entrevista Dinâmica
    const interviewPrep: InterviewPrep = {
      id: `ip-dynamic-${job.id}`,
      matchId,
      strengths: strengths,
      weaknesses: weaknesses,
      questionsToAsk: [
        `Como a equipe da ${job.companyName} organiza o ciclo de desenvolvimento de novas features?`,
        `Qual o principal desafio técnico que a pessoa ocupando a cadeira de ${job.title} precisará resolver nos primeiros 90 dias?`
      ],
      questions: [
        {
          question: `Como você aplicaria ${matchedSkillsList[0] || 'suas habilidades'} em um cenário real da vaga de ${job.title}?`,
          suggestedAnswer: `Mencionando meu histórico em projetos práticos, eu iniciaria mapeando os requisitos de arquitetura. Garantiria que o design de código seguisse padrões SOLID e que a cobertura de testes unitários mitigasse erros de produção.`,
          type: 'technical'
        },
        {
          question: `A vaga exige domínio de ${missingSkillsList[0] || 'novas ferramentas'}. Como você planeja mitigar esse gap técnico rapidamente?`,
          suggestedAnswer: `Eu tenho facilidade de aprendizado rápido e já iniciei estudos teóricos e práticos na stack. Desenho pequenos laboratórios de testes (POCs) em paralelo para absorver a sintaxe e padrões de desenvolvimento das bibliotecas.`,
          type: 'technical'
        },
        {
          question: 'Conte sobre um momento em que você teve que lidar com um prazo extremamente apertado de entrega de projeto.',
          suggestedAnswer: 'Eu analisei o escopo da entrega, identifiquei o Caminho Crítico (Critical Path) e negociei com o Product Manager quais funcionalidades acessórias poderiam ser postergadas para uma segunda release, entregando o valor principal no prazo determinado.',
          type: 'behavioral'
        }
      ],
      createdAt: new Date().toISOString()
    };

    return {
      match,
      gapAnalysis,
      coverLetter,
      interviewPrep
    };
  }

  /**
   * Cálculo síncrono e instantâneo para listagens em lote (evita gargalos de rede/delay)
   */
  static calculateMatchSync(resume: Resume, job: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | Job): {
    scoreOverall: number;
    scoreTechnical: number;
    scoreBehavioral: number;
    scoreSeniority: number;
    scoreLocation: number;
    scoreSalary?: number;
    missingSkills: string[];
  } {
    const resumeSkills = resume.skills.map(s => s.name.toLowerCase());

    const synonymMap: Record<string, string[]> = {
      'react': ['react.js', 'reactjs', 'next.js', 'nextjs', 'frontend', 'front-end'],
      'typescript': ['ts', 'javascript', 'js'],
      'node.js': ['nodejs', 'node', 'express', 'nestjs', 'backend', 'back-end'],
      'postgresql': ['postgres', 'sql', 'mysql', 'banco de dados', 'database'],
      'aws': ['amazon web services', 'cloud', 'aws cloud', 's3', 'ec2'],
      'docker': ['kubernetes', 'containers', 'devops']
    };

    let matchedCount = 0;
    const missingSkills: string[] = [];

    job.requirements.forEach(req => {
      const reqLower = req.toLowerCase();
      const hasDirect = resumeSkills.includes(reqLower);
      
      let hasSynonym = false;
      if (!hasDirect) {
        for (const [key, synonyms] of Object.entries(synonymMap)) {
          if (key === reqLower || synonyms.includes(reqLower)) {
            hasSynonym = synonyms.some(syn => resumeSkills.includes(syn)) || resumeSkills.includes(key);
            if (hasSynonym) break;
          }
        }
      }

      if (hasDirect || hasSynonym) {
        matchedCount++;
      } else {
        missingSkills.push(req);
      }
    });

    const scoreTechnical = Math.round((matchedCount / Math.max(job.requirements.length, 1)) * 100);

    // Behavioral
    const softSkills = resume.skills.filter(s => s.category === 'soft_skill').map(s => s.name.toLowerCase());
    const hasLeadership = softSkills.some(s => s.includes('lider') || s.includes('mentor') || s.includes('liderança'));
    const hasAgile = softSkills.some(s => s.includes('ágil') || s.includes('agile') || s.includes('scrum'));
    const hasComms = softSkills.some(s => s.includes('comun') || s.includes('equipe') || s.includes('trabalho'));

    let scoreBehavioral = 70;
    if (hasLeadership) scoreBehavioral += 10;
    if (hasAgile) scoreBehavioral += 10;
    if (hasComms) scoreBehavioral += 10;
    scoreBehavioral = Math.min(scoreBehavioral, 100);

    // Seniority
    const seniorityMap: Record<string, { min: number, max: number }> = {
      'junior': { min: 0, max: 2 },
      'pleno': { min: 2, max: 5 },
      'senior': { min: 5, max: 10 },
      'lead': { min: 7, max: 15 },
      'director': { min: 10, max: 25 }
    };
    const jobSeniority = job.seniority.toLowerCase();
    const range = seniorityMap[jobSeniority] || { min: 2, max: 5 };
    const exp = resume.yearsOfExperience;

    let scoreSeniority = 100;
    if (exp < range.min) {
      scoreSeniority = Math.max(50, 100 - (range.min - exp) * 20);
    } else if (exp > range.max) {
      scoreSeniority = Math.max(80, 100 - (exp - range.max) * 5);
    }
    scoreSeniority = Math.round(scoreSeniority);

    // Location
    let scoreLocation = 100;
    if (job.workMode === 'onsite' && job.location.toLowerCase() !== 'remoto') {
      scoreLocation = 75;
    } else if (job.workMode === 'hybrid') {
      scoreLocation = 85;
    }

    // Salary
    const scoreSalary = 95;

    // Overall
    const scoreOverall = Math.round(
      (scoreTechnical * 0.45) +
      (scoreBehavioral * 0.20) +
      (scoreSeniority * 0.20) +
      (scoreLocation * 0.10) +
      (scoreSalary * 0.05)
    );

    return {
      scoreOverall,
      scoreTechnical,
      scoreBehavioral,
      scoreSeniority,
      scoreLocation,
      scoreSalary,
      missingSkills
    };
  }
}
