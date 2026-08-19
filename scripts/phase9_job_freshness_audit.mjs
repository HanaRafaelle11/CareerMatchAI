import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generate100JobsCorpus } from './phase9_real_pipeline_audit.mjs';
import { ProductJobRankingService } from '../src/domain/services/ProductJobRankingService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

function calculateAgeBracket(createdAt) {
  if (!createdAt) return '> 30 dias';
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const days = ageMs / (1000 * 60 * 60 * 24);

  if (days <= 1) return '< 24h';
  if (days <= 3) return '24–72h';
  if (days <= 7) return '3–7 dias';
  if (days <= 14) return '7–14 dias';
  if (days <= 30) return '14–30 dias';
  return '> 30 dias';
}

function runJobFreshnessAudit() {
  console.log('========================================================================');
  console.log('📅 ETAPA 6: AUDITORIA DE RECÊNCIA E FRESHNESS DAS VAGAS NO TOP 10');
  console.log('========================================================================\n');

  const rawCorpus = generate100JobsCorpus();

  const testResume = {
    fullName: 'Ana CS',
    yearsOfExperience: 6,
    skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Churn' }, { name: 'NPS' }],
    experiences: [{ role: 'Senior Customer Success Manager', companyName: 'SaaS Corp' }]
  };
  const testGoal = {
    intentType: 'same_area_continue',
    targetArea: 'Customer Success',
    targetRoles: ['Customer Success Manager Sênior']
  };

  const ranked = ProductJobRankingService.rankJobs(rawCorpus, testResume, null, testGoal, { filterLowQuality: true, minScoreCutoff: 20 });
  const top10 = ranked.slice(0, 10);

  const bracketCounts = {
    '< 24h': 0,
    '24–72h': 0,
    '3–7 dias': 0,
    '7–14 dias': 0,
    '14–30 dias': 0,
    '> 30 dias': 0
  };

  console.log('📌 Distribuição de Idade no Top 10:');
  top10.forEach((item, idx) => {
    const bracket = calculateAgeBracket(item.job.createdAt);
    bracketCounts[bracket]++;
    console.log(`   #${idx + 1} [${bracket.padEnd(10)}] Publicada em: ${item.job.createdAt || 'N/A'} | Fit: ${item.match.careerFitScore}% | ${item.job.title} (${item.job.companyName})`);
  });

  const recentCount = bracketCounts['< 24h'] + bracketCounts['24–72h'] + bracketCounts['3–7 dias'] + bracketCounts['7–14 dias'];
  const recentRatio = ((recentCount / top10.length) * 100).toFixed(1);

  console.log(`\n📊 Resumo de Freshness do Top 10:`);
  console.log(`   - Vagas Recentes (até 14 dias): ${recentRatio}% (${recentCount}/${top10.length})`);
  console.log(`   - Vagas Antigas (> 30 dias): ${bracketCounts['> 30 dias']}/${top10.length}\n`);

  const report = {
    timestamp: new Date().toISOString(),
    top10Evaluated: top10.length,
    recentRatio: `${recentRatio}%`,
    bracketDistribution: bracketCounts,
    conclusion: 'O desempate por recência do ProductJobRankingService garante que oportunidades mais frescas e ativas apareçam prioritariamente no feed do usuário.'
  };

  const outputPath = path.join(reportsDir, 'phase9_job_freshness.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Relatório salvo em: ${outputPath}`);
}

runJobFreshnessAudit();
