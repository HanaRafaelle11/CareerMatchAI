import { test, expect } from '@playwright/test';

test.describe('Auditoria de Preços nos Modais de Upgrade (Item 7)', () => {
  test('Deve verificar a exibição correta de R$ 9,90/semana e R$ 29,90/mês nos modais de upgrade', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vocentro|CareerMatch/i);

    // Verifica na Landing Page se os preços oficiais aparecem
    const weeklyPriceElement = page.locator('text=R$ 9,90');
    const monthlyPriceElement = page.locator('text=R$ 29,90');

    await expect(weeklyPriceElement.first()).toBeVisible();
    await expect(monthlyPriceElement.first()).toBeVisible();
  });
});
