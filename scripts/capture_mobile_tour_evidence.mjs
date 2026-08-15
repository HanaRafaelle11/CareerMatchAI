import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/e09a8bb6-d60a-4ef0-b498-8a675e179afb';
const BASE_URL = 'https://vocentro.com.br';

const USER = {
  id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
  email: 'user.a.1783575891256@example.com',
  name: 'Usuário Mobile Test'
};

async function captureMobileTour() {
  console.log("================================================================================");
  console.log("CAPTURANDO EVIDÊNCIAS VISUAIS MOBILE EM PRODUÇÃO (390x844)");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true });
  // Viewport mobile (iPhone 14 / 390x844)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
  }, USER);

  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // ── 1. ABRIR MENU HAMBÚRGUER MOBILE E CAPTURAR O BOTÃO "TOUR DA PLATAFORMA" ──
  console.log("\n[1] Abrindo Menu Lateral Mobile...");
  const menuBtn = page.locator('header button').first();
  await menuBtn.click();
  await page.waitForTimeout(800);

  const shotMobileMenu = path.join(ARTIFACT_DIR, 'mobile_1_menu_drawer_tour.png');
  await page.screenshot({ path: shotMobileMenu, fullPage: false });
  console.log(`  📸 Screenshot 1 (Menu Mobile com Tour): ${shotMobileMenu}`);

  // ── 2. CLICAR NO BOTÃO "TOUR DA PLATAFORMA" E CAPTURAR O TOUR ABERTO NO MOBILE ──
  console.log("\n[2] Clicando em 'Tour da Plataforma' no mobile...");
  const tourBtn = page.locator('button:has-text("Tour da Plataforma")').first();
  await tourBtn.click();
  await page.waitForTimeout(1000);

  const shotMobileTourModal = path.join(ARTIFACT_DIR, 'mobile_2_tour_modal_open.png');
  await page.screenshot({ path: shotMobileTourModal, fullPage: false });
  console.log(`  📸 Screenshot 2 (Tour de Onboarding Aberto no Mobile): ${shotMobileTourModal}`);

  // Fechar tour
  const closeTourBtn = page.locator('div[role="dialog"] button, .fixed.inset-0 button').first();
  if (await closeTourBtn.count() > 0) {
    await closeTourBtn.click();
    await page.waitForTimeout(500);
  }

  // ── 3. NAVEGAR PARA CONFIGURAÇÕES NO MOBILE E CAPTURAR O CARD DE TOUR ──
  console.log("\n[3] Navegando para Configurações no Mobile...");
  const avatarBtn = page.locator('header img, header .rounded-full').first();
  await avatarBtn.click();
  await page.waitForTimeout(1500);

  const shotMobileSettings = path.join(ARTIFACT_DIR, 'mobile_3_settings_tour_card.png');
  await page.screenshot({ path: shotMobileSettings, fullPage: false });
  console.log(`  📸 Screenshot 3 (Configurações Mobile com Card de Tour): ${shotMobileSettings}`);

  await browser.close();
  console.log("\n================================================================================");
  console.log("TODAS AS EVIDÊNCIAS MOBILE CAPTURADAS COM SUCESSO!");
  console.log("================================================================================");
}

captureMobileTour().catch(console.error);
