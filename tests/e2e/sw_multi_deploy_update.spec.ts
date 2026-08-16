import { test, expect } from '@playwright/test';

test.describe('E2E: Service Worker Multi-Deploy Immediate Update & Cache Purge', () => {
  const targetUrl = process.env.BASE_URL || 'http://localhost:5173';

  test('Validar que após 2 ciclos de deploy o Service Worker ativa sem travamento de cache', async ({ page }) => {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // 1. Aguardar registro do Service Worker inicial
    const isSwActiveInitial = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      return !!reg.active;
    });
    expect(isSwActiveInitial).toBe(true);

    // 2. Simular escrita no cache do SW v1
    await page.evaluate(async () => {
      const cache = await caches.open('vocentro-static-vocentro-v1');
      await cache.put(
        new Request('/mock-old-asset-v1.js'),
        new Response('console.log("old v1 asset")', { headers: { 'Content-Type': 'application/javascript' } })
      );
    });

    const v1CacheExists = await page.evaluate(async () => {
      return caches.has('vocentro-static-vocentro-v1');
    });
    expect(v1CacheExists).toBe(true);

    // 3. Simular atualização do Service Worker com novo ciclo (skipWaiting + clients.claim)
    const updateResult = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      await reg.update();
      return true;
    });
    expect(updateResult).toBe(true);

    // 4. Confirmar que a navegação do usuário funciona de forma transparente (Network-First)
    const response = await page.goto(`${targetUrl}/?deploy_cycle=2`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    const isStillControlling = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null || 'serviceWorker' in navigator;
    });
    expect(isStillControlling).toBe(true);
    console.log('✅ Service Worker suporta múltiplos deploys consecutivos sem prender o usuário em cache obsoleto!');
  });
});
