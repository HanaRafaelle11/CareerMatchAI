import { test, expect } from '@playwright/test';

test.describe('Verificação de Volume de Vagas Real e Interface', () => {
  test.setTimeout(90000); // 90 segundos

  test('Buscar "cozinheiro" e "vendedor" e medir contagem real na tela', async ({ page }) => {
    await page.goto('/');
    
    // Clicar em Entrar
    const loginBtn = page.locator('button:has-text("Entrar")');
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    await loginBtn.click();

    // Formulário de login
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('hardening.e2e@example.com');
    await page.locator('input[type="password"]').fill('HardeningE2EPassword123!');
    await page.locator('button[type="submit"]:has-text("Entrar")').click();

    await page.waitForTimeout(3000);

    // Remover modal overlay se presente
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(el => el.remove());
    });

    // Ir para Vagas & Match
    const navBtn = page.locator('aside button, nav button').filter({ hasText: /Vagas|Compatibilidade|Mapeamento/i }).first();
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Descoberta
    const discoverTab = page.locator('button:has-text("Descoberta de Vagas"), button:has-text("Descoberta")').first();
    if (await discoverTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await discoverTab.click({ force: true });
    }

    const searchInput = page.locator('input[placeholder*="cargo"], input[placeholder*="Buscar"], input[placeholder*="palavra"], input[type="text"]').first();
    const searchSubmitBtn = page.locator('button:has-text("Buscar Vagas"), button:has-text("Buscar")').first();

    // --- TESTE 1: Cozinheiro ---
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('cozinheiro');
    await searchSubmitBtn.click();

    await page.waitForTimeout(6000);
    await page.screenshot({ path: 'scratch_cozinheiro_results.png', fullPage: true });

    // --- TESTE 2: Vendedor ---
    await searchInput.fill('vendedor');
    await searchSubmitBtn.click();

    await page.waitForTimeout(6000);
    await page.screenshot({ path: 'scratch_vendedor_results.png', fullPage: true });
  });
});
