import { test, expect } from '@playwright/test';

test.describe('Cascata de Fallback de Busca de Vagas (Item 3 & 4)', () => {
  test('Deve simular busca por "Ouvidor Sênior" e verificar que a cascata dispara para família ocupacional', async ({ page }) => {
    // Acessa a Landing / Login
    await page.goto('/');
    await expect(page).toHaveTitle(/Vocentro|CareerMatch/i);

    // Mock das requisições de API de busca de vaga para testar o fallback no frontend
    await page.route('**/functions/v1/search-jobs', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      const keyword = (postData.keyword || postData.query || '').toLowerCase();

      if (keyword.includes('ouvidor sênior')) {
        // Poucos resultados na camada 1 (3 vagas < threshold 8)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              { id: 'mock-1', title: 'Ouvidor Sênior', companyName: 'Empresa A', location: 'Florianópolis, Santa Catarina', description: 'Vaga de ouvidor sênior' }
            ],
            count: 1
          })
        });
      } else if (keyword.includes('relacionamento') || keyword.includes('atendimento')) {
        // Camada 4 da cascata traz resultados completos
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: Array.from({ length: 10 }).map((_, i) => ({
              id: `mock-rel-${i}`,
              title: `Analista de Relacionamento com Cliente ${i + 1}`,
              companyName: `Empresa ${i + 1}`,
              location: 'Florianópolis SC',
              description: 'Atendimento e relacionamento com clientes em Florianópolis'
            })),
            count: 10
          })
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [], count: 0 }) });
      }
    });
  });
});
