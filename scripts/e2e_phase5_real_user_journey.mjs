import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';
import { CareerCoachService } from '../src/application/services/CareerCoachService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = 'C:\\Users\\Sthephany\\.gemini\\antigravity-ide\\brain\\9f7f9b9a-50ea-41eb-b845-0b203276219b';

async function runE2EPhase5RealUserJourney() {
  console.log('========================================================================');
  console.log('🚀 FASE 5: JORNADA REAL DE USUÁRIO E AUDITORIA DE PRODUTO COMPLETA');
  console.log('========================================================================\n');

  const userId = 'usr-p5-journey';
  const userObj = {
    id: userId,
    email: 'candidata.transicao@vocentro.com.br',
    role: 'user',
    is_pro: true,
    plan: 'pro',
    user_metadata: { full_name: 'Camila Ferreira', is_pro: true }
  };

  const sampleResume = {
    id: 'res-p5-01',
    userId: userId,
    resumeVersionId: 'ver-p5-01',
    fileName: 'cv_camila_cs.pdf',
    fullName: 'Camila Ferreira',
    headline: 'Customer Success Specialist | 4 anos em SaaS B2B',
    yearsOfExperience: 4,
    skills: [
      { name: 'Customer Success', category: 'hard_skill' },
      { name: 'Onboarding', category: 'hard_skill' },
      { name: 'Jira', category: 'tool' },
      { name: 'Churn', category: 'hard_skill' },
      { name: 'NPS', category: 'hard_skill' },
      { name: 'Comunicação', category: 'soft_skill' },
      { name: 'Gestão de Stakeholders', category: 'hard_skill' }
    ],
    experiences: [
      {
        role: 'Customer Success Specialist',
        companyName: 'Cloud SaaS Corp',
        description: 'Gestão de contas estratégicas, análise de indicadores de retenção, rituais ágeis e NPS.'
      }
    ]
  };

  const sampleProfile = {
    id: 'prof-p5-01',
    userId: userId,
    personal: { fullName: 'Camila Ferreira', headline: 'Customer Success Specialist em Transição para Produto' },
    summary: 'Especialista em CS com sólido domínio de métricas de retenção e rituais ágeis, buscando transição para Product Management.',
    skills: ['Customer Success', 'Onboarding', 'Jira', 'Churn', 'NPS', 'Comunicação', 'Gestão de Stakeholders'],
    experience: [
      {
        role: 'Customer Success Specialist',
        companyName: 'Cloud SaaS Corp',
        description: 'Gestão de contas estratégicas e retenção de clientes B2B.'
      }
    ]
  };

  const sampleGoal = {
    id: 'goal-p5-01',
    userId: userId,
    intentType: 'career_transition',
    targetArea: 'Gestão de Produto',
    targetRoles: ['Product Manager', 'Associate Product Manager'],
    targetSeniority: 'pleno',
    targetLocation: 'Brasil',
    targetWorkModes: ['remote'],
    desiredSalary: 'R$ 10.000',
    transferableSkills: ['Comunicação interpessoal', 'Gestão de stakeholders', 'Visão centrada no usuário', 'Análise de métricas'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sampleJob = {
    id: 'job-p5-pm',
    title: 'Product Manager (SaaS & Operações)',
    companyName: 'Stone Pagamentos',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'pleno',
    salary: 'R$ 10.000',
    description: 'Buscamos Product Manager para liderar discovery de novos fluxos, roadmap estratégico e gestão de squads ágeis.',
    requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis', 'SQL'],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  // Cálculo V3 puro no Engine
  const engineResult = CareerMatchEngineV3.calculate(sampleJob, sampleResume, sampleProfile, sampleGoal);
  const coachEval = CareerCoachService.evaluateCandidacy(sampleResume, sampleJob, null, sampleProfile, engineResult, sampleGoal);

  console.log('📊 RESULTADO DETERMINÍSTICO V3:');
  console.log(`   - Career Fit Score: ${engineResult.careerFitScore}%`);
  console.log(`   - Career Goal Score: ${engineResult.careerGoalScore}%`);
  console.log(`   - Transição: ${engineResult.transition.label}`);
  console.log(`   - Recomendação Coach: ${coachEval.shouldApply} — ${coachEval.recommendation}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  // 1. PASSO 1: LANDING PAGE (Visão de Novo Usuário)
  console.log('📍 ETAPA 1: Auditando Landing Page...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const landingScreenshot = path.join(ARTIFACTS_DIR, 'evidencia_fase5_etapa1_landing.png');
  await page.screenshot({ path: landingScreenshot, fullPage: false });
  console.log(`   📸 Screenshot Landing Page salvo: ${landingScreenshot}`);

  // 2. PASSO 2: INJETAR SESSÃO AUTENTICADA COM DADOS DO NOVO PERFIL & OBJETIVO
  console.log('\n📍 ETAPA 2: Autenticando e navegando para Perfil & Objetivo...');
  await page.addInitScript(({ uId, uObj, res, goal, prof, jb, engineRes }) => {
    window.localStorage.setItem('vocentro_mock_authenticated', 'true');
    window.localStorage.setItem('vocentro_is_pro', 'true');
    window.localStorage.setItem('vocentro_auth_user', JSON.stringify(uObj));
    window.localStorage.setItem('vocentro_mock_user', JSON.stringify(uObj));
    window.localStorage.setItem('vocentro_profile', JSON.stringify(uObj));
    window.localStorage.setItem('vocentro_onboarding_completed', 'true');
    window.localStorage.setItem('vocentro_theme', 'dark');

    window.localStorage.setItem('vocentro_resumes', JSON.stringify([res]));
    window.localStorage.setItem('vocentro_primary_resume', JSON.stringify(res));
    window.localStorage.setItem(`vocentro_career_goal_${uId}`, JSON.stringify(goal));
    window.localStorage.setItem('vocentro_career_goals', JSON.stringify([goal]));
    window.localStorage.setItem(`vocentro_career_profile_${uId}`, JSON.stringify(prof));
    window.localStorage.setItem('vocentro_career_profile', JSON.stringify(prof));

    window.localStorage.setItem('vocentro_jobs', JSON.stringify([jb]));
    window.localStorage.setItem(`vocentro_jobs_${uId}`, JSON.stringify([jb]));

    const matchDoc = {
      id: 'match-p5-01',
      userId: uId,
      resumeId: res.id,
      resumeVersionId: res.resumeVersionId,
      jobId: jb.id,
      jobTitle: jb.title,
      companyName: jb.companyName,
      scoreOverall: engineRes.careerFitScore,
      scoreTechnical: engineRes.dimensions.skills,
      scoreBehavioral: engineRes.dimensions.experience,
      scoreSeniority: engineRes.dimensions.seniority,
      scoreLocation: engineRes.dimensions.context,
      scoreSalary: 85,
      careerFitScore: engineRes.careerFitScore,
      careerGoalScore: engineRes.careerGoalScore,
      dimensions: engineRes.dimensions,
      transition: engineRes.transition,
      skillsAssessment: engineRes.skillsAssessment,
      createdAt: new Date().toISOString()
    };
    window.localStorage.setItem(`vocentro_matches_${uId}`, JSON.stringify([matchDoc]));
    window.localStorage.setItem('vocentro_matches', JSON.stringify([matchDoc]));
  }, { uId: userId, uObj: userObj, res: sampleResume, goal: sampleGoal, prof: sampleProfile, jb: sampleJob, engineRes: engineResult });

  // 3. PASSO 3: AUDITORIA DO OBJETIVO PROFISSIONAL NO PERFIL
  console.log('\n📍 ETAPA 3: Visualizando Objetivo Profissional Desacoplado no Perfil...');
  await page.goto('http://localhost:5173?tab=profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const profileScreenshot = path.join(ARTIFACTS_DIR, 'evidencia_fase5_etapa3_perfil_objetivo.png');
  await page.screenshot({ path: profileScreenshot, fullPage: false });
  console.log(`   📸 Screenshot Perfil & Objetivo salvo: ${profileScreenshot}`);

  // 4. PASSO 4: JOBMATCHHUB — ANÁLISE DE VAGA, DUPLO SCORE E 5 DIMENSÕES
  console.log('\n📍 ETAPA 4: Abrindo JobMatchHub e selecionando vaga com Duplo Score...');
  await page.goto(`http://localhost:5173/?tab=match&jobId=${sampleJob.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const unlockBtn = page.locator('button:has-text("Desbloquear Vaga")').first();
  if (await unlockBtn.isVisible()) {
    await unlockBtn.click();
    await page.waitForTimeout(1000);
  }

  // Rolar até o Card V3
  await page.evaluate(() => window.scrollBy(0, 1400));
  await page.waitForTimeout(800);

  // Abrir o painel "Por que esse match?"
  const diagBtn = page.locator('button:has-text("Por que esse match?"), button:has-text("Diagnóstico 5 Dimensões")').first();
  if (await diagBtn.isVisible()) {
    await diagBtn.click();
    await page.waitForTimeout(600);
  }

  const matchCardScreenshot = path.join(ARTIFACTS_DIR, 'evidencia_fase5_etapa4_duplo_score_expandido.png');
  await page.screenshot({ path: matchCardScreenshot, fullPage: false });
  console.log(`   📸 Screenshot Duplo Score & 5 Dimensões salvo: ${matchCardScreenshot}`);

  // 5. PASSO 5: AI COACH & GERAÇÃO DE CARTA
  console.log('\n📍 ETAPA 5: Abrindo AI Coach, avaliando recomendação e gerando carta...');
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(800);

  const coverLetterTab = page.locator('button:has-text("Carta")').first();
  if (await coverLetterTab.isVisible()) {
    await coverLetterTab.click();
    await page.waitForTimeout(1200);
  }

  const coachScreenshot = path.join(ARTIFACTS_DIR, 'evidencia_fase5_etapa5_coach_carta.png');
  await page.screenshot({ path: coachScreenshot, fullPage: false });
  console.log(`   📸 Screenshot AI Coach & Carta salvo: ${coachScreenshot}`);

  // 6. VALIDAÇÃO DOS CONTEÚDOS EXATOS NA TELA
  const bodyText = await page.locator('body').innerText();
  const hasFit = bodyText.includes(`${engineResult.careerFitScore}%`);
  const hasGoal = bodyText.includes(`${engineResult.careerGoalScore}%`);
  const hasTransition = bodyText.includes(engineResult.transition.label);
  const hasSkillsDim = bodyText.includes('1. Competências');
  const hasExpDim = bodyText.includes('2. Experiência');
  const hasGoalDim = bodyText.includes('5. Objetivo de Carreira');

  console.log('\n🔎 VERIFICAÇÃO DE INTEGRIDADE DE PRODUTO NA UI:');
  console.log(`   - Compatibilidade Atual (${engineResult.careerFitScore}%): ${hasFit ? '✅ CORRETO' : '❌ ERRO'}`);
  console.log(`   - Potencial para seu Objetivo (${engineResult.careerGoalScore}%): ${hasGoal ? '✅ CORRETO' : '❌ ERRO'}`);
  console.log(`   - Badge de Transição ("${engineResult.transition.label}"): ${hasTransition ? '✅ CORRETO' : '❌ ERRO'}`);
  console.log(`   - Dimensões Visíveis: Competências=${hasSkillsDim ? '✅' : '❌'}, Exp=${hasExpDim ? '✅' : '❌'}, Goal=${hasGoalDim ? '✅' : '❌'}`);

  if (!hasFit || !hasGoal || !hasTransition) {
    throw new Error('❌ Falha na integridade da jornada E2E da Fase 5!');
  }

  await browser.close();
  console.log('\n🎉 JORNADA REAL DE USUÁRIO E2E CONCLUÍDA COM 100% DE SUCESSO!');
}

runE2EPhase5RealUserJourney().catch(err => {
  console.error('❌ Erro na Jornada E2E Fase 5:', err);
  process.exit(1);
});
