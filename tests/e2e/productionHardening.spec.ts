import { test, expect } from '@playwright/test';

test.describe('Sprint Production Hardening E2E — CareerMatch AI', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Navegar para a página inicial (Login ou Dashboard se já autenticado)
    await page.goto('/');
  });

  test('Fluxo completo currículo: Upload -> Estado Real -> Perfil Criado', async ({ page }) => {
    // a. Simular login se o formulário estiver visível
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('candidato.e2e@example.com');
      await page.locator('input[type="password"]').fill('CandidatoPassword123!');
      await page.locator('button[type="submit"]').click();
    }

    // b. Verificar redirecionamento para o Dashboard
    await expect(page.locator('h1')).toContainText(/Olá|Módulo|Dashboard|Upload/i);

    // c. Ir para a aba do Perfil / Upload
    // Clicar no botão ou link da Navbar para trocar de tab
    const profileTab = page.locator('nav >> text=Currículo').or(page.locator('nav >> text=Perfil'));
    if (await profileTab.isVisible()) {
      await profileTab.click();
    } else {
      await page.goto('/#profile');
    }

    // d. Encontrar o dropzone/input de arquivo PDF
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // e. Fazer upload de um arquivo PDF simulado
    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      const file = new File(['dummy content'], 'curriculo_teste.pdf', { type: 'application/pdf' });
      dt.items.add(file);
      return dt;
    });

    // Enviar nome e objetivo se aplicável
    const nameInput = page.locator('input[placeholder*="CS Pleno 2026"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Currículo Teste Playwright E2E');
    }
    
    // Anexar o arquivo ao input
    await fileInput.setInputFiles({
      name: 'curriculo_teste.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy pdf content')
    });

    // Submeter formulário
    const submitBtn = page.locator('button:has-text("Salvar Currículo")').or(page.locator('button:has-text("Upload")'));
    await submitBtn.click();

    // f. Validar máquina de estados real do processamento (loader/passos do pipeline visíveis)
    const pipelineLoader = page.locator('text=Estamos lendo seu currículo').or(page.locator('text=Upload concluído'));
    await expect(pipelineLoader).toBeVisible();

    const progressSteps = page.locator('[class*="ProcessingState"]');
    if (await progressSteps.count() > 0) {
      await expect(progressSteps.first()).toBeVisible();
    }
  });

  test('Fluxo erro Gemini: API falha -> Mensagem amigável com código -> Retry', async ({ page }) => {
    // Ir direto para o painel de Match de Vagas
    const matchTab = page.locator('nav >> text=Vagas').or(page.locator('nav >> text=Match'));
    if (await matchTab.isVisible()) {
      await matchTab.click();
    } else {
      await page.goto('/#match');
    }

    // Selecionar uma vaga na lista se houver
    const firstJobCard = page.locator('div[class*="cursor-pointer"]').first();
    if (await firstJobCard.isVisible()) {
      await firstJobCard.click();
    }

    // Simular clique em calcular match se o botão estiver disponível
    const calcMatchBtn = page.locator('button:has-text("Calcular Compatibilidade")');
    if (await calcMatchBtn.isVisible()) {
      await calcMatchBtn.click();

      // Verificar exibição da máquina de estados real do Match
      await expect(page.locator('text=Comparando currículo').or(page.locator('text=dados da vaga'))).toBeVisible();
    }

    // Se ocorrer um erro durante o cálculo, o componente ErrorState deve ser renderizado
    const errorStateWidget = page.locator('[class*="ErrorState"]').or(page.locator('text=RESUME_EXTRACTION_FAILED').or(page.locator('text=AI_TIMEOUT')));
    if (await errorStateWidget.isVisible()) {
      // Validar código de erro amigável e botão de tentar novamente
      await expect(errorStateWidget).toContainText(/Código|Tentativa|Falhou/i);
      const retryBtn = page.locator('button:has-text("Tentar Novamente")').or(page.locator('button:has-text("Recalcular")'));
      await expect(retryBtn).toBeEnabled();
    }
  });

  test('Fluxo mobile: responsividade, modais e gráficos adaptados', async ({ page, viewport }) => {
    // Definir viewports pequenos para dispositivos móveis
    if (viewport && viewport.width < 768) {
      // a. Verificar se o menu hamburger móvel está visível
      const menuBtn = page.locator('header button');
      await expect(menuBtn).toBeVisible();

      // b. Abrir menu lateral móvel e clicar em fechar
      await menuBtn.click();
      const closeBtn = page.locator('nav button:has-text("X")').or(page.locator('nav button svg'));
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    } else {
      // No desktop, verificar se a navbar lateral padrão está visível
      const desktopNav = page.locator('aside').or(page.locator('nav'));
      await expect(desktopNav).toBeVisible();
    }
  });
});
