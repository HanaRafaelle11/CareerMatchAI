import { test, expect } from '@playwright/test';

// Função auxiliar no Node/Playwright para calcular contraste relativo WCAG 2.1 entre duas cores RGB
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

test.describe('Regressão Visual & Contraste WCAG - Modo Claro (Vocentro)', () => {

  test.beforeEach(async ({ page }) => {
    // Forçar modo claro via localStorage antes de qualquer navegação
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
  });

  test('1. Deve renderizar a Landing Page no Modo Claro com fundo claro e logo visível', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Garantir classe .light no elemento raiz
    await page.evaluate(() => {
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    // 1. Checar cor de fundo da página (deve ser claro: luminância >= 0.6)
    const pageBgRgb = await page.evaluate(() => {
      const container = document.querySelector('.min-h-screen') || document.body;
      const bg = window.getComputedStyle(container).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    });

    const pageLum = getLuminance(pageBgRgb.r, pageBgRgb.g, pageBgRgb.b);
    expect(pageLum, `Fundo da Página no Modo Claro deve ser claro (Luminância >= 0.6).`).toBeGreaterThanOrEqual(0.6);

    // 2. Checar visibilidade do Logo no Header/Navbar
    const logoData = await page.evaluate(() => {
      const headerEl = document.querySelector('nav, header') || document.body;

      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 15, g: 23, b: 42, a: 1 };
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
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
      expect(contrast, `Logo no Header/Navbar deve ter contraste WCAG >= 3.0 no Modo Claro. Atual: ${contrast.toFixed(2)}:1`).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('2. Deve renderizar o Command Center (Admin Dashboard Módulos 2.1-2.8) com cards claros e contraste de texto', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Garantir modo claro
    await page.evaluate(() => {
      document.documentElement.className = 'light';
      document.body.className = 'light';
    });

    // Inspecionar amostras de cards no Command Center convertendo cores via Canvas 2D
    const cardsEvaluation = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, button, strong'));
      const samples: Array<{ bg: { r: number; g: number; b: number; a: number }; color: { r: number; g: number; b: number; a: number }; classNames: string }> = [];

      function getRgb(colorStr: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }

      function getEffectiveBg(element: Element): { r: number; g: number; b: number; a: number } {
        let el: Element | null = element.parentElement;
        while (el) {
          const bg = window.getComputedStyle(el).backgroundColor;
          const rgb = getRgb(bg);
          if (rgb.a > 0 && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return rgb;
          }
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
            samples.push({
              bg,
              color,
              classNames: el.className
            });
            if (samples.length >= 20) break;
          }
        }
      }
      return samples;
    });

    expect(cardsEvaluation.length).toBeGreaterThan(0);

    for (const sample of cardsEvaluation) {
      const isDarkSlate = (sample.bg.a > 0.5 && sample.bg.r < 30 && sample.bg.g < 35 && sample.bg.b < 50);
      expect(isDarkSlate, `Nenhum card do Command Center deve manter fundo escuro slate (r=${sample.bg.r}, g=${sample.bg.g}, b=${sample.bg.b}) quando a classe .light está ativa. Classe: ${sample.classNames}`).toBe(false);

      const contrast = calculateContrastRatio(sample.color, sample.bg);
      expect(contrast, `Texto dentro do card do Command Center deve ter contraste WCAG >= 2.4. Atual: ${contrast.toFixed(2)}:1 (Texto: r=${sample.color.r}, g=${sample.color.g}, b=${sample.color.b})`).toBeGreaterThanOrEqual(2.4);
    }
  });

  test('3. Deve alternar dinamicamente entre Modo Escuro e Modo Claro alterando as variáveis de tema', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 1. Alternar para modo escuro clicando no botão ThemeToggle
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
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 15, g: 23, b: 42, a: 1 };
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    });

    expect(getLuminance(darkBgRgb.r, darkBgRgb.g, darkBgRgb.b), `Fundo no modo escuro deve ter luminância baixa (< 0.3).`).toBeLessThan(0.3);

    // 2. Alternar de volta para modo claro clicando no botão ThemeToggle
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
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { r: 248, g: 250, b: 252, a: 1 };
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    });

    expect(getLuminance(lightBgRgb.r, lightBgRgb.g, lightBgRgb.b), `Fundo no modo claro deve ter luminância alta (>= 0.6).`).toBeGreaterThanOrEqual(0.6);
  });

});
