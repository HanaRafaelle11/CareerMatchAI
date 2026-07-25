import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Suite', () => {
  test('deve carregar a landing page com título e hero legíveis sem quebras', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vocentro/);

    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();

    const heroParagraph = page.locator('p').first();
    await expect(heroParagraph).toBeVisible();
  });

  test('deve interagir com o acordeão de FAQ expandindo as respostas', async ({ page }) => {
    await page.goto('/');
    const faqButton = page.locator('button', { hasText: 'Meus dados ficam seguros?' }).first();
    if (await faqButton.isVisible()) {
      await faqButton.click();
      await expect(page.locator('text=LGPD')).toBeVisible();
    }
  });
});
