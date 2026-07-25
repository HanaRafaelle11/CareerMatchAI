import { test, expect } from '@playwright/test';

test.describe('Regressão Visual & Snapshots Playwright', () => {
  test('Landing Page snapshot visual no desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ocultar elementos dinâmicos se houver
    await expect(page).toHaveScreenshot('landing-desktop.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: false
    });
  });

  test('Dashboard snapshot visual', async ({ page }) => {
    await page.goto('/');
    const dashBtn = page.locator('button', { hasText: 'Meu Copiloto' }).first();
    if (await dashBtn.isVisible()) {
      await dashBtn.click();
    }
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: false
    });
  });
});
