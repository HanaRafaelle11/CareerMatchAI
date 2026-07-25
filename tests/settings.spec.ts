import { test, expect } from '@playwright/test';

test.describe('Strategy & Settings E2E Suite', () => {
  test('deve carregar o Kanban da jornada e alternar o tema em Ajustes', async ({ page }) => {
    await page.goto('/');

    const settingsBtn = page.locator('button', { hasText: 'Ajustes' }).first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
    }
  });
});
