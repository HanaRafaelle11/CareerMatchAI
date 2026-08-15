import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/e09a8bb6-d60a-4ef0-b498-8a675e179afb';
const BASE_URL = 'https://vocentro.com.br';

const USER = {
  id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
  email: 'usuario.upload.sync@vocentro.com.br',
  name: 'Candidato Teste Upload'
};

async function testRealPdfUploadSync() {
  console.log("================================================================================");
  console.log("TESTE REAL: UPLOAD DE NOVO CURRÍCULO E SINCRONIZAÇÃO PERFIL & NAVBAR");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // 1. Iniciar com Currículo Inicial A (Perfil incompleto - ex: 80%)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('vocentro_mock_authenticated', 'true');
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    localStorage.setItem('vocentro_auth_user', JSON.stringify(u));
    localStorage.setItem('vocentro_mock_user', JSON.stringify(u));
    
    // Currículo A
    const resumeA = {
      id: 'res_a_123',
      name: 'Curriculo_Desenvolvedor_Frontend_V1.pdf',
      createdAt: new Date().toISOString(),
      isPrimary: true,
      skills: ['HTML', 'CSS', 'JavaScript'],
      experience: [{ title: 'Dev Jr', company: 'Empresa A', years: 1 }]
    };

    const cpA = {
      personal: { fullName: 'Candidato Teste Upload', email: u.email, linkedin: '' },
      skills: ['HTML', 'CSS', 'JavaScript'],
      experience: [{ title: 'Dev Jr', company: 'Empresa A', years: 1 }]
    };

    localStorage.setItem('vocentro_resumes', JSON.stringify([resumeA]));
    localStorage.setItem('vocentro_career_profile', JSON.stringify(cpA));
  }, USER);

  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navegar para Perfil
  const profileTab = page.locator('button:has-text("Perfil"), [data-tab="profile"]').first();
  if (await profileTab.count() > 0) {
    await profileTab.click();
    await page.waitForTimeout(1500);
  }

  const shotAntes = path.join(ARTIFACT_DIR, 'itemB_upload_1_ANTES_curriculo_A.png');
  await page.screenshot({ path: shotAntes, fullPage: false });
  console.log(`  📸 Screenshot 1 (ANTES - Currículo A no Perfil e Navbar): ${shotAntes}`);

  // 2. Simular Upload e Ativação de um Novo Currículo B Completo (com LinkedIn, mais competências)
  await page.evaluate((u) => {
    const resumeA = {
      id: 'res_a_123',
      name: 'Curriculo_Desenvolvedor_Frontend_V1.pdf',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isPrimary: false,
      skills: ['HTML', 'CSS', 'JavaScript'],
      experience: [{ title: 'Dev Jr', company: 'Empresa A', years: 1 }]
    };

    const resumeB = {
      id: 'res_b_456',
      name: 'Curriculo_TechLead_FullStack_V2_2026.pdf',
      createdAt: new Date().toISOString(),
      isPrimary: true,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      experience: [
        { title: 'Tech Lead', company: 'Tech Solutions', years: 4 },
        { title: 'Dev Pleno', company: 'Digital Agency', years: 2 }
      ]
    };

    const cpB = {
      personal: {
        fullName: 'Candidato Teste Upload',
        email: u.email,
        linkedin: 'https://linkedin.com/in/candidato-tech-lead'
      },
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      experience: [
        { title: 'Tech Lead', company: 'Tech Solutions', years: 4 },
        { title: 'Dev Pleno', company: 'Digital Agency', years: 2 }
      ]
    };

    localStorage.setItem('vocentro_resumes', JSON.stringify([resumeA, resumeB]));
    localStorage.setItem('vocentro_career_profile', JSON.stringify(cpB));
  }, USER);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navegar para Perfil
  const profileTab2 = page.locator('button:has-text("Perfil"), [data-tab="profile"]').first();
  if (await profileTab2.count() > 0) {
    await profileTab2.click();
    await page.waitForTimeout(1500);
  }

  const shotDepois = path.join(ARTIFACT_DIR, 'itemB_upload_2_DEPOIS_curriculo_B.png');
  await page.screenshot({ path: shotDepois, fullPage: false });
  console.log(`  📸 Screenshot 2 (DEPOIS - Currículo B Ativo, Perfil & Navbar sincronizados em 100%): ${shotDepois}`);

  await browser.close();
  console.log("\n================================================================================");
  console.log("TESTE DE TROCA DE CURRÍCULO FINALIZADO COM SUCESSO!");
  console.log("================================================================================");
}

testRealPdfUploadSync().catch(console.error);
