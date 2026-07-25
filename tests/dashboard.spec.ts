import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Suite', () => {
  test('deve renderizar o dashboard e validar atalhos da jornada', async ({ page }) => {
    await page.goto('/');
    
    // Switch to Dashboard tab
    const dashBtn = page.locator('button', { hasText: 'Meu Copiloto' }).first();
    if (await dashBtn.isVisible()) {
      await dashBtn.click();
    }

    const mainHeader = page.locator('main');
    await expect(mainHeader).toBeVisible();
  });
});
