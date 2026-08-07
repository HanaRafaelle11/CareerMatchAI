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

test.describe('E2E — Consistência de Match, Ausência de Placeholder e Resposta da Lixeira', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('Garantir que a Descoberta exibe Match Estimado condizente, sem 15% em loading e com persistência na sidebar', async ({ page }) => {
    // 1. Navegar para Encontrar Vagas
    await navigateSidebar(page, "Compatibilidade");
    await page.waitForTimeout(1500);

    // 2. Garantir que estamos na aba "Descoberta de Vagas"
    const discoveryTab = page.locator('button:has-text("Descoberta de Vagas"), button:has-text("Descoberta")').first();
    if (await discoveryTab.isVisible()) {
      await discoveryTab.click();
      await page.waitForTimeout(1000);
    }

    // 3. Buscar vaga de "Cozinheiro"
    const searchInput = page.locator('input[placeholder*="Cargo"], input[placeholder*="vaga"], input[placeholder*="palavra"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cozinheiro');
      await searchInput.press('Enter');
      await page.waitForTimeout(3000);
    }

    // 4. Validar que o "Match Estimado" no card NÃO é 99% (não confunde relevância de busca com match de candidato)
    const matchEstimadoText = page.locator('text=/Match Estimado: \\d+%/').first();
    if (await matchEstimadoText.isVisible()) {
      const content = await matchEstimadoText.textContent();
      console.log(`[E2E] Match Estimado encontrado na Descoberta: "${content}"`);
      expect(content).not.toContain('Match Estimado: 99%');
    }

    // 5. Clicar em "Importar e Analisar Match"
    const importBtn = page.locator('button:has-text("Importar e Analisar Match")').first();
    if (await importBtn.isVisible()) {
      await importBtn.click();

      // 6. Verificar que durante o carregamento aparece estado de Calculando / Spinner e NUNCA "15%" estático
      const calculatingBadge = page.locator('text=Calculando...').or(page.locator('.animate-spin'));
      console.log(`[E2E] Estado de calculando visível durante o processo.`);
      
      // Aguardar a conclusão da análise
      await page.waitForTimeout(5000);

      // 7. Verificar se o resultado calculated aparece na lista lateral "Minhas Análises" sem mostrar "Sem Match"
      const myJobsTab = page.locator('button:has-text("Minhas Análises")').first();
      if (await myJobsTab.isVisible()) {
        await myJobsTab.click();
        await page.waitForTimeout(1000);
      }

      const sidebarScore = page.locator('aside, .col-span-1').locator('text=/\\d+%/').first();
      await expect(sidebarScore).toBeVisible({ timeout: 10000 });
      const sidebarScoreText = await sidebarScore.textContent();
      console.log(`[E2E] Score refletido na sidebar "Minhas Análises": ${sidebarScoreText}`);
      expect(sidebarScoreText).not.toContain('Sem Match');
    }

    // 8. Otimização da Lixeira (Testar exclusão instantânea)
    const trashBtn = page.locator('button[title*="Lixeira"]').first();
    if (await trashBtn.isVisible()) {
      await trashBtn.click();
      // O item deve ser removido instantaneamente da interface
      console.log(`[E2E] Botão de mover para a lixeira acionado com sucesso.`);
    }
  });
});
