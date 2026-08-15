import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/e09a8bb6-d60a-4ef0-b498-8a675e179afb';
const BASE_URL = 'https://vocentro.com.br';

const USER = {
  id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
  email: 'user.a.1783575891256@example.com',
  name: 'Usuário Teste Sincronização'
};

async function captureSyncEvidence() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    deviceScaleFactor: 1
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

  // Navegar para Perfil & Currículo
  const profileTab = page.locator('button:has-text("Perfil"), [data-tab="profile"]').first();
  if (await profileTab.count() > 0) {
    await profileTab.click();
    await page.waitForTimeout(1500);
  }

  const shotSync = path.join(ARTIFACT_DIR, 'itemB_sync_profile_navbar.png');
  await page.screenshot({ path: shotSync, fullPage: false });
  console.log(`  📸 Screenshot Item B (Sincronização Perfil & Sidebar): ${shotSync}`);

  await browser.close();
}

captureSyncEvidence().catch(console.error);
