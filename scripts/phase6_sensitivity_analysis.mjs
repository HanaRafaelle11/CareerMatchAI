import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';
import { REAL_WORLD_MATCHING_CASES } from '../tests/fixtures/realWorldMatchingCases.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

function runSensitivityAnalysis() {
  console.log('========================================================================');
  console.log('🧪 TESTE DE SENSIBILIDADE E ROBUSTEZ — CAREER MATCH ENGINE V3');
  console.log('========================================================================\n');

  const baseCase = REAL_WORLD_MATCHING_CASES.find(c => c.id === 'A4'); // Backend Developer
  if (!baseCase) throw new Error('Base case A4 not found');

  const baselineResult = CareerMatchEngineV3.calculate(baseCase.job, baseCase.resume, null, baseCase.careerGoal);
  console.log(`📌 Baseline (A4 Backend Developer):`);
  console.log(`   Fit: ${baselineResult.careerFitScore}% | Goal: ${baselineResult.careerGoalScore}% | Seniority Dim: ${baselineResult.dimensions.seniority}%\n`);

  const variations = [
    {
      name: 'Perturbação Relevante (+1 Skill Crítica: Docker)',
      mutate: () => {
        const mutatedJob = { ...baseCase.job, requirements: [...baseCase.job.requirements, 'Docker'] };
        return CareerMatchEngineV3.calculate(mutatedJob, baseCase.resume, null, baseCase.careerGoal);
      },
      expectedDirection: 'increase_or_stable'
    },
    {
      name: 'Perturbação Relevante (-1 Skill Crítica do Candidato: remove Node.js do CV e histórico)',
      mutate: () => {
        const mutatedResume = {
          ...baseCase.resume,
          skills: baseCase.resume.skills.filter(s => !s.name.toLowerCase().includes('node')),
          experiences: baseCase.resume.experiences.map(e => ({
            ...e,
            description: e.description.replace(/node\.js/gi, 'Ruby')
          }))
        };
        return CareerMatchEngineV3.calculate(baseCase.job, mutatedResume, null, baseCase.careerGoal);
      },
      expectedDirection: 'decrease'
    },
    {
      name: 'Perturbação de Senioridade (Vaga muda de Pleno para Lead)',
      mutate: () => {
        const mutatedJob = { ...baseCase.job, seniority: 'lead' };
        return CareerMatchEngineV3.calculate(mutatedJob, baseCase.resume, null, baseCase.careerGoal);
      },
      expectedDirection: 'decrease_fit_increase_goal'
    },
    {
      name: 'Perturbação Irrelevante (Espaçamento e Caixa Alta em Skills)',
      mutate: () => {
        const mutatedJob = {
          ...baseCase.job,
          requirements: baseCase.job.requirements.map(r => `  ${r.toUpperCase()}  `)
        };
        return CareerMatchEngineV3.calculate(mutatedJob, baseCase.resume, null, baseCase.careerGoal);
      },
      expectedDirection: 'identical'
    },
    {
      name: 'Perturbação de Objetivo (Muda TargetRole para Enfermeiro)',
      mutate: () => {
        const mutatedGoal = {
          ...baseCase.careerGoal,
          targetArea: 'Enfermagem',
          targetRoles: ['Enfermeiro UTI']
        };
        return CareerMatchEngineV3.calculate(baseCase.job, baseCase.resume, null, mutatedGoal);
      },
      expectedDirection: 'decrease_goal_preserve_fit'
    }
  ];

  const report = [];

  for (const v of variations) {
    const mutatedResult = v.mutate();
    const deltaFit = mutatedResult.careerFitScore - baselineResult.careerFitScore;
    const deltaGoal = (mutatedResult.careerGoalScore ?? 0) - (baselineResult.careerGoalScore ?? 0);

    let pass = true;
    if (v.expectedDirection === 'decrease' && deltaFit >= 0) pass = false;
    if (v.expectedDirection === 'identical' && deltaFit !== 0) pass = false;
    if (v.expectedDirection === 'decrease_goal_preserve_fit' && (deltaGoal >= 0 || deltaFit !== 0)) pass = false;

    console.log(`[${pass ? '✅ PASS' : '❌ FAIL'}] ${v.name}`);
    console.log(`       Δ Fit: ${deltaFit > 0 ? '+' : ''}${deltaFit}% | Δ Goal: ${deltaGoal > 0 ? '+' : ''}${deltaGoal}% | Fit Final: ${mutatedResult.careerFitScore}%`);

    report.push({
      test: v.name,
      deltaFit,
      deltaGoal,
      finalFit: mutatedResult.careerFitScore,
      finalGoal: mutatedResult.careerGoalScore,
      passed: pass
    });
  }

  const outputPath = path.join(reportsDir, 'phase6_sensitivity_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 Relatório de sensibilidade salvo: ${outputPath}`);
}

runSensitivityAnalysis();
