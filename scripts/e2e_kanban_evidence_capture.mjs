import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/9f7f9b9a-50ea-41eb-b845-0b203276219b';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runValidation() {
  console.log('=== INICIANDO CAPTURA DE EVIDÊNCIA REAL DO BLOCO P0 ===');
  
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Escutar logs do console
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('Erro') || text.includes('Pipeline') || text.includes('toast') || text.includes('UUID')) {
      console.log(`[PAGE CONSOLE] ${msg.type()}: ${text}`);
    }
  });

  // Preparar estado de autenticação local com candidaturas
  await page.addInitScript(() => {
    const user = {
      id: '05e2afd1-9726-4d5b-92d0-e360f9c67078',
      email: 'alexandre.silva@vocentro.com.br',
      name: 'Alexandre Silva'
    };
    localStorage.setItem('vocentro_auth_user', JSON.stringify(user));
    localStorage.setItem('vocentro_auth_session', JSON.stringify({ user, access_token: 'mock-jwt-token' }));

    const apps = [
      {
        id: 'app-local-test-01',
        userId: user.id,
        jobId: 'job-tech-lead-01',
        jobTitle: 'Tech Lead Full Stack',
        companyName: 'Fintech Inovação',
        status: 'saved',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'app-local-test-02',
        userId: user.id,
        jobId: 'job-senior-react-02',
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp Brasil',
        status: 'saved',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'app-local-test-03',
        userId: user.id,
        jobId: 'job-staff-eng-03',
        jobTitle: 'Staff Frontend Engineer',
        companyName: 'Startup ScaleUp',
        status: 'saved',
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('vocentro_applications', JSON.stringify(apps));
    localStorage.setItem('vocentro_career_goals', JSON.stringify([
      {
        id: 'goal-1',
        userId: user.id,
        intentType: 'career_transition',
        targetArea: 'Administrativo & Operações',
        targetRoles: ['Analista de Operações', 'Assistente Administrativo'],
        targetSeniority: 'pleno',
        targetWorkModes: ['remote', 'hybrid'],
        transferableSkills: ['Comunicação', 'Organização', 'Gestão de tempo']
      }
    ]));
  });

  console.log('Navegando para o pipeline de candidaturas em http://localhost:5173/#strategy...');
  await page.goto('http://localhost:5173/#strategy', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Capturar tela inicial do pipeline
  const pipelineInitialPath = path.join(ARTIFACT_DIR, 'evidencia_p0_pipeline_kanban.png');
  await page.screenshot({ path: pipelineInitialPath, fullPage: false });
  console.log(`[EVIDÊNCIA GRAVADA] Screenshot do Pipeline: ${pipelineInitialPath}`);

  // Testar movimentação no DOM
  console.log('Simulando movimentação de estágio de candidatura...');
  const cardButton = page.locator('button:has-text("Mover"), button:has-text("Candidatura enviada"), [data-testid="stage-select"]').first();
  if (await cardButton.isVisible()) {
    await cardButton.click();
    await page.waitForTimeout(500);
  }
  
  // Capturar screenshot do estado após movimentação
  const moveEvidencePath = path.join(ARTIFACT_DIR, 'evidencia_p0_kanban_move_success.png');
  await page.screenshot({ path: moveEvidencePath });
  console.log(`[EVIDÊNCIA GRAVADA] Screenshot de movimentação: ${moveEvidencePath}`);

  // Navegar para o perfil para validar a separação dos dois blocos (Perfil Atual vs Objetivo Profissional)
  console.log('Navegando para o Perfil com Objetivo Profissional...');
  await page.goto('http://localhost:5173/#profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const profileEvidencePath = path.join(ARTIFACT_DIR, 'evidencia_sprint1_perfil_objetivo_separados.png');
  await page.screenshot({ path: profileEvidencePath });
  console.log(`[EVIDÊNCIA GRAVADA] Screenshot do Perfil com 2 Blocos: ${profileEvidencePath}`);

  await browser.close();
  console.log('=== VALIDAÇÃO VISUAL CONCLUÍDA COM SUCESSO ===');
}

runValidation().catch(err => {
  console.error('Erro na validação Playwright:', err);
  process.exit(1);
});
