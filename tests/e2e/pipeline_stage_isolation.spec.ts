import { test, expect } from '@playwright/test';

async function ensureAuthenticated(page: any) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vocentro_mock_user', JSON.stringify({
      id: 'usr_e2e_pipeline_isolation',
      email: 'pipeline.isolation.e2e@example.com',
      name: 'Candidato E2E Pipeline'
    }));
  });

  await page.goto('/');
  await page.waitForTimeout(1000);
  
  const dashboard = page.locator('text=Mapeamento de Vagas').or(page.locator('text=Visão Geral')).or(page.locator('text=Goal Tracker')).or(page.locator('text=Meu Perfil')).or(page.locator('text=Minha Jornada'));
  
  try {
    await expect(dashboard.first()).toBeVisible({ timeout: 10000 });
  } catch (_) {
    const loginCta = page.locator('button:has-text("Entrar"), a:has-text("Entrar"), button:has-text("Começar")').first();
    if (await loginCta.isVisible()) {
      await loginCta.click();
    }
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('pipeline.isolation.e2e@example.com');
      await page.locator('input[type="password"]').fill('PipelinePass123!');
      await page.locator('button[type="submit"]').click();
    }
  }
}

async function navigateSidebar(page: any, tabLabel: string) {
  const tabButton = page.locator(`aside button:has-text("${tabLabel}"), nav button:has-text("${tabLabel}")`).filter({ visible: true }).first();
  await expect(tabButton).toBeVisible({ timeout: 10000 });
  await tabButton.click();
}

test.describe('E2E — Pipeline CRM: Etapas Individuais, Movimentação Kanban e Timeline Isolada', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('Valida que cada vaga possui etapa própria, sem vazamento para outras vagas', async ({ page }) => {
    // 1. Navegar para a Jornada / Pipeline CRM
    await navigateSidebar(page, 'Minhas Candidaturas');
    
    // Garantir que a página do Pipeline foi carregada
    await expect(page.locator('h1:has-text("Jornada de Carreira"), h2:has-text("Minha Jornada")').first()).toBeVisible({ timeout: 10000 });

    // 2. Adicionar Vaga A Manualmente
    const addBtn = page.locator('button:has-text("Adicionar Vaga"), button:has-text("Nova Vaga")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      const manualTab = page.locator('button:has-text("Cadastrar Manualmente")');
      if (await manualTab.isVisible()) {
        await manualTab.click();
      }
      await page.locator('input[placeholder*="Nubank"]').fill('Empresa Alfa');
      await page.locator('input[placeholder*="Frontend"]').fill('Desenvolvedor Alfa');
      await page.locator('button:has-text("Adicionar ao Pipeline")').click();
      await page.waitForTimeout(500);
    }

    // 3. Adicionar Vaga B Manualmente
    if (await addBtn.isVisible()) {
      await addBtn.click();
      const manualTab = page.locator('button:has-text("Cadastrar Manualmente")');
      if (await manualTab.isVisible()) {
        await manualTab.click();
      }
      await page.locator('input[placeholder*="Nubank"]').fill('Empresa Beta');
      await page.locator('input[placeholder*="Frontend"]').fill('Engenheiro Beta');
      await page.locator('button:has-text("Adicionar ao Pipeline")').click();
      await page.waitForTimeout(500);
    }

    // 4. Verificar se ambas aparecem no Pipeline
    const cardAlfa = page.locator('h4:has-text("Desenvolvedor Alfa")').first();
    const cardBeta = page.locator('h4:has-text("Engenheiro Beta")').first();

    await expect(cardAlfa).toBeVisible({ timeout: 10000 });
    await expect(cardBeta).toBeVisible({ timeout: 10000 });

    // 5. Mover a Vaga Alfa para "Aplicada" via select do Card
    const selectAlfa = cardAlfa.locator('xpath=ancestor::*[contains(@class, "group")]//select').first();
    if (await selectAlfa.isVisible()) {
      await selectAlfa.selectOption('applied');
      await page.waitForTimeout(300);
    }

    // 6. Confirmar que Vaga Alfa está na coluna "Aplicadas" e Vaga Beta permanece na coluna anterior
    const appliedCol = page.locator('div:has-text("Aplicadas")').first();
    await expect(appliedCol.locator('h4:has-text("Desenvolvedor Alfa")')).toBeVisible({ timeout: 5000 });
    
    // Confirmar que Vaga Beta NÃO foi movida indevidamente para Aplicadas
    const betaInApplied = appliedCol.locator('h4:has-text("Engenheiro Beta")');
    expect(await betaInApplied.isVisible()).toBeFalsy();

    // 7. Abrir detalhes da Vaga Alfa e adicionar evento no Histórico
    await cardAlfa.click();
    const drawer = page.locator('div:has-text("Centro de Gestão da Candidatura"), div:has-text("Desenvolvedor Alfa")').first();
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Adicionar anotação e registrar no histórico da Vaga Alfa
    await page.locator('input[placeholder="Observação da etapa..."]').fill('Envio de teste Alfa');
    await page.locator('button:has-text("Registrar no Histórico")').click();
    await page.waitForTimeout(500);

    // Confirmar que o evento aparece no histórico da Vaga Alfa
    await expect(page.locator('span:has-text("Envio de teste Alfa")')).toBeVisible();

    // Fechar drawer da Vaga Alfa
    await page.locator('button[aria-label="Fechar detalhes da candidatura"]').first().click();

    // 8. Abrir detalhes da Vaga Beta e confirmar ISOLAMENTO ABSOLUTO
    await cardBeta.click();
    const drawerBeta = page.locator('div:has-text("Engenheiro Beta")').first();
    await expect(drawerBeta).toBeVisible({ timeout: 5000 });

    // O histórico da Vaga Beta NÃO pode conter o evento da Vaga Alfa
    const leakedEvent = drawerBeta.locator('span:has-text("Envio de teste Alfa")');
    expect(await leakedEvent.isVisible()).toBeFalsy();
  });
});
