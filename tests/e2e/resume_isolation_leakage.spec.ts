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
    await emailInput.fill('leakage.prevention.e2e@example.com');
    await page.locator('input[type="password"]').fill('AntiLeakagePass123!');
    await page.locator('button[type="submit"]').click();
    
    try {
      await expect(dashboard.first()).toBeVisible({ timeout: 8000 });
      return;
    } catch (e) {
      console.log("Tentando cadastro para usuário de teste E2E anti-vazamento...");
    }

    const signUpToggle = page.locator('button:has-text("Cadastre-se")');
    if (await signUpToggle.isVisible()) {
      await signUpToggle.click();
      await page.locator('input[placeholder*="João"]').fill('Candidato E2E Anti-Leakage');
      await page.locator('input[type="email"]').fill('leakage.prevention.e2e@example.com');
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

test.describe('E2E Regressão — Prevenção Estrita de Vazamento de Dados Entre Currículos', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('Garantir isolamento total de dados de match e estabilidade de navegação ao trocar/excluir currículos', async ({ page }) => {
    // ── PASSO 1: UPLOAD DO CURRÍCULO A (Gastronomia / Cozinheira) ──
    await navigateSidebar(page, "Currículo");
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    const cvAText = `Nome do Candidato: Maria Gastronomia - Cozinheira Industrial Chefe.
      Objetivo Profissional: Cozinheira Chefe em Restaurantes e Hospitais.
      Resumo: Especialista em Gastronomia, preparo de molhos, cortes de carnes e higiene de alimentos.
      Competências Técnicas: Culinária Italiana, Segurança Alimentar, Controle de Estoque de Cozinha, Preparo de Refeições Coletivas.`;

    await fileInput.setInputFiles({
      name: 'curriculo_A_cozinheira.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(cvAText)
    });

    await page.waitForTimeout(3000);

    // ── PASSO 2: IR PARA ENCONTRAR VAGAS E GERAR MATCH DE UMA VAGA DE GASTRONOMIA ──
    await navigateSidebar(page, "Compatibilidade");
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder*="cargo"], input[placeholder*="vaga"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cozinheiro');
      await searchInput.press('Enter');
      await page.waitForTimeout(2500);
    }

    // ── PASSO 3: EXCLUIR O CURRÍCULO A ──
    await navigateSidebar(page, "Currículo");
    await page.waitForTimeout(1000);

    const deleteBtn = page.locator('button:has-text("Excluir"), button[title*="Excluir"]').first();
    if (await deleteBtn.isVisible()) {
      page.on('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await page.waitForTimeout(2000);
    }

    // ── PASSO 4: UPLOAD DO CURRÍCULO B (Customer Success / Tecnologia) ──
    const cvBText = `Nome do Candidato: Roberto Technology - Gerente de Customer Success Sênior.
      Objetivo Profissional: Head de Customer Success, Atendimento ao Cliente e Retention em Empresas SaaS.
      Resumo: Especialista em retenção de clientes, redução de churn, métricas de SaaS (NPS, CSAT, ARR) e gestão de contas.
      Competências Técnicas: Zendesk, Salesforce, Customer Onboarding, Churn Analysis, Net Promoter Score, Key Account Management.`;

    await fileInput.setInputFiles({
      name: 'curriculo_B_customer_success.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(cvBText)
    });

    // ── PASSO 5: VERIFICAR QUE TELA PERMANECE NO MEU PERFIL (SEM NAVEGAÇÃO AUTOMÁTICA) ──
    await page.waitForTimeout(2500);
    const profileHeading = page.locator('h2:has-text("Estruturação do Currículo"), h3:has-text("Perfil Profissional")').first();
    await expect(profileHeading).toBeVisible();

    // ── PASSO 6: VERIFICAR QUE A LISTA DE VAGAS RECENTES NÃO EXIBE COZINHEIRO PARA O CURRÍCULO CS ──
    const profilePageContent = await page.content();
    expect(profilePageContent).not.toContain('Cozinheiro Industrial Chefe');

    // ── PASSO 7: NAVEGAR VIA CLIQUE EXPLÍCITO NO CTA "Buscar vagas e ver seu Match" ──
    const ctaButton = page.locator('button:has-text("Buscar vagas e ver seu Match")').first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await page.waitForTimeout(2000);
    } else {
      await navigateSidebar(page, "Compatibilidade");
    }

    // ── PASSO 8: BUSCAR VAGA DE COZINHEIRO E VERIFICAR ZERO VAZAMENTO DO CURRÍCULO A ──
    const searchInputB = page.locator('input[placeholder*="cargo"], input[placeholder*="vaga"]').first();
    if (await searchInputB.isVisible()) {
      await searchInputB.fill('Cozinheiro');
      await searchInputB.press('Enter');
      await page.waitForTimeout(2500);
    }

    const pageContent = await page.content();
    expect(pageContent).not.toContain('Maria Gastronomia');
    expect(pageContent).not.toContain('Culinária Italiana');
    expect(pageContent).not.toContain('Preparo de Molhos');
    expect(pageContent).not.toContain('Segurança Alimentar');

    console.log('✅ TESTE E2E ANTI-VAZAMENTO E ESTABILIDADE DE NAVEGAÇÃO PASSOU COM SUCESSO!');
  });
});
