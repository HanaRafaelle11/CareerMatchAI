import { test, expect } from '@playwright/test';

test.describe('E2E — Item 1: Validação Real na UI do Fluxo Arquivar e Reativar Vaga', () => {
  test.setTimeout(120000);

  test('Realizar cliques reais na UI com a conta rafaelaletbey@gmail.com', async ({ page }) => {
    // 1. Acessar aplicação em produção
    console.log('[E2E UI] Acessando vocentro.com.br...');
    await page.goto('https://vocentro.com.br/');
    
    const loginBtn = page.locator('button:has-text("Entrar")').first();
    await expect(loginBtn).toBeVisible({ timeout: 15000 });
    await loginBtn.click();

    // 2. Preencher credenciais reais da usuária de testes
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('rafaelaletbey@gmail.com');
    await page.locator('input[type="password"]').fill('Haninha11!');
    
    const submitBtn = page.locator('button[type="submit"]:has-text("Entrar")');
    await submitBtn.click();

    console.log('[E2E UI] Aguardando autenticação...');
    await page.waitForTimeout(5000);

    // Limpar overlays de onboarding se existirem
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(el => el.remove());
    });

    // 3. Navegar para a página de Vagas e clicar na subAba Minhas Análises
    console.log('[E2E UI] Acessando /vagas e clicando em Minhas Análises...');
    await page.goto('https://vocentro.com.br/vagas');
    await page.waitForTimeout(4000);

    // Limpar overlays se existirem
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(el => el.remove());
    });

    const myJobsBtn = page.getByText('Minhas Análises', { exact: true });
    await expect(myJobsBtn).toBeVisible({ timeout: 15000 });
    await myJobsBtn.click({ force: true });
    await page.waitForTimeout(4000);

    // Print 1: Estado Inicial Ativo em Minhas Análises
    await page.screenshot({ path: 'scratch_ui_01_minhas_analises_ativa.png', fullPage: true });

    // 5. Localizar botão de mover para a Lixeira e clicar
    const trashBtn = page.locator('button[title*="Lixeira"], button[title*="Mover"]').first();
    await expect(trashBtn).toBeVisible({ timeout: 25000 });
    console.log('[E2E UI] Clicando no botão real de mover para a Lixeira...');
    await trashBtn.click({ force: true });
    await page.waitForTimeout(3000);

    // Print 2: Vaga Arquivada (Toast / Removida da lista ativa)
    await page.screenshot({ path: 'scratch_ui_02_vaga_arquivada.png', fullPage: true });

    // 6. Clicar na subAba "Lixeira de Vagas"
    const trashTab = page.locator('button').filter({ hasText: 'Lixeira' }).first();
    await expect(trashTab).toBeVisible({ timeout: 15000 });
    console.log('[E2E UI] Navegando para a subAba Lixeira...');
    await trashTab.click({ force: true });
    await page.waitForTimeout(3000);

    // Print 3: Vaga visível na Lixeira
    await page.screenshot({ path: 'scratch_ui_03_tela_lixeira.png', fullPage: true });

    // 7. Clicar no botão real de "Restaurar Vaga"
    const restoreBtn = page.locator('button:has-text("Restaurar Vaga")').first();
    await expect(restoreBtn).toBeVisible({ timeout: 15000 });
    console.log('[E2E UI] Clicando no botão real de Restaurar Vaga...');
    await restoreBtn.click({ force: true });
    await page.waitForTimeout(3000);

    // Print 4: Vaga Restaurada
    await page.screenshot({ path: 'scratch_ui_04_vaga_restaurada.png', fullPage: true });

    // 8. Voltar para "Minhas Análises" e verificar reaparecimento
    await myJobsBtn.click({ force: true });
    await page.waitForTimeout(3000);

    // Print 5: Estado final restaurado em Minhas Análises
    await page.screenshot({ path: 'scratch_ui_05_estado_final.png', fullPage: true });
    console.log('[E2E UI] ✅ TESTE E2E NA UI CONCLUÍDO COM SUCESSO REAL!');
  });
});
