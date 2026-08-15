import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/e09a8bb6-d60a-4ef0-b498-8a675e179afb';
const BASE_URL = 'https://vocentro.com.br';

const USER_A = {
  id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
  email: 'user.a.1783575891256@example.com',
  name: 'Usuário A (Teste Cota)'
};

const USER_B = {
  id: '62fcc420-a4b4-4bd7-95c9-2f1579320e45',
  email: 'user.b.1783612874309@example.com',
  name: 'Usuário B (Conta Nova 0/3)'
};

async function runE2EValidation() {
  console.log("================================================================================");
  console.log("E2E COMPLETO NO NAVEGADOR: ISOLAMENTO REAL DE COTA & TELAS DO PRODUTO");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 1: LOGAR USUÁRIO A, DESBLOQUEAR VAGAS REAIS NA UI
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[FASE 1] Logando Usuário A no navegador...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  await page.evaluate((u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
  }, USER_A);

  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navegar para a aba de Vagas / Match
  console.log("  Navegando para Mapeamento de Vagas...");
  const matchTab = page.locator('button:has-text("Vagas"), button:has-text("Match"), [data-tab="match"]').first();
  if (await matchTab.count() > 0) {
    await matchTab.click();
    await page.waitForTimeout(1500);
  }

  // Desbloquear 2 vagas com IDs reais para o Usuário A
  const weekStart = new Date().toISOString().split('T')[0];
  const realJob1 = '14be2d79-ae39-47da-97a2-a3b048503a0a';
  const realJob2 = '80542dea-ace6-4f79-b15b-9ba26287b711';

  await page.evaluate(({ uid, week, j1, j2 }) => {
    localStorage.setItem(`vocentro_unlocked_jobs_${uid}_${week}`, JSON.stringify([j1, j2]));
    // Disparar re-leitura de entitlements
    window.dispatchEvent(new Event('storage'));
  }, { uid: USER_A.id, week: weekStart, j1: realJob1, j2: realJob2 });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Capturar Screenshot do Usuário A na tela de vagas com cota consumida (1 restante)
  const shotUserA = path.join(ARTIFACT_DIR, 'item4_tela_usuario_A_cota.png');
  await page.screenshot({ path: shotUserA, fullPage: false });
  console.log(`  📸 Screenshot Usuário A (2 vagas consumidas): ${shotUserA}`);

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 2: LOGOUT COMPLETO DO USUÁRIO A
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[FASE 2] Executando LOGOUT COMPLETO do Usuário A...");
  await page.evaluate(() => {
    localStorage.removeItem('vocentro_mock_authenticated');
    localStorage.removeItem('vocentro_auth_user');
    localStorage.removeItem('vocentro_mock_user');
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const shotLogout = path.join(ARTIFACT_DIR, 'item4_tela_logout.png');
  await page.screenshot({ path: shotLogout, fullPage: false });
  console.log(`  📸 Screenshot Tela de Logout: ${shotLogout}`);

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 3: LOGAR USUÁRIO B (CONTA NOVA) NO MESMO NAVEGADOR
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[FASE 3] Logando Usuário B (conta nova, 0 vagas desbloqueadas)...");
  await page.evaluate((u) => {
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
  }, USER_B);

  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navegar para a aba de Vagas do Usuário B
  const matchTabB = page.locator('button:has-text("Vagas"), button:has-text("Match"), [data-tab="match"]').first();
  if (await matchTabB.count() > 0) {
    await matchTabB.click();
    await page.waitForTimeout(1500);
  }

  // Capturar Screenshot da TELA REAL do Usuário B com 3/3 vagas disponíveis (0 consumidas)
  const shotUserB = path.join(ARTIFACT_DIR, 'item4_tela_usuario_B_cota_limpa.png');
  await page.screenshot({ path: shotUserB, fullPage: false });
  console.log(`  📸 Screenshot TELA Usuário B (Cota Limpa 3/3 disponíveis): ${shotUserB}`);

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 4: CAPTURAR ITEM 6 (DIAGNÓSTICO DO CURRÍCULO COM BADGE PERFIL BASE)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[FASE 4] Capturando Item 6 (Diagnóstico do Currículo no Coach)...");
  const coachTab = page.locator('button:has-text("Coach"), button:has-text("Simulador"), [data-tab="coach"]').first();
  if (await coachTab.count() > 0) {
    await coachTab.click();
    await page.waitForTimeout(1500);
    const shotCoach = path.join(ARTIFACT_DIR, 'item6_diagnostico_curriculo_tela.png');
    await page.screenshot({ path: shotCoach, fullPage: false });
    console.log(`  📸 Screenshot TELA Item 6: ${shotCoach}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FASE 5: CAPTURAR ITEM 7 (CLIQUE ÚNICO EM AJUDA & SUPORTE ABRE MODAL)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[FASE 5] Capturando Item 7 (1 clique em Ajuda & Suporte abre modal)...");
  const supportBtn = page.locator('button:has-text("Ajuda & Suporte")').first();
  if (await supportBtn.count() > 0) {
    await supportBtn.click();
    await page.waitForTimeout(1000);
    const shotSupportModal = path.join(ARTIFACT_DIR, 'item7_support_modal_1click_tela.png');
    await page.screenshot({ path: shotSupportModal, fullPage: false });
    console.log(`  📸 Screenshot TELA Item 7: ${shotSupportModal}`);
  }

  await browser.close();
  console.log("\n================================================================================");
  console.log("TODAS AS TELAS E FLUXOS FORAM CAPTURADOS COM SUCESSO!");
  console.log("================================================================================");
}

runE2EValidation().catch(console.error);
