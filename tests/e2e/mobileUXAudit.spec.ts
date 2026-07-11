// tests/e2e/mobileUXAudit.spec.ts
import { test, expect } from '@playwright/test';

async function ensureAuthenticated(page: any) {
  await page.goto('/');
  const emailInput = page.locator('input[type="email"]');
  const dashboard = page.locator('text=Goal Tracker');
  
  await expect(emailInput.or(dashboard).first()).toBeVisible({ timeout: 15000 });

  if (await emailInput.isVisible()) {
    await emailInput.fill('hardening.e2e@example.com');
    await page.locator('input[type="password"]').fill('HardeningE2EPassword123!');
    await page.locator('button[type="submit"]').click();
    
    try {
      await expect(dashboard.first()).toBeVisible({ timeout: 12000 });
      return;
    } catch (e) {
      console.log("Primeira tentativa de login falhou ou demorou. Recarregando e tentando novamente...");
    }

    await page.goto('/');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('hardening.e2e@example.com');
    await page.locator('input[type="password"]').fill('HardeningE2EPassword123!');
    await page.locator('button[type="submit"]').click();

    try {
      await expect(dashboard.first()).toBeVisible({ timeout: 12000 });
      return;
    } catch (e) {
      console.log("Segunda tentativa de login falhou. Tentando cadastro...");
    }

    const signUpToggle = page.locator('button:has-text("Cadastre-se agora")');
    if (await signUpToggle.isVisible()) {
      await signUpToggle.click();
      await page.locator('input[placeholder="João da Silva"]').fill('Candidato E2E Hardening');
      await page.locator('input[type="email"]').fill('hardening.e2e@example.com');
      await page.locator('input[placeholder="••••••••"]').first().fill('HardeningE2EPassword123!');
      await page.locator('input[placeholder="••••••••"]').last().fill('HardeningE2EPassword123!');
      await page.locator('button[type="submit"]:has-text("Cadastrar")').click();
    }
    
    await expect(dashboard.first()).toBeVisible({ timeout: 15000 });
  }
}

async function navigateSidebar(page: any, tabLabel: string) {
  let actualLabel = tabLabel;
  if (tabLabel === 'Currículo') actualLabel = 'Meu Perfil';
  if (tabLabel === 'Compatibilidade') actualLabel = 'Encontrar Vagas';
  
  const tabButton = page.locator(`aside button:has-text("${actualLabel}"), nav button:has-text("${actualLabel}")`).filter({ visible: true }).first();
  await expect(tabButton).toBeVisible({ timeout: 10000 });
  await tabButton.click();
}

async function runMobileUXAudit(page: any, width: number) {
  // Ir para a página de perfil / currículo
  await navigateSidebar(page, "Currículo");
  
  // Verificar se a seção do dropzone cabe na tela
  const dropzone = page.locator('div[class*="border-2"][class*="border-dashed"]').first();
  if (await dropzone.isVisible()) {
    const box = await dropzone.boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(width);
    }
  }

  // Ir para o Match Manual / Job Match Hub
  await navigateSidebar(page, "Compatibilidade");
  
  // Verificar se a área principal cabe na tela
  const mainContainer = page.locator('main').first();
  await expect(mainContainer).toBeVisible();
  
  const mainBox = await mainContainer.boundingBox();
  if (mainBox) {
    expect(mainBox.width).toBeLessThanOrEqual(width);
  }
}

test.describe('Sprint final QA mobile responsiveness viewport tests', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('Responsive check on active viewport', async ({ page }) => {
    const initialViewport = page.viewportSize();
    const isMobileProject = initialViewport && initialViewport.width < 500;

    if (isMobileProject) {
      // Em projetos mobile (iPhone SE, Pixel 5), usar o viewport nativo do emulador
      await runMobileUXAudit(page, initialViewport.width);
    } else {
      // Em projetos desktop (Chromium), simular as 3 larguras exigidas (320px, 375px, 414px)
      const widths = [320, 375, 414];
      for (const w of widths) {
        await page.setViewportSize({ width: w, height: 568 });
        await runMobileUXAudit(page, w);
      }
    }
  });
});
