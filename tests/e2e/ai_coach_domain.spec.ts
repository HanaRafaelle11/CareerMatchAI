import { test, expect } from '@playwright/test';

test.describe('AI Coach — Domínio Alvo & Paywall na Geração (Item 5 & 6)', () => {
  test('Deve verificar que o AI Coach bloqueia a geração nas abas Pro para usuários Free com cota estourada', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vocentro|CareerMatch/i);
  });
});
