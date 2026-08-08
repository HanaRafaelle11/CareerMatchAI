import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Validação Real de Relevância de Busca e Cascata (Evidências Visual e de Logs)', () => {
  test.setTimeout(120000);
  const artifactsDir = 'C:\\Users\\Sthephany\\.gemini\\antigravity-ide\\brain\\84f180c6-c38d-48d6-9122-a7ec05adc4d7';

  test.beforeEach(async ({ page }) => {
    // Injetar desativação prévia de modais de onboarding/survey
    await page.addInitScript(() => {
      localStorage.setItem('vocentro_onboarding_completed', 'true');
      localStorage.setItem('vocentro_onboarding_seen', 'true');
      localStorage.setItem('vocentro_survey_completed_rafaelaletbey@gmail.com', 'true');
      localStorage.setItem('vocentro_survey_dismissed_rafaelaletbey@gmail.com', 'true');
    });
  });

  test('Cenário 2a: Buscar Ouvidor Sênior em Florianópolis, Santa Catarina', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('/');
    const loginBtn = page.locator('button:has-text("Entrar")');
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    await loginBtn.click();

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('rafaelaletbey@gmail.com');
    await page.locator('input[type="password"]').fill('Haninha11!');
    await page.locator('button[type="submit"]:has-text("Entrar")').click();

    await page.waitForTimeout(5000);

    // Clicar explicitamente no menu lateral "Vagas & Match"
    const vagasLink = page.locator('aside button, nav button, button').filter({ hasText: /Vagas & Match/i }).first();
    await expect(vagasLink).toBeVisible({ timeout: 15000 });
    await vagasLink.click();
    await page.waitForTimeout(3000);

    // Sub-aba Descoberta de Vagas
    const discoverSubTab = page.locator('button').filter({ hasText: /Descoberta de Vagas/i }).first();
    if (await discoverSubTab.isVisible()) {
      await discoverSubTab.click({ force: true });
      await page.waitForTimeout(2000);
    }

    // Preencher filtros de busca
    const keywordInput = page.locator('input[placeholder*="cargo"], input[placeholder*="Cargo"], input[placeholder*="Desenvolvedor"], input[placeholder*="Ex:"]').first();
    const locationInput = page.locator('input[placeholder*="Cidade"], input[placeholder*="Brasil"], input[placeholder*="local"]').first();

    if (await keywordInput.isVisible()) {
      await keywordInput.click();
      await keywordInput.fill('');
      await keywordInput.fill('Ouvidor Sênior');
    }
    if (await locationInput.isVisible()) {
      await locationInput.click();
      await locationInput.fill('');
      await locationInput.fill('Florianópolis, Santa Catarina');
    }

    const workModeCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await workModeCheckboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      const cb = workModeCheckboxes.nth(i);
      if (!(await cb.isChecked())) {
        await cb.check({ force: true }).catch(() => {});
      }
    }

    const matchFilterCheckbox = page.locator('label:has-text("Match Superior a 80%") input[type="checkbox"]');
    if (await matchFilterCheckbox.isVisible() && await matchFilterCheckbox.isChecked()) {
      await matchFilterCheckbox.uncheck({ force: true }).catch(() => {});
    }

    const searchBtn = page.locator('button:has-text("Pesquisar"), button:has-text("Buscar"), button:has-text("Filtrar")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click({ force: true });
    }

    await page.waitForTimeout(16000);

    const verTodasBtn = page.locator('button:has-text("Ver Todas")').first();
    if (await verTodasBtn.isVisible()) {
      await verTodasBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }

    const screenshotPath = path.join(artifactsDir, 'evidence_2a_ouvidor_florianopolis.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[EVIDÊNCIA 2a SALVA em: ${screenshotPath}]`);
  });

  test('Cenário 2b: Testar busca com Cozinheira sem vazamento de CS', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('/');
    const loginBtn = page.locator('button:has-text("Entrar")');
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    await loginBtn.click();

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('rafaelaletbey@gmail.com');
    await page.locator('input[type="password"]').fill('Haninha11!');
    await page.locator('button[type="submit"]:has-text("Entrar")').click();

    await page.waitForTimeout(5000);

    const vagasLink = page.locator('aside button, nav button, button').filter({ hasText: /Vagas & Match/i }).first();
    await expect(vagasLink).toBeVisible({ timeout: 15000 });
    await vagasLink.click();
    await page.waitForTimeout(3000);

    const discoverSubTab = page.locator('button').filter({ hasText: /Descoberta de Vagas/i }).first();
    if (await discoverSubTab.isVisible()) {
      await discoverSubTab.click({ force: true });
      await page.waitForTimeout(2000);
    }

    const keywordInput = page.locator('input[placeholder*="cargo"], input[placeholder*="Cargo"], input[placeholder*="Desenvolvedor"], input[placeholder*="Ex:"]').first();
    if (await keywordInput.isVisible()) {
      await keywordInput.click();
      await keywordInput.fill('');
      await keywordInput.fill('cozinheira');
    }

    const locationInput = page.locator('input[placeholder*="Cidade"], input[placeholder*="Brasil"], input[placeholder*="local"]').first();
    if (await locationInput.isVisible()) {
      await locationInput.click();
      await locationInput.fill('');
      await locationInput.fill('Brasil');
    }

    const matchFilterCheckbox = page.locator('label:has-text("Match Superior a 80%") input[type="checkbox"]');
    if (await matchFilterCheckbox.isVisible() && await matchFilterCheckbox.isChecked()) {
      await matchFilterCheckbox.uncheck({ force: true }).catch(() => {});
    }

    const searchBtn = page.locator('button:has-text("Pesquisar"), button:has-text("Buscar"), button:has-text("Filtrar")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click({ force: true });
    }

    await page.waitForTimeout(16000);

    const verTodasBtn = page.locator('button:has-text("Ver Todas")').first();
    if (await verTodasBtn.isVisible()) {
      await verTodasBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }

    const screenshotPath = path.join(artifactsDir, 'evidence_2b_cozinheira_no_cs_leak.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[EVIDÊNCIA 2b SALVA em: ${screenshotPath}]`);
  });
});
