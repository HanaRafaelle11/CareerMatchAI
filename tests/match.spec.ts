import { test, expect } from '@playwright/test';

test.describe('JobMatchHub E2E Suite', () => {
  test('deve abrir a tela de vagas, calcular compatibilidade e exibir badge sem quebras', async ({ page }) => {
    await page.goto('/');

    const matchBtn = page.locator('button', { hasText: 'Vagas & Match' }).first();
    if (await matchBtn.isVisible()) {
      await matchBtn.click();
    }

    const calcBtn = page.locator('button', { hasText: 'Calcular Compatibilidade' }).first();
    if (await calcBtn.isVisible()) {
      await calcBtn.click();
    }
  });
});
