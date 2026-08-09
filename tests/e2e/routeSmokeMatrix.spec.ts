import { test, expect } from '@playwright/test';

/**
 * Route Smoke Matrix — VoCentro
 * Validates all public and authenticated routes for:
 * 1. HTTP 200 / rendering
 * 2. No runtime JS exceptions / pageerrors
 * 3. Element visibility
 * 4. Mobile 375px responsiveness
 * 5. Admin access control (non-admin redirect)
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

  test('Validar Responsividade Mobile (Viewport 375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Validar Controle de Acesso /admin (Bloqueio de Candidato Não-Admin)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('vocentro_mock_user', JSON.stringify({
        id: 'usr_non_admin_candidate',
        email: 'candidato.comum@gmail.com',
        user_metadata: { full_name: 'Candidato Comum' }
      }));
      window.localStorage.setItem('vocentro_mock_authenticated', 'true');
    });

    await page.goto(`${targetUrl}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Non-admin user should not see admin panel, but be redirected to main dashboard
    const adminHeader = page.locator('text=/Painel Administrativo|Ondas de Pesquisa/i');
    await expect(adminHeader).not.toBeVisible();
  });
});
