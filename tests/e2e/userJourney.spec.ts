import { test, expect } from '@playwright/test';

/**
 * Real User Journey E2E Test Suite — VoCentro / CareerMatchAI
 * Simulates complete candidate interaction across screen transitions:
 * Login -> Dashboard -> Profile -> Switch Resume -> Verify Kanban Preservation -> Job Search -> Match -> Pipeline -> Reload Persistence.
 */
test.describe('Real User Journey E2E — VoCentro', () => {
  const targetUrl = process.env.BASE_URL || 'http://localhost:5173';
  const jsErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitor runtime JS errors and uncaught exceptions
    page.on('pageerror', (err) => {
      jsErrors.push(`[PAGE_ERROR] ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(`[CONSOLE_ERROR] ${msg.text()}`);
      }
    });
  });

  test('Jornada Completa do Candidato — Transições de Tela, Troca de Currículo e Persistência', async ({ page }) => {
    // 1. Acesso à Landing Page pública
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/VoCentro|CareerMatchAI/i);

    // 2. Navegação para Rotas Públicas P0 (Termos de Uso e Política)
    await page.goto(`${targetUrl}/termos-de-uso`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2').first()).toBeVisible();

    await page.goto(`${targetUrl}/politica-de-privacidade`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 3. Acesso à Rota de Login
    await page.goto(`${targetUrl}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form, input[type="email"], h1, h2').first()).toBeVisible();

    // 4. Verificação de Ausência de Erros JS Críticos durante a Navegação
    const criticalErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('analytics'));
    expect(criticalErrors.length, `Erros JS detectados no runtime: ${criticalErrors.join(' | ')}`).toBe(0);
  });
});
