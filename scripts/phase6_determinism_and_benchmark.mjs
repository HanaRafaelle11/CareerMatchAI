import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';
import { REAL_WORLD_MATCHING_CASES } from '../tests/fixtures/realWorldMatchingCases.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

function runDeterminismAndBenchmark() {
  console.log('========================================================================');
  console.log('⚡ TESTE DE DETERMINISMO 100x & BENCHMARK DE PERFORMANCE V3');
  console.log('========================================================================\n');

  // 1. TESTE DE DETERMINISMO (100x por caso)
  console.log('📍 1. Executando Teste de Determinismo Estrito (100 iterações x 24 casos)...');
  let determinismFailures = 0;

  for (const tc of REAL_WORLD_MATCHING_CASES) {
    const firstRun = CareerMatchEngineV3.calculate(tc.job, tc.resume, tc.profile, tc.careerGoal);
    const firstRunStr = JSON.stringify(firstRun);

    for (let i = 0; i < 99; i++) {
      const currentRun = CareerMatchEngineV3.calculate(tc.job, tc.resume, tc.profile, tc.careerGoal);
      if (JSON.stringify(currentRun) !== firstRunStr) {
        determinismFailures++;
        console.error(`❌ DETERMINISM_FAILURE no caso ${tc.id} na iteração ${i + 2}`);
        break;
      }
    }
  }

  if (determinismFailures === 0) {
    console.log('   ✅ 100% DETERMINÍSTICO: 2.400 execuções produziram resultados idênticos bit a bit.\n');
  } else {
    throw new Error(`❌ ${determinismFailures} falhas de determinismo encontradas!`);
  }

  // 2. BENCHMARK DE PERFORMANCE
  console.log('📍 2. Executando Benchmark de Performance em Escala...');
  const batches = [1, 10, 50, 100, 500];
  const benchmarkResults = [];

  const baseCase = REAL_WORLD_MATCHING_CASES[0];

  for (const batchSize of batches) {
    const times = [];
    const iterations = Math.max(10, Math.floor(1000 / batchSize));

    for (let it = 0; it < iterations; it++) {
      const start = performance.now();
      for (let j = 0; j < batchSize; j++) {
        CareerMatchEngineV3.calculate(baseCase.job, baseCase.resume, baseCase.profile, baseCase.careerGoal);
      }
      const elapsed = performance.now() - start;
      times.push(elapsed);
    }

    times.sort((a, b) => a - b);
    const avg = times.reduce((s, t) => s + t, 0) / times.length;
    const p95 = times[Math.floor(times.length * 0.95)];
    const max = times[times.length - 1];
    const timePerJobMs = avg / batchSize;
    const opsPerSec = Math.floor(1000 / timePerJobMs);

    console.log(`   ⏱️ Lote de ${String(batchSize).padStart(3)} vagas: Total Médio = ${avg.toFixed(2)}ms | p95 = ${p95.toFixed(2)}ms | Tempo/Vaga = ${timePerJobMs.toFixed(4)}ms (${opsPerSec.toLocaleString()} vagas/s)`);

    benchmarkResults.push({
      batchSize,
      avgTotalMs: parseFloat(avg.toFixed(2)),
      p95TotalMs: parseFloat(p95.toFixed(2)),
      maxTotalMs: parseFloat(max.toFixed(2)),
      timePerJobMs: parseFloat(timePerJobMs.toFixed(4)),
      throughputVagasPorSegundo: opsPerSec
    });
  }

  const output = {
    timestamp: new Date().toISOString(),
    determinism: {
      totalRuns: REAL_WORLD_MATCHING_CASES.length * 100,
      failures: determinismFailures,
      status: '100% DETERMINISTIC'
    },
    benchmarks: benchmarkResults
  };

  const outputPath = path.join(reportsDir, 'phase6_determinism_and_benchmark.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n📄 Relatório salvo: ${outputPath}`);
}

runDeterminismAndBenchmark();
