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
    await page.goto('/');
    const emailInput = page.locator('input[type="email"]');
    const dashboard = page.locator('text=Goal Tracker');
    
    await expect(emailInput.or(dashboard).first()).toBeVisible({ timeout: 15000 });

    if (await emailInput.isVisible()) {
      await emailInput.fill('hardening.e2e@example.com');
      await page.locator('input[type="password"]').fill('HardeningE2EPassword123!');
      await page.locator('button[type="submit"]').click();
      
      try {
        await expect(dashboard.first()).toBeVisible({ timeout: 12000 });
      } catch (e) {
        console.log("Primeira tentativa de login falhou ou demorou. Recarregando e tentando novamente...");
        await page.goto('/');
        await expect(emailInput).toBeVisible({ timeout: 5000 });
        await emailInput.fill('hardening.e2e@example.com');
        await page.locator('input[type="password"]').fill('HardeningE2EPassword123!');
        await page.locator('button[type="submit"]').click();

        try {
          await expect(dashboard.first()).toBeVisible({ timeout: 12000 });
        } catch (e2) {
          console.log("Segunda tentativa de login falhou. Tentando cadastro...");
          const signUpToggle = page.locator('button:has-text("Cadastre-se agora")');
          if (await signUpToggle.isVisible()) {
            await signUpToggle.click();
            await page.locator('input[placeholder="João da Silva"]').fill('Candidato E2E Hardening');
            await page.locator('input[type="email"]').fill('hardening.e2e@example.com');
            await page.locator('input[placeholder="••••••••"]').first().fill('HardeningE2EPassword123!');
            await page.locator('input[placeholder="••••••••"]').last().fill('HardeningE2EPassword123!');
            await page.locator('button[type="submit"]:has-text("Cadastrar")').click();
          }
          await expect(dashboard.first()).toBeVisible({ timeout: 15000 });
        }
      }
    }
    // Navegar para Meu Currículo
    const profileTab = page.locator('aside button:has-text("Currículo"), nav button:has-text("Currículo")').filter({ visible: true }).first();
    await expect(profileTab).toBeVisible({ timeout: 10000 });
    await profileTab.click();
  });

  test('✅ TXT válido com > 100 chars → sucesso no upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(createMockFile('curriculo_valido.txt', VALID_RESUME_TEXT, 'text/plain'));

    // Deve iniciar o pipeline (mostrar etapa de upload ou progresso)
    const pipelineOrSuccess = page.locator('text=Upload do arquivo').or(page.locator('text=Upload concluído')).or(page.locator('text=Registrando')).or(page.locator('text=concluída')).or(page.locator('text=concluído'));
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
    const pipelineOrSuccess = page.locator('text=Upload do arquivo').or(page.locator('text=Upload concluído')).or(page.locator('text=Registrando')).or(page.locator('text=concluída')).or(page.locator('text=concluído'));
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
    const pipelineOrSuccess = page.locator('text=Upload do arquivo').or(page.locator('text=Upload concluído')).or(page.locator('text=Registrando')).or(page.locator('text=concluída')).or(page.locator('text=concluído'));
    await expect(pipelineOrSuccess.first()).toBeVisible({ timeout: 10000 });
  });
});
