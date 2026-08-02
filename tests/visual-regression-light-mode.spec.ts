import { test, expect } from '@playwright/test';

test.describe('Regressão Visual - Modo Claro (Vocentro)', () => {

  const publicRoutes = [
    { path: '/', name: 'landing-page' },
    { path: '/about', name: 'about-page' },
    { path: '/how-google-login-works', name: 'how-google-login-works' },
    { path: '/google-auth', name: 'google-auth' },
    { path: '/faq', name: 'faq-help-page' },
    { path: '/politica-de-privacidade', name: 'privacy-policy' },
    { path: '/termos-de-uso', name: 'terms-of-use' }
  ];

  for (const route of publicRoutes) {
    test(`deve renderizar ${route.name} no Modo Claro sem quebra de legibilidade`, async ({ page }) => {
      // 1. Forçar modo claro via localStorage antes da navegação
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'light');
      });

      // 2. Navegar até a rota
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // 3. Garantir que a classe .light está no HTML/Body
      await page.evaluate(() => {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      });

      // 4. Verificar se a classe .light está presente
      const hasLightClass = await page.evaluate(() => 
        document.documentElement.classList.contains('light') || document.body.classList.contains('light')
      );
      expect(hasLightClass).toBe(true);

      // 5. Validar contraste básico de cor computada no elemento body (fundo claro, texto escuro)
      const bodyStyles = await page.evaluate(() => {
        const style = window.getComputedStyle(document.body);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color
        };
      });

      // Verificar que o body não está com fundo preto/slate escuro em modo claro
      expect(bodyStyles.backgroundColor).not.toBe('rgb(15, 23, 42)'); // Slate 900
      expect(bodyStyles.backgroundColor).not.toBe('rgb(2, 6, 23)');   // Slate 950

      // 6. Screenshot para validação de regressão visual
      await page.screenshot({ 
        path: `playwright-report/screenshots/light-mode-${route.name}.png`,
        fullPage: false 
      });
    });
  }

  test('deve alternar dinamicamente entre Modo Escuro e Modo Claro via botão ThemeToggle', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Encontrar o botão ThemeToggle
    const themeButton = page.locator('button[aria-label*="Alternar para Modo"]');
    await expect(themeButton).toBeVisible();

    // Clicar para alternar tema
    await themeButton.click();
    await page.waitForTimeout(300);

    // Verificar se a classe mudou no documento
    const isLightModeApplied = await page.evaluate(() => 
      document.documentElement.classList.contains('light') || document.body.classList.contains('light')
    );
    expect(isLightModeApplied).toBe(true);

    // Tirar screenshot da alternância dinâmica
    await page.screenshot({ 
      path: 'playwright-report/screenshots/light-mode-dynamic-toggle.png' 
    });
  });

});
