import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { MATCHING_WEIGHTS } from '../src/domain/services/MatchingWeights.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getGitCommitHash() {
  try {
    return execSync('git log -n 1 --format="%h (%H)"', { cwd: rootDir }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function generateSnapshot() {
  const commitHash = getGitCommitHash();
  const timestamp = new Date().toISOString();

  const snapshot = {
    metadata: {
      version: 'CareerMatchEngineV3',
      phase: 'FASE 6 - Baseline Snapshot',
      commit: commitHash,
      createdAt: timestamp,
      architecture: 'Deterministic 5-Dimensions + Decoupled Goal & Fit Scoring'
    },
    engineParameters: {
      fitWeights: MATCHING_WEIGHTS.fit,
      goalWeights: MATCHING_WEIGHTS.goal,
      thresholds: MATCHING_WEIGHTS.thresholds
    },
    dimensions: {
      experience: { weight: 0.30, description: 'Recência, anos de experiência e funções anteriores' },
      skills: { weight: 0.35, description: 'Hard skills e requisitos técnicos atendidos vs faltantes' },
      seniority: { weight: 0.15, description: 'Autonomia e nível hierárquico' },
      context: { weight: 0.20, description: 'Domínio, modelo de trabalho e segmento' },
      careerGoal: { weight: 'independente', description: 'Pontencial de transição e alavancagem para o objetivo' }
    },
    thresholds: {
      highFit: 75,
      moderateFit: 55,
      lowFit: 35,
      highGoal: 75,
      moderateGoal: 50,
      transitionClassification: {
        near: { minFunctionalOverlap: 0.65, maxGapPenalty: 0.20 },
        moderate: { minFunctionalOverlap: 0.40, maxGapPenalty: 0.45 },
        challenging: { minFunctionalOverlap: 0.20, maxGapPenalty: 0.70 },
        distant: { maxFunctionalOverlap: 0.19, minGapPenalty: 0.71 }
      }
    },
    filesIncluded: [
      'src/domain/services/CareerMatchEngineV3.ts',
      'src/domain/services/MatchingWeights.ts',
      'src/domain/services/TransferableSkillsService.ts',
      'src/domain/services/UnifiedMatchService.ts',
      'src/application/services/matchingEngine.ts'
    ]
  };

  const outputPath = path.join(rootDir, 'matching_v3_snapshot.json');
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`✅ Snapshot do Engine V3 gerado com sucesso: ${outputPath}`);
  return snapshot;
}

generateSnapshot();
