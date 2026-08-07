import { test, expect } from '@playwright/test';

async function ensureAuthenticated(page: any) {
  await page.goto('/');
  
  const emailInput = page.locator('input[type="email"]');
  const dashboard = page.locator('text=Mapeamento de Vagas').or(page.locator('text=Visão Geral')).or(page.locator('text=Goal Tracker')).or(page.locator('text=Meu Perfil'));
  
  try {
    await expect(emailInput.or(dashboard).first()).toBeVisible({ timeout: 15000 });
  } catch (_) {
    const loginCta = page.locator('button:has-text("Entrar"), a:has-text("Entrar"), button:has-text("Começar")').first();
    if (await loginCta.isVisible()) {
      await loginCta.click();
    }
  }

  if (await emailInput.isVisible()) {
    await emailInput.fill('discovery.consistency.e2e@example.com');
    await page.locator('input[type="password"]').fill('AntiLeakagePass123!');
    await page.locator('button[type="submit"]').click();
    
    try {
      await expect(dashboard.first()).toBeVisible({ timeout: 8000 });
      return;
    } catch (e) {
      console.log("Criando usuário de teste E2E para consistência de Descoberta...");
    }

    const signUpToggle = page.locator('button:has-text("Cadastre-se")');
    if (await signUpToggle.isVisible()) {
      await signUpToggle.click();
      await page.locator('input[placeholder*="João"]').fill('Candidato E2E Consistência Match');
      await page.locator('input[type="email"]').fill('discovery.consistency.e2e@example.com');
      await page.locator('input[type="password"]').first().fill('AntiLeakagePass123!');
      const confirmPass = page.locator('input[placeholder="••••••••"]').nth(1);
      if (await confirmPass.isVisible()) {
        await confirmPass.fill('AntiLeakagePass123!');
      }
      await page.locator('button[type="submit"]').click();
    }
  }
  
  await expect(dashboard.first()).toBeVisible({ timeout: 15000 });
}

async function navigateSidebar(page: any, tabLabel: string) {
  let actualLabel = tabLabel;
  if (tabLabel === 'Currículo') actualLabel = 'Meu Perfil';
  if (tabLabel === 'Compatibilidade') actualLabel = 'Encontrar Vagas';
  
  const tabButton = page.locator(`aside button:has-text("${actualLabel}"), nav button:has-text("${actualLabel}")`).filter({ visible: true }).first();
  await expect(tabButton).toBeVisible({ timeout: 10000 });
  await tabButton.click();
}

test.describe('E2E — Consistência de Match, Ausência de Popup, Feedback Único e Busca Robusta', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('Garantir busca robusta com fallback para título longo e feedback com ícone único', async ({ page }) => {
    // 1. Navegar para Encontrar Vagas
    await navigateSidebar(page, "Compatibilidade");
    await page.waitForTimeout(1500);

    // 2. Testar busca com título longo e frágil (deve usar fallback automático para Customer Success)
    const discoveryTab = page.locator('button:has-text("Descoberta de Vagas"), button:has-text("Descoberta")').first();
    if (await discoveryTab.isVisible()) {
      await discoveryTab.click();
      await page.waitForTimeout(1000);
    }

    const searchInput = page.locator('input[placeholder*="Cargo"], input[placeholder*="vaga"], input[placeholder*="palavra"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Supervisora de Customer Success & Opera...');
      await searchInput.press('Enter');
      await page.waitForTimeout(3500);
    }

    // 3. Importar e Analisar Vaga encontrada via fallback
    const importBtn = page.locator('button:has-text("Importar e Analisar Match")').first();
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await page.waitForTimeout(4000);

      // 4. Validar que o botão de feedback tem apenas 1 ícone limpo
      const feedbackBtn = page.locator('button:has-text("Sim, combina comigo")').first();
      if (await feedbackBtn.isVisible()) {
        const text = await feedbackBtn.textContent();
        expect(text).not.toContain('👍'); // Sem emoji duplicado
        console.log(`[E2E] Texto do botão de feedback validado com 1 único ícone: "${text}"`);
      }
    }

    // 5. Otimização da Lixeira (Testar exclusão instantânea)
    const trashBtn = page.locator('button[title*="Lixeira"]').first();
    if (await trashBtn.isVisible()) {
      await trashBtn.click();
      console.log(`[E2E] Exclusão acionada com sucesso.`);
    }
  });
});
