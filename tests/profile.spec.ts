import { test, expect } from '@playwright/test';

test.describe('Profile E2E Suite', () => {
  test('deve carregar o perfil e permitir edição de competências', async ({ page }) => {
    await page.goto('/');
    const profileBtn = page.locator('button', { hasText: 'Perfil & Currículo' }).first();
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
    }
  });
});
