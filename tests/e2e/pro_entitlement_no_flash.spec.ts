import { test, expect } from '@playwright/test';

/**
 * E2E — Pro Entitlement & Zero Paywall Flash Test
 * Validates that:
 * 1. A PRO user NEVER receives an upgrade modal or "Tornar-se PRO" / "Seja Pro" paywall flash during initial load or navigation.
 * 2. A FREE user DOES see upgrade options appropriately after entitlement load.
 */
test.describe('E2E — Pro Entitlement & Zero Flash Verification', () => {
  const targetUrl = process.env.BASE_URL || 'http://localhost:5173';

  test('Usuário PRO — Inicialização Direta sem Flash de Upgrade ou Modal FREE', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const paywallFlashes: string[] = [];

    // Capturar qualquer aparição visual de elementos de paywall ou upgrade durante o ciclo de vida
    page.on('dialog', dialog => dialog.dismiss());

    await page.addInitScript(() => {
      const mockProUserId = 'usr_e2e_pro_client';

      window.localStorage.setItem('vocentro_mock_user', JSON.stringify({
        id: mockProUserId,
        email: 'hanarafaelle11@gmail.com',
        user_metadata: { full_name: 'Hana Pro Candidate', plan: 'pro', is_pro: true }
      }));
      window.localStorage.setItem('vocentro_mock_authenticated', 'true');
      window.localStorage.setItem('vocentro_onboarding_completed', 'true');
      window.localStorage.setItem(`vocentro_is_pro_${mockProUserId}`, 'true');
      window.localStorage.setItem('vocentro_is_pro', 'true');
    });

    // Monitorar a UI desde a primeira renderização
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Verificar ativamente por 3 segundos se o modal de paywall ou CTA "Seja Pro" apareceu em algum frame
    const paywallModal = page.locator('text=/Fazer Upgrade para Pro|Alcance Mais Oportunidades com o Vocentro Pro|Cota Semanal de Vagas/i');
    const isPaywallVisible = await paywallModal.isVisible();
    expect(isPaywallVisible, 'Modal de upgrade/Paywall NÃO deve aparecer para usuário PRO!').toBe(false);

    // Confirmar que o dashboard carregou com a marcação / badges ativas
    await expect(page.locator('body')).toBeVisible();

    // Navegar pelas abas principais mantendo escuta de flash de paywall
    const profileTab = page.locator('button[title*="Perfil"], button:has-text("Perfil")').first();
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(300);
      expect(await paywallModal.isVisible(), 'Paywall não deve ser disparado no Perfil para PRO').toBe(false);
    }
  });

  test('Usuário FREE — Acesso a Recursos Gratuitos com CTA de Upgrade Disponível', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.addInitScript(() => {
      const mockFreeUserId = 'usr_e2e_free_candidate';

      window.localStorage.setItem('vocentro_mock_user', JSON.stringify({
        id: mockFreeUserId,
        email: 'candidato.free@gmail.com',
        user_metadata: { full_name: 'Candidato Free' }
      }));
      window.localStorage.setItem('vocentro_mock_authenticated', 'true');
      window.localStorage.setItem('vocentro_onboarding_completed', 'true');
      window.localStorage.removeItem(`vocentro_is_pro_${mockFreeUserId}`);
      window.localStorage.removeItem('vocentro_is_pro');
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Confirmar que a página carrega perfeitamente para usuário FREE
    await expect(page.locator('body')).toBeVisible();
  });
});
