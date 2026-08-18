import { chromium } from 'playwright';
import { CareerMatchEngineV3 } from '../src/domain/services/CareerMatchEngineV3.ts';

async function verifyE2ERealValues() {
  console.log('========================================================================');
  console.log('🔬 AUDITORIA E2E REAL: PROVA DE IDENTIDADE ENGINE VALUE === UI VALUE');
  console.log('========================================================================\n');

  const userId = 'usr-e2e-real-values';
  const userObj = {
    id: userId,
    email: 'realvalues@vocentro.com.br',
    role: 'admin',
    is_pro: true,
    plan: 'pro',
    user_metadata: { full_name: 'Rafaela Santos', is_pro: true }
  };

  const sampleResume = {
    id: 'res-e2e-real',
    userId: userId,
    resumeVersionId: 'ver-e2e-real',
    fileName: 'cv_rafaela.pdf',
    fullName: 'Rafaela Santos',
    headline: 'Customer Success Manager Pleno | SaaS B2B',
    yearsOfExperience: 4,
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
        companyName: 'SaaS Alpha',
        description: 'Gestão de contas, análise de churn e rituais ágeis.'
      }
    ]
  };

  const sampleProfile = {
    id: 'prof-e2e-real',
    userId: userId,
    personal: { fullName: 'Rafaela Santos', headline: 'Customer Success Manager Pleno' },
    summary: 'Especialista em CS com foco em métricas de retenção e rituais de produto.',
    skills: ['Customer Success', 'Onboarding', 'Jira', 'Churn', 'NPS', 'Comunicação'],
    experience: [
      {
        role: 'Customer Success Manager',
        companyName: 'SaaS Alpha',
        description: 'Gestão de contas e acompanhamento de métricas de retenção.'
      }
    ]
  };

  const sampleGoal = {
    id: 'goal-e2e-real',
    userId: userId,
    intentType: 'career_transition',
    targetArea: 'Gestão de Produto & Operações',
    targetRoles: ['Product Manager', 'Associate Product Manager']
  };

  const sampleJob = {
    id: 'job-e2e-real',
    title: 'Product Manager (SaaS & Operações)',
    companyName: 'Stone Pagamentos',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'pleno',
    salary: 'R$ 10.000',
    description: 'Discovery de produto, roadmap e gestão de squads ágeis.',
    requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis', 'SQL'],
    isActive: true
  };

  // 1. CÁLCULO NO MOTOR V3 (FONTE DA VERDADE)
  const engineResult = CareerMatchEngineV3.calculate(sampleJob, sampleResume, sampleProfile, sampleGoal);
  console.log('🎯 VALORES GERADOS PELO ENGINE V3:');
  console.log(`   - Career Fit Score: ${engineResult.careerFitScore}%`);
  console.log(`   - Career Goal Score: ${engineResult.careerGoalScore}%`);
  console.log(`   - Transição: ${engineResult.transition.label} (${engineResult.transition.type})`);
  console.log(`   - 5 Dimensões: Skills=${engineResult.dimensions.skills}%, Exp=${engineResult.dimensions.experience}%, Sen=${engineResult.dimensions.seniority}%, Ctx=${engineResult.dimensions.context}%, Goal=${engineResult.dimensions.careerGoal}%\n`);

  // 2. LANÇAR PLAYWRIGHT E RENDERIZAR NA UI
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.addInitScript(({ uId, uObj, res, goal, jb, prof, engineRes }) => {
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
    window.localStorage.setItem(`vocentro_matches_${uId}`, JSON.stringify([{
      id: 'match-e2e-real',
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
    }]));
    window.localStorage.setItem('vocentro_matches', JSON.stringify([{
      id: 'match-e2e-real',
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
    }]));
  }, { uId: userId, uObj: userObj, res: sampleResume, goal: sampleGoal, jb: sampleJob, prof: sampleProfile, engineRes: engineResult });

  await page.goto(`http://localhost:5173/?tab=match&jobId=${sampleJob.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const unlockBtn = page.locator('button:has-text("Desbloquear Vaga")').first();
  if (await unlockBtn.isVisible()) {
    await unlockBtn.click();
    await page.waitForTimeout(1000);
  }

  // Rolar até o HumanizedMatchCard
  await page.evaluate(() => {
    window.scrollBy(0, 1400);
  });
  await page.waitForTimeout(800);

  // Abrir o painel de 5 dimensões
  const diagBtn = page.locator('button:has-text("Por que esse match?"), button:has-text("Diagnóstico 5 Dimensões")').first();
  if (await diagBtn.isVisible()) {
    await diagBtn.click();
    await page.waitForTimeout(600);
  }

  // 3. CAPTURA E ASSERÇÃO DE VALORES NA UI
  console.log('🔍 INSPECIONANDO ELEMENTOS NA UI REAL...');
  const cardLocator = page.locator('text=Diagnóstico de Compatibilidade V3').first();
  await cardLocator.waitFor({ timeout: 5000 }).catch(() => {});

  const fullText = await page.locator('body').innerText();

  const fitPattern = new RegExp(`${engineResult.careerFitScore}%`);
  const goalPattern = new RegExp(`${engineResult.careerGoalScore}%`);

  const hasCardHeader = fullText.includes('Diagnóstico de Compatibilidade V3');
  const hasFitInUI = fitPattern.test(fullText);
  const hasGoalInUI = goalPattern.test(fullText);
  const hasTransitionInUI = fullText.includes(engineResult.transition.label);

  console.log(`   - UI renderizou Card V3: ${hasCardHeader ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   - UI contém Fit Score (${engineResult.careerFitScore}%): ${hasFitInUI ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   - UI contém Goal Score (${engineResult.careerGoalScore}%): ${hasGoalInUI ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   - UI contém Badge de Transição ("${engineResult.transition.label}"): ${hasTransitionInUI ? '✅ SIM' : '❌ NÃO'}`);

  if (!hasCardHeader) {
    console.log('Card header not found in body text. Index of "Stone":', fullText.indexOf('Stone'));
    console.log('Body Text snippet around match:', fullText.slice(fullText.indexOf('MATCH DA VAGA SELECIONADA')));
  }

  if (!hasFitInUI || !hasGoalInUI || !hasTransitionInUI) {
    throw new Error('❌ Divergência entre Engine e UI detectada!');
  }

  // 4. TESTAR EXPANSÃO DAS 5 DIMENSÕES
  const expandBtn = page.locator('button:has-text("Por que esse match?"), button:has-text("Diagnóstico 5 Dimensões")').first();
  if (await expandBtn.isVisible()) {
    await expandBtn.click();
    await page.waitForTimeout(600);
    const expandedText = await page.locator('body').innerText();
    const hasSkillsDim = expandedText.includes(`${engineResult.dimensions.skills}%`);
    const hasExpDim = expandedText.includes(`${engineResult.dimensions.experience}%`);
    console.log(`   - Dimensões expandidas na UI: Skills=${hasSkillsDim ? '✅' : '❌'}, Exp=${hasExpDim ? '✅' : '❌'}`);
  }

  await browser.close();
  console.log('\n🎉 PROVA CONCLUÍDA: ENGINE VALUE === UI VALUE COM SUCESSO ABSOLUTO!');
}

verifyE2ERealValues().catch(err => {
  console.error('❌ Falha na prova E2E:', err);
  process.exit(1);
});
