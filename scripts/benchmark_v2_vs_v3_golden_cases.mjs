import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';
import { MatchingEngine } from '../src/application/services/matchingEngine.ts';

console.log('========================================================================');
console.log('📊 BENCHMARK COMPARATIVO & AUDITORIA DE EXPLICABILIDADE: MOTOR V2 vs V3');
console.log('========================================================================\n');

const goldenDataset = [
  {
    name: '1. Match Direto (Senior Dev React -> Senior Dev React)',
    job: {
      id: 'job-1',
      title: 'Senior Frontend Engineer (React/TypeScript)',
      requirements: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      seniority: 'senior',
      location: 'Remoto',
      workMode: 'remote'
    },
    resume: {
      id: 'res-1',
      fullName: 'Lucas Dev',
      yearsOfExperience: 6,
      skills: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Node.js' }, { name: 'GraphQL' }],
      experiences: [{ role: 'Senior Frontend Engineer', companyName: 'Tech Alpha' }]
    },
    goal: {
      intentType: 'same_area_grow',
      targetArea: 'Engenharia Frontend',
      targetRoles: ['Senior Frontend Engineer', 'Staff Engineer']
    }
  },
  {
    name: '2. Promoção de Senioridade (Pleno Dev -> Tech Lead)',
    job: {
      id: 'job-2',
      title: 'Tech Lead Backend (Node.js)',
      requirements: ['Node.js', 'PostgreSQL', 'Liderança Técnica', 'Arquitetura de Microsserviços'],
      seniority: 'lead',
      location: 'Remoto',
      workMode: 'remote'
    },
    resume: {
      id: 'res-2',
      fullName: 'Beatriz Lima',
      yearsOfExperience: 4,
      skills: [{ name: 'Node.js' }, { name: 'PostgreSQL' }, { name: 'Docker' }],
      experiences: [{ role: 'Backend Developer Pleno', companyName: 'SaaS Hub' }]
    },
    goal: {
      intentType: 'same_area_grow',
      targetArea: 'Liderança Técnica',
      targetRoles: ['Tech Lead', 'Engineering Lead'],
      targetSeniority: 'lead'
    }
  },
  {
    name: '3. Mudança de Área Próxima (CS Manager -> Product Manager)',
    job: {
      id: 'job-3',
      title: 'Product Manager Jr/Pleno (SaaS)',
      requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis'],
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote'
    },
    resume: {
      id: 'res-3',
      fullName: 'Mariana CS',
      yearsOfExperience: 4,
      skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Jira' }, { name: 'Churn' }, { name: 'NPS' }],
      experiences: [{ role: 'Customer Success Manager', companyName: 'Cloud Corp', description: 'Gestão de contas e rituais ágeis.' }]
    },
    goal: {
      intentType: 'career_transition',
      targetArea: 'Gestão de Produto (Product Management)',
      targetRoles: ['Product Manager', 'Associate Product Manager']
    }
  },
  {
    name: '4. Transição Moderada (Advogado Corporativo -> DPO / Privacidade)',
    job: {
      id: 'job-4',
      title: 'Consultor de Privacidade e LGPD / DPO',
      requirements: ['LGPD', 'Governança de Dados', 'Compliance', 'Gestão de Riscos'],
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote'
    },
    resume: {
      id: 'res-4',
      fullName: 'Rodrigo Direito',
      yearsOfExperience: 5,
      skills: [{ name: 'Direito Empresarial' }, { name: 'Contratos' }, { name: 'Compliance' }, { name: 'Auditoria' }],
      experiences: [{ role: 'Advogado Pleno', companyName: 'Escritório Jurídico' }]
    },
    goal: {
      intentType: 'career_transition',
      targetArea: 'Privacidade de Dados',
      targetRoles: ['Data Protection Officer (DPO)', 'Analista LGPD']
    }
  },
  {
    name: '5. Transição Distante (Dev Backend -> Enfermeiro UTI)',
    job: {
      id: 'job-5',
      title: 'Enfermeiro UTI Adulto',
      requirements: ['COREN Ativo', 'Cuidados Críticos', 'Farmacologia Hospitalar'],
      seniority: 'pleno',
      location: 'São Paulo',
      workMode: 'onsite'
    },
    resume: {
      id: 'res-5',
      fullName: 'Marcos Dev',
      yearsOfExperience: 3,
      skills: [{ name: 'Python' }, { name: 'Django' }],
      experiences: [{ role: 'Python Developer', companyName: 'Tech Ltda' }]
    },
    goal: {
      intentType: 'career_transition',
      targetArea: 'Saúde & Enfermagem',
      targetRoles: ['Enfermeiro']
    }
  },
  {
    name: '6. Vaga Incompatível (Operador de Caixa -> Cloud Architect AWS)',
    job: {
      id: 'job-6',
      title: 'Principal Cloud Architect (AWS/Kubernetes)',
      requirements: ['AWS Certified Solutions Architect', 'Terraform', 'Kubernetes Multi-Cluster', 'FinOps'],
      seniority: 'lead',
      location: 'Remoto',
      workMode: 'remote'
    },
    resume: {
      id: 'res-6',
      fullName: 'José Caixa',
      yearsOfExperience: 1,
      skills: [{ name: 'Atendimento ao Cliente' }, { name: 'Fechamento de Caixa' }],
      experiences: [{ role: 'Operador de Caixa', companyName: 'Supermercado' }]
    },
    goal: {
      intentType: 'same_area_continue',
      targetArea: 'Varejo'
    }
  },
  {
    name: '7. Objetivo Não Definido (Product Designer com goal null)',
    job: {
      id: 'job-7',
      title: 'Senior Product Designer',
      requirements: ['Figma', 'UX Research', 'Design System'],
      seniority: 'senior',
      location: 'Remoto',
      workMode: 'remote'
    },
    resume: {
      id: 'res-7',
      fullName: 'Clara UX',
      yearsOfExperience: 5,
      skills: [{ name: 'Figma' }, { name: 'UX Research' }, { name: 'Design System' }],
      experiences: [{ role: 'Product Designer', companyName: 'Studio' }]
    },
    goal: null
  }
];

const resultsTable = [];

for (const caseItem of goldenDataset) {
  // Executar V2
  const v2ScoreObj = MatchingEngine.calculateMatchSync(caseItem.job, caseItem.resume);
  const v2Score = v2ScoreObj.scoreOverall;

  // Executar V3
  const v3Result = CareerMatchEngineV3.calculate(caseItem.job, caseItem.resume, null, caseItem.goal);

  resultsTable.push({
    Cenário: caseItem.name,
    'V2 Score Único': `${v2Score}%`,
    'V3 Fit Atual': `${v3Result.careerFitScore}%`,
    'V3 Goal Potential': v3Result.careerGoalScore !== null ? `${v3Result.careerGoalScore}%` : 'N/A (Pendente)',
    'Tipo Transição': v3Result.transition.label,
    'Explicabilidade (5 Dimensões)': `Skills: ${v3Result.dimensions.skills}% | Exp: ${v3Result.dimensions.experience}% | Sen: ${v3Result.dimensions.seniority}% | Ctx: ${v3Result.dimensions.context}% | Goal: ${v3Result.dimensions.careerGoal}%`
  });
}

console.table(resultsTable);

console.log('\n========================================================================');
console.log('🔬 AUDITORIA DE EXPLICABILIDADE — ÁRVORE DETERMINÍSTICA DO CASO 3 (CS -> PM)');
console.log('========================================================================');
const case3 = goldenDataset[2];
const v3Case3 = CareerMatchEngineV3.calculate(case3.job, case3.resume, null, case3.goal);

console.log(`\n🎯 SCORE FINAL:`);
console.log(`   - Career Fit Score (Aderência Atual): ${v3Case3.careerFitScore}%`);
console.log(`   - Career Goal Score (Potencial de Transição): ${v3Case3.careerGoalScore}%`);
console.log(`   - Distância de Transição: ${v3Case3.transition.label} (Confiança: ${v3Case3.transition.confidence}%)`);

console.log(`\n📊 5 DIMENSÕES DETERMINÍSTICAS:`);
console.log(`   1. Competências: ${v3Case3.dimensions.skills}%`);
console.log(`   2. Experiência: ${v3Case3.dimensions.experience}%`);
console.log(`   3. Senioridade: ${v3Case3.dimensions.seniority}%`);
console.log(`   4. Contexto / Domínio: ${v3Case3.dimensions.context}%`);
console.log(`   5. Objetivo de Carreira: ${v3Case3.dimensions.careerGoal}%`);

console.log(`\n🧩 MATRIZ DE COMPETÊNCIAS:`);
console.log(`   - Você Já Possui: ${JSON.stringify(v3Case3.skillsAssessment.matched)}`);
console.log(`   - Competências Transferíveis: ${JSON.stringify(v3Case3.skillsAssessment.transferable)}`);
console.log(`   - Para Desenvolver: ${JSON.stringify(v3Case3.skillsAssessment.missing)}`);

console.log(`\n📝 JUSTIFICATIVAS RASTREÁVEIS:`);
console.log(`   - Headline Fit: "${v3Case3.explanation.fitHeadline}"`);
console.log(`   - Headline Goal: "${v3Case3.explanation.goalHeadline}"`);
console.log(`   - Razão da Transferência: "${v3Case3.explanation.transferabilityReason}"`);
console.log(`   - Pontos Fortes Evidenciados: ${JSON.stringify(v3Case3.explanation.strengths)}`);
console.log(`   - Gaps Identificados: ${JSON.stringify(v3Case3.explanation.gaps)}`);
