import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JobQualityService } from '../src/domain/services/JobQualityService.ts';
import { JobDeduplicationService } from '../src/domain/services/JobDeduplicationService.ts';
import { ProductJobRankingService } from '../src/domain/services/ProductJobRankingService.ts';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Gerador de Corpus de 100+ vagas realistas multi-área e multi-provedor
export function generate100JobsCorpus() {
  const providers = ['LinkedIn', 'Glassdoor', 'Google Jobs', 'Catho', 'InfoJobs', 'Gupy'];
  const areas = [
    { title: 'Product Manager', domain: 'Produto', reqs: ['Product Discovery', 'Roadmap', 'SQL', 'Product Analytics', 'Scrum'], seniority: ['junior', 'pleno', 'senior', 'lead'] },
    { title: 'Customer Success Manager', domain: 'Customer Success', reqs: ['Customer Success', 'Onboarding', 'Churn', 'NPS', 'Salesforce'], seniority: ['junior', 'pleno', 'senior', 'lead'] },
    { title: 'Backend Developer (Node.js)', domain: 'Engenharia', reqs: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'], seniority: ['junior', 'pleno', 'senior', 'lead'] },
    { title: 'Frontend Engineer (React)', domain: 'Engenharia', reqs: ['React', 'TypeScript', 'CSS', 'Tailwind', 'Next.js'], seniority: ['junior', 'pleno', 'senior'] },
    { title: 'Product Operations Analyst', domain: 'Operações', reqs: ['Product Operations', 'Jira', 'Processos Ágeis', 'SQL', 'Excel'], seniority: ['junior', 'pleno', 'senior'] },
    { title: 'Business Operations Analyst', domain: 'Operações', reqs: ['Business Operations', 'Análise de Dados', 'Excel Avançado', 'Power BI'], seniority: ['junior', 'pleno', 'senior'] },
    { title: 'Inside Sales Specialist B2B', domain: 'Vendas', reqs: ['Vendas B2B', 'Negociação', 'CRM', 'Inside Sales', 'Outbound'], seniority: ['junior', 'pleno', 'senior'] },
    { title: 'Product Designer (UI/UX)', domain: 'Design', reqs: ['Figma', 'Product Design', 'Design System', 'Prototipação', 'UX Research'], seniority: ['junior', 'pleno', 'senior'] },
    { title: 'Analista de Marketing Digital', domain: 'Marketing', reqs: ['Marketing de Conteúdo', 'SEO', 'Google Analytics', 'Copywriting'], seniority: ['junior', 'pleno', 'senior'] },
    { title: 'Analista Financeiro Pleno', domain: 'Financeiro', reqs: ['Modelagem Financeira', 'Excel Avançado', 'DRE', 'Controladoria'], seniority: ['pleno', 'senior'] },
    { title: 'Analista de Recursos Humanos (BP)', domain: 'RH', reqs: ['Recrutamento e Seleção', 'Business Partner', 'Treinamento', 'Clima Organizacional'], seniority: ['junior', 'pleno', 'senior'] },
    { title: 'Enfermeiro de UTI Adulto', domain: 'Saúde', reqs: ['COREN Ativo', 'UTI Adulto', 'Cuidados Críticos', 'Farmacologia'], seniority: ['pleno', 'senior'] }
  ];

  const companies = ['Nubank', 'Stone', 'iFood', 'Totvs', 'Loft', 'Omie', 'QuintoAndar', 'Mercado Livre', 'PicPay', 'Hospital Central', 'Consultoria Tech'];
  const locations = ['São Paulo, SP', 'Remoto', 'Campinas, SP', 'Belo Horizonte, MG', 'Curitiba, PR', 'Rio de Janeiro, RJ'];

  const jobs = [];
  let idCounter = 1;

  // Gerar ~104 vagas estruturadas
  for (const area of areas) {
    for (const sen of area.seniority) {
      for (let k = 0; k < 3; k++) {
        const prov = providers[(idCounter) % providers.length];
        const comp = companies[(idCounter) % companies.length];
        const loc = locations[(idCounter) % locations.length];
        
        // Variação de data de publicação (freshness)
        const daysAgo = (idCounter * 3) % 45;
        const pubDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 10% de vagas com baixa qualidade de dados para teste do quality pipeline
        const isLowQuality = idCounter % 10 === 0;

        jobs.push({
          id: `job-p9-${idCounter.toString().padStart(3, '0')}`,
          title: isLowQuality ? area.title.split(' ')[0] : `${area.title} ${sen === 'senior' ? 'Sênior' : sen === 'junior' ? 'Júnior' : 'Pleno'}`,
          companyName: isLowQuality ? 'Empresa Confidencial' : comp,
          location: loc,
          workMode: loc === 'Remoto' ? 'remote' : 'hybrid',
          seniority: isLowQuality ? '' : sen,
          description: isLowQuality ? 'Vaga aberta para início imediato. Envie seu CV.' : `Oportunidade para atuar como ${area.title} na equipe de ${area.domain}. Responsabilidades incluem execução de rituais, métricas e entregas de alto impacto. Requisitos mandatórios: ${area.reqs.join(', ')}.`,
          requirements: isLowQuality ? [] : area.reqs,
          salary: isLowQuality ? '' : 'R$ 8.000 - 14.000',
          provider: prov,
          isActive: true,
          createdAt: pubDate,
          url: `https://jobs.example.com/${idCounter}`
        });

        idCounter++;
      }
    }
  }

  // Adicionar duplicatas intencionais cross-provider
  jobs.push({
    id: `job-p9-dupe-1`,
    title: 'Senior Product Manager',
    companyName: 'Nubank',
    location: 'São Paulo, SP',
    workMode: 'hybrid',
    seniority: 'senior',
    description: 'Liderar a estratégia de cartões de crédito. Requisitos: Product Discovery, Roadmap, SQL.',
    requirements: ['Product Discovery', 'Roadmap', 'SQL'],
    provider: 'Catho',
    isActive: true,
    createdAt: '2026-08-10',
    url: 'https://catho.example.com/nubank-pm'
  });

  jobs.push({
    id: `job-p9-dupe-2`,
    title: 'Senior Product Manager (Cartões)',
    companyName: 'Nubank',
    location: 'São Paulo, SP',
    workMode: 'hybrid',
    seniority: 'senior',
    description: 'Liderar a estratégia de cartões de crédito. Requisitos: Product Discovery, Roadmap, SQL.',
    requirements: ['Product Discovery', 'Roadmap', 'SQL'],
    provider: 'Glassdoor',
    isActive: true,
    createdAt: '2026-08-10',
    url: 'https://glassdoor.example.com/nubank-pm'
  });

  return jobs;
}

function runRealPipelineAudit() {
  console.log('========================================================================');
  console.log('🔍 ETAPA 1: AUDITORIA DO PIPELINE REAL DE VAGAS EM ESCALA (100+ VAGAS)');
  console.log('========================================================================\n');

  const rawCorpus = generate100JobsCorpus();
  const totalIngested = rawCorpus.length;

  let totalLowQuality = 0;
  let totalMediumQuality = 0;
  let totalHighQuality = 0;

  // 1. Quality Assessment
  for (const job of rawCorpus) {
    const q = JobQualityService.evaluateJobQuality(job);
    if (q.level === 'LOW_QUALITY') totalLowQuality++;
    else if (q.level === 'MEDIUM_QUALITY') totalMediumQuality++;
    else totalHighQuality++;
  }

  // 2. Deduplication
  const canonicalJobs = JobDeduplicationService.deduplicateJobs(rawCorpus);
  const totalUniqueJobs = canonicalJobs.length;
  const totalDuplicates = totalIngested - totalUniqueJobs;

  // 3. Matching & Ranking contra perfil de teste (CSM Sênior)
  const testResume = {
    fullName: 'Carlos CSM',
    yearsOfExperience: 6,
    skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Churn' }, { name: 'NPS' }],
    experiences: [{ role: 'Senior Customer Success Manager', companyName: 'SaaS Corp' }]
  };
  const testGoal = {
    intentType: 'same_area_continue',
    targetArea: 'Customer Success',
    targetRoles: ['Senior Customer Success Manager']
  };

  const rankedItems = ProductJobRankingService.rankJobs(rawCorpus, testResume, null, testGoal, { filterLowQuality: true, minScoreCutoff: 20 });
  const totalMatched = rankedItems.length;
  const totalFiltered = totalUniqueJobs - totalMatched;
  const totalDisplayed = Math.min(10, totalMatched);

  const report = {
    timestamp: new Date().toISOString(),
    pipelineMetrics: {
      total_ingested: totalIngested,
      total_normalized: totalIngested,
      total_low_quality: totalLowQuality,
      total_medium_quality: totalMediumQuality,
      total_high_quality: totalHighQuality,
      total_duplicates: totalDuplicates,
      total_unique_jobs: totalUniqueJobs,
      total_matched: totalMatched,
      total_filtered: totalFiltered,
      total_displayed: totalDisplayed
    },
    conversionRates: {
      ingestion_to_usable_rate: `${(((totalIngested - totalLowQuality) / totalIngested) * 100).toFixed(1)}%`,
      usable_to_matched_rate: `${((totalMatched / (totalIngested - totalLowQuality)) * 100).toFixed(1)}%`,
      matched_to_displayed_rate: `${((totalDisplayed / totalMatched) * 100).toFixed(1)}%`
    }
  };

  console.log(`📊 Métricas do Pipeline:`);
  console.log(`   - Total Ingerido: ${report.pipelineMetrics.total_ingested} vagas`);
  console.log(`   - Vagas High Quality: ${report.pipelineMetrics.total_high_quality}`);
  console.log(`   - Vagas Medium Quality: ${report.pipelineMetrics.total_medium_quality}`);
  console.log(`   - Vagas Low Quality (rebaixadas/filtradas): ${report.pipelineMetrics.total_low_quality}`);
  console.log(`   - Duplicatas Eliminadas: ${report.pipelineMetrics.total_duplicates}`);
  console.log(`   - Vagas Únicas Canônicas: ${report.pipelineMetrics.total_unique_jobs}`);
  console.log(`   - Vagas com Match Aderente: ${report.pipelineMetrics.total_matched}`);
  console.log(`   - Vagas Exibidas no Top Feed: ${report.pipelineMetrics.total_displayed}\n`);

  console.log(`📈 Taxas de Eficiência do Pipeline:`);
  console.log(`   - Ingestion ➔ Usable: ${report.conversionRates.ingestion_to_usable_rate}`);
  console.log(`   - Usable ➔ Matched:   ${report.conversionRates.usable_to_matched_rate}`);
  console.log(`   - Matched ➔ Displayed: ${report.conversionRates.matched_to_displayed_rate}\n`);

  const outputPath = path.join(reportsDir, 'phase9_pipeline_audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Relatório salvo em: ${outputPath}`);
}

runRealPipelineAudit();
