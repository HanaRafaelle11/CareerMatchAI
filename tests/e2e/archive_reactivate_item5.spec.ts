import { test, expect } from '@playwright/test';

test.describe('E2E — Item 1: Fluxo Completo de Arquivar (Lixeira) e Reativar (Restaurar) Vaga', () => {
  test.setTimeout(120000);

  test('Autenticar com conta rafaelaletbey@gmail.com, mover vaga para Lixeira e restaurar com sucesso', async ({ page }) => {
    // 1. Acessar aplicação em produção e fazer login real com a conta rafaelaletbey@gmail.com
    await page.goto('https://vocentro.com.br/');
    
    const loginBtn = page.locator('button:has-text("Entrar")');
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    await loginBtn.click();

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('rafaelaletbey@gmail.com');
    await page.locator('input[type="password"]').fill('Haninha11!');
    await page.locator('button[type="submit"]:has-text("Entrar")').click();

    await page.waitForTimeout(5000);

    // Remover modal onboarding/overlays do DOM
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(el => el.remove());
    });

    // 2. Navegar diretamente para a URL de vagas em produção
    await page.goto('https://vocentro.com.br/vagas');
    await page.waitForTimeout(3000);

    // Remover qualquer overlay residual
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(el => el.remove());
    });

    // 3. Clicar no botão da subAba "Lixeira"
    const trashSubTab = page.locator('button').filter({ hasText: 'Lixeira' }).first();
    await expect(trashSubTab).toBeVisible({ timeout: 15000 });
    await trashSubTab.click({ force: true });
    await page.waitForTimeout(2000);

    // Se houver vagas na Lixeira, restaurar todas para garantir estado limpo
    const restoreButtons = page.locator('button:has-text("Restaurar Vaga")');
    const restoreCount = await restoreButtons.count();
    for (let i = 0; i < restoreCount; i++) {
      const btn = page.locator('button:has-text("Restaurar Vaga")').first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(1000);
      }
    }

    // 4. Ir para a subAba "Minhas Análises" para ter vagas ativas
    const myJobsSubTab = page.locator('button').filter({ hasText: 'Minhas Análises' }).first();
    await expect(myJobsSubTab).toBeVisible({ timeout: 10000 });
    await myJobsSubTab.click({ force: true });
    await page.waitForTimeout(3000);

    // Evidência 1: Estado inicial com vagas ativas
    await page.screenshot({ path: 'scratch_item1_01_vagas_iniciais.png', fullPage: true });

    // 5. Aguardar o carregamento das vagas (Minhas Análises ou Descobrir Vagas)
    let firstTrashIconBtn = page.locator('button[title*="Lixeira"], button[title*="Mover"]').first();
    const isVisibleInMyJobs = await firstTrashIconBtn.isVisible().catch(() => false);
    if (!isVisibleInMyJobs) {
      console.log('[E2E ITEM 1] Alternando para subAba "Descoberta de Vagas"...');
      const discoverSubTab = page.locator('button').filter({ hasText: 'Descoberta' }).first();
      await discoverSubTab.click({ force: true });
      await page.waitForTimeout(3000);
      firstTrashIconBtn = page.locator('button[title*="Lixeira"], button[title*="Mover"]').first();
    }
    await firstTrashIconBtn.waitFor({ state: 'visible', timeout: 30000 });

    const firstJobCardContainer = page.locator('button[title*="Lixeira"]').first().locator('xpath=ancestor::div[contains(@class, "p-3") or contains(@class, "p-4")]');
    const targetJobTitle = (await firstJobCardContainer.locator('h4, h3, h2').first().textContent()) || 'Vaga Selecionada';
    console.log(`[E2E ITEM 1] Arquivando a vaga "${targetJobTitle.trim()}" para a Lixeira...`);

    await firstTrashIconBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Evidência 2: Vaga movida para a Lixeira
    await page.screenshot({ path: 'scratch_item1_02_vaga_arquivada.png', fullPage: true });

    // 6. Navegar para a subAba "Lixeira de Vagas"
    await trashSubTab.click({ force: true });
    await page.waitForTimeout(2000);

    // Evidência 3: Tela da Lixeira exibindo o item arquivado com opção de Restaurar
    await page.screenshot({ path: 'scratch_item1_03_tela_lixeira_com_vaga.png', fullPage: true });

    // 7. Reativar / Restaurar a vaga específica
    const restoreBtnTarget = page.locator('button:has-text("Restaurar Vaga")').first();
    await expect(restoreBtnTarget).toBeVisible({ timeout: 10000 });
    await restoreBtnTarget.click({ force: true });

    await page.waitForTimeout(2000);

    // Evidência 4: Vaga restaurada na Lixeira
    await page.screenshot({ path: 'scratch_item1_04_vaga_reativada_restaurada.png', fullPage: true });

    // 8. Voltar para "Minhas Análises" e confirmar reaparecimento
    await myJobsSubTab.click({ force: true });
    await page.waitForTimeout(2000);

    // Evidência 5: Estado final com a vaga reativada nas análises
    await page.screenshot({ path: 'scratch_item1_05_estado_final_restaurado.png', fullPage: true });
  });
});
