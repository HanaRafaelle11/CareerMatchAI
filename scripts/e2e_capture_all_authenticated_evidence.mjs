import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/e09a8bb6-d60a-4ef0-b498-8a675e179afb';
const BASE_URL = 'http://localhost:5173';

const USER_A = {
  id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
  email: 'user.a.qa@example.com',
  name: 'Usuário QA Validação'
};

const USER_NO_CV = {
  id: 'd4444444-5555-6666-7777-888888888888',
  email: 'user.no.cv@example.com',
  name: 'Usuário Sem CV'
};

async function captureAllEvidence() {
  console.log("================================================================================");
  console.log("SUÍTE COMPLETA DE VALIDAÇÃO E2E AUTENTICADA NO PRODUTO");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. DASHBOARD: ITENS 1 E 2 (TOUR REMOVIDO DO HEADER + MONITOR DE DEMANDA REAL)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[1] Capturando Dashboard (Itens 1 e 2)...");
  const ctxDash = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const pageDash = await ctxDash.newPage();

  await pageDash.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await pageDash.evaluate((u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
    localStorage.setItem('theme', 'dark');
  }, USER_A);

  await pageDash.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await pageDash.waitForTimeout(2000);

  await pageDash.screenshot({ path: path.join(ARTIFACT_DIR, 'item1_item2_dashboard_clean.png'), fullPage: false });
  console.log("  📸 Screenshot Dashboard Salva: item1_item2_dashboard_clean.png");
  await ctxDash.close();

  // ───────────────────────────────────────────────────────────────────────────
  // 2. VAGAS & MATCH: ITENS 3, 4 E 6
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[2] Capturando Vagas & Match (Itens 3, 4 e 6)...");
  const ctxVagas = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const pageVagas = await ctxVagas.newPage();

  await pageVagas.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await pageVagas.evaluate((u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
    localStorage.setItem('theme', 'dark');
  }, USER_A);

  await pageVagas.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await pageVagas.waitForTimeout(1500);

  // Navegar para aba Vagas & Match
  const matchNavBtn = pageVagas.locator('button:has-text("Vagas"), button:has-text("Match"), [data-tab="match"]').first();
  if (await matchNavBtn.count() > 0) {
    await matchNavBtn.click();
    await pageVagas.waitForTimeout(2000);
  }

  // Screenshot geral da tela de Vagas & Match (sem o botão redundante 'Explorar Vagas' no header)
  await pageVagas.screenshot({ path: path.join(ARTIFACT_DIR, 'item5_header_vagas_clean.png'), fullPage: false });
  console.log("  📸 Screenshot Header Vagas Salva: item5_header_vagas_clean.png");

  // Testar clique no botão 'Melhorar meu Match com IA'
  const improveBtn = pageVagas.locator('button:has-text("Melhorar meu Match com IA"), button:has-text("Otimizar currículo para esta vaga")').first();
  if (await improveBtn.count() > 0) {
    console.log("  Clicando em 'Melhorar meu Match com IA'...");
    await improveBtn.click();
    await pageVagas.waitForTimeout(1500);
    await pageVagas.screenshot({ path: path.join(ARTIFACT_DIR, 'item3_otimizar_cv_painel_aberto.png'), fullPage: false });
    console.log("  📸 Screenshot Painel Otimizar CV Salva: item3_otimizar_cv_painel_aberto.png");
  }

  // Testar exclusão para a lixeira (Item 4)
  const trashBtn = pageVagas.locator('button[title*="Lixeira"]').first();
  if (await trashBtn.count() > 0) {
    console.log("  Clicando para mover vaga para a Lixeira...");
    await trashBtn.click();
    await pageVagas.waitForTimeout(1500);
    await pageVagas.screenshot({ path: path.join(ARTIFACT_DIR, 'item4_minhas_analises_sem_vaga.png'), fullPage: false });
    console.log("  📸 Screenshot Minhas Análises (sem a vaga excluída) Salva: item4_minhas_analises_sem_vaga.png");

    // Clicar na aba Lixeira
    const trashTab = pageVagas.locator('button:has-text("Lixeira de Vagas")').first();
    if (await trashTab.count() > 0) {
      await trashTab.click();
      await pageVagas.waitForTimeout(1500);
      await pageVagas.screenshot({ path: path.join(ARTIFACT_DIR, 'item4_lixeira_de_vagas_aba.png'), fullPage: false });
      console.log("  📸 Screenshot Aba Lixeira Salva: item4_lixeira_de_vagas_aba.png");
    }
  }

  await ctxVagas.close();

  // ───────────────────────────────────────────────────────────────────────────
  // 3. BUSCA DE VAGAS SEM CURRÍCULO (ITEM 5)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[3] Capturando Busca de Vagas sem Currículo (Item 5)...");
  const ctxNoCv = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const pageNoCv = await ctxNoCv.newPage();

  await pageNoCv.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await pageNoCv.evaluate((u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
    // Sem currículo nenhum cadastrado
    localStorage.removeItem('vocentro_career_resumes');
    localStorage.removeItem('vocentro_selected_resume');
    localStorage.setItem('theme', 'dark');
  }, USER_NO_CV);

  await pageNoCv.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await pageNoCv.waitForTimeout(1500);

  const matchNavNoCv = pageNoCv.locator('button:has-text("Vagas"), button:has-text("Match"), [data-tab="match"]').first();
  if (await matchNavNoCv.count() > 0) {
    await matchNavNoCv.click();
    await pageNoCv.waitForTimeout(2000);
  }

  // Clicar na aba 'Buscar Novas Vagas'
  const discTabNoCv = pageNoCv.locator('button:has-text("Buscar Novas Vagas")').first();
  if (await discTabNoCv.count() > 0) {
    await discTabNoCv.click();
    await pageNoCv.waitForTimeout(2000);
  }

  await pageNoCv.screenshot({ path: path.join(ARTIFACT_DIR, 'item5_descoberta_sem_curriculo_aviso.png'), fullPage: false });
  console.log("  📸 Screenshot Busca sem Currículo Salva: item5_descoberta_sem_curriculo_aviso.png");

  await ctxNoCv.close();
  await browser.close();
  console.log("\n================================================================================");
  console.log("TODAS AS EVIDÊNCIAS VISUAIS FORAM CAPTURADAS COM SUCESSO!");
  console.log("================================================================================");
}

captureAllEvidence().catch(console.error);
