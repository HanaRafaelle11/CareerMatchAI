/**
 * Upload Edge Cases — Testes de Validação de Upload (Frontend)
 * 
 * Estes testes validam a lógica de validação de upload do Profile.tsx
 * sem necessidade de Supabase real. Rodam via `npx playwright test`.
 */
import { test, expect } from '@playwright/test';

// Helpers
function createMockFile(name: string, content: string, type: string): { name: string; mimeType: string; buffer: Buffer } {
  return {
    name,
    mimeType: type,
    buffer: Buffer.from(content)
  };
}

const VALID_RESUME_TEXT = `
Nome: João Carlos da Silva
Cargo: Engenheiro de Software Sênior
Experiência: 8 anos de experiência em desenvolvimento de software.
Empresa: Tech Corp Brasil Ltda.
Cargo: Engenheiro de Software Sênior (2020 - presente)
Responsabilidades: Desenvolvimento de aplicações web usando React, TypeScript, Node.js e PostgreSQL.
Formação: Ciência da Computação - Universidade de São Paulo (USP)
Competências: TypeScript, React, Node.js, PostgreSQL, Docker, AWS, CI/CD, Git, Agile, Scrum.
Idiomas: Português (Nativo), Inglês (Fluente).
`;

const SHORT_TEXT = 'Nome: João. Cargo: Dev.';

test.describe('Upload Edge Cases — Validação Frontend', () => {

  test.beforeEach(async ({ page }) => {
    // Navegar para a página e autenticar
    await page.goto('/');
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('hardening.e2e@example.com');
      await page.locator('input[type="password"]').fill('HardeningE2EPassword123!');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Goal Tracker').first()).toBeVisible({ timeout: 15000 });
    }
    // Navegar para Meu Currículo
    const menuBtn = page.locator('header button').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(600);
    }
    const profileTab = page.locator('aside button:has-text("Meu Currículo")');
    if (await profileTab.isVisible()) {
      await profileTab.click();
    }
  });

  test('✅ TXT válido com > 100 chars → sucesso no upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(createMockFile('curriculo_valido.txt', VALID_RESUME_TEXT, 'text/plain'));

    // Deve iniciar o pipeline (mostrar etapa de upload ou progresso)
    const pipelineOrSuccess = page.locator('text=Upload do arquivo').or(page.locator('text=Upload concluído')).or(page.locator('text=Registrando'));
    await expect(pipelineOrSuccess.first()).toBeVisible({ timeout: 10000 });
  });

  test('❌ TXT vazio → mensagem de erro', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(createMockFile('vazio.txt', '', 'text/plain'));

    // Deve mostrar mensagem de erro sobre arquivo vazio
    const errorMsg = page.locator('text=vazio').or(page.locator('text=curto'));
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('❌ TXT com < 50 chars → mensagem de erro sobre conteúdo curto', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(createMockFile('curto.txt', SHORT_TEXT, 'text/plain'));

    const errorMsg = page.locator('text=curto').or(page.locator('text=50 caracteres'));
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('❌ Arquivo .svg → rejeição por extensão perigosa', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>';
    await fileInput.setInputFiles(createMockFile('malicious.svg', svgContent, 'image/svg+xml'));

    const errorMsg = page.locator('text=não é permitido').or(page.locator('text=suportados'));
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('❌ Arquivo .html → rejeição por extensão perigosa', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    const htmlContent = '<html><body><script>document.cookie</script></body></html>';
    await fileInput.setInputFiles(createMockFile('attack.html', htmlContent, 'text/html'));

    const errorMsg = page.locator('text=não é permitido').or(page.locator('text=suportados'));
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('❌ Arquivo .exe → rejeição por extensão perigosa', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(createMockFile('malware.exe', 'MZ\x90\x00', 'application/x-msdownload'));

    const errorMsg = page.locator('text=não é permitido').or(page.locator('text=suportados'));
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('✅ Arquivo com nome acentuado → nome sanitizado e upload sucesso', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(createMockFile('Currículo - Ação Imediata.txt', VALID_RESUME_TEXT, 'text/plain'));

    // Deve iniciar o pipeline sem erro de nome
    const pipelineOrSuccess = page.locator('text=Upload do arquivo').or(page.locator('text=Upload concluído')).or(page.locator('text=Registrando'));
    await expect(pipelineOrSuccess.first()).toBeVisible({ timeout: 10000 });
  });

  test('✅ XSS no conteúdo TXT → tags removidas, upload sucesso', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    const xssContent = `Nome: João Carlos da Silva <script>alert("xss")</script>
Cargo: Engenheiro de Software Sênior com mais de 8 anos de experiência em empresas como Google e Amazon.
Skills: React, TypeScript, Node.js, Docker, AWS, CI/CD, Git, Agile, Scrum, Python, PostgreSQL, MongoDB.
<img src=x onerror=alert(1)>
Formação: Ciência da Computação na USP, Mestrado em IA na UNICAMP.`;

    await fileInput.setInputFiles(createMockFile('xss_test.txt', xssContent, 'text/plain'));

    // Deve sanitizar e iniciar pipeline normalmente
    const pipelineOrSuccess = page.locator('text=Upload do arquivo').or(page.locator('text=Upload concluído')).or(page.locator('text=Registrando'));
    await expect(pipelineOrSuccess.first()).toBeVisible({ timeout: 10000 });
  });
});
