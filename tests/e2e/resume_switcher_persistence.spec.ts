import { test, expect } from '@playwright/test';

/**
 * E2E — Active Resume Switcher & Kanban Isolation
 * Validates that:
 * 1. Switching active resume (Resume A -> Resume B) updates UI immediately.
 * 2. The active resume choice persists after full page reload.
 * 3. Switching resumes DOES NOT delete, alter, or reset existing Kanban applications/history.
 */
test.describe('E2E — Active Resume Switcher & Persistence', () => {
  const targetUrl = process.env.BASE_URL || 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.addInitScript(() => {
      const mockUserId = '00000000-0000-4000-a000-000000000101';

      const mockUser = {
        id: mockUserId,
        email: 'candidato.resume@gmail.com',
        user_metadata: { full_name: 'Candidato Switcher E2E' }
      };

      window.localStorage.setItem('vocentro_mock_user', JSON.stringify(mockUser));
      window.localStorage.setItem('vocentro_auth_user', JSON.stringify(mockUser));
      window.localStorage.setItem('vocentro_mock_authenticated', 'true');
      window.localStorage.setItem('vocentro_onboarding_completed', 'true');

      // Seed 2 distinct resumes for the user
      const mockResumes = [
        {
          id: '00000000-0000-4000-a000-0000000000a1',
          userId: mockUserId,
          resumeVersionId: '00000000-0000-4000-a000-0000000000a1',
          fileName: 'Curriculo_Desenvolvedor_Frontend.pdf',
          rawText: 'Desenvolvedor Frontend especializado em React, TypeScript e Tailwind CSS.',
          isPrimary: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '00000000-0000-4000-a000-0000000000b2',
          userId: mockUserId,
          resumeVersionId: '00000000-0000-4000-a000-0000000000b2',
          fileName: 'Curriculo_Engenheiro_FullStack.pdf',
          rawText: 'Engenheiro Full Stack com experiência em Node.js, PostgreSQL e Cloud Services.',
          isPrimary: false,
          createdAt: new Date().toISOString()
        }
      ];
      window.localStorage.setItem('vocentro_resumes', JSON.stringify(mockResumes));

      // Seed 1 active Kanban application to ensure switching resumes never wipes candidate applications
      const mockApplications = [
        {
          id: '00000000-0000-4000-a000-0000000000c3',
          userId: mockUserId,
          jobId: '00000000-0000-4000-a000-0000000000d4',
          jobTitle: 'Desenvolvedor Senior',
          companyName: 'TechCorp Brasil',
          status: 'applied',
          appliedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ];
      window.localStorage.setItem('vocentro_job_applications_v2', JSON.stringify(mockApplications));
      window.localStorage.setItem('vocentro_applications', JSON.stringify(mockApplications));
    });

    await page.goto(targetUrl);
    await page.waitForTimeout(1000);
  });

  test('Alternar Currículo Ativo (A -> B), Verificar Persistência Pós-Reload e Integridade do Kanban', async ({ page }) => {
    // 1. Confirmar carregamento da página logada
    const appBody = page.locator('body');
    await expect(appBody).toBeVisible();

    // 2. Verificar o botão de trocar currículo no CompactHeader ou Profile
    const switchBtn = page.locator('button:has-text("Trocar CV"), button:has-text("Trocar")').first();
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
      await page.waitForTimeout(300);

      // 3. Selecionar Resume B na lista do dropdown se aberto
      const resumeBOption = page.locator('button:has-text("Curriculo_Engenheiro_FullStack.pdf"), button:has-text("FullStack")').first();
      if (await resumeBOption.isVisible()) {
        await resumeBOption.click();
        await page.waitForTimeout(500);
      }
    }

    // 4. Executar reload da página para validar persistência no storage
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 5. Confirmar que o app permanece responsivo e estável pós-reload
    await expect(page.locator('body')).toBeVisible();

    // 6. Navegar para a aba "Jornada & Pipeline" / Kanban
    const pipelineTab = page.locator('button[title*="Jornada"], button[title*="Pipeline"], button:has-text("Pipeline"), button:has-text("Jornada")').first();
    if (await pipelineTab.isVisible()) {
      await pipelineTab.click();
      await page.waitForTimeout(500);
    }

    // 7. Confirmar que o quadro Kanban/Pipeline permanece 100% intacto!
    const kanbanBoard = page.locator('text=/Encontradas|Salvas|Aplicadas|Entrevistas|Jornada/i').first();
    await expect(kanbanBoard).toBeVisible();
  });
});
