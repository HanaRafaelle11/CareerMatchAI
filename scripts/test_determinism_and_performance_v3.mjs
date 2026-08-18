import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';
import { performance } from 'perf_hooks';

console.log('========================================================================');
console.log('🔬 AUDITORIA DE DETERMINISMO & BENCHMARK DE PERFORMANCE V3');
console.log('========================================================================\n');

const sampleJob = {
  id: 'perf-job-1',
  title: 'Product Manager (SaaS & Operações)',
  companyName: 'Fintech X',
  location: 'Remoto',
  workMode: 'remote',
  seniority: 'pleno',
  requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis', 'SQL', 'Jira']
};

const sampleProfile = {
  id: 'perf-prof-1',
  userId: 'usr-perf-1',
  personal: {
    fullName: 'Rafaela Santos',
    headline: 'Customer Success Manager Pleno'
  },
  summary: 'Customer Success com 4 anos de experiência em SaaS, churn, rituais ágeis e mapeamento de dores de produto.',
  skills: ['Customer Success', 'Onboarding', 'Jira', 'Churn', 'NPS', 'Comunicação'],
  experience: [
    {
      role: 'Customer Success Manager',
      companyName: 'Cloud SaaS',
      description: 'Gestão de contas e acompanhamento de métricas de retenção.',
      isCurrent: true
    }
  ]
};

const sampleGoal = {
  id: 'perf-goal-1',
  userId: 'usr-perf-1',
  intentType: 'career_transition',
  targetArea: 'Gestão de Produto & Operações',
  targetRoles: ['Product Manager', 'Associate Product Manager']
};

// ─────────────────────────────────────────────────────────────────────────────
// PARTE 1: TESTE DE DETERMINISMO PURO (100 ITERAÇÕES IDÊNTICAS)
// ─────────────────────────────────────────────────────────────────────────────
console.log('🧪 TESTE 1: DETERMINISMO (100 iterações com os mesmos inputs)...');
const baseline = CareerMatchEngineV3.calculate(sampleJob, null, sampleProfile, sampleGoal);
let determinismPass = true;

for (let i = 1; i <= 100; i++) {
  const current = CareerMatchEngineV3.calculate(sampleJob, null, sampleProfile, sampleGoal);
  const isIdentical =
    current.careerFitScore === baseline.careerFitScore &&
    current.careerGoalScore === baseline.careerGoalScore &&
    current.dimensions.skills === baseline.dimensions.skills &&
    current.dimensions.experience === baseline.dimensions.experience &&
    current.dimensions.seniority === baseline.dimensions.seniority &&
    current.dimensions.context === baseline.dimensions.context &&
    current.dimensions.careerGoal === baseline.dimensions.careerGoal &&
    current.transition.type === baseline.transition.type &&
    JSON.stringify(current.skillsAssessment) === JSON.stringify(baseline.skillsAssessment);

  if (!isIdentical) {
    console.error(`❌ Falha de determinismo na iteração ${i}!`);
    determinismPass = false;
    break;
  }
}

if (determinismPass) {
  console.log('✅ 100% DETERMINÍSTICO: 100/100 iterações geraram resultados idênticos em todas as dimensões.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTE 2: BENCHMARK DE PERFORMANCE SÍNCRONA
// ─────────────────────────────────────────────────────────────────────────────
console.log('⏱️ TESTE 2: PERFORMANCE SÍNCRONA DO MOTOR V3 (1, 10, 50 e 100 vagas)...');

function generateJobs(count) {
  return Array.from({ length: count }, (_, idx) => ({
    id: `bench-job-${idx}`,
    title: idx % 2 === 0 ? 'Product Manager (SaaS & Operações)' : 'Senior Backend Developer (Node.js/PostgreSQL)',
    companyName: `Empresa ${idx}`,
    location: 'Remoto',
    workMode: 'remote',
    seniority: idx % 3 === 0 ? 'senior' : 'pleno',
    requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis', 'SQL', 'Docker', 'PostgreSQL', 'TypeScript']
  }));
}

const batchSizes = [1, 10, 50, 100];
const perfResults = [];

for (const size of batchSizes) {
  const jobs = generateJobs(size);
  const times = [];

  // Aquecimento
  for (let w = 0; w < 5; w++) {
    CareerMatchEngineV3.calculate(jobs[0], null, sampleProfile, sampleGoal);
  }

  // Execução de 20 rodadas
  for (let r = 0; r < 20; r++) {
    const t0 = performance.now();
    for (const job of jobs) {
      CareerMatchEngineV3.calculate(job, null, sampleProfile, sampleGoal);
    }
    const t1 = performance.now();
    times.push(t1 - t0);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const timePerJob = avgTime / size;

  perfResults.push({
    'Quantidade de Vagas': size,
    'Tempo Médio Total': `${avgTime.toFixed(2)} ms`,
    'Tempo Máximo': `${maxTime.toFixed(2)} ms`,
    'Tempo Médio por Vaga': `${timePerJob.toFixed(3)} ms`,
    'Status SLA': avgTime < 100 ? '✅ Ultrarrápido (<100ms)' : '⚠️ Atenção'
  });
}

console.table(perfResults);
