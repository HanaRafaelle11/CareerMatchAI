import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/e09a8bb6-d60a-4ef0-b498-8a675e179afb';
const BASE_URL = 'http://localhost:5173';

const TEST_USER = {
  id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
  email: 'admin@vocentro.com.br',
  name: 'Victor QA - Validação E2E'
};

const weekStart = new Date();
const day = weekStart.getDay();
const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
weekStart.setDate(diff);
const weekStartStr = weekStart.toISOString().split('T')[0];

const JOB_1 = {
  id: 'job-tech-lead-54',
  companyId: 'manual',
  companyName: 'Fintech Inovação',
  title: 'Tech Lead Full Stack',
  description: 'Liderança técnica de squad ágil, arquitetura de microsserviços Node.js e frontend moderno em React.',
  requirements: ['React', 'Node.js', 'TypeScript', 'Docker', 'AWS'],
  location: 'São Paulo, SP',
  workMode: 'hybrid',
  seniority: 'lead',
  currency: 'BRL',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const JOB_2 = {
  id: 'job-senior-react-88',
  companyId: 'manual',
  companyName: 'TechCorp Brasil',
  title: 'Senior React & Node Engineer',
  description: 'Desenvolvimento de aplicações web de alta escala com React, TypeScript e TailwindCSS.',
  requirements: ['React', 'TypeScript', 'TailwindCSS'],
  location: 'Remoto',
  workMode: 'remote',
  seniority: 'senior',
  currency: 'BRL',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const JOB_3 = {
  id: 'job-frontend-architect-62',
  companyId: 'manual',
  companyName: 'Startup ScaleUp',
  title: 'Staff Frontend Architect',
  description: 'Definição de padrões de arquitetura frontend, design system e governança técnica.',
  requirements: ['Design System', 'Microfrontend', 'Next.js'],
  location: 'São Paulo, SP',
  workMode: 'onsite',
  seniority: 'lead',
  currency: 'BRL',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const RESUME = {
  id: 'res-victor-qa',
  userId: TEST_USER.id,
  resumeVersionId: 'ver-victor-qa',
  title: 'Currículo Tech Lead Full Stack',
  fileName: 'Curriculo_Victor_TechLead.pdf',
  isPrimary: true,
  headline: 'Tech Lead Full Stack | React | Node.js | TypeScript',
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  summary: 'Profissional com mais de 8 anos liderando engenharia de software e arquiteturas escaláveis.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const MATCH_1 = {
  id: 'match-1',
  userId: TEST_USER.id,
  resumeId: RESUME.id,
  jobId: JOB_1.id,
  jobTitle: JOB_1.title,
  companyName: JOB_1.companyName,
  scoreOverall: 54,
  scoreTechnical: 55,
  scoreBehavioral: 60,
  scoreSeniority: 65,
  scoreLocation: 100,
  explanation: 'Aderência moderada. Recomenda-se destacar liderança técnica.',
  createdAt: new Date().toISOString()
};

const MATCH_2 = {
  id: 'match-2',
  userId: TEST_USER.id,
  resumeId: RESUME.id,
  jobId: JOB_2.id,
  jobTitle: JOB_2.title,
  companyName: JOB_2.companyName,
  scoreOverall: 88,
  scoreTechnical: 90,
  scoreBehavioral: 85,
  scoreSeniority: 90,
  scoreLocation: 100,
  explanation: 'Excelente compatibilidade técnica.',
  createdAt: new Date().toISOString()
};

const MATCH_3 = {
  id: 'match-3',
  userId: TEST_USER.id,
  resumeId: RESUME.id,
  jobId: JOB_3.id,
  jobTitle: JOB_3.title,
  companyName: JOB_3.companyName,
  scoreOverall: 62,
  scoreTechnical: 65,
  scoreBehavioral: 70,
  scoreSeniority: 70,
  scoreLocation: 100,
  explanation: 'Compatibilidade boa para frontend.',
  createdAt: new Date().toISOString()
};

const EXPLANATION_1 = {
  id: 'exp-1',
  userId: TEST_USER.id,
  jobId: JOB_1.id,
  resumeVersionId: RESUME.resumeVersionId,
  overallMatchReason: 'Compatibilidade moderada com a liderança técnica exigida.',
  strengths: ['Experiência sólida em React e TypeScript', 'Conhecimento em Docker e AWS'],
  gaps: [{ skill: 'GraphQL', reason: 'Requisito desejável não encontrado no currículo', impact: 'médio' }],
  recommendation: 'Adapte seu currículo com foco em arquitetura de microsserviços e liderança de times ágeis.',
  confidenceScore: 88,
  careerFitScore: 54,
  breakdown: {
    skillsScore: 60,
    experienceScore: 55,
    seniorityScore: 65,
    careerGoalScore: 70,
    salaryScore: 80,
    locationScore: 100,
    semanticScore: 55
  }
};

async function run() {
  console.log("=== INICIANDO CAPTURA LIMPA DE EVIDÊNCIAS (ITENS 3 E 4) ===");
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Injetar estado
  await page.evaluate(({ u, res, j1, j2, j3, m1, m2, m3, exp1, week }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
    localStorage.setItem(`vocentro_is_pro_${u.id}`, 'true');
    localStorage.setItem('theme', 'dark');

    localStorage.setItem('vocentro_profile', JSON.stringify({ id: u.id, fullName: u.name, email: u.email, role: 'admin' }));
    localStorage.setItem('vocentro_resumes', JSON.stringify([res]));
    localStorage.setItem('vocentro_career_resumes', JSON.stringify([res]));
    localStorage.setItem('vocentro_selected_resume', JSON.stringify(res));
    localStorage.setItem('vocentro_jobs', JSON.stringify([j1, j2, j3]));
    localStorage.setItem('vocentro_matches', JSON.stringify([m1, m2, m3]));
    localStorage.setItem('vocentro_job_explanations', JSON.stringify([exp1]));
    localStorage.setItem(`vocentro_unlocked_jobs_${u.id}_${week}`, JSON.stringify([j1.id, j2.id, j3.id]));
  }, { u: TEST_USER, res: RESUME, j1: JOB_1, j2: JOB_2, j3: JOB_3, m1: MATCH_1, m2: MATCH_2, m3: MATCH_3, exp1: EXPLANATION_1, week: weekStartStr });

  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Navegar para Vagas & Match
  const matchNav = page.locator('button:has-text("Vagas & Match"), button:has-text("Vagas"), [data-tab="match"]').first();
  await matchNav.click();
  await page.waitForTimeout(2000);

  // Clicar na aba 'Minhas Análises'
  console.log("Clicando na aba 'Minhas Análises'...");
  const myJobsTab = page.locator('button:has-text("Minhas Análises")').last();
  await myJobsTab.click();
  await page.waitForTimeout(2000);

  // 1. Screenshot ANTES da exclusão (3 vagas ativas)
  console.log("[1] Capturando item4_1_ANTES_minhas_analises_3_vagas.png...");
  const shotAntes = path.join(ARTIFACT_DIR, 'item4_1_ANTES_minhas_analises_3_vagas.png');
  await page.screenshot({ path: shotAntes, fullPage: false });
  console.log(`  📸 Salvo: ${shotAntes}`);

  // 2. Testar clique em 'Melhorar meu Match com IA'
  console.log("[2] Clicando em 'Melhorar meu Match com IA (Otimizar CV)'...");
  const improveBtn = page.locator('button:has-text("Melhorar meu Match com IA (Otimizar CV)"), button:has-text("Otimizar currículo")').first();
  if (await improveBtn.count() > 0) {
    await improveBtn.click();
    await page.waitForTimeout(2500);

    const shotItem3 = path.join(ARTIFACT_DIR, 'item3_click_real_otimizar_cv_fired.png');
    await page.screenshot({ path: shotItem3, fullPage: false });
    console.log(`  📸 Salvo: ${shotItem3}`);
  }

    // 3. Excluir vaga para a Lixeira
    console.log("[3] Rolando para o topo e excluindo a 3ª vaga da lista para a Lixeira...");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const trashBtns = page.locator('button[title*="Lixeira"]');
    const countTrash = await trashBtns.count();
    console.log(`  Botões de Lixeira encontrados: ${countTrash}`);

    if (countTrash > 0) {
      await trashBtns.last().click();
      await page.waitForTimeout(1500);

      const shotDepois = path.join(ARTIFACT_DIR, 'item4_2_DEPOIS_minhas_analises_removida.png');
      await page.screenshot({ path: shotDepois, fullPage: false });
      console.log(`  📸 Salvo: ${shotDepois}`);

      // Clicar na aba Lixeira
      const trashTab = page.locator('button:has-text("Lixeira de Vagas")').first();
      if (await trashTab.count() > 0) {
        await trashTab.click();
        await page.waitForTimeout(1500);

        const shotLixeira = path.join(ARTIFACT_DIR, 'item4_3_LIXEIRA_vaga_presente.png');
        await page.screenshot({ path: shotLixeira, fullPage: false });
        console.log(`  📸 Salvo: ${shotLixeira}`);
      }
    }

  await ctx.close();
  await browser.close();
  console.log("=== FINALIZADO COM SUCESSO ===");
}

run().catch(console.error);
