import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';
import { REAL_WORLD_MATCHING_CASES, scoreToOrdinal } from '../tests/fixtures/realWorldMatchingCases.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function runRealWorldValidation() {
  console.log('========================================================================');
  console.log('🔬 AUDITORIA QUANTITATIVA: DATASET REALISTA & FALSOS POSITIVOS / NEGATIVOS');
  console.log('========================================================================\n');

  const results = [];
  let ordinalMatches = 0;
  const falsePositives = [];
  const falseNegatives = [];
  const edgeCases = [];

  for (const tc of REAL_WORLD_MATCHING_CASES) {
    const v3 = CareerMatchEngineV3.calculate(tc.job, tc.resume, tc.profile, tc.careerGoal);
    const fitOrdinal = scoreToOrdinal(v3.careerFitScore);
    const goalOrdinal = scoreToOrdinal(v3.careerGoalScore);

    // Avaliação ordinal
    const fitPassed = fitOrdinal === tc.expected.fit || 
      (tc.expected.fit === 'very_high' && (fitOrdinal === 'very_high' || fitOrdinal === 'high')) ||
      (tc.expected.fit === 'high' && (fitOrdinal === 'high' || fitOrdinal === 'very_high' || fitOrdinal === 'medium')) ||
      (tc.expected.fit === 'low' && (fitOrdinal === 'low' || fitOrdinal === 'very_low' || fitOrdinal === 'medium')) ||
      (tc.expected.fit === 'very_low' && (fitOrdinal === 'very_low' || fitOrdinal === 'low'));

    const goalPassed = tc.expected.goal === null 
      ? v3.careerGoalScore === null 
      : (goalOrdinal === tc.expected.goal || 
         (tc.expected.goal === 'very_high' && (goalOrdinal === 'very_high' || goalOrdinal === 'high')) ||
         (tc.expected.goal === 'high' && (goalOrdinal === 'high' || goalOrdinal === 'very_high' || goalOrdinal === 'medium')) ||
         (tc.expected.goal === 'low' && (goalOrdinal === 'low' || goalOrdinal === 'very_low')) ||
         (tc.expected.goal === 'very_low' && (goalOrdinal === 'very_low' || goalOrdinal === 'low')));

    const transitionPassed = tc.expected.transition === 'none' 
      ? (v3.transition.type === 'none' || !tc.careerGoal || tc.careerGoal.intentType.startsWith('same_area'))
      : (v3.transition.type === tc.expected.transition || 
         (tc.expected.transition === 'moderate' && (v3.transition.type === 'near' || v3.transition.type === 'moderate' || v3.transition.type === 'challenging')) ||
         (tc.expected.transition === 'near' && (v3.transition.type === 'near' || v3.transition.type === 'moderate')));

    const overallPassed = fitPassed && goalPassed;
    if (overallPassed) ordinalMatches++;

    // Detecção de Falsos Positivos
    if (tc.group === 'E_DistantTransition' && (v3.careerFitScore > 35 || (v3.careerGoalScore !== null && v3.careerGoalScore > 50))) {
      falsePositives.push({
        id: tc.id,
        name: tc.name,
        fitScore: v3.careerFitScore,
        goalScore: v3.careerGoalScore,
        reason: 'Score acima do esperado para transição distante/incompatível'
      });
    }

    // Detecção de Falsos Negativos
    if (tc.group === 'C_NearTransition' && v3.careerGoalScore !== null && v3.careerGoalScore < 60) {
      falseNegatives.push({
        id: tc.id,
        name: tc.name,
        fitScore: v3.careerFitScore,
        goalScore: v3.careerGoalScore,
        reason: 'Score de objetivo baixo para transição com ponte funcional mapeada'
      });
    }

    if (tc.group === 'F_IncompleteData') {
      edgeCases.push({
        id: tc.id,
        name: tc.name,
        fitScore: v3.careerFitScore,
        confidence: v3.confidenceScore,
        note: 'Dados incompletos processados com resiliência'
      });
    }

    const row = {
      id: tc.id,
      name: tc.name,
      group: tc.group,
      actualFit: `${v3.careerFitScore}% (${fitOrdinal})`,
      expectedFit: tc.expected.fit,
      actualGoal: v3.careerGoalScore !== null ? `${v3.careerGoalScore}% (${goalOrdinal})` : 'null',
      expectedGoal: tc.expected.goal || 'null',
      transition: v3.transition.label,
      confidence: `${v3.confidenceScore}%`,
      passed: overallPassed
    };

    results.push(row);
    console.log(`[${overallPassed ? '✅' : '⚠️'}] ${tc.id.padEnd(3)} | Fit: ${String(v3.careerFitScore).padStart(3)}% | Goal: ${String(v3.careerGoalScore ?? 'null').padStart(4)}% | Trans: ${v3.transition.label.padEnd(25)} | ${tc.name}`);
  }

  const accuracy = (ordinalMatches / REAL_WORLD_MATCHING_CASES.length) * 100;
  console.log(`\n📊 ACURÁCIA ORDINAL GLOBAL: ${accuracy.toFixed(1)}% (${ordinalMatches}/${REAL_WORLD_MATCHING_CASES.length})`);
  console.log(`   - Falsos Positivos Críticos: ${falsePositives.length}`);
  console.log(`   - Falsos Negativos Críticos: ${falseNegatives.length}`);
  console.log(`   - Casos com Dados Parciais (Edge Cases): ${edgeCases.length}`);

  const outputReport = {
    timestamp: new Date().toISOString(),
    totalCases: REAL_WORLD_MATCHING_CASES.length,
    ordinalMatches,
    accuracy: `${accuracy.toFixed(1)}%`,
    falsePositives,
    falseNegatives,
    edgeCases,
    results
  };

  const outputPath = path.join(reportsDir, 'real_world_validation_matrix.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputReport, null, 2), 'utf-8');
  console.log(`📄 Matriz de validação salva: ${outputPath}\n`);

  return outputReport;
}

runRealWorldValidation();
