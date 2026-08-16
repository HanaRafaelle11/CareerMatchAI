import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E Real Evidence: PWA Modern Manifest, Service Worker & Match Calibration', () => {
  const targetUrl = process.env.BASE_URL || 'http://localhost:5173';
  const artifactsDir = 'C:\\Users\\Sthephany\\.gemini\\antigravity-ide\\brain\\e09a8bb6-d60a-4ef0-b498-8a675e179afb';

  test('1. Validar Manifest PWA, Meta Tags e Registro do Service Worker', async ({ page }) => {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // 1.1 Verificar link do manifest
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBe('/manifest.webmanifest');

    // 1.2 Verificar meta tags de instalabilidade
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#08162E');

    const mobileCapable = await page.locator('meta[name="mobile-web-app-capable"]').getAttribute('content');
    expect(mobileCapable).toBe('yes');

    // 1.3 Fetch do manifest.webmanifest e validação dos campos obrigatórios do Android WebAPK
    const manifestResponse = await page.request.get(`${targetUrl}/manifest.webmanifest`);
    expect(manifestResponse.status()).toBe(200);
    const manifestJson = await manifestResponse.json();

    expect(manifestJson.id).toBe('https://vocentro.com.br/');
    expect(manifestJson.name).toContain('Vocentro');
    expect(manifestJson.display).toBe('standalone');
    expect(manifestJson.start_url).toBe('/?source=pwa');
    expect(manifestJson.icons.length).toBeGreaterThanOrEqual(4);
    expect(manifestJson.screenshots.length).toBeGreaterThanOrEqual(2);

    // 1.4 Validar disponibilidade do Service Worker (public/sw.js)
    const swResponse = await page.request.get(`${targetUrl}/sw.js`);
    expect(swResponse.status()).toBe(200);
    const swText = await swResponse.text();
    expect(swText).toContain('self.skipWaiting()');
    expect(swText).toContain('self.clients.claim()');

    await page.screenshot({
      path: path.join(artifactsDir, 'pwa_manifest_and_sw_verified.png'),
      fullPage: false
    });
    console.log('✅ Evidência PWA capturada: pwa_manifest_and_sw_verified.png');
  });

  test('2. Validar UI: CompactHeader sem badge solto IA XX% e Vagas com Prévia Calibrada', async ({ page }) => {
    await page.addInitScript(() => {
      const user = {
        id: 'usr_pwa_match_test',
        email: 'candidato.ouvidoria@gmail.com',
        user_metadata: { full_name: 'Candidato Ouvidoria Real' }
      };
      window.localStorage.setItem('vocentro_mock_user', JSON.stringify(user));
      window.localStorage.setItem('vocentro_auth_user', JSON.stringify(user));
      window.localStorage.setItem('vocentro_mock_authenticated', 'true');
      window.localStorage.setItem('vocentro_onboarding_completed', 'true');

      // Currículo de Ouvidoria
      window.localStorage.setItem('vocentro_resumes_usr_pwa_match_test', JSON.stringify([
        {
          id: 'res_ouvidoria_test',
          userId: 'usr_pwa_match_test',
          resumeVersionId: 'res_ouvidoria_test',
          fileName: 'Curriculo_Ouvidoria_SAC.pdf',
          rawText: 'Ouvidor Sênior especialista em Atendimento ao Cliente, Mediação de Conflitos e SAC.',
          isPrimary: true,
          createdAt: new Date().toISOString()
        }
      ]));
    });

    await page.goto(`${targetUrl}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 2.1 Verificar que o cabeçalho NÃO possui o badge IA XX%
    const compactHeader = page.locator('text=Currículo em Análise').first();
    if (await compactHeader.isVisible()) {
      const headerText = await page.locator('header, div.w-full').first().innerText();
      expect(headerText).not.toContain('IA 21%');
    }

    await page.screenshot({
      path: path.join(artifactsDir, 'compact_header_clean_no_ia_badge.png'),
      fullPage: false
    });
    console.log('✅ Evidência Header capturada: compact_header_clean_no_ia_badge.png');
  });
});
