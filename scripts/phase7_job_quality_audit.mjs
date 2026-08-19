import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Corpus realista representativo de vagas de múltiplos agregadores
const SAMPLE_JOB_CORPUS = [
  // Provider: LinkedIn (Alta qualidade)
  { id: 'j-li-01', title: 'Senior Product Manager', companyName: 'Nubank', location: 'São Paulo, SP', workMode: 'hybrid', seniority: 'senior', salary: 'R$ 18.000 - 22.000', description: 'Buscamos Senior PM para liderar a estratégia de cartões de crédito e crédito digital. Requisitos: Product Discovery, Roadmap, SQL, Métricas de Engajamento, Rituais Ágeis.', requirements: ['Product Discovery', 'Roadmap', 'SQL', 'Product Analytics', 'Metodologias Ágeis'], provider: 'LinkedIn', isActive: true, createdAt: '2026-08-10' },
  { id: 'j-li-02', title: 'Customer Success Manager Enterprise', companyName: 'Totvs', location: 'Remoto', workMode: 'remote', seniority: 'pleno', salary: 'R$ 8.000 - 10.000', description: 'Gestão de contas estratégicas enterprise no setor de ERP. Requisitos: Onboarding, Churn, NPS, CRM Salesforce.', requirements: ['Customer Success', 'Onboarding', 'Churn', 'NPS', 'Salesforce'], provider: 'LinkedIn', isActive: true, createdAt: '2026-08-12' },
  { id: 'j-li-03', title: 'Tech Lead Backend (Node.js & AWS)', companyName: 'Stone', location: 'Remoto', workMode: 'remote', seniority: 'lead', salary: 'R$ 19.000', description: 'Liderança técnica de squad de adquirência e mensageria em microsserviços.', requirements: ['Node.js', 'TypeScript', 'AWS', 'Arquitetura de Software', 'Kubernetes'], provider: 'LinkedIn', isActive: true, createdAt: '2026-08-14' },
  { id: 'j-li-04', title: 'Product Operations Specialist', companyName: 'iFood', location: 'Campinas, SP', workMode: 'hybrid', seniority: 'pleno', salary: 'R$ 9.000', description: 'Ponte entre squads de produto e operações logísticas.', requirements: ['Product Operations', 'Jira', 'Processos Ágeis', 'SQL'], provider: 'LinkedIn', isActive: true, createdAt: '2026-08-15' },
  
  // Provider: InfoJobs (Qualidade Média/Mista)
  { id: 'j-ij-01', title: 'Assistente de Atendimento ao Cliente', companyName: 'Teleatendimento Brasil', location: 'São Paulo, SP', workMode: 'onsite', seniority: 'junior', salary: 'R$ 1.800', description: 'Atendimento telefônico receptivo para suporte a clientes.', requirements: ['Atendimento ao Cliente', 'Boa Comunicação'], provider: 'InfoJobs', isActive: true, createdAt: '2026-08-01' },
  { id: 'j-ij-02', title: 'Analista de Operações', companyName: '', location: 'Rio de Janeiro, RJ', workMode: '', seniority: '', salary: '', description: 'Atuar com planilhas e rotinas.', requirements: [], provider: 'InfoJobs', isActive: true, createdAt: '2026-07-20' }, // Baixa qualidade
  { id: 'j-ij-03', title: 'Desenvolvedor Java', companyName: 'Consultoria TI', location: 'Belo Horizonte, MG', workMode: 'hybrid', seniority: 'pleno', salary: '', description: 'Desenvolvimento de sistemas legado.', requirements: ['Java', 'Spring Boot', 'Oracle'], provider: 'InfoJobs', isActive: true, createdAt: '2026-08-05' },

  // Provider: Catho (Qualidade Variável)
  { id: 'j-cat-01', title: 'Consultor de Privacidade e DPO', companyName: 'Privacy Latam', location: 'Remoto', workMode: 'remote', seniority: 'pleno', salary: 'R$ 11.000', description: 'Conformidade com LGPD e auditoria de riscos regulatórios.', requirements: ['LGPD', 'Direito Digital', 'Compliance', 'Auditoria'], provider: 'Catho', isActive: true, createdAt: '2026-08-11' },
  { id: 'j-cat-02', title: 'Vaga Urgente - Analista', companyName: 'Confidencial', location: '', workMode: '', seniority: '', salary: '', description: 'Envie CV urgente.', requirements: [], provider: 'Catho', isActive: false, createdAt: '2026-05-01' }, // Expirada e Baixa qualidade
  { id: 'j-cat-03', title: 'Customer Success Manager Enterprise', companyName: 'Totvs', location: 'Remoto', workMode: 'remote', seniority: 'pleno', salary: '', description: 'Gestão de contas estratégicas enterprise. Requisitos: Onboarding, Churn, NPS.', requirements: ['Customer Success', 'Onboarding', 'Churn', 'NPS'], provider: 'Catho', isActive: true, createdAt: '2026-08-12' }, // Duplicata provável de j-li-02

  // Provider: Glassdoor / Google Jobs
  { id: 'j-gj-01', title: 'Senior Product Manager', companyName: 'Nubank', location: 'São Paulo', workMode: 'hybrid', seniority: 'senior', salary: '', description: 'Liderar a estratégia de cartões de crédito. Requisitos: Product Discovery, Roadmap, SQL.', requirements: ['Product Discovery', 'Roadmap', 'SQL'], provider: 'Google Jobs', isActive: true, createdAt: '2026-08-10' }, // Duplicata de j-li-01
  { id: 'j-gd-01', title: 'UX/UI Designer Pleno', companyName: 'Loft', location: 'Remoto', workMode: 'remote', seniority: 'pleno', salary: 'R$ 8.500', description: 'Design de interfaces, design system e testes de usabilidade.', requirements: ['Figma', 'Design System', 'Prototipação', 'Testes de Usabilidade'], provider: 'Glassdoor', isActive: true, createdAt: '2026-08-16' },
  { id: 'j-gd-02', title: 'Inside Sales Specialist B2B', companyName: 'Omie', location: 'São Paulo, SP', workMode: 'hybrid', seniority: 'pleno', salary: 'R$ 6.000 + comissão', description: 'Prospecção ativa e qualificação de leads B2B.', requirements: ['Vendas B2B', 'Negociação', 'CRM', 'Inside Sales'], provider: 'Glassdoor', isActive: true, createdAt: '2026-08-13' }
];

function runJobQualityAudit() {
  console.log('========================================================================');
  console.log('🔍 ETAPA 1: AUDITORIA DA QUALIDADE E DADOS DO PIPELINE DE VAGAS');
  console.log('========================================================================\n');

  const total = SAMPLE_JOB_CORPUS.length;
  let validDescriptionCount = 0;
  let validRequirementsCount = 0;
  let validSeniorityCount = 0;
  let validLocationCount = 0;
  let validSalaryCount = 0;
  let validCompanyCount = 0;
  let expiredCount = 0;
  let lowQualityCount = 0;

  const providerStats = {};

  for (const job of SAMPLE_JOB_CORPUS) {
    // Provider grouping
    if (!providerStats[job.provider]) {
      providerStats[job.provider] = { total: 0, lowQuality: 0, withReqs: 0 };
    }
    providerStats[job.provider].total++;

    const hasDesc = job.description && job.description.trim().length >= 30;
    const hasReqs = job.requirements && job.requirements.length > 0;
    const hasSeniority = !!job.seniority;
    const hasLocation = !!job.location;
    const hasSalary = !!job.salary;
    const hasCompany = job.companyName && !job.companyName.toLowerCase().includes('confidencial');
    const isExpired = !job.isActive || new Date(job.createdAt).getTime() < new Date('2026-07-01').getTime();

    if (hasDesc) validDescriptionCount++;
    if (hasReqs) {
      validRequirementsCount++;
      providerStats[job.provider].withReqs++;
    }
    if (hasSeniority) validSeniorityCount++;
    if (hasLocation) validLocationCount++;
    if (hasSalary) validSalaryCount++;
    if (hasCompany) validCompanyCount++;
    if (isExpired) expiredCount++;

    const isLowQuality = !hasDesc || !hasReqs || !hasCompany || isExpired;
    if (isLowQuality) {
      lowQualityCount++;
      providerStats[job.provider].lowQuality++;
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalAnalyzed: total,
    metrics: {
      validDescriptionPct: `${((validDescriptionCount / total) * 100).toFixed(1)}%`,
      validRequirementsPct: `${((validRequirementsCount / total) * 100).toFixed(1)}%`,
      validSeniorityPct: `${((validSeniorityCount / total) * 100).toFixed(1)}%`,
      validLocationPct: `${((validLocationCount / total) * 100).toFixed(1)}%`,
      validSalaryPct: `${((validSalaryCount / total) * 100).toFixed(1)}%`,
      validCompanyPct: `${((validCompanyCount / total) * 100).toFixed(1)}%`,
      potentiallyExpiredPct: `${((expiredCount / total) * 100).toFixed(1)}%`,
      lowQualityJobPct: `${((lowQualityCount / total) * 100).toFixed(1)}%`
    },
    providerQuality: providerStats,
    classification: 'JOB_DATA_QUALITY_EVALUATED'
  };

  console.log(`📊 Total de Vagas Auditadas: ${total}`);
  console.log(`   - Com Descrição Válida: ${report.metrics.validDescriptionPct}`);
  console.log(`   - Com Requisitos Identificáveis: ${report.metrics.validRequirementsPct}`);
  console.log(`   - Com Senioridade Mapeada: ${report.metrics.validSeniorityPct}`);
  console.log(`   - Com Localização/Modalidade: ${report.metrics.validLocationPct}`);
  console.log(`   - Com Salário Informado: ${report.metrics.validSalaryPct}`);
  console.log(`   - Vagas com Baixa Qualidade de Dados: ${report.metrics.lowQualityJobPct}`);
  console.log(`   - Vagas Potencialmente Expiradas: ${report.metrics.potentiallyExpiredPct}\n`);

  console.log('📌 Qualidade por Agregador/Provider:');
  for (const [prov, st] of Object.entries(providerStats)) {
    const qualPct = (((st.total - st.lowQuality) / st.total) * 100).toFixed(1);
    console.log(`   - ${prov.padEnd(12)}: ${st.total} vagas | ${qualPct}% alta qualidade | ${st.withReqs} com requisitos`);
  }

  const outputPath = path.join(reportsDir, 'phase7_job_quality_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 Relatório salvo em: ${outputPath}`);

  return { report, corpus: SAMPLE_JOB_CORPUS };
}

runJobQualityAudit();
