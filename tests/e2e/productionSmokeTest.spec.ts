import { test, expect } from '@playwright/test';

/**
 * Production Smoke Test — VoCentro / CareerMatchAI
 * Validates live product availability, core routes, and user journey P0 endpoints.
 */
test.describe('Production Smoke Test — VoCentro', () => {
  const targetUrl = process.env.BASE_URL || 'https://vocentro.com.br';

  test('1. Validação de Disponibilidade HTTP e Título da Plataforma', async ({ page }) => {
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify brand title or header
    await expect(page).toHaveTitle(/VoCentro|CareerMatchAI/i);
  });

  test('2. Validação da Rota de Login / Autenticação', async ({ page }) => {
    await page.goto(`${targetUrl}/login`, { waitUntil: 'domcontentloaded' });
    
    // Check if login inputs or heading exist
    const heading = page.locator('h1, h2, form').first();
    await expect(heading).toBeVisible();
  });

  test('3. Validação dos Termos de Uso e Política de Privacidade (Links Públicos P0)', async ({ page }) => {
    const termsRes = await page.goto(`${targetUrl}/termos-de-uso`, { waitUntil: 'domcontentloaded' });
    expect(termsRes?.status()).toBe(200);

    const privacyRes = await page.goto(`${targetUrl}/politica-de-privacidade`, { waitUntil: 'domcontentloaded' });
    expect(privacyRes?.status()).toBe(200);
  });
});
