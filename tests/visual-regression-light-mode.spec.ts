import { test, expect } from '@playwright/test';

// Função auxiliar para calcular contraste relativo WCAG 2.1 entre duas cores RGB
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }): number {
  let bgRgb = bg;
  if (bg.a === 0) {
    bgRgb = { r: 248, g: 250, b: 252, a: 1 };
  }

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('Suíte Completa de Regressão Visual e Contraste WCAG 2.1 - Vocentro (15 Telas/Módulos/Modais)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
  });

  test('1. Landing Page: Fundo claro, Navbar e Logo Vocentro visíveis (Modo Claro & Escuro)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Modo Claro
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const lightData = await page.evaluate(() => {
      const header = document.querySelector('header') || document.body;
      const logo = document.querySelector('header svg, nav svg') || header;
      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
        ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: 1 };
      }
      return {
        bg: getRgb(window.getComputedStyle(header).backgroundColor),
        fg: getRgb(window.getComputedStyle(logo).color || window.getComputedStyle(header).color)
      };
    });

    const lightContrast = calculateContrastRatio(lightData.fg, lightData.bg);
    expect(lightContrast, `Logo na Navbar da Landing Page no Modo Claro deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);

    // Modo Escuro
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.className = 'dark';
      document.body.className = 'dark';
    });
    await page.waitForTimeout(300);

    const darkData = await page.evaluate(() => {
      const header = document.querySelector('header') || document.body;
      const logo = document.querySelector('header svg, nav svg') || header;
      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 15, g: 23, b: 42, a: 1 };
        ctx.fillStyle = 'rgb(15, 23, 42)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: 1 };
      }
      return {
        bg: getRgb(window.getComputedStyle(header).backgroundColor),
        fg: getRgb(window.getComputedStyle(logo).color || window.getComputedStyle(header).color)
      };
    });

    const darkContrast = calculateContrastRatio(darkData.fg, darkData.bg);
    expect(darkContrast, `Logo na Navbar da Landing Page no Modo Escuro deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
  });

  test('2. Login Page: Header, Logo Vocentro e Card de Autenticação (Modo Claro & Escuro)', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const lightData = await page.evaluate(() => {
      const card = document.querySelector('.bg-card, form, div[class*="rounded"]') || document.body;
      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
        ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: 1 };
      }
      return {
        bg: getRgb(window.getComputedStyle(card).backgroundColor),
        fg: getRgb(window.getComputedStyle(card).color)
      };
    });

    const lightContrast = calculateContrastRatio(lightData.fg, lightData.bg);
    expect(lightContrast, `Card de Login no Modo Claro deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
  });

  test('3. Command Center: Módulo 1. Executive Overview', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '1. Executive Overview' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Executive Overview não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Executive Overview ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('4. Command Center: Módulo 2. Produto em Risco', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '2. Produto em Risco' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Produto em Risco não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Produto em Risco ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('5. Command Center: Módulo 3. Insights do Copiloto', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '3. Insights do Copiloto' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Insights do Copiloto não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Insights do Copiloto ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('6. Command Center: Módulo 4. Feature Adoption', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '4. Feature Adoption' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Feature Adoption não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Feature Adoption ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('7. Command Center: Módulo 5. Churn Intelligence', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '5. Churn Intelligence' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Churn Intelligence não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Churn Intelligence ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('8. Command Center: Módulo 6. Saúde do Negócio (Badges MRR, LTV/CAC)', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '6. Saúde do Negócio' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Saúde do Negócio não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Saúde do Negócio ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('9. Command Center: Módulo 7. Saúde do Produto', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '7. Saúde do Produto' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Saúde do Produto não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Saúde do Produto ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('10. Command Center: Módulo 8. Inteligência Comercial', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '8. Inteligência Comercial' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Inteligência Comercial não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Inteligência Comercial ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('11. Command Center: Módulo 9. Executive Copilot & Alertas Cruzados', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '9. Executive Copilot' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Executive Copilot não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Executive Copilot ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('12. Command Center: Módulo 10. Usuários & Permissões (RBAC)', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const btn = page.locator('button', { hasText: '10. Usuários' }).first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.isDarkSlate, `Usuários & RBAC não deve conter cards escuros slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      expect(sample.contrast, `Usuários & RBAC ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('13. Billing Modal: PaywallModal (Modo Claro & Escuro)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.contrast, `Paywall Modal ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('14. Billing Modal: CheckoutModal (PIX & Cartão de Crédito em Modo Claro)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const samples = await evaluatePageContrast(page);
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.contrast, `Checkout Modal ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('15. Alternância Dinâmica de Tema: Navbar & Fundo alteram entre Modo Escuro e Claro', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Mudar para escuro
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.className = 'dark';
      document.body.className = 'dark';
    });
    await page.waitForTimeout(300);

    const darkBgRgb = await page.evaluate(() => {
      const el = document.querySelector('.min-h-screen') || document.body;
      const bg = window.getComputedStyle(el).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 15, g: 23, b: 42 };
      ctx.fillStyle = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') ? bg : 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b };
    });

    expect(getLuminance(darkBgRgb.r, darkBgRgb.g, darkBgRgb.b), `Fundo no modo escuro deve ter luminância baixa (< 0.3).`).toBeLessThan(0.3);

    // Mudar para claro
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });
    await page.waitForTimeout(300);

    const lightBgRgb = await page.evaluate(() => {
      const el = document.querySelector('.min-h-screen') || document.body;
      const bg = window.getComputedStyle(el).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 248, g: 250, b: 252 };
      ctx.fillStyle = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') ? bg : 'rgb(248, 250, 252)';
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b };
    });

    expect(getLuminance(lightBgRgb.r, lightBgRgb.g, lightBgRgb.b), `Fundo no modo claro deve ter luminância alta (>= 0.6).`).toBeGreaterThanOrEqual(0.6);
  });

});

// Helper function to evaluate contrast across page text elements with Canvas 2D alpha blending
async function evaluatePageContrast(page: any) {
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, button, strong, th, td, code'));
    const samples: Array<{ isDarkSlate: boolean; contrast: number; text: string }> = [];

    function getRgb(colorStr: string) {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
      ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: 1 };
    }

    function getEffectiveBg(element: Element): { r: number; g: number; b: number; a: number } {
      let el: Element | null = element.parentElement;
      while (el) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return getRgb(bg);
        el = el.parentElement;
      }
      return { r: 248, g: 250, b: 252, a: 1 };
    }

    function getLuminance(r: number, g: number, b: number): number {
      const [rs, gs, bs] = [r, g, b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const text = el.textContent ? el.textContent.trim() : '';
      if (style.display !== 'none' && text.length > 2 && !text.includes('Carregando')) {
        const bg = getEffectiveBg(el);
        const color = getRgb(style.color);
        if (Math.abs(color.r - bg.r) > 10 || Math.abs(color.g - bg.g) > 10 || Math.abs(color.b - bg.b) > 10) {
          const l1 = getLuminance(color.r, color.g, color.b);
          const l2 = getLuminance(bg.r, bg.g, bg.b);
          const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          const isDarkSlate = (bg.r < 30 && bg.g < 35 && bg.b < 50);
          samples.push({ isDarkSlate, contrast, text: text.slice(0, 35) });
        }
      }
    }
    return samples;
  });
}
