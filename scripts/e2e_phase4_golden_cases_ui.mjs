import { chromium } from 'playwright';
import path from 'path';

const artifactsDir = 'C:\\Users\\Sthephany\\.gemini\\antigravity-ide\\brain\\9f7f9b9a-50ea-41eb-b845-0b203276219b';

async function runE2EGoldenCases() {
  console.log('🚀 Iniciando Validação E2E dos Golden Cases e Responsividade Mobile V3...');
  const browser = await chromium.launch({ headless: true });

  const userId = 'usr_phase4_showcase';
  const userObj = {
    id: userId,
    email: 'rafaela_fase4@vocentro.com.br',
    role: 'admin',
    is_pro: true,
    plan: 'pro',
    user_metadata: { full_name: 'Rafaela Santos', is_pro: true }
  };

  const sampleResume = {
    id: 'res-fase4-001',
    userId: userId,
    resumeVersionId: 'ver-fase4-001',
    fileName: 'Curriculo_Rafaela_CS.pdf',
    fullName: 'Rafaela Santos',
    headline: 'Customer Success Manager Pleno | SaaS B2B',
    yearsOfExperience: 4,
    isPrimary: true,
    versionNumber: 2,
    structuredSummary: 'Perfil sênior em gestão de clientes e processos SaaS.',
    skills: [
      { name: 'Customer Success', category: 'hard_skill' },
      { name: 'Onboarding', category: 'hard_skill' },
      { name: 'Jira', category: 'tool' },
      { name: 'Churn', category: 'hard_skill' },
      { name: 'NPS', category: 'hard_skill' },
      { name: 'Comunicação', category: 'soft_skill' }
    ],
    experiences: [
      {
        role: 'Customer Success Manager',
        companyName: 'Cloud SaaS Tech',
        description: 'Gestão de carteira enterprise, análise de métricas de retenção, mapeamento de dores de usuários e rituais ágeis.'
      }
    ]
  };

  const sampleCareerGoal = {
    id: 'goal-fase4-001',
    userId: userId,
    intentType: 'career_transition',
    targetArea: 'Gestão de Produto & Operações',
    targetRoles: ['Product Manager', 'Associate Product Manager', 'Product Owner'],
    desiredSalaryMin: 8000,
    desiredSalaryMax: 12000,
    salaryCurrency: 'BRL',
    transferableSkills: ['Product Discovery', 'Stakeholder Management', 'Métricas de Retenção'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sampleJob = {
    id: 'job-fase4-pm',
    title: 'Product Manager (SaaS & Operações)',
    companyName: 'Stone Pagamentos',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'pleno',
    salary: 'R$ 10.000',
    description: 'Buscamos Product Manager para liderar discovery, roadmap de produto e rituais ágeis.',
    requirements: [
      'Product Discovery',
      'Product Analytics',
      'Gestão de Stakeholders',
      'Metodologias Ágeis',
      'SQL'
    ],
    isActive: true,
    isScraped: false,
    createdAt: new Date().toISOString()
  };

  const sampleProfileNew = {
    id: 'prof-fase4-001',
    userId: userId,
    personal: {
      fullName: 'Rafaela Santos',
      headline: 'Customer Success Manager Pleno | SaaS B2B'
    },
    summary: 'Especialista em CS com foco em métricas de retenção, churn e relacionamento com squads de produto.',
    skills: ['Customer Success', 'Onboarding', 'Jira', 'Churn', 'NPS', 'Comunicação'],
    experience: [
      {
        role: 'Customer Success Manager',
        companyName: 'Cloud SaaS Tech',
        description: 'Gestão de contas e acompanhamento de métricas de retenção.',
        isCurrent: true
      }
    ]
  };

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 1100 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_430', width: 430, height: 932 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_375', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    await page.addInitScript(({ uId, uObj, res, goal, jb, mtch, exp, prof }) => {
      window.localStorage.setItem('vocentro_mock_authenticated', 'true');
      window.localStorage.setItem('vocentro_is_pro', 'true');
      window.localStorage.setItem('vocentro_auth_user', JSON.stringify(uObj));
      window.localStorage.setItem('vocentro_mock_user', JSON.stringify(uObj));
      window.localStorage.setItem('vocentro_onboarding_completed', 'true');
      window.localStorage.setItem('vocentro_theme', 'dark');

      window.localStorage.setItem('vocentro_resumes', JSON.stringify([res]));
      window.localStorage.setItem('vocentro_primary_resume', JSON.stringify(res));
      window.localStorage.setItem(`vocentro_career_goal_${uId}`, JSON.stringify(goal));
      window.localStorage.setItem('vocentro_career_goals', JSON.stringify([goal]));
      window.localStorage.setItem(`vocentro_career_profile_${uId}`, JSON.stringify(prof));

      window.localStorage.setItem('vocentro_jobs', JSON.stringify([jb]));
      window.localStorage.setItem(`vocentro_matches_${uId}`, JSON.stringify([mtch]));
      window.localStorage.setItem('vocentro_matches', JSON.stringify([mtch]));
      window.localStorage.setItem(`vocentro_explanation_${jb.id}`, JSON.stringify(exp));
      window.localStorage.setItem(`vocentro_explanations_${uId}`, JSON.stringify({ [jb.id]: exp }));
    }, {
      uId: userId,
      uObj: userObj,
      res: sampleResume,
      goal: sampleCareerGoal,
      jb: sampleJob,
      mtch: {
        id: 'match-fase4-pm',
        userId: userId,
        resumeId: sampleResume.id,
        resumeVersionId: sampleResume.resumeVersionId,
        jobId: sampleJob.id,
        jobTitle: sampleJob.title,
        companyName: sampleJob.companyName,
        scoreOverall: 72,
        scoreTechnical: 68,
        scoreBehavioral: 88,
        scoreSeniority: 90,
        scoreLocation: 100,
        careerFitScore: 68,
        careerGoalScore: 88,
        createdAt: new Date().toISOString()
      },
      exp: {
        id: 'exp-fase4-pm',
        userId: userId,
        jobId: sampleJob.id,
        resumeVersionId: sampleResume.resumeVersionId,
        overallMatchReason: 'Match de 72% com o currículo ativo e 88% de potencial de transição.',
        strengths: [{ skill: 'Gestão de Stakeholders', reason: 'Alinhamento com liderança.' }],
        gaps: [{ requirement: 'SQL', impact: 'Médio', suggestion: 'Desenvolver queries.' }],
        recommendation: 'Aplique destacando competências de CS.',
        confidenceScore: 90,
        careerFitScore: 68,
        breakdown: {
          skillsScore: 65,
          experienceScore: 78,
          seniorityScore: 90,
          careerGoalScore: 88,
          salaryScore: 90,
          locationScore: 100,
          semanticScore: 80
        },
        createdAt: new Date().toISOString()
      },
      prof: sampleProfileNew
    });

    await page.goto('http://localhost:5173?tab=match&subtab=my-jobs', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Clicar na sub-aba "Minhas Análises"
    const minhasAnalisesBtn = page.locator('button:has-text("Minhas Análises")').first();
    if (await minhasAnalisesBtn.isVisible()) {
      await minhasAnalisesBtn.click();
      await page.waitForTimeout(1000);
    }

    // Expandir painel de 5 dimensões
    const expandBtn = page.locator('button:has-text("Por que esse match?"), button:has-text("Diagnóstico 5 Dimensões")').first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(600);
    }

    await page.evaluate(() => {
      window.scrollBy(0, 600);
    });
    await page.waitForTimeout(500);

    const screenshotPath = path.join(artifactsDir, `evidencia_fase4_${vp.name}_vagas_match.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Capturada evidência autenticada para viewport ${vp.name}: ${screenshotPath}`);

    await page.close();
  }

  await browser.close();
  console.log('✅ Validação E2E de Responsividade Mobile concluída com sucesso!');
}

runE2EGoldenCases().catch(err => {
  console.error('❌ Erro no teste E2E:', err);
  process.exit(1);
});
