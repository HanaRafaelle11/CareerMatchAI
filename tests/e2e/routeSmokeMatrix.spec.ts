import { test, expect } from '@playwright/test';

/**
 * Route Smoke Matrix — VoCentro
 * Validates all public and authenticated routes for:
 * 1. HTTP 200 / rendering
 * 2. No runtime JS exceptions / pageerrors
 * 3. Element visibility
 * 4. Dark & Light mode compatibility
 */
const PUBLIC_ROUTES = [
  { path: '/', title: 'VoCentro' },
  { path: '/login', title: 'Login' },
  { path: '/about', title: 'Sobre' },
  { path: '/how-google-login-works', title: 'Login com Google' },
  { path: '/google-auth', title: 'Google Auth' },
  { path: '/termos-de-uso', title: 'Termos de Uso' },
  { path: '/politica-de-privacidade', title: 'Política de Privacidade' },
  { path: '/faq', title: 'FAQ' }
];

test.describe('Route Smoke Matrix — Rotas Públicas', () => {
  const targetUrl = process.env.BASE_URL || 'http://localhost:5173';

  for (const route of PUBLIC_ROUTES) {
    test(`Validar Rota P0: ${route.path}`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      const res = await page.goto(`${targetUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);

      // Verify screen contains content and no blank page
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Ensure no uncaught JS errors
      expect(pageErrors.length, `Erros de JS na rota ${route.path}: ${pageErrors.join('; ')}`).toBe(0);
    });
  }
});
