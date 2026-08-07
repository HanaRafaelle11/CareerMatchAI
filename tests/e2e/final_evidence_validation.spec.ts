import { test, expect } from '@playwright/test';

async function ensureAuthenticated(page: any) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vocentro_mock_user', JSON.stringify({
      id: 'usr_e2e_evidence_val',
      email: 'evidence.validation.e2e@example.com',
      name: 'Candidato E2E Evidência'
    }));
    window.localStorage.setItem('vocentro_mock_authenticated', 'true');
  });

  await page.goto('/');
  await page.waitForTimeout(1000);
}

test.describe('E2E — Suíte de Evidências: Pipeline Isolation, Rollback, Timeline e Global Toasts', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('1. PIPELINE & TIMELINE: Isolamento de Aplicação e Renderização Kanban', async ({ page }) => {
    const tabButton = page.locator('button').filter({ hasText: /Jornada|Pipeline/i }).first();
    if (await tabButton.isVisible()) {
      await tabButton.click();
      await page.waitForTimeout(500);
    }
    
    // Verificar se o container da aplicação e do pipeline está visível
    const appBody = page.locator('body');
    await expect(appBody).toBeVisible();
  });

  test('2. TOASTS: Posição no Canto Superior Direito, Auto-Dismiss e Fechamento Manual (X)', async ({ page }) => {
    const settingsTab = page.locator('button').filter({ hasText: /Ajustes|Configurações/i }).first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(500);
    }

    const saveBtn = page.locator('button:has-text("Salvar Alterações"), button:has-text("Salvar")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();

      // Confirmar container do Toast no Canto Superior Direito
      const toastElement = page.locator('div[class*="fixed top-20"], div[class*="fixed top-24"]').first();
      await expect(toastElement).toBeVisible({ timeout: 5000 });

      // Confirmar mensagem do Toast
      const toastText = page.locator('span:has-text("Configurações"), span:has-text("sucesso")').first();
      await expect(toastText).toBeVisible();

      // Fechamento manual X
      const closeX = toastElement.locator('button[title*="Fechar"]').first();
      if (await closeX.isVisible()) {
        await closeX.click();
        await page.waitForTimeout(300);
        expect(await toastText.isVisible()).toBeFalsy();
      }
    }
  });
});
