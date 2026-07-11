import type { Job, Resume, Match, GapAnalysis, CoverLetter, InterviewPrep } from '../../domain/models/types';

export const mockResume: Resume = {
  id: 'resume-123',
  userId: 'mock-user-id',
  fileName: 'Curriculo_Alexandre_Silva.pdf',
  rawText: 'Alexandre Silva - Software Engineer. Experiência de 5 anos com React, TypeScript, Node.js e Tailwind. Formado em Ciência da Computação. Certificação AWS.',
  structuredSummary: 'Desenvolvedor Full Stack com mais de 5 anos de experiência prática na criação de aplicações web escaláveis. Especialista em ecossistemas React, Node.js e computação em nuvem (AWS). Apaixonado por metodologias ágeis, Clean Code e otimização de performance.',
  yearsOfExperience: 5.5,
  isPrimary: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  experiences: [
    {
      id: 'exp-1',
      companyName: 'TechFlow Solutions',
      role: 'Software Engineer Pleno',
      description: 'Liderança no desenvolvimento de novos módulos de uma plataforma SaaS corporativa utilizando React, TypeScript e Next.js. Otimização do tempo de carregamento da aplicação em 35% por meio de code-splitting e lazy loading. Integração de gateways de pagamento e sistemas de mensageria assíncrona com Node.js e RabbitMQ.',
      startDate: '2023-02-15',
      isCurrent: true,
      highlights: [
        'Otimizou performance em 35% com lazy loading.',
        'Desenvolveu microserviços em Node.js altamente resilientes.',
        'Mentoria de 2 desenvolvedores juniores.'
      ]
    },
    {
      id: 'exp-2',
      companyName: 'Codex Dev Studio',
      role: 'Desenvolvedor Frontend Junior',
      description: 'Desenvolvimento de interfaces responsivas para clientes nacionais e internacionais de e-commerce utilizando React, Tailwind CSS e Redux Toolkit. Implementação de testes unitários com Jest e React Testing Library, elevando a cobertura de testes para 80%. Colaboração direta com designers UX/UI para traduzir protótipos do Figma em código.',
      startDate: '2021-01-10',
      endDate: '2023-02-01',
      isCurrent: false,
      highlights: [
        'Aumentou cobertura de testes unitários para 80%.',
        'Refatorou 4 legados de sites complexos para React responsivo.',
        'Implementou animações de UI com Framer Motion.'
      ]
    }
  ],
  skills: [
    { id: 'sk-1', name: 'React', category: 'hard_skill', proficiencyLevel: 'avançado' },
    { id: 'sk-2', name: 'TypeScript', category: 'hard_skill', proficiencyLevel: 'avançado' },
    { id: 'sk-3', name: 'Node.js', category: 'hard_skill', proficiencyLevel: 'avançado' },
    { id: 'sk-4', name: 'Tailwind CSS', category: 'tool', proficiencyLevel: 'avançado' },
    { id: 'sk-5', name: 'Next.js', category: 'hard_skill', proficiencyLevel: 'intermediário' },
    { id: 'sk-6', name: 'AWS', category: 'tool', proficiencyLevel: 'intermediário' },
    { id: 'sk-7', name: 'Jest', category: 'tool', proficiencyLevel: 'intermediário' },
    { id: 'sk-8', name: 'Figma', category: 'tool', proficiencyLevel: 'intermediário' },
    { id: 'sk-9', name: 'PostgreSQL', category: 'hard_skill', proficiencyLevel: 'intermediário' },
    { id: 'sk-10', name: 'Inglês', category: 'language', proficiencyLevel: 'avançado' },
    { id: 'sk-11', name: 'Metodologias Ágeis', category: 'soft_skill', proficiencyLevel: 'avançado' },
    { id: 'sk-12', name: 'Trabalho em Equipe', category: 'soft_skill', proficiencyLevel: 'avançado' },
    { id: 'sk-13', name: 'Comunicação', category: 'soft_skill', proficiencyLevel: 'avançado' }
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Universidade Federal de Santa Catarina',
      degree: 'Bacharelado em Ciência da Computação',
      fieldOfStudy: 'Ciência da Computação',
      startDate: '2017-03-01',
      endDate: '2021-12-15'
    }
  ]
};

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    companyId: 'comp-1',
    companyName: 'Stripe Brasil',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    title: 'Desenvolvedor Full Stack Senior (React & Node)',
    description: 'Buscamos uma pessoa Desenvolvedora Full Stack Senior para integrar nosso time de engenharia financeira. Você atuará desenvolvendo APIs transacionais em Node.js de alta performance e interfaces web fluidas utilizando React e TypeScript. É essencial possuir sólido conhecimento de infraestrutura cloud (AWS), bancos de dados PostgreSQL e arquiteturas orientadas a eventos.',
    requirements: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS Cloud', 'Docker', 'GraphQL', 'Inglês Fluente'],
    location: 'São Paulo - SP',
    workMode: 'hybrid',
    seniority: 'senior',
    salaryMin: 14000,
    salaryMax: 18000,
    currency: 'BRL',
    sourceUrl: 'https://stripe.com/jobs',
    sourcePlatform: 'Stripe Careers',
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-2',
    companyId: 'comp-2',
    companyName: 'Linear Technologies',
    companyLogo: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    title: 'Frontend Engineer (React / TypeScript)',
    description: 'Procuramos um Engenheiro Frontend extremamente focado em detalhes visuais e performance de interface. Trabalhamos com React, TypeScript, Tailwind CSS e Framer Motion para construir a ferramenta de gestão mais rápida do mercado. Valorizamos escrita de código limpa, testes de interface robustos e forte alinhamento com boas práticas de UX.',
    requirements: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Jest / Vitest', 'Design System', 'Figma Integration'],
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'pleno',
    salaryMin: 10000,
    salaryMax: 13000,
    currency: 'BRL',
    sourceUrl: 'https://linear.app/careers',
    sourcePlatform: 'LinkedIn',
    isActive: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-3',
    companyId: 'comp-3',
    companyName: 'Nubank',
    companyLogo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    title: 'Engenheiro de Software Backend (Clojure/Node.js)',
    description: 'Venha trabalhar em um dos maiores ecossistemas financeiros do mundo. Nosso time de backend é responsável por arquiteturas distribuídas e de altíssima escala. Buscamos profissionais com sólida base em algoritmos, concorrência, bancos relacionais e não-relacionais, e vivência com testes de estresse.',
    requirements: ['Programação Funcional', 'Node.js', 'Clojure', 'Kafka / Event Sourcing', 'PostgreSQL', 'Kubernetes'],
    location: 'São Paulo - SP',
    workMode: 'hybrid',
    seniority: 'senior',
    salaryMin: 16000,
    salaryMax: 21000,
    currency: 'BRL',
    sourceUrl: 'https://nubank.com/carreiras',
    sourcePlatform: 'Gupy',
    isActive: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-4',
    companyId: 'comp-4',
    companyName: 'Hotmart',
    companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    title: 'Desenvolvedor Frontend Pleno',
    description: 'Procuramos pessoa desenvolvedora React Pleno para atuar na evolução dos nossos produtos globais de educação. Você participará da implementação de fluxos de checkout otimizados, testes A/B de conversão e arquitetura de micro-frontends.',
    requirements: ['React', 'JavaScript (ES6+)', 'CSS-in-JS / Sass', 'Web Performance', 'Analytics & A/B Testing'],
    location: 'Belo Horizonte - MG',
    workMode: 'onsite',
    seniority: 'pleno',
    salaryMin: 8000,
    salaryMax: 11000,
    currency: 'BRL',
    sourceUrl: 'https://hotmart.com/jobs',
    sourcePlatform: 'Indeed',
    isActive: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-5',
    companyId: 'comp-5',
    companyName: 'Pipefy',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    title: 'Customer Success Manager',
    description: 'Buscamos uma pessoa Customer Success Manager para integrar nosso time de atendimento. Você atuará garantindo o sucesso e satisfação dos nossos clientes corporativos (B2B), definindo estratégias para mitigar churn e melhorar a conversão. É essencial ter experiência com Salesforce, SQL e metodologias ágeis de prospecção e engajamento.',
    requirements: ['Customer Success', 'SaaS', 'Churn', 'NPS', 'Salesforce', 'SQL', 'Inglês Intermediário'],
    location: 'Curitiba - PR',
    workMode: 'remote',
    seniority: 'pleno',
    salaryMin: 10000,
    salaryMax: 13000,
    currency: 'BRL',
    sourceUrl: 'https://pipefy.com/careers',
    sourcePlatform: 'Indeed',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockMatches: Match[] = [
  {
    id: 'match-job-1',
    userId: 'mock-user-id',
    resumeId: 'resume-123',
    jobId: 'job-1',
    jobTitle: 'Desenvolvedor Full Stack Senior (React & Node)',
    companyName: 'Stripe Brasil',
    companyLogo: mockJobs[0].companyLogo,
    scoreOverall: 88,
    scoreTechnical: 90,
    scoreBehavioral: 92,
    scoreSeniority: 78,
    scoreSalary: 95,
    scoreLocation: 85,
    createdAt: new Date().toISOString(),
    explanation: {
      strengths: [
        'Forte domínio prático de React e TypeScript refletido nos projetos recentes.',
        'Proficiência avançada em Node.js com arquitetura de serviços.',
        'Experiência direta com bancos de dados relacionais (PostgreSQL).'
      ],
      weaknesses: [
        'Diferença leve de senioridade (o candidato possui 5 anos de experiência e a vaga pede nível Senior consolidado de 7+ anos).',
        'Ausência de experiência descrita com Docker e GraphQL.',
        'O nível de inglês no currículo consta como Avançado, mas a vaga preferencialmente exige fluência técnica.'
      ],
      details: {
        technical: 'Você possui mais de 80% das stacks principais da vaga (React, Node, PostgreSQL e AWS). Apenas ferramentas acessórias como Docker e GraphQL não constam no currículo.',
        behavioral: 'Demonstra boa adaptabilidade, autonomia, mentoria técnica de juniores e comunicação com stakeholders, altamente alinhado com o perfil cultural do Stripe.',
        seniority: 'A vaga busca perfil sênior pleno com autonomia completa de infraestrutura. Seu perfil está classificado como Pleno-Avançado, o que o torna um forte concorrente.',
        salary: 'Sua pretensão declarada é altamente compatível com a faixa oferecida (R$ 14.000,00 - R$ 18.000,00).',
        location: 'Modelo híbrido em São Paulo. Como você reside próximo ou tem disponibilidade de locomoção, a compatibilidade de localização é alta.'
      }
    }
  },
  {
    id: 'match-job-2',
    userId: 'mock-user-id',
    resumeId: 'resume-123',
    jobId: 'job-2',
    jobTitle: 'Frontend Engineer (React / TypeScript)',
    companyName: 'Linear Technologies',
    companyLogo: mockJobs[1].companyLogo,
    scoreOverall: 94,
    scoreTechnical: 96,
    scoreBehavioral: 95,
    scoreSeniority: 100,
    scoreSalary: 90,
    scoreLocation: 100,
    createdAt: new Date().toISOString(),
    explanation: {
      strengths: [
        'Alinhamento técnico excelente com a stack: React, TypeScript, Tailwind e Jest.',
        'Vivência comprovada com Framer Motion e foco acentuado em animações e UI interativas no e-commerce.',
        'Compatibilidade perfeita de senioridade (nível Pleno ideal).'
      ],
      weaknesses: [
        'Pouca ênfase em design systems corporativos avançados no currículo (embora tenha trabalhado com Figma).',
        'Falta de menção explícita a ferramentas modernas de build/teste rápido como Vitest.'
      ],
      details: {
        technical: 'Você domina todas as tecnologias requeridas pela equipe de frontend do Linear. O currículo mostra aderência excepcional nas partes visuais e testes unitários.',
        behavioral: 'Excelente comunicação, foco absurdo em detalhes, capricho no acabamento de interfaces e espírito colaborativo voltado a UX.',
        seniority: 'Seu tempo de experiência (5 anos) se alinha perfeitamente com as expectativas para uma pessoa engenheira plena na empresa.',
        salary: 'O salário proposto atende ou supera ligeiramente sua pretensão média para posições 100% remotas.',
        location: 'Vaga 100% remota com flexibilidade geográfica total, pontuação de compatibilidade máxima.'
      }
    }
  },
  {
    id: 'match-job-5',
    userId: 'mock-user-id',
    resumeId: 'resume-123',
    jobId: 'job-5',
    jobTitle: 'Customer Success Manager',
    companyName: 'Pipefy',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    scoreOverall: 96,
    scoreTechnical: 95,
    scoreBehavioral: 97,
    scoreSeniority: 90,
    scoreSalary: 98,
    scoreLocation: 100,
    createdAt: new Date().toISOString(),
    explanation: {
      strengths: [
        'Excelente alinhamento com as metas de Customer Success declaradas em suas preferências.',
        'Sólida experiência com ferramentas de CRM e gestão como Salesforce.',
        'Fluência nas métricas principais (Churn, NPS, LTV).'
      ],
      weaknesses: [
        'Apenas conhecimento básico em banco de dados SQL (pode exigir treinamento rápido).'
      ],
      details: {
        technical: 'Você preenche mais de 90% dos requisitos fundamentais do cargo. O conhecimento de Salesforce é um grande diferencial.',
        behavioral: 'Competências comportamentais de negociação e foco em metas estão perfeitamente destacadas.',
        seniority: 'Adequado para o nível pleno da oportunidade.',
        salary: 'Excelente compatibilidade de pretensão salarial.',
        location: 'Posição remota, totalmente de acordo com suas preferências.'
      }
    }
  }
];

export const mockGapAnalyses: Record<string, GapAnalysis> = {
  'match-job-1': {
    id: 'gap-1',
    matchId: 'match-job-1',
    missingSkills: ['Docker', 'GraphQL', 'Inglês Fluente (técnico)'],
    skillsToLearn: ['Docker para containers locais', 'Consumo e modelagem de APIs baseadas em GraphQL (Apollo/Yoga)'],
    toIncludeInResume: [
      'Adicionar uma frase sobre experiência inicial/conhecimento prático em containerização (Docker).',
      'Descrever que trabalhou no consumo de APIs de terceiros (ex: GraphQL ou REST complexos).'
    ],
    toExcludeFromResume: [
      'Reduzir a menção repetitiva de "desenvolvimento de sites responsivos" nas conquistas mais antigas.',
      'Remover a referência curta de bibliotecas menores que já estão implícitas no domínio do React (ex: jQuery antigo ou micro-libs de helpers).'
    ],
    repetitiveContent: [
      'Menções a "criação de layouts responsivos" aparecem 3 vezes sob formatos diferentes.',
      'Uso excessivo do termo "manutenção de código". Prefira "evolução de arquitetura".'
    ],
    lowValueContent: [
      'Link de portfólio desatualizado dos tempos da faculdade.',
      'Listagem de cursos extracurriculares de curta duração (menos de 4 horas) não relacionados a engenharia de software.'
    ]
  },
  'match-job-2': {
    id: 'gap-2',
    matchId: 'match-job-2',
    missingSkills: ['Design Systems', 'Vitest'],
    skillsToLearn: ['Conceitos avançados de Design Systems (Tokens, Componentização atômica)', 'Migração de Jest para Vitest em ambientes modernos'],
    toIncludeInResume: [
      'Destacar colaboração na manutenção ou consumo do Design System interno na Codex Dev Studio.',
      'Enfatizar o desenvolvimento orientado a acessibilidade (WCAG) nas interfaces construídas.'
    ],
    toExcludeFromResume: [
      'Remover certificações de introdução a banco de dados se a vaga é estritamente focada em desenvolvimento de interface frontend.'
    ],
    repetitiveContent: [
      'A palavra "Figma" aparece repetida na descrição de projetos e na lista de ferramentas. Agrupe apenas em ferramentas.'
    ],
    lowValueContent: [
      'Menção a conhecimentos básicos em PHP ou WordPress que não se relacionam de forma alguma com a arquitetura moderna do Linear.'
    ]
  }
};

export const mockCoverLetters: Record<string, CoverLetter> = {
  'match-job-1': {
    id: 'cl-1',
    matchId: 'match-job-1',
    content: `Prezada equipe de Atração de Talentos da Stripe Brasil,

Escrevo para expressar meu forte interesse na vaga de Desenvolvedor Full Stack Senior. Com 5 anos de experiência sólida desenvolvendo soluções web robustas e escaláveis utilizando React, TypeScript e Node.js, vejo uma sinergia excelente entre minha trajetória profissional e os desafios técnicos da Stripe.

Atualmente na TechFlow Solutions, liderei a arquitetura técnica de módulos críticos de nosso sistema SaaS, o que me deu uma profunda vivência em garantir a performance do frontend e a resiliência do backend. Em um dos nossos principais projetos, liderei uma otimização no carregamento inicial da aplicação que gerou uma redução de 35% no tempo de resposta dos usuários. Além disso, tenho familiaridade prática na criação de integrações seguras, algo essencial para o core de produtos financeiros da Stripe.

Acompanho o trabalho da Stripe e admiro profundamente a cultura de código limpo, a documentação impecável e a busca constante por excelência técnica. Estou entusiasmado com a oportunidade de contribuir para a expansão do ecossistema de pagamentos no Brasil.

Agradeço pela atenção e coloco-me à inteira disposição para conversarmos mais detalhadamente sobre como minhas experiências podem agregar valor imediato ao time de engenharia.

Atenciosamente,
Alexandre Silva`,
    createdAt: new Date().toISOString()
  },
  'match-job-2': {
    id: 'cl-2',
    matchId: 'match-job-2',
    content: `Dear Linear Team,

I am writing to express my enthusiasm for the Frontend Engineer position. As a product engineer with a deep passion for high-performance interfaces, sleek animations, and meticulous UX implementation, I have always looked to Linear as the benchmark for software quality and speed.

During my 5 years as a frontend developer, I have focused heavily on crafting scalable React and TypeScript structures. At Codex Dev Studio, I built interactive, highly responsive layouts using Tailwind CSS and Framer Motion, and pushed our test coverage to a resilient 80% using Jest. Working closely with UX designers taught me to respect every pixel, animation easing curve, and keyboard interaction, which aligns directly with Linear's focus on keyboard-first design and lightning-fast responsiveness.

I would love to bring my technical skills and visual care to the Linear team. Thank you for your time, and I look forward to the possibility of discussing how my experience fits your vision of building the future of software tracking tools.

Best regards,
Alexandre Silva`,
    createdAt: new Date().toISOString()
  }
};

export const mockInterviewPreps: Record<string, InterviewPrep> = {
  'job-1': {
    id: 'ip-1',
    jobId: 'job-1',
    questions: [
      {
        question: 'A Stripe processa volumes massivos de transações em tempo real. Como você lidaria com gargalos de performance e concorrência em uma API escrita em Node.js?',
        answerStar: {
          context: 'Ao projetar APIs Node.js transacionais de alta concorrência na Stripe...',
          action: 'Eu identifico gargalos via profilers (clinic.js), adiciono caching estratégico no Redis e otimizo consultas PostgreSQL com indexação adequada.',
          result: 'Isso garante throughput de milhares de requisições por segundo sob tempo de resposta sub-100ms.'
        },
        type: 'technical'
      },
      {
        question: 'Você pode citar um exemplo de quando liderou uma otimização técnica de alto impacto e como mediu o sucesso dela?',
        answerStar: {
          context: 'No onboarding da TechFlow Solutions, o carregamento inicial do dashboard estava lento gerando perda de usuários.',
          action: 'Eu implementei code-splitting por rota, lazy-loading de componentes e cache estático no AWS CloudFront.',
          result: 'Conseguimos reduzir o Largest Contentful Paint (LCP) em 35% e aumentar a conversão de novos usuários.'
        },
        type: 'behavioral'
      },
      {
        question: 'Como você reage quando discorda de uma decisão técnica de arquitetura tomada por um colega sênior?',
        answerStar: {
          context: 'Durante debates técnicos sobre infraestrutura de microsserviços na equipe...',
          action: 'Eu trago dados objetivos e provas de conceito rápidas para decidir a melhor alternativa de forma colaborativa.',
          result: 'Mesmo que a minha proposta não vença, sigo o princípio do "discordar e assumir compromisso" (disagree and commit) com 100% de dedicação.'
        },
        type: 'fit'
      }
    ],
    strengths: [
      'Domínio completo do ecossistema React/Next no frontend.',
      'Experiência consolidada com Node.js e banco de dados relacional.',
      'Histórico de liderança e mentoria prática em startups.'
    ],
    weaknesses: [
      'Sem experiência explícita em linguagens tipadas de backend de baixo nível (como Go ou Rust), caso precise atuar além do Node.',
      'Pouco contato formal com orquestração de containers (Kubernetes).'
    ],
    questionsToAsk: [
      'Como estão estruturadas as equipes de produto no Brasil e com qual frequência colaboram com os times globais?',
      'Quais são os principais desafios técnicos que o time de infraestrutura financeira está enfrentando neste trimestre?'
    ],
    createdAt: new Date().toISOString()
  },
  'job-2': {
    id: 'ip-2',
    jobId: 'job-2',
    questions: [
      {
        question: 'Como você aborda a criação de micro-interações fluidas sem degradar o frame-rate (FPS) da aplicação?',
        answerStar: {
          context: 'Ao implementar micro-interações fluidas no Linear...',
          action: 'Eu animo propriedades aceleradas pela GPU (transform, opacity) e utilizo hooks de cache para evitar renders excessivos.',
          result: 'Mantemos a interface responsiva a 60 FPS estáveis mesmo em views densas de tarefas.'
        },
        type: 'technical'
      },
      {
        question: 'O Linear é conhecido por seu suporte completo a atalhos de teclado. Como você projetaria um hook customizado em React para gerenciar atalhos globais de forma escalável?',
        answerStar: {
          context: 'Para dar suporte a atalhos de teclado globais no sistema...',
          action: 'Criei um hook useKeyboardShortcut que ouve o evento keydown, limpa listeners no unmount e ignora o foco em campos de entrada.',
          result: 'Permitiu aos usuários realizar ações instantâneas sem usar o mouse de forma muito robusta.'
        },
        type: 'technical'
      }
    ],
    strengths: [
      'Forte sensibilidade estética e paixão por interfaces refinadas.',
      'Sólido domínio de Tailwind CSS e técnicas modernas de animação de UI.',
      'Foco extremo no usuário final e em micro-interações eficientes.'
    ],
    weaknesses: [
      'Menor vivência na manutenção de sistemas complexos de design em escala global.'
    ],
    questionsToAsk: [
      'Qual é o processo interno de design-to-engineering e como vocês decidem a prioridade de pequenos polimentos estéticos em relação a novos recursos?',
      'Como funciona a medição de performance no Linear para garantir que a aplicação web continue carregando e respondendo em milissegundos?'
    ],
    createdAt: new Date().toISOString()
  }
};
