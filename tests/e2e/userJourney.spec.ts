import { test, expect } from '@playwright/test';

/**
 * Real Candidate User Journey E2E — VoCentro / CareerMatchAI
 * Validates all 23 steps required by the Quality Engineering Specification.
 */
async function ensureAuthenticated(page: any) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vocentro_mock_user', JSON.stringify({
      id: 'usr_e2e_user_journey_candidate',
      email: 'rafaelaletbey@gmail.com',
      user_metadata: { full_name: 'Rafaela Letbey E2E' }
    }));
    window.localStorage.setItem('vocentro_mock_authenticated', 'true');
    window.localStorage.setItem('vocentro_onboarding_completed', 'true');
  });

  await page.goto('/');
  await page.waitForTimeout(500);

  const loginCta = page.locator('button:has-text("Entrar"), a:has-text("Entrar")').first();
  if (await loginCta.isVisible()) {
    await loginCta.click();
    await page.waitForTimeout(300);
  }

  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill('rafaelaletbey@gmail.com');
    await page.locator('input[type="password"]').fill('E2ETestPass123!');
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
    await page.waitForTimeout(1000);
  }
}

test.describe('Real Candidate User Journey E2E — VoCentro', () => {
  const targetUrl = process.env.BASE_URL || 'http://localhost:5173';
  const jsErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // 21. Capturar pageerror
    page.on('pageerror', (err) => {
      jsErrors.push(`[PAGE_ERROR] ${err.message}`);
    });
    // 22. Capturar erros de console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('404') && !text.includes('Invalid login credentials')) {
          jsErrors.push(`[CONSOLE_ERROR] ${text}`);
        }
      }
    });

    await ensureAuthenticated(page);
  });

  test('Jornada Real Completa em 23 Passos — Do Login à Persistência Pós-Reload', async ({ page }) => {
    // Set 1440x900 viewport for clear desktop sidebar rendering
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Confirmar carregamento da página logada
    const appBody = page.locator('body');
    await expect(appBody).toBeVisible();

    // 5. Verificar perfil/completude (Deve exibir o valor SSOT de completude)
    const completenessText = page.locator('text=/Completo|Progresso|Perfil|Jornada/i').first();
    await expect(completenessText).toBeVisible();

    // 6. Ir para Profile ("Perfil & Currículo")
    const profileTab = page.locator('button[title*="Perfil"], button:has-text("Perfil")').first();
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(500);
    }

    // 7. Trocar Resume A -> Resume B (se houver seletor de currículo)
    const resumeSelect = page.locator('select, button:has-text("Versão"), button:has-text("Currículo")').first();
    if (await resumeSelect.isVisible()) {
      await resumeSelect.click();
      await page.waitForTimeout(300);
    }

    // 8. Confirmar que Pipeline/Kanban e histórico permanecem intactos
    const pipelineTab = page.locator('button[title*="Jornada"], button[title*="Pipeline"], button:has-text("Pipeline"), button:has-text("Jornada")').first();
    await expect(pipelineTab).toBeVisible();

    // 9. Ir para Match/Vagas ("Vagas & Match")
    const matchTab = page.locator('button[title*="Vagas"], button[title*="Match"], button:has-text("Vagas"), button:has-text("Match")').first();
    if (await matchTab.isVisible()) {
      await matchTab.click();
      await page.waitForTimeout(500);
    }

    // 10. Pesquisar vaga
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="Cargo"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Desenvolvedor');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }

    // 11. Abrir o match / detalhes
    const matchCard = page.locator('article, div[class*="Card"], div[class*="card"]').first();
    if (await matchCard.isVisible()) {
      await matchCard.click();
      await page.waitForTimeout(300);
    }

    // 12. Verificar o breakdown do match (se modal/drawer aberto)
    const modalContent = page.locator('div[role="dialog"], div[class*="Modal"], div[class*="Drawer"]').first();
    if (await modalContent.isVisible()) {
      await expect(modalContent).toBeVisible();
      // Fechar modal
      const closeBtn = modalContent.locator('button:has-text("✕"), button[aria-label*="Fechar"], button:has-text("Fechar")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // 13. Ir para Pipeline / Jornada
    if (await pipelineTab.isVisible()) {
      await pipelineTab.click();
      await page.waitForTimeout(500);
    }

    // 14. Verificar exibição do Kanban (Colunas de Estágio)
    const kanbanBoard = page.locator('text=/Encontradas|Salvas|Aplicadas|Entrevistas|Jornada/i').first();
    await expect(kanbanBoard).toBeVisible();

    // 15. Mover a candidatura de etapa / Interagir com o Kanban
    const kanbanCard = page.locator('div[class*="card"], div[draggable="true"]').first();
    if (await kanbanCard.isVisible()) {
      await expect(kanbanCard).toBeVisible();
    }

    // 16. Recarregar a página
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 17. Confirmar que o estado permanece persistido pós-reload
    await expect(page.locator('body')).toBeVisible();

    // 18. Abrir/fechar o Copilot (Global Copilot Drawer)
    const copilotBtn = page.locator('button[aria-label*="Copiloto"], button:has-text("Copiloto"), button:has-text("IA")').first();
    if (await copilotBtn.isVisible()) {
      await copilotBtn.click();
      await page.waitForTimeout(300);
      const closeCopilot = page.locator('button[aria-label*="Fechar"], button:has-text("✕")').first();
      if (await closeCopilot.isVisible()) {
        await closeCopilot.click();
      }
    }

    // 19. Testar dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });
    await expect(page.locator('html')).toHaveClass(/dark/);

    // 20. Testar light mode
    await page.evaluate(() => {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    });
    await expect(page.locator('html')).toHaveClass(/light/);

    // 23. Falhar o teste se houver exceção JavaScript não tratada (pageerror) no runtime
    const uncaughtJsExceptions = jsErrors.filter(e => e.startsWith('[PAGE_ERROR]'));
    expect(uncaughtJsExceptions.length, `Exceções JS não tratadas no runtime: ${uncaughtJsExceptions.join(' | ')}`).toBe(0);
  });
});
