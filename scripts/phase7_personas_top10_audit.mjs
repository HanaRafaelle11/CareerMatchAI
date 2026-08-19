import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

const EXTENDED_JOBS_POOL = [
  { id: 'j-pm-sr', title: 'Senior Product Manager', companyName: 'Nubank', seniority: 'senior', location: 'São Paulo', workMode: 'hybrid', requirements: ['Product Discovery', 'Roadmap', 'SQL', 'Product Analytics'], isActive: true },
  { id: 'j-pm-pl', title: 'Product Manager Pleno', companyName: 'Stone', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Product Discovery', 'Roadmap', 'Scrum', 'Gestão de Stakeholders'], isActive: true },
  { id: 'j-pm-jr', title: 'Associate Product Manager', companyName: 'Fintech X', seniority: 'junior', location: 'Remoto', workMode: 'remote', requirements: ['Product Discovery', 'Análise de Métricas', 'Visão do Cliente'], isActive: true },
  { id: 'j-pops', title: 'Product Operations Specialist', companyName: 'iFood', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Product Operations', 'Jira', 'Processos Ágeis', 'SQL'], isActive: true },
  { id: 'j-cs-sr', title: 'Senior Customer Success Manager', companyName: 'Totvs', seniority: 'senior', location: 'Remoto', workMode: 'remote', requirements: ['Customer Success', 'Onboarding', 'Churn', 'NPS', 'Enterprise'], isActive: true },
  { id: 'j-cs-pl', title: 'Customer Success Specialist', companyName: 'SaaS Alpha', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Customer Success', 'Gestão de Contas', 'Onboarding', 'NPS'], isActive: true },
  { id: 'j-cs-lead', title: 'Customer Success Team Lead', companyName: 'Global Cloud', seniority: 'lead', location: 'Remoto', workMode: 'remote', requirements: ['Customer Success', 'Liderança de Equipe', 'Gestão de Indicadores'], isActive: true },
  { id: 'j-dev-lead', title: 'Tech Lead Backend (Node.js)', companyName: 'Stone', seniority: 'lead', location: 'Remoto', workMode: 'remote', requirements: ['Node.js', 'TypeScript', 'AWS', 'Arquitetura de Software'], isActive: true },
  { id: 'j-dev-pl', title: 'Backend Developer Pleno', companyName: 'Logistics AI', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker'], isActive: true },
  { id: 'j-dev-sr', title: 'Senior Backend Engineer', companyName: 'Cloud Solutions', seniority: 'senior', location: 'Remoto', workMode: 'remote', requirements: ['Node.js', 'PostgreSQL', 'Microsserviços', 'Kubernetes'], isActive: true },
  { id: 'j-ops-proj', title: 'Project Manager (Operações)', companyName: 'Global Services', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Gestão de Projetos', 'Planejamento', 'Cronogramas', 'Organização'], isActive: true },
  { id: 'j-ops-biz', title: 'Business Operations Analyst', companyName: 'Fintech Hub', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Business Operations', 'Análise de Dados', 'Excel Avançado', 'Processos'], isActive: true },
  { id: 'j-sales', title: 'Inside Sales Specialist B2B', companyName: 'Omie', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Vendas B2B', 'Negociação', 'CRM', 'Comunicação'], isActive: true },
  { id: 'j-dpo', title: 'Privacy & Data Protection Analyst (DPO)', companyName: 'Privacy Latam', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['LGPD', 'Privacidade de Dados', 'Compliance', 'Direito Digital'], isActive: true },
  { id: 'j-des-pl', title: 'Product Designer Pleno', companyName: 'Loft', seniority: 'pleno', location: 'Remoto', workMode: 'remote', requirements: ['Figma', 'Product Design', 'Design System', 'Prototipação'], isActive: true },
  { id: 'j-nurse', title: 'Enfermeiro de UTI Adulto', companyName: 'Hospital Central', seniority: 'pleno', location: 'São Paulo', workMode: 'onsite', requirements: ['COREN Ativo', 'UTI Adulto', 'Cuidados Críticos'], isActive: true },
  { id: 'j-civil', title: 'Engenheiro Civil de Obras', companyName: 'Construtora Horizonte', seniority: 'senior', location: 'Curitiba', workMode: 'onsite', requirements: ['CREA Ativo', 'AutoCAD', 'Cálculo Estrutural'], isActive: true }
];

const PERSONAS = [
  { id: 'P1', name: 'CSM Senior buscando CSM Senior', resume: { fullName: 'Carlos Mendes', yearsOfExperience: 6, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Churn' }, { name: 'NPS' }], experiences: [{ role: 'Senior Customer Success Manager', companyName: 'SaaS Alpha' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Customer Success', targetRoles: ['Senior Customer Success Manager'] } },
  { id: 'P2', name: 'CSM buscando Product Manager', resume: { fullName: 'Juliana Pires', yearsOfExperience: 4, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Visão do Cliente' }, { name: 'Jira' }], experiences: [{ role: 'Customer Success Manager', companyName: 'SaaS Alpha' }] }, goal: { intentType: 'career_transition', targetArea: 'Gestão de Produto', targetRoles: ['Product Manager', 'Associate Product Manager'] } },
  { id: 'P3', name: 'Operations buscando Product Operations', resume: { fullName: 'Lucas Neves', yearsOfExperience: 3, skills: [{ name: 'Operações' }, { name: 'Jira' }, { name: 'Mapeamento de Processos' }], experiences: [{ role: 'Operations Analyst', companyName: 'EdTech' }] }, goal: { intentType: 'career_transition', targetArea: 'Product Operations', targetRoles: ['Product Operations Specialist'] } },
  { id: 'P4', name: 'Backend Developer buscando Tech Lead', resume: { fullName: 'Igor Ferreira', yearsOfExperience: 5, skills: [{ name: 'Node.js' }, { name: 'TypeScript' }, { name: 'PostgreSQL' }], experiences: [{ role: 'Backend Developer Pleno', companyName: 'Web Systems' }] }, goal: { intentType: 'same_area_grow', targetArea: 'Liderança Técnica', targetRoles: ['Tech Lead'] } },
  { id: 'P5', name: 'Product Analyst buscando Product Manager', resume: { fullName: 'Helena Martins', yearsOfExperience: 2, skills: [{ name: 'Product Analytics' }, { name: 'SQL' }, { name: 'Mapeamento de Processos' }], experiences: [{ role: 'Product Analyst Júnior', companyName: 'App Store' }] }, goal: { intentType: 'same_area_grow', targetArea: 'Gestão de Produto', targetRoles: ['Product Manager'] } },
  { id: 'P6', name: 'Marketing buscando Customer Success', resume: { fullName: 'Sabrina Toledo', yearsOfExperience: 3, skills: [{ name: 'Marketing de Conteúdo' }, { name: 'Comunicação' }, { name: 'Relacionamento' }], experiences: [{ role: 'Analista de Marketing', companyName: 'Agência Criativa' }] }, goal: { intentType: 'career_transition', targetArea: 'Customer Success', targetRoles: ['Customer Success Specialist'] } },
  { id: 'P7', name: 'Finance buscando Business Operations', resume: { fullName: 'Tiago Bueno', yearsOfExperience: 4, skills: [{ name: 'Excel Avançado' }, { name: 'Análise de Dados' }, { name: 'Processos' }], experiences: [{ role: 'Analista Financeiro Pleno', companyName: 'Banco Invest' }] }, goal: { intentType: 'career_transition', targetArea: 'Business Operations', targetRoles: ['Business Operations Analyst'] } },
  { id: 'P8', name: 'Designer buscando Product Designer', resume: { fullName: 'Camila Design', yearsOfExperience: 4, skills: [{ name: 'Figma' }, { name: 'UI Design' }, { name: 'Design System' }], experiences: [{ role: 'UI Designer', companyName: 'Studio Design' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Product Design', targetRoles: ['Product Designer'] } },
  { id: 'P9', name: 'Profissional em Exploração (Sem Objetivo)', resume: { fullName: 'Danilo Melo', yearsOfExperience: 4, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }], experiences: [{ role: 'Customer Success Specialist', companyName: 'SaaS Co' }] }, goal: null },
  { id: 'P10', name: 'Mudança Radical (Dev para Enfermagem)', resume: { fullName: 'Valter Gomes', yearsOfExperience: 4, skills: [{ name: 'Python' }, { name: 'Django' }], experiences: [{ role: 'Python Developer', companyName: 'Tech Delta' }] }, goal: { intentType: 'career_transition', targetArea: 'Enfermagem Hospitalar', targetRoles: ['Enfermeiro'] } }
];

function evaluateRecommendationQuality(persona, job, match) {
  const isTransition = persona.goal && (persona.goal.intentType === 'career_transition' || match.transition.isCareerTransition);
  const targetArea = persona.goal?.targetArea?.toLowerCase() || '';

  // Classificação humana:
  // A = Perfeito alinhamento direto ou transição de alto potencial
  // B = Boa oportunidade adjacente
  // C = Aceitável
  // D = Fraca
  // F = Totalmente incompatível ou absurda
  if (job.id === 'j-nurse' && !targetArea.includes('enfermagem')) return 'F';
  if (job.id === 'j-civil' && !targetArea.includes('civil')) return 'F';

  if (!isTransition) {
    if (match.careerFitScore >= 75) return 'A';
    if (match.careerFitScore >= 55) return 'B';
    if (match.careerFitScore >= 35) return 'C';
    return 'D';
  } else {
    if (match.careerGoalScore >= 75) return 'A';
    if (match.careerGoalScore >= 55) return 'B';
    if (match.careerGoalScore >= 35) return 'C';
    return 'D';
  }
}

function runPersonasTop10Audit() {
  console.log('========================================================================');
  console.log('👥 ETAPA 4 & 5: AUDITORIA DE TOP 10 E SANITY CHECK PARA 10 PERSONAS');
  console.log('========================================================================\n');

  const reportPersonas = [];
  let totalRecommendations = 0;
  let gradeACount = 0;
  let gradeBCount = 0;
  let gradeCCount = 0;
  let gradeDCount = 0;
  let gradeFCount = 0;
  let top3GoodCount = 0;

  for (const persona of PERSONAS) {
    console.log(`👤 PERSONA ${persona.id}: ${persona.name}`);

    const scoredJobs = EXTENDED_JOBS_POOL.map(job => {
      const match = CareerMatchEngineV3.calculate(job, persona.resume, null, persona.goal);
      let rankingScore = match.careerFitScore;
      if (persona.goal && match.careerGoalScore !== null) {
        if (persona.goal.intentType === 'career_transition') {
          rankingScore = match.careerGoalScore;
        } else {
          rankingScore = Math.round((match.careerFitScore * 0.7) + (match.careerGoalScore * 0.3));
        }
      }
      const grade = evaluateRecommendationQuality(persona, job, match);
      return { job, match, rankingScore, grade };
    });

    scoredJobs.sort((a, b) => b.rankingScore - a.rankingScore);
    const top10 = scoredJobs.slice(0, 10);

    top10.forEach((item, idx) => {
      totalRecommendations++;
      if (item.grade === 'A') gradeACount++;
      else if (item.grade === 'B') gradeBCount++;
      else if (item.grade === 'C') gradeCCount++;
      else if (item.grade === 'D') gradeDCount++;
      else if (item.grade === 'F') gradeFCount++;

      if (idx < 3 && (item.grade === 'A' || item.grade === 'B')) {
        top3GoodCount++;
      }

      const gStr = item.match.careerGoalScore !== null ? `${item.match.careerGoalScore}%` : 'null';
      console.log(`   #${idx + 1} [Grade ${item.grade} | Rank ${item.rankingScore}%] Fit: ${item.match.careerFitScore}% | Goal: ${gStr} | ${item.job.title} - ${item.job.companyName}`);
    });

    reportPersonas.push({
      personaId: persona.id,
      personaName: persona.name,
      top10: top10.map(t => ({
        jobTitle: t.job.title,
        company: t.job.companyName,
        fit: t.match.careerFitScore,
        goal: t.match.careerGoalScore,
        grade: t.grade,
        rankScore: t.rankingScore
      }))
    });

    console.log('');
  }

  const top3RelevanceRate = ((top3GoodCount / (PERSONAS.length * 3)) * 100).toFixed(1);
  const gradeABRate = (((gradeACount + gradeBCount) / totalRecommendations) * 100).toFixed(1);

  console.log(`📊 SANITY CHECK GLOBAL:`);
  console.log(`   - Top 3 Relevance Rate (Notas A/B nos 3 primeiros): ${top3RelevanceRate}%`);
  console.log(`   - Taxa de Recomendações A/B no Top 10: ${gradeABRate}% (${gradeACount + gradeBCount}/${totalRecommendations})`);
  console.log(`   - Taxa de Recomendações C (Aceitáveis): ${((gradeCCount / totalRecommendations) * 100).toFixed(1)}%`);
  console.log(`   - Taxa de Recomendações D/F: ${(((gradeDCount + gradeFCount) / totalRecommendations) * 100).toFixed(1)}%`);

  const output = {
    timestamp: new Date().toISOString(),
    totalPersonas: PERSONAS.length,
    top3RelevanceRate: `${top3RelevanceRate}%`,
    gradeABRate: `${gradeABRate}%`,
    gradeDistribution: {
      A: gradeACount,
      B: gradeBCount,
      C: gradeCCount,
      D: gradeDCount,
      F: gradeFCount
    },
    personas: reportPersonas
  };

  const outputPath = path.join(reportsDir, 'phase7_top10_personas.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n📄 Relatório salvo: ${outputPath}`);
}

runPersonasTop10Audit();
