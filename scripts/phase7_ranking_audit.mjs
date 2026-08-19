import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

// Conjunto diversificado de vagas para ranking
const JOBS_POOL = [
  { id: 'job-pm-1', title: 'Senior Product Manager', companyName: 'Nubank', seniority: 'senior', location: 'São Paulo', workMode: 'hybrid', requirements: ['Product Discovery', 'Roadmap', 'SQL', 'Product Analytics'], isActive: true },
  { id: 'job-pm-2', title: 'Associate Product Manager', companyName: 'Fintech X', seniority: 'junior', location: 'Remoto', workMode: 'remote', requirements: ['Product Discovery', 'Análise de Métricas', 'Visão do Cliente'], isActive: true },
  { id: 'job-cs-1', title: 'Senior Customer Success Manager', companyName: 'Totvs', seniority: 'senior', location: 'Remoto', workMode: 'remote', requirements: ['Customer Success', 'Onboarding', 'Churn', 'NPS'], isActive: true },
  { id: 'job-cs-2', title: 'Customer Success Specialist', companyName: 'SaaS Alpha', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Customer Success', 'Gestão de Contas', 'Onboarding'], isActive: true },
  { id: 'job-dev-1', title: 'Tech Lead Backend (Node.js)', companyName: 'Stone', seniority: 'lead', location: 'Remoto', workMode: 'remote', requirements: ['Node.js', 'TypeScript', 'AWS', 'Arquitetura de Software'], isActive: true },
  { id: 'job-dev-2', title: 'Backend Developer Pleno', companyName: 'Logistics AI', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Node.js', 'PostgreSQL', 'Docker'], isActive: true },
  { id: 'job-nurse', title: 'Enfermeiro UTI Adulto', companyName: 'Hospital Central', seniority: 'pleno', location: 'São Paulo', workMode: 'onsite', requirements: ['COREN Ativo', 'UTI', 'Cuidados Críticos'], isActive: true },
  { id: 'job-civil', title: 'Engenheiro Civil de Obras', companyName: 'Construtora Horizonte', seniority: 'senior', location: 'Curitiba', workMode: 'onsite', requirements: ['CREA Ativo', 'AutoCAD', 'Cálculo Estrutural'], isActive: true }
];

function scoreJobForRanking(job, resume, profile, goal) {
  const result = CareerMatchEngineV3.calculate(job, resume, profile, goal);
  
  // Regra de ordenação:
  // Se o usuário está em transição de carreira, o ranking de transição prioriza 100% o Career Goal Score (com desempate por Fit)
  // Se é mesma área ou continuidade: prioriza FitScore (70%) + GoalScore (30%)
  // Se não tem objetivo: 100% FitScore
  let effectiveRankingScore = result.careerFitScore;
  if (goal && result.careerGoalScore !== null) {
    if (goal.intentType === 'career_transition' || result.transition.isCareerTransition) {
      effectiveRankingScore = result.careerGoalScore;
    } else {
      effectiveRankingScore = Math.round((result.careerFitScore * 0.7) + (result.careerGoalScore * 0.3));
    }
  }

  return {
    job,
    result,
    effectiveRankingScore
  };
}

function runRankingAudit() {
  console.log('========================================================================');
  console.log('📊 ETAPA 2: AUDITORIA DO RANKING REAL E APRESENTAÇÃO DE VAGAS');
  console.log('========================================================================\n');

  const scenarios = [
    {
      name: 'Cenário A: Candidato CSM buscando Continuidade em CS',
      resume: { id: 'res-a', fullName: 'Carla CS', yearsOfExperience: 5, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Churn' }, { name: 'NPS' }], experiences: [{ role: 'Senior Customer Success Manager', companyName: 'CRM Co' }] },
      goal: { id: 'goal-a', intentType: 'same_area_continue', targetArea: 'Customer Success', targetRoles: ['Senior Customer Success Manager'] },
      expectedTopJobId: 'job-cs-1'
    },
    {
      name: 'Cenário B: Candidato CSM em Transição para Product Management',
      resume: { id: 'res-b', fullName: 'Marcos CS', yearsOfExperience: 4, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Visão do Cliente' }, { name: 'Jira' }], experiences: [{ role: 'Customer Success Manager', companyName: 'SaaS Co' }] },
      goal: { id: 'goal-b', intentType: 'career_transition', targetArea: 'Gestão de Produto', targetRoles: ['Product Manager', 'Associate Product Manager'] },
      expectedTopCategory: 'Product'
    },
    {
      name: 'Cenário C: Candidato Backend Developer Sem Objetivo Definido',
      resume: { id: 'res-c', fullName: 'Diego Dev', yearsOfExperience: 4, skills: [{ name: 'Node.js' }, { name: 'TypeScript' }, { name: 'PostgreSQL' }], experiences: [{ role: 'Backend Developer Pleno', companyName: 'Tech Co' }] },
      goal: null,
      expectedTopJobId: 'job-dev-2'
    },
    {
      name: 'Cenário D: Isolamento de Vagas Incompatíveis para Dev',
      resume: { id: 'res-d', fullName: 'Diego Dev', yearsOfExperience: 4, skills: [{ name: 'Node.js' }, { name: 'TypeScript' }], experiences: [{ role: 'Backend Developer', companyName: 'Tech Co' }] },
      goal: { id: 'goal-d', intentType: 'same_area_continue', targetArea: 'Backend', targetRoles: ['Backend Developer'] },
      expectedBottomJobId: 'job-nurse'
    }
  ];

  const auditReport = [];

  for (const sc of scenarios) {
    console.log(`📌 ${sc.name}:`);
    const rankedJobs = JOBS_POOL.map(j => scoreJobForRanking(j, sc.resume, null, sc.goal))
      .sort((a, b) => b.effectiveRankingScore - a.effectiveRankingScore);

    rankedJobs.forEach((item, idx) => {
      const gStr = item.result.careerGoalScore !== null ? `${item.result.careerGoalScore}%` : 'null';
      console.log(`   ${idx + 1}. [Rank: ${item.effectiveRankingScore}%] Fit: ${item.result.careerFitScore}% | Goal: ${gStr} | ${item.job.title} (${item.job.companyName})`);
    });

    const top1 = rankedJobs[0];
    const bottom1 = rankedJobs[rankedJobs.length - 1];

    let pass = true;
    if (sc.expectedTopJobId && top1.job.id !== sc.expectedTopJobId) pass = false;
    if (sc.expectedTopCategory && !top1.job.title.includes(sc.expectedTopCategory)) pass = false;
    if (sc.expectedBottomJobId && bottom1.job.id !== sc.expectedBottomJobId && bottom1.job.id !== 'job-civil') pass = false;

    console.log(`   Status do Cenário: ${pass ? '✅ APROVADO' : '❌ FALHA'}\n`);

    auditReport.push({
      scenario: sc.name,
      topJob: { id: top1.job.id, title: top1.job.title, score: top1.effectiveRankingScore },
      bottomJob: { id: bottom1.job.id, title: bottom1.job.title, score: bottom1.effectiveRankingScore },
      passed: pass,
      rankedList: rankedJobs.map(r => ({ id: r.job.id, title: r.job.title, rankScore: r.effectiveRankingScore, fit: r.result.careerFitScore, goal: r.result.careerGoalScore }))
    });
  }

  const outputPath = path.join(reportsDir, 'phase7_ranking_audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`📄 Relatório de auditoria de ranking salvo em: ${outputPath}`);
}

runRankingAudit();
