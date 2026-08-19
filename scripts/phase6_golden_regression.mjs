import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

export const GOLDEN_CASES = [
  {
    id: 'GC1_DirectMatch',
    name: 'Match Direto (Senior Dev React -> Senior Dev React)',
    job: { id: 'job-gc-1', title: 'Senior Frontend Engineer (React/TypeScript)', companyName: 'Banco Alpha', seniority: 'senior', location: 'Remoto', workMode: 'remote', requirements: ['React', 'TypeScript', 'Node.js', 'GraphQL'], isActive: true },
    resume: { id: 'res-gc-1', userId: 'usr-gc-1', fullName: 'Lucas Ferreira', yearsOfExperience: 6, skills: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Node.js' }, { name: 'GraphQL' }], experiences: [{ role: 'Senior Frontend Engineer', companyName: 'Fintech X' }] },
    careerGoal: { id: 'goal-gc-1', userId: 'usr-gc-1', intentType: 'same_area_grow', targetArea: 'Frontend Engineering', targetRoles: ['Senior Frontend Engineer', 'Staff Engineer'] },
    expectedFitMin: 80,
    expectedGoalMin: 80
  },
  {
    id: 'GC2_Promotion',
    name: 'Promoção de Senioridade (Dev Pleno -> Tech Lead)',
    job: { id: 'job-gc-2', title: 'Tech Lead Backend (Node.js)', companyName: 'Logistics Prime', seniority: 'lead', location: 'Remoto', workMode: 'remote', requirements: ['Node.js', 'Arquitetura de Sistemas', 'Liderança Técnica'], isActive: true },
    resume: { id: 'res-gc-2', userId: 'usr-gc-2', fullName: 'Marina Costa', yearsOfExperience: 4, skills: [{ name: 'Node.js' }, { name: 'TypeScript' }, { name: 'PostgreSQL' }], experiences: [{ role: 'Backend Developer Pleno', companyName: 'SaaS Alpha' }] },
    careerGoal: { id: 'goal-gc-2', userId: 'usr-gc-2', intentType: 'same_area_grow', targetArea: 'Liderança Técnica', targetRoles: ['Tech Lead Backend', 'Engineering Manager'], targetSeniority: 'lead' },
    expectedFitMin: 45,
    expectedGoalMin: 70
  },
  {
    id: 'GC3_NearTransition',
    name: 'Transição Próxima / Moderada (CS Manager -> Product Manager)',
    job: { id: 'job-gc-3', title: 'Product Manager (SaaS & Operações)', companyName: 'Stone Pagamentos', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis', 'SQL'], isActive: true },
    resume: { id: 'res-gc-3', userId: 'usr-gc-3', fullName: 'Rafaela Santos', yearsOfExperience: 4, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Jira' }, { name: 'Churn' }, { name: 'NPS' }], experiences: [{ role: 'Customer Success Manager', companyName: 'Cloud Corp' }] },
    careerGoal: { id: 'goal-gc-3', userId: 'usr-gc-3', intentType: 'career_transition', targetArea: 'Gestão de Produto & Operações', targetRoles: ['Product Manager', 'Associate Product Manager'] },
    expectedFitMax: 45,
    expectedGoalMin: 75
  },
  {
    id: 'GC4_ModerateTransition',
    name: 'Transição Moderada (Data Analyst -> Analytics Engineer)',
    job: { id: 'job-gc-4', title: 'Analytics Engineer', companyName: 'Data Scale', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['dbt', 'Data Modeling', 'SQL Avançado', 'Snowflake'], isActive: true },
    resume: { id: 'res-gc-4', userId: 'usr-gc-4', fullName: 'Bruno Silva', yearsOfExperience: 3, skills: [{ name: 'SQL' }, { name: 'Power BI' }, { name: 'Excel' }, { name: 'Python' }], experiences: [{ role: 'Data Analyst Pleno', companyName: 'Varejo Tech' }] },
    careerGoal: { id: 'goal-gc-4', userId: 'usr-gc-4', intentType: 'career_transition', targetArea: 'Engenharia de Analytics', targetRoles: ['Analytics Engineer'] },
    expectedFitMin: 30,
    expectedGoalMin: 65
  },
  {
    id: 'GC5_DistantTransition',
    name: 'Transição Distante (Python Dev -> Enfermeiro UTI)',
    job: { id: 'job-gc-5', title: 'Enfermeiro de UTI Geral', companyName: 'Hospital São Paulo', seniority: 'pleno', location: 'São Paulo, SP', workMode: 'onsite', requirements: ['COREN Ativo', 'UTI Adulto', 'Cuidados Críticos'], isActive: true },
    resume: { id: 'res-gc-5', userId: 'usr-gc-5', fullName: 'Valter Gomes', yearsOfExperience: 4, skills: [{ name: 'Python' }, { name: 'Django' }, { name: 'SQL' }], experiences: [{ role: 'Python Developer', companyName: 'Tech Delta' }] },
    careerGoal: { id: 'goal-gc-5', userId: 'usr-gc-5', intentType: 'career_transition', targetArea: 'Enfermagem Hospitalar', targetRoles: ['Enfermeiro'] },
    expectedFitMax: 30,
    expectedGoalMax: 50
  },
  {
    id: 'GC6_Incompatible',
    name: 'Vaga Incompatível (Advogado Trabalhista -> Engenheiro Civil)',
    job: { id: 'job-gc-6', title: 'Engenheiro Civil de Obras', companyName: 'Construtora Horizonte', seniority: 'senior', location: 'Curitiba, PR', workMode: 'onsite', requirements: ['CREA Ativo', 'Cálculo Estrutural', 'AutoCAD'], isActive: true },
    resume: { id: 'res-gc-6', userId: 'usr-gc-6', fullName: 'Wagner Prado', yearsOfExperience: 6, skills: [{ name: 'Direito Trabalhista' }, { name: 'Contencioso' }], experiences: [{ role: 'Advogado Trabalhista', companyName: 'Prado Advocacia' }] },
    careerGoal: { id: 'goal-gc-6', userId: 'usr-gc-6', intentType: 'same_area_grow', targetArea: 'Direito Corporativo', targetRoles: ['Sócio Advogado'] },
    expectedFitMax: 25,
    expectedGoalMax: 30
  },
  {
    id: 'GC7_NoGoal',
    name: 'Objetivo Não Definido (careerGoal === null)',
    job: { id: 'job-gc-7', title: 'UX Designer Pleno', companyName: 'Design Studio', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Figma', 'Prototipação', 'Design System'], isActive: true },
    resume: { id: 'res-gc-7', userId: 'usr-gc-7', fullName: 'Camila Designer', yearsOfExperience: 3, skills: [{ name: 'Figma' }, { name: 'Design System' }, { name: 'UI Design' }], experiences: [{ role: 'UX Designer', companyName: 'Studio Creativo' }] },
    careerGoal: null,
    expectedFitMin: 70,
    expectedGoalNull: true
  }
];

function runGoldenRegression() {
  console.log('========================================================================');
  console.log('🔍 REGRESSÃO DOS GOLDEN CASES — FASE 6 (BASELINE VS RESULTADO ATUAL)');
  console.log('========================================================================\n');

  const results = [];
  let passedCount = 0;

  for (const gc of GOLDEN_CASES) {
    const v3 = CareerMatchEngineV3.calculate(gc.job, gc.resume, null, gc.careerGoal);
    
    // Validação ordinal e de limites
    let passed = true;
    const failures = [];

    if (gc.expectedFitMin !== undefined && v3.careerFitScore < gc.expectedFitMin) {
      passed = false;
      failures.push(`Fit ${v3.careerFitScore}% < min ${gc.expectedFitMin}%`);
    }
    if (gc.expectedFitMax !== undefined && v3.careerFitScore > gc.expectedFitMax) {
      passed = false;
      failures.push(`Fit ${v3.careerFitScore}% > max ${gc.expectedFitMax}%`);
    }
    if (gc.expectedGoalNull && v3.careerGoalScore !== null) {
      passed = false;
      failures.push(`Goal score não é null (recebido: ${v3.careerGoalScore})`);
    }
    if (gc.expectedGoalMin !== undefined && (v3.careerGoalScore === null || v3.careerGoalScore < gc.expectedGoalMin)) {
      passed = false;
      failures.push(`Goal ${v3.careerGoalScore}% < min ${gc.expectedGoalMin}%`);
    }
    if (gc.expectedGoalMax !== undefined && (v3.careerGoalScore !== null && v3.careerGoalScore > gc.expectedGoalMax)) {
      passed = false;
      failures.push(`Goal ${v3.careerGoalScore}% > max ${gc.expectedGoalMax}%`);
    }

    if (passed) passedCount++;

    const entry = {
      caseId: gc.id,
      name: gc.name,
      careerFitScore: v3.careerFitScore,
      careerGoalScore: v3.careerGoalScore,
      transitionType: v3.transition.type,
      transitionLabel: v3.transition.label,
      dimensions: v3.dimensions,
      skillsAssessment: {
        matchedCount: v3.skillsAssessment.matched.length,
        transferableCount: v3.skillsAssessment.transferable.length,
        missingCount: v3.skillsAssessment.missing.length
      },
      confidenceScore: v3.confidenceScore,
      passed,
      failures
    };

    results.push(entry);
    console.log(`[${passed ? '✅ PASS' : '❌ FAIL'}] ${gc.id}: ${gc.name}`);
    console.log(`       Fit: ${v3.careerFitScore}% | Goal: ${v3.careerGoalScore !== null ? v3.careerGoalScore + '%' : 'null'} | Transição: ${v3.transition.label}`);
    if (!passed) {
      console.log(`       Motivos: ${failures.join('; ')}`);
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalCases: GOLDEN_CASES.length,
    passedCount,
    failedCount: GOLDEN_CASES.length - passedCount,
    accuracy: (passedCount / GOLDEN_CASES.length) * 100,
    cases: results
  };

  const outputPath = path.join(reportsDir, 'phase6_golden_regression.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 Relatório de regressão salvo: ${outputPath}`);

  if (passedCount !== GOLDEN_CASES.length) {
    console.error('❌ Falha na regressão dos Golden Cases!');
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS GOLDEN CASES PASSARAM SEM REGRESSÃO!');
  }
}

runGoldenRegression();
