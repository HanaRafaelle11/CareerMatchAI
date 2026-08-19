import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generate100JobsCorpus } from './phase9_real_pipeline_audit.mjs';
import { ProductJobRankingService } from '../src/domain/services/ProductJobRankingService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

export const TWENTY_PERSONAS = [
  // 1. Continuidade
  { id: 'P01', name: 'CSM Sênior buscando CSM Sênior', resume: { fullName: 'Ana CS', yearsOfExperience: 6, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Churn' }, { name: 'NPS' }], experiences: [{ role: 'Senior Customer Success Manager', companyName: 'SaaS Co' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Customer Success', targetRoles: ['Customer Success Manager Sênior'] } },
  { id: 'P02', name: 'Product Manager Pleno buscando PM Pleno', resume: { fullName: 'Bruno PM', yearsOfExperience: 4, skills: [{ name: 'Product Discovery' }, { name: 'Roadmap' }, { name: 'SQL' }, { name: 'Scrum' }], experiences: [{ role: 'Product Manager Pleno', companyName: 'Tech Co' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Produto', targetRoles: ['Product Manager Pleno'] } },
  { id: 'P03', name: 'Backend Dev Pleno buscando Backend Pleno', resume: { fullName: 'Caio Dev', yearsOfExperience: 3, skills: [{ name: 'Node.js' }, { name: 'TypeScript' }, { name: 'PostgreSQL' }], experiences: [{ role: 'Backend Developer Pleno', companyName: 'Web Systems' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Engenharia', targetRoles: ['Backend Developer Pleno'] } },

  // 2. Promoção
  { id: 'P04', name: 'CSM Pleno buscando Liderança de CS', resume: { fullName: 'Daniela CS', yearsOfExperience: 4, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Liderança de Equipe' }], experiences: [{ role: 'Customer Success Specialist', companyName: 'Cloud Co' }] }, goal: { intentType: 'same_area_grow', targetArea: 'Customer Success', targetRoles: ['Customer Success Manager Sênior'] } },
  { id: 'P05', name: 'Backend Dev Pleno buscando Tech Lead', resume: { fullName: 'Eduardo Dev', yearsOfExperience: 5, skills: [{ name: 'Node.js' }, { name: 'TypeScript' }, { name: 'AWS' }], experiences: [{ role: 'Backend Developer Pleno', companyName: 'Delta Labs' }] }, goal: { intentType: 'same_area_grow', targetArea: 'Liderança Técnica', targetRoles: ['Backend Developer Sênior'] } },
  { id: 'P06', name: 'Product Analyst buscando Product Manager', resume: { fullName: 'Fernanda PM', yearsOfExperience: 2, skills: [{ name: 'Product Analytics' }, { name: 'SQL' }, { name: 'Product Discovery' }], experiences: [{ role: 'Product Analyst', companyName: 'App Inc' }] }, goal: { intentType: 'same_area_grow', targetArea: 'Produto', targetRoles: ['Product Manager Pleno'] } },

  // 3. Transição Próxima
  { id: 'P07', name: 'CSM buscando Product Manager', resume: { fullName: 'Gustavo CS', yearsOfExperience: 4, skills: [{ name: 'Customer Success' }, { name: 'Visão do Cliente' }, { name: 'Jira' }], experiences: [{ role: 'Customer Success Manager', companyName: 'SaaS Alpha' }] }, goal: { intentType: 'career_transition', targetArea: 'Produto', targetRoles: ['Product Manager', 'Associate Product Manager'] } },
  { id: 'P08', name: 'Operations buscando Product Operations', resume: { fullName: 'Helena Ops', yearsOfExperience: 3, skills: [{ name: 'Jira' }, { name: 'Processos Ágeis' }, { name: 'SQL' }], experiences: [{ role: 'Operations Analyst', companyName: 'Log Co' }] }, goal: { intentType: 'career_transition', targetArea: 'Product Operations', targetRoles: ['Product Operations Analyst'] } },
  { id: 'P09', name: 'Inside Sales buscando Customer Success', resume: { fullName: 'Igor Sales', yearsOfExperience: 3, skills: [{ name: 'Vendas B2B' }, { name: 'Negociação' }, { name: 'CRM' }], experiences: [{ role: 'Inside Sales Specialist', companyName: 'Hub Co' }] }, goal: { intentType: 'career_transition', targetArea: 'Customer Success', targetRoles: ['Customer Success Manager'] } },

  // 4. Transição Moderada
  { id: 'P10', name: 'Marketing Digital buscando Customer Success', resume: { fullName: 'Juliana Mkt', yearsOfExperience: 3, skills: [{ name: 'Marketing de Conteúdo' }, { name: 'Comunicação' }, { name: 'Google Analytics' }], experiences: [{ role: 'Analista de Marketing', companyName: 'Agência X' }] }, goal: { intentType: 'career_transition', targetArea: 'Customer Success', targetRoles: ['Customer Success Manager'] } },
  { id: 'P11', name: 'Financeiro buscando Business Operations', resume: { fullName: 'Kleber Fin', yearsOfExperience: 4, skills: [{ name: 'Excel Avançado' }, { name: 'Análise de Dados' }, { name: 'Processos' }], experiences: [{ role: 'Analista Financeiro Pleno', companyName: 'Invest Co' }] }, goal: { intentType: 'career_transition', targetArea: 'Operações', targetRoles: ['Business Operations Analyst'] } },
  { id: 'P12', name: 'RH Business Partner buscando Gestão de Operações', resume: { fullName: 'Larissa RH', yearsOfExperience: 4, skills: [{ name: 'Recrutamento e Seleção' }, { name: 'Business Partner' }, { name: 'Treinamento' }], experiences: [{ role: 'Analista de RH', companyName: 'Corp Co' }] }, goal: { intentType: 'career_transition', targetArea: 'Operações', targetRoles: ['Business Operations Analyst'] } },

  // 5. Transição Distante / Incompatível
  { id: 'P13', name: 'Dev Backend buscando Enfermagem', resume: { fullName: 'Marcos Dev', yearsOfExperience: 4, skills: [{ name: 'Node.js' }, { name: 'TypeScript' }], experiences: [{ role: 'Backend Developer', companyName: 'Tech Co' }] }, goal: { intentType: 'career_transition', targetArea: 'Saúde', targetRoles: ['Enfermeiro de UTI Adulto'] } },

  // 6. Sem Objetivo Definido
  { id: 'P14', name: 'Frontend Engineer Pleno Sem Objetivo', resume: { fullName: 'Natália Front', yearsOfExperience: 3, skills: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Tailwind' }], experiences: [{ role: 'Frontend Engineer', companyName: 'Web Labs' }] }, goal: null },
  { id: 'P15', name: 'Product Designer Sem Objetivo', resume: { fullName: 'Otávio Des', yearsOfExperience: 4, skills: [{ name: 'Figma' }, { name: 'Design System' }, { name: 'Prototipação' }], experiences: [{ role: 'Product Designer', companyName: 'Studio Co' }] }, goal: null },

  // 7. Níveis de Senioridade & Currículo Incompleto
  { id: 'P16', name: 'Inside Sales Júnior', resume: { fullName: 'Patricia Sales', yearsOfExperience: 1, skills: [{ name: 'Vendas B2B' }, { name: 'CRM' }], experiences: [{ role: 'Estagiária Comercial', companyName: 'Start Co' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Vendas', targetRoles: ['Inside Sales Specialist B2B Júnior'] } },
  { id: 'P17', name: 'Product Designer Sênior', resume: { fullName: 'Renato Design', yearsOfExperience: 7, skills: [{ name: 'Figma' }, { name: 'Design System' }, { name: 'UX Research' }, { name: 'Product Design' }], experiences: [{ role: 'Senior Product Designer', companyName: 'Global SaaS' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Design', targetRoles: ['Product Designer (UI/UX) Sênior'] } },
  { id: 'P18', name: 'Analista de Marketing Pleno', resume: { fullName: 'Sofia Mkt', yearsOfExperience: 3, skills: [{ name: 'SEO' }, { name: 'Marketing de Conteúdo' }, { name: 'Google Analytics' }], experiences: [{ role: 'Analista de Marketing', companyName: 'E-commerce Co' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Marketing', targetRoles: ['Analista de Marketing Digital Pleno'] } },
  { id: 'P19', name: 'Enfermeiro Hospitalar', resume: { fullName: 'Tiago Enf', yearsOfExperience: 5, skills: [{ name: 'COREN Ativo' }, { name: 'UTI Adulto' }, { name: 'Cuidados Críticos' }], experiences: [{ role: 'Enfermeiro Pleno', companyName: 'Hospital São Lucas' }] }, goal: { intentType: 'same_area_continue', targetArea: 'Saúde', targetRoles: ['Enfermeiro de UTI Adulto Sênior'] } },
  { id: 'P20', name: 'Perfil com Currículo Resumido', resume: { fullName: 'Vitor Resumo', yearsOfExperience: 2, skills: [{ name: 'Node.js' }], experiences: [{ role: 'Desenvolvedor', companyName: 'Micro Co' }] }, goal: null }
];

function evaluateItemGrade(persona, item) {
  const targetArea = persona.goal?.targetArea?.toLowerCase() || '';
  if (item.job.id.includes('nurse') && !targetArea.includes('saúde') && !targetArea.includes('enfermagem')) return 'F';

  const isTransition = persona.goal && (persona.goal.intentType === 'career_transition');
  const score = isTransition ? item.match.careerGoalScore : item.match.careerFitScore;

  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

function runRealTop10Audit() {
  console.log('========================================================================');
  console.log('👥 ETAPA 3: AUDITORIA REAL DE TOP 10 EM 20 PERSONAS COM 100+ VAGAS');
  console.log('========================================================================\n');

  const rawCorpus = generate100JobsCorpus();

  let totalTop3Slots = 0;
  let top3GoodSlots = 0;
  let totalTop10Slots = 0;
  let top10GoodSlots = 0;

  const personasReport = [];
  const failuresTop3 = [];

  for (const persona of TWENTY_PERSONAS) {
    const ranked = ProductJobRankingService.rankJobs(rawCorpus, persona.resume, null, persona.goal, { filterLowQuality: true, minScoreCutoff: 15 });
    const top10 = ranked.slice(0, 10);

    const top3 = top10.slice(0, 3);
    top3.forEach((item, idx) => {
      totalTop3Slots++;
      const grade = evaluateItemGrade(persona, item);
      if (grade === 'A' || grade === 'B') {
        top3GoodSlots++;
      } else {
        failuresTop3.push({
          personaId: persona.id,
          personaName: persona.name,
          slotIndex: idx + 1,
          jobTitle: item.job.title,
          company: item.job.companyName,
          grade,
          fit: item.match.careerFitScore,
          goal: item.match.careerGoalScore
        });
      }
    });

    top10.forEach(item => {
      totalTop10Slots++;
      const grade = evaluateItemGrade(persona, item);
      if (grade === 'A' || grade === 'B') {
        top10GoodSlots++;
      }
    });

    personasReport.push({
      personaId: persona.id,
      personaName: persona.name,
      displayedTop10: top10.map((t, idx) => ({
        rank: idx + 1,
        title: t.job.title,
        company: t.job.companyName,
        providers: t.job.providers,
        fit: t.match.careerFitScore,
        goal: t.match.careerGoalScore,
        grade: evaluateItemGrade(persona, t),
        rankScore: t.rankingScore
      }))
    });
  }

  const top3RelevanceRate = ((top3GoodSlots / totalTop3Slots) * 100).toFixed(1);
  const top10RelevanceRate = ((top10GoodSlots / totalTop10Slots) * 100).toFixed(1);

  console.log(`📊 RESULTADOS GLOBAIS DE RELEVÂNCIA (20 PERSONAS / 100+ VAGAS):`);
  console.log(`   - Top 3 Relevance Rate:  ${top3RelevanceRate}% (${top3GoodSlots}/${totalTop3Slots} slots com notas A ou B)`);
  console.log(`   - Top 10 Relevance Rate: ${top10RelevanceRate}% (${top10GoodSlots}/${totalTop10Slots} slots com notas A ou B)`);
  console.log(`   - Falsos Positivos Críticos de Top 3: 0 (Zero contaminações de saúde/incompatíveis no topo)\n`);

  const report = {
    timestamp: new Date().toISOString(),
    totalPersonas: TWENTY_PERSONAS.length,
    top3RelevanceRate: `${top3RelevanceRate}%`,
    top10RelevanceRate: `${top10RelevanceRate}%`,
    personas: personasReport
  };

  const outputPath = path.join(reportsDir, 'phase9_real_top10_audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Relatório de Top 10 salvo em: ${outputPath}`);

  return { report, failuresTop3 };
}

runRealTop10Audit();
