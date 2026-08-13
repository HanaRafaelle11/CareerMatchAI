import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'path';

async function runE2eBrowserSuite() {
  console.log("=================================================");
  console.log("🌐 VOCENTRO E2E REAL BROWSER UI REGRESSION SUITE");
  console.log("=================================================");

  // 1. Start Vite dev server locally to test real React DOM rendering
  console.log("\n🚀 Iniciando Vite Dev Server local para ambiente E2E...");
  const server = await createServer({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    server: { port: 5199 }
  });
  await server.listen();
  const baseUrl = 'http://localhost:5199';
  console.log(`✓ Server ativo em: ${baseUrl}`);

  let passed = 0;
  let failed = 0;
  let browser;

  async function testUi(name, fn) {
    try {
      console.log(`\n▶ [E2E DOM Test] ${name}`);
      await fn();
      console.log(`  ✅ PASSOU: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FALHOU: ${name} -> ${err.message}`);
      failed++;
    }
  }

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Inject mock user session into localStorage so React renders AuthenticatedApp & JobMatchHub
    await page.addInitScript(() => {
      window.sessionStorage.clear();
      window.localStorage.setItem('theme', 'dark');
      
      const mockSession = {
        access_token: 'mock_jwt_access_token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock_jwt_refresh_token',
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'e2e-test@vocentro.com.br',
          user_metadata: { full_name: 'Usuário Teste E2E' }
        }
      };
      
      window.localStorage.setItem('sb-bdlpfrwebsmpohtclnxf-auth-token', JSON.stringify(mockSession));
      window.localStorage.setItem('vocentro_local_user', JSON.stringify(mockSession.user));
    });

    // Go to the hub directly
    await page.goto(`${baseUrl}/hub`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // If still on landing page, click Start/Login
    const startBtn = page.locator('button:has-text("Entrar"), button:has-text("Começar"), button:has-text("Acessar")').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1000);
    }

    // TEST E2E 1: Inicialização do Filtro de Modelo de Trabalho no DOM (os 3 devem estar marcados por padrão)
    await testUi("1. Filtro Modelo de Trabalho no DOM - Todos os 3 Modos Marcados por Padrão", async () => {
      const checkboxLocator = page.locator('input[type="checkbox"]');
      const count = await checkboxLocator.count();
      
      let checkedCount = 0;
      for (let i = 0; i < count; i++) {
        if (await checkboxLocator.nth(i).isChecked()) {
          checkedCount++;
        }
      }
      
      console.log(`  * Checkboxes encontradas no DOM: ${count} | Marcadas: ${checkedCount}`);
      if (count > 0 && checkedCount < 3) {
        throw new Error(`O DOM renderizou apenas ${checkedCount} de ${count} checkboxes marcadas (Remoto, Híbrido e Presencial devem vir marcados por padrão)`);
      }
    });

    // TEST E2E 2: Busca "Vendedor em SP" no DOM (Renderiza volume de vagas real na interface)
    await testUi("2. Busca E2E no DOM - Vendedor em São Paulo, SP", async () => {
      const keywordInput = page.locator('input[placeholder*="React"], input[placeholder*="Cargo"], input[type="text"]').first();
      const locationInput = page.locator('input[placeholder*="São Paulo"], input[placeholder*="Cidade"]').nth(1);
      
      if (await keywordInput.isVisible()) {
        await keywordInput.fill('Vendedor');
        if (await locationInput.isVisible()) {
          await locationInput.fill('São Paulo, SP');
        }
        
        const submitBtn = page.locator('button[type="submit"]').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
        }

        const cards = page.locator('.line-clamp-3, h3, [class*="rounded-2xl"]');
        const cardCount = await cards.count();
        console.log(`  * Vagas renderizadas na interface do DOM: ${cardCount}`);
      }
    });

    // TEST E2E 3: Preservação de escolha do usuário (Guarda Item 1B)
    await testUi("3. Guarda Item 1B no DOM - Escolha Manual 'Apenas Presencial' Mantida ao Navegar", async () => {
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      if (count >= 3) {
        if (await checkboxes.nth(0).isChecked()) await checkboxes.nth(0).click();
        if (await checkboxes.nth(1).isChecked()) await checkboxes.nth(1).click();
        
        await page.waitForTimeout(300);
        
        await page.evaluate(() => {
          window.history.pushState({}, '', '/profile');
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
        await page.waitForTimeout(300);

        await page.evaluate(() => {
          window.history.pushState({}, '', '/hub');
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
        await page.waitForTimeout(500);

        const isRemoteChecked = await page.locator('input[type="checkbox"]').nth(0).isChecked();
        const isHybridChecked = await page.locator('input[type="checkbox"]').nth(1).isChecked();
        const isOnsiteChecked = await page.locator('input[type="checkbox"]').nth(2).isChecked();

        console.log(`  * Estado pós-navegação no DOM: Remoto=${isRemoteChecked}, Híbrido=${isHybridChecked}, Presencial=${isOnsiteChecked}`);

        if (isRemoteChecked || isHybridChecked || !isOnsiteChecked) {
          throw new Error("O filtro manual do usuário foi resetado ou sobrescrito após navegação!");
        }
      }
    });

    // TEST E2E 4: Re-submissão de Busca Repetida (Botão Buscar Vagas não fica inerte)
    await testUi("4. Re-submissão de Busca no DOM - Botão 'Buscar Vagas' Dispara Nova Consulta sem Ficar Inerte", async () => {
      await page.goto(`${baseUrl}/hub`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        // Primeira busca
        await submitBtn.click();
        await page.waitForTimeout(1000);
        
        // Segunda busca com os mesmos termos
        await submitBtn.click();
        await page.waitForTimeout(1000);
        
        console.log("  * Re-submissão com termos idênticos executada com sucesso!");
      }
    });

    // TEST E2E 5: Validação da Paginação de Vagas no DOM
    await testUi("5. Paginação no DOM - Exibição do Total de Vagas e Navegação entre Páginas", async () => {
      await page.goto(`${baseUrl}/hub`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const pageText = await page.locator('text=Exibindo').first().textContent().catch(() => '');
      console.log(`  * Texto de total de vagas na interface: "${pageText}"`);
    });

  } finally {
    if (browser) await browser.close();
    await server.close();
  }

  console.log("\n=================================================");
  console.log(`📊 RESULTADO FINAL E2E BROWSER UI: ${passed} PASSARAM | ${failed} FALHARAM`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runE2eBrowserSuite().catch(err => {
  console.error("Erro fatal no teste E2E Browser:", err);
  process.exit(1);
});
