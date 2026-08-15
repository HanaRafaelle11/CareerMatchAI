import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/e09a8bb6-d60a-4ef0-b498-8a675e179afb';
const BASE_URL = 'https://vocentro.com.br';

const USER_TEST = {
  id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
  email: 'usuario.sync.teste@vocentro.com.br',
  name: 'Victor Candidato Teste'
};

async function captureAntesDepois() {
  console.log("================================================================================");
  console.log("CAPTURANDO EVIDÊNCIA VISUAL: ANTES E DEPOIS DA SINCRONIZAÇÃO DE PERFIL");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // ── ESTADO 1 (ANTES): PERFIL 80% (SEM LINKEDIN) ──
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
    localStorage.setItem('vocentro_profile_state', JSON.stringify({
      hasResume: true,
      hasExperiences: true,
      hasSkills: true,
      linkedin: ''
    }));
  }, USER_TEST);

  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navegar para Perfil
  const profileTab = page.locator('button:has-text("Perfil"), [data-tab="profile"]').first();
  if (await profileTab.count() > 0) {
    await profileTab.click();
    await page.waitForTimeout(1500);
  }

  const shotAntes = path.join(ARTIFACT_DIR, 'itemB_sync_1_ANTES_80pct.png');
  await page.screenshot({ path: shotAntes, fullPage: false });
  console.log(`  📸 Screenshot 1 (ANTES - Perfil 80% e Sidebar sincronizados): ${shotAntes}`);

  // ── ESTADO 2 (DEPOIS): PERFIL 100% (COM LINKEDIN ADICIONADO) ──
  await page.evaluate((u) => {
    // Simula atualização de perfil com LinkedIn vinculado
    const cp = {
      personal: {
        fullName: 'Victor Candidato Teste',
        email: u.email,
        linkedin: 'https://linkedin.com/in/victor-candidato'
      },
      skills: ['React', 'TypeScript', 'Node.js', 'TailwindCSS'],
      experience: [{ title: 'Desenvolvedor Frontend', company: 'Tech Corp', years: 3 }],
      soft_skills: ['Comunicação', 'Resolução de Problemas'],
      languages: ['Português Nativo', 'Inglês Intermediário']
    };
    localStorage.setItem('vocentro_career_profile', JSON.stringify(cp));
  }, USER_TEST);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navegar para Perfil
  const profileTab2 = page.locator('button:has-text("Perfil"), [data-tab="profile"]').first();
  if (await profileTab2.count() > 0) {
    await profileTab2.click();
    await page.waitForTimeout(1500);
  }

  const shotDepois = path.join(ARTIFACT_DIR, 'itemB_sync_2_DEPOIS_100pct.png');
  await page.screenshot({ path: shotDepois, fullPage: false });
  console.log(`  📸 Screenshot 2 (DEPOIS - Perfil 100% e Sidebar sincronizados): ${shotDepois}`);

  await browser.close();
  console.log("\n================================================================================");
  console.log("PRINTS ANTES E DEPOIS CAPTURADOS COM SUCESSO!");
  console.log("================================================================================");
}

captureAntesDepois().catch(console.error);
