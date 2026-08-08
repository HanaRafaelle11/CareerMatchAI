import { test, expect } from '@playwright/test';

test.describe('E2E — Item 5: Fluxo Completo de Arquivar (Lixeira) e Reativar (Restaurar) Vaga', () => {
  test.setTimeout(120000);

  test('Autenticar com conta E2E real, mover vaga para Lixeira e restaurar com sucesso', async ({ page }) => {
    // 1. Acessar aplicação e fazer login real com a conta E2E
    await page.goto('/');
    
    const loginBtn = page.locator('button:has-text("Entrar")');
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    await loginBtn.click();

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('rafaelaletbey@gmail.com');
    await page.locator('input[type="password"]').fill('Haninha11!');
    await page.locator('button[type="submit"]:has-text("Entrar")').click();

    await page.waitForTimeout(4000);

    // Remover modal onboarding do DOM
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(el => el.remove());
    });

    await page.waitForTimeout(1000);

    // 2. Navegar para a aba "Vagas & Match"
    const navBtn = page.locator('aside button, nav button').filter({ hasText: /Vagas|Compatibilidade|Mapeamento/i }).first();
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    await page.waitForTimeout(2000);

    // Remover qualquer overlay residual
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(el => el.remove());
    });

    // 3. Garantir que estamos na subAba "Lixeira de Vagas" para restaurar qualquer vaga pendente
    const trashSubTab = page.locator('button').filter({ hasText: /Lixeira de Vagas/i }).first();
    await expect(trashSubTab).toBeVisible({ timeout: 10000 });
    await trashSubTab.click({ force: true });
    await page.waitForTimeout(2000);

    // Se houver vagas na Lixeira, restaurar todas para garantir que "Minhas Análises" tenha vagas ativas
    const restoreButtons = page.locator('button:has-text("Restaurar Vaga")');
    const restoreCount = await restoreButtons.count();
    for (let i = 0; i < restoreCount; i++) {
      const btn = page.locator('button:has-text("Restaurar Vaga")').first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(1000);
      }
    }

    // 4. Voltar para "Minhas Análises" agora com vagas disponíveis ativas
    const myJobsSubTab = page.locator('button').filter({ hasText: /^Minhas Análises$/i }).first();
    await expect(myJobsSubTab).toBeVisible({ timeout: 10000 });
    await myJobsSubTab.click({ force: true });
    await page.waitForTimeout(2000);

    // Evidência 1: Estado inicial com vagas disponíveis
    await page.screenshot({ path: 'scratch_item5_01_vagas_iniciais.png', fullPage: true });

    // 5. Mover a primeira vaga disponível para a Lixeira (Arquivar)
    const firstTrashIconBtn = page.locator('button[title*="Lixeira"], button[title*="Mover"]').first();
    await expect(firstTrashIconBtn).toBeVisible({ timeout: 15000 });

    const firstJobCardContainer = page.locator('button[title*="Lixeira"]').first().locator('xpath=ancestor::div[contains(@class, "p-3")]');
    const targetJobTitle = (await firstJobCardContainer.locator('h4').textContent()) || 'Vaga Selecionada';
    console.log(`[E2E ITEM 5] Arquivando a vaga "${targetJobTitle}" para a Lixeira...`);

    await firstTrashIconBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Evidência 2: Vaga movida para a Lixeira com Toast de aviso
    await page.screenshot({ path: 'scratch_item5_02_vaga_arquivada_lixeira.png', fullPage: true });

    // 6. Navegar para a subAba "Lixeira de Vagas"
    await trashSubTab.click({ force: true });
    await page.waitForTimeout(2000);

    // Confirmar que a vaga arquivada está listada na Lixeira
    const trashedItemCard = page.locator(`h4:has-text("${targetJobTitle}")`).first();
    await expect(trashedItemCard).toBeVisible({ timeout: 10000 });

    // Evidência 3: Tela da Lixeira exibindo o item arquivado
    await page.screenshot({ path: 'scratch_item5_03_tela_lixeira_com_vaga.png', fullPage: true });

    // 7. Reativar / Restaurar a vaga específica
    const restoreBtnTarget = trashedItemCard.locator('xpath=ancestor::div[contains(@class, "p-4")]').locator('button:has-text("Restaurar Vaga")').first();
    await expect(restoreBtnTarget).toBeVisible({ timeout: 10000 });
    await restoreBtnTarget.click({ force: true });

    await page.waitForTimeout(2000);

    // Evidência 4: Vaga restaurada com sucesso
    await page.screenshot({ path: 'scratch_item5_04_vaga_reativada_restaurada.png', fullPage: true });

    // 8. Voltar para "Minhas Análises" e confirmar reaparecimento nas Vagas Disponíveis
    await myJobsSubTab.click({ force: true });
    await page.waitForTimeout(2000);

    const restoredJobTitle = page.locator(`h2:has-text("${targetJobTitle}"), h3:has-text("${targetJobTitle}"), h4:has-text("${targetJobTitle}")`).first();
    await expect(restoredJobTitle).toBeVisible({ timeout: 10000 });

    // Evidência 5: Estado final com a vaga reativada
    await page.screenshot({ path: 'scratch_item5_05_estado_final_restaurado.png', fullPage: true });
  });
});
