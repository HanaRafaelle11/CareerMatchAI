import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

const SAMPLE_JOBS_FOR_DEDUP = [
  { id: 'j1', title: 'Senior Product Manager', companyName: 'Nubank', location: 'São Paulo, SP', provider: 'LinkedIn', description: 'Liderar a estratégia de cartões de crédito e crédito digital. Requisitos: Product Discovery, Roadmap, SQL.' },
  { id: 'j2', title: 'Senior Product Manager', companyName: 'Nubank', location: 'São Paulo', provider: 'Google Jobs', description: 'Liderar a estratégia de cartões de crédito. Requisitos: Product Discovery, Roadmap, SQL.' }, // PROBABLE_DUPLICATE (Cross-provider)
  { id: 'j3', title: 'Customer Success Manager Enterprise', companyName: 'Totvs', location: 'Remoto', provider: 'LinkedIn', description: 'Gestão de contas estratégicas enterprise no setor de ERP. Requisitos: Onboarding, Churn, NPS.' },
  { id: 'j4', title: 'Customer Success Manager Enterprise', companyName: 'Totvs', location: 'Remoto', provider: 'Catho', description: 'Gestão de contas estratégicas enterprise. Requisitos: Onboarding, Churn, NPS.' }, // PROBABLE_DUPLICATE (Cross-provider)
  { id: 'j5', title: 'Tech Lead Backend (Node.js & AWS)', companyName: 'Stone', location: 'Remoto', provider: 'LinkedIn', description: 'Liderança técnica de squad de adquirência.' },
  { id: 'j6', title: 'Backend Developer Pleno', companyName: 'Logistics AI', location: 'Remoto', provider: 'InfoJobs', description: 'Desenvolvimento de microsserviços em Node.js.' },
  { id: 'j7', title: 'UX/UI Designer Pleno', companyName: 'Loft', location: 'Remoto', provider: 'Glassdoor', description: 'Design de interfaces e design system.' },
  { id: 'j8', title: 'Inside Sales Specialist B2B', companyName: 'Omie', location: 'São Paulo, SP', provider: 'Glassdoor', description: 'Prospecção ativa e qualificação de leads B2B.' },
  { id: 'j9', title: 'Consultor de Privacidade e DPO', companyName: 'Privacy Latam', location: 'Remoto', provider: 'Catho', description: 'Conformidade com LGPD.' },
  { id: 'j10', title: 'Desenvolvedor Java', companyName: 'Consultoria TI', location: 'Belo Horizonte, MG', provider: 'InfoJobs', description: 'Desenvolvimento de sistemas legado.' }
];

function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').trim();
}

function runDuplicateAudit() {
  console.log('========================================================================');
  console.log('📑 ETAPA 3: AUDITORIA DE DUPLICIDADE DE VAGAS E INGESTÃO MULTI-PROVIDER');
  console.log('========================================================================\n');

  const total = SAMPLE_JOBS_FOR_DEDUP.length;
  const duplicatePairs = [];
  const exactDuplicates = [];
  const probableDuplicates = [];
  const distinctJobs = [];

  const seenKeys = new Map();

  for (let i = 0; i < total; i++) {
    const jobA = SAMPLE_JOBS_FOR_DEDUP[i];
    let isDupe = false;

    for (let j = i + 1; j < total; j++) {
      const jobB = SAMPLE_JOBS_FOR_DEDUP[j];
      
      const normTitleA = normalizeStr(jobA.title);
      const normTitleB = normalizeStr(jobB.title);
      const normCompA = normalizeStr(jobA.companyName);
      const normCompB = normalizeStr(jobB.companyName);

      const titleMatch = normTitleA === normTitleB || (normTitleA.includes(normTitleB) || normTitleB.includes(normTitleA));
      const compMatch = normCompA && normCompB && (normCompA === normCompB || normCompA.includes(normCompB) || normCompB.includes(normCompA));

      if (titleMatch && compMatch) {
        isDupe = true;
        const pair = {
          jobA: { id: jobA.id, title: jobA.title, company: jobA.companyName, provider: jobA.provider },
          jobB: { id: jobB.id, title: jobB.title, company: jobB.companyName, provider: jobB.provider },
          type: (normTitleA === normTitleB && normCompA === normCompB && jobA.location === jobB.location) ? 'EXACT_DUPLICATE' : 'PROBABLE_DUPLICATE'
        };

        if (pair.type === 'EXACT_DUPLICATE') exactDuplicates.push(pair);
        else probableDuplicates.push(pair);
        duplicatePairs.push(pair);

        console.log(`⚠️ Duplicata Encontrada (${pair.type}):`);
        console.log(`   [${jobA.provider}] ${jobA.title} - ${jobA.companyName}`);
        console.log(`   [${jobB.provider}] ${jobB.title} - ${jobB.companyName}\n`);
      }
    }

    if (!isDupe) {
      distinctJobs.push(jobA);
    }
  }

  const duplicationRate = ((duplicatePairs.length / total) * 100).toFixed(1);

  console.log(`📊 Taxa Global de Duplicação: ${duplicationRate}% (${duplicatePairs.length} pares em ${total} vagas)`);
  console.log(`   - Duplicatas Exatas: ${exactDuplicates.length}`);
  console.log(`   - Duplicatas Prováveis Cross-Provider: ${probableDuplicates.length}`);
  console.log(`   - Vagas Únicas e Distintas: ${distinctJobs.length}\n`);

  const report = {
    timestamp: new Date().toISOString(),
    totalAnalyzed: total,
    duplicationRate: `${duplicationRate}%`,
    exactDuplicatesCount: exactDuplicates.length,
    probableDuplicatesCount: probableDuplicates.length,
    distinctCount: distinctJobs.length,
    duplicatePairs,
    recommendation: 'Implementar chave de deduplicação canônica no ingestion layer (normalizedTitle + normalizedCompany + normalizedLocation) antes de salvar no Supabase'
  };

  const outputPath = path.join(reportsDir, 'phase7_duplicate_jobs_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Relatório de duplicidade salvo: ${outputPath}`);
}

runDuplicateAudit();
