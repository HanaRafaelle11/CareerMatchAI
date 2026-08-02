import { test, expect } from '@playwright/test';

// Função auxiliar para calcular contraste relativo WCAG 2.1 entre duas cores RGB
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(colorStr: string): { r: number; g: number; b: number; a: number } {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return { 
      r: parseInt(match[1]), 
      g: parseInt(match[2]), 
      b: parseInt(match[3]),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1
    };
  }
  return { r: 248, g: 250, b: 252, a: 1 };
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

test.describe('Regressão Visual & Contraste WCAG Completo - Modo Claro (Vocentro)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
  });

  test('1. Landing Page no Modo Claro: Fundo claro e Logo visível', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    await page.evaluate(() => {
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const pageBgRgb = await page.evaluate(() => {
      const container = document.querySelector('.min-h-screen') || document.body;
      const bg = window.getComputedStyle(container).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
      ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    });

    const pageLum = getLuminance(pageBgRgb.r, pageBgRgb.g, pageBgRgb.b);
    expect(pageLum, `Fundo da Landing Page no Modo Claro deve ter luminância >= 0.6.`).toBeGreaterThanOrEqual(0.6);

    const logoData = await page.evaluate(() => {
      const headerEl = document.querySelector('nav, header') || document.body;
      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 15, g: 23, b: 42, a: 1 };
        ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }
      const textStyle = window.getComputedStyle(headerEl);
      return {
        textColor: getRgb(textStyle.color || 'rgb(15, 23, 42)'),
        headerBg: getRgb(textStyle.backgroundColor || 'rgb(255, 255, 255)')
      };
    });

    expect(logoData).not.toBeNull();
    if (logoData) {
      const contrast = calculateContrastRatio(logoData.textColor, logoData.headerBg);
      expect(contrast, `Logo no Header/Navbar deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('2. Command Center: Módulo 1. Executive Overview', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const subtabBtn = page.locator('button', { hasText: '1. Executive Overview' }).first();
    if (await subtabBtn.isVisible()) {
      await subtabBtn.click();
      await page.waitForTimeout(400);
    }

    const cardsEvaluation = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, button, strong'));
      const samples: Array<{ bg: { r: number; g: number; b: number; a: number }; color: { r: number; g: number; b: number; a: number }; text: string; classNames: string }> = [];

      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
        ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }

      function getEffectiveBg(element: Element): { r: number; g: number; b: number; a: number } {
        let el: Element | null = element.parentElement;
        while (el) {
          const bg = window.getComputedStyle(el).backgroundColor;
          const rgb = getRgb(bg);
          if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return rgb;
          el = el.parentElement;
        }
        return { r: 248, g: 250, b: 252, a: 1 };
      }

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && el.textContent && el.textContent.trim().length > 3) {
          const bg = getEffectiveBg(el);
          const color = getRgb(style.color);
          if (Math.abs(color.r - bg.r) > 10 || Math.abs(color.g - bg.g) > 10 || Math.abs(color.b - bg.b) > 10) {
            samples.push({ bg, color, text: el.textContent.trim().slice(0, 30), classNames: el.className });
          }
        }
      }
      return samples;
    });

    expect(cardsEvaluation.length).toBeGreaterThan(0);
    for (const sample of cardsEvaluation) {
      const isDarkSlate = (sample.bg.r < 30 && sample.bg.g < 35 && sample.bg.b < 50);
      expect(isDarkSlate, `Nenhum card de Executive Overview deve manter fundo escuro slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      const contrast = calculateContrastRatio(sample.color, sample.bg);
      expect(contrast, `Executive Overview ("${sample.text}") deve ter contraste WCAG >= 3.0.`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('3. Command Center: Módulo 6. Saúde do Negócio (Badges MRR, LTV/CAC)', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const subtabBtn = page.locator('button', { hasText: '6. Saúde do Negócio' }).first();
    if (await subtabBtn.isVisible()) {
      await subtabBtn.click();
      await page.waitForTimeout(400);
    }

    const cardsEvaluation = await page.evaluate(() => {
      const container = document.querySelector('[class*="space-y"]') || document.body;
      const elements = Array.from(container.querySelectorAll('span, strong, p, h1, h2, h3, h4'));
      const samples: Array<{ bg: { r: number; g: number; b: number; a: number }; color: { r: number; g: number; b: number; a: number }; text: string; classNames: string }> = [];

      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
        ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }

      function getEffectiveBg(element: Element): { r: number; g: number; b: number; a: number } {
        let el: Element | null = element.parentElement;
        while (el) {
          const bg = window.getComputedStyle(el).backgroundColor;
          const rgb = getRgb(bg);
          if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return rgb;
          el = el.parentElement;
        }
        return { r: 248, g: 250, b: 252, a: 1 };
      }

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && el.textContent && el.textContent.trim().length > 2) {
          const bg = getEffectiveBg(el);
          const color = getRgb(style.color);
          if (Math.abs(color.r - bg.r) > 10 || Math.abs(color.g - bg.g) > 10 || Math.abs(color.b - bg.b) > 10) {
            samples.push({ bg, color, text: el.textContent.trim().slice(0, 35), classNames: el.className });
          }
        }
      }
      return samples;
    });

    expect(cardsEvaluation.length).toBeGreaterThan(0);
    for (const sample of cardsEvaluation) {
      const isDarkSlate = (sample.bg.r < 30 && sample.bg.g < 35 && sample.bg.b < 50);
      expect(isDarkSlate, `Nenhum card de Saúde do Negócio deve manter fundo escuro slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      const contrast = calculateContrastRatio(sample.color, sample.bg);
      expect(contrast, `Badge/Texto de Saúde do Negócio ("${sample.text}") deve ter contraste WCAG >= 3.0. Atual: ${contrast.toFixed(2)}:1 (Texto: r=${sample.color.r}, g=${sample.color.g}, b=${sample.color.b})`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('4. Command Center: Módulo 9. Executive Copilot & Alertas Cruzados', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const subtabBtn = page.locator('button', { hasText: '9. Executive Copilot' }).first();
    if (await subtabBtn.isVisible()) {
      await subtabBtn.click();
      await page.waitForTimeout(400);
    }

    const cardsEvaluation = await page.evaluate(() => {
      const container = document.querySelector('[class*="space-y"]') || document.body;
      const elements = Array.from(container.querySelectorAll('span, strong, p, h1, h2, h3, h4'));
      const samples: Array<{ bg: { r: number; g: number; b: number; a: number }; color: { r: number; g: number; b: number; a: number }; text: string; classNames: string }> = [];

      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
        ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }

      function getEffectiveBg(element: Element): { r: number; g: number; b: number; a: number } {
        let el: Element | null = element.parentElement;
        while (el) {
          const bg = window.getComputedStyle(el).backgroundColor;
          const rgb = getRgb(bg);
          if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return rgb;
          el = el.parentElement;
        }
        return { r: 248, g: 250, b: 252, a: 1 };
      }

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && el.textContent && el.textContent.trim().length > 2) {
          const bg = getEffectiveBg(el);
          const color = getRgb(style.color);
          if (Math.abs(color.r - bg.r) > 10 || Math.abs(color.g - bg.g) > 10 || Math.abs(color.b - bg.b) > 10) {
            samples.push({ bg, color, text: el.textContent.trim().slice(0, 35), classNames: el.className });
          }
        }
      }
      return samples;
    });

    expect(cardsEvaluation.length).toBeGreaterThan(0);
    for (const sample of cardsEvaluation) {
      const isDarkSlate = (sample.bg.r < 30 && sample.bg.g < 35 && sample.bg.b < 50);
      expect(isDarkSlate, `Nenhum card de Executive Copilot & Alertas Cruzados deve manter fundo escuro slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      const contrast = calculateContrastRatio(sample.color, sample.bg);
      expect(contrast, `Executive Copilot ("${sample.text}") deve ter contraste WCAG >= 3.0. Atual: ${contrast.toFixed(2)}:1`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('5. Command Center: Módulo 10. Usuários & Permissões (RBAC)', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    const subtabBtn = page.locator('button', { hasText: '10. Usuários' }).first();
    if (await subtabBtn.isVisible()) {
      await subtabBtn.click();
      await page.waitForTimeout(400);
    }

    const cardsEvaluation = await page.evaluate(() => {
      const container = document.querySelector('[class*="space-y"]') || document.body;
      const elements = Array.from(container.querySelectorAll('span, strong, p, h1, h2, h3, h4, th, td'));
      const samples: Array<{ bg: { r: number; g: number; b: number; a: number }; color: { r: number; g: number; b: number; a: number }; text: string; classNames: string }> = [];

      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
        ctx.fillStyle = 'rgb(248, 250, 252)'; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = colorStr; ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }

      function getEffectiveBg(element: Element): { r: number; g: number; b: number; a: number } {
        let el: Element | null = element.parentElement;
        while (el) {
          const bg = window.getComputedStyle(el).backgroundColor;
          const rgb = getRgb(bg);
          if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return rgb;
          el = el.parentElement;
        }
        return { r: 248, g: 250, b: 252, a: 1 };
      }

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && el.textContent && el.textContent.trim().length > 2) {
          const bg = getEffectiveBg(el);
          const color = getRgb(style.color);
          if (Math.abs(color.r - bg.r) > 10 || Math.abs(color.g - bg.g) > 10 || Math.abs(color.b - bg.b) > 10) {
            samples.push({ bg, color, text: el.textContent.trim().slice(0, 35), classNames: el.className });
          }
        }
      }
      return samples;
    });

    expect(cardsEvaluation.length).toBeGreaterThan(0);
    for (const sample of cardsEvaluation) {
      const isDarkSlate = (sample.bg.r < 30 && sample.bg.g < 35 && sample.bg.b < 50);
      expect(isDarkSlate, `Nenhum card de Usuários & RBAC deve manter fundo escuro slate no Modo Claro. Texto: "${sample.text}"`).toBe(false);
      const contrast = calculateContrastRatio(sample.color, sample.bg);
      expect(contrast, `Usuários & RBAC ("${sample.text}") deve ter contraste WCAG >= 3.0. Atual: ${contrast.toFixed(2)}:1`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('6. Alternância Dinâmica de Tema: Fundo altera entre Modo Escuro e Modo Claro', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const themeBtn = page.locator('button[aria-label*="Modo"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(400);
    } else {
      await page.evaluate(() => {
        document.documentElement.className = 'dark';
        document.body.className = 'dark';
      });
    }

    const darkBgRgb = await page.evaluate(() => {
      const container = document.querySelector('.min-h-screen') || document.body;
      const bg = window.getComputedStyle(container).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 15, g: 23, b: 42, a: 1 };
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    });

    expect(getLuminance(darkBgRgb.r, darkBgRgb.g, darkBgRgb.b), `Fundo no modo escuro deve ter luminância baixa (< 0.3).`).toBeLessThan(0.3);

    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(400);
    } else {
      await page.evaluate(() => {
        document.documentElement.className = 'light';
        document.body.className = 'light';
      });
    }

    const lightBgRgb = await page.evaluate(() => {
      const container = document.querySelector('.min-h-screen') || document.body;
      const bg = window.getComputedStyle(container).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    });

    expect(getLuminance(lightBgRgb.r, lightBgRgb.g, lightBgRgb.b), `Fundo no modo claro deve ter luminância alta (>= 0.6).`).toBeGreaterThanOrEqual(0.6);
  });

});
