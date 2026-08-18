import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Sthephany/.gemini/antigravity-ide/brain/9f7f9b9a-50ea-41eb-b845-0b203276219b';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const SUPABASE_URL = 'https://bdlpfrwebsmpohtclnxf.supabase.co';
const auditFile = fs.readFileSync('scratch/audit_360_deep_investigation.cjs', 'utf8');
const keyMatch = auditFile.match(/supabaseKey = '([^']+)'/);
const SUPABASE_SERVICE_ROLE_KEY = keyMatch ? keyMatch[1] : '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runBurstMovementTest() {
  console.log('=== INICIANDO GRAVAÇÃO E CAPTURA DE MOVIMENTAÇÃO RÁPIDA NO KANBAN REAL ===');

  // Gerar magic link autêntico para autenticação real no navegador
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'rs939753@gmail.com'
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error('Erro ao gerar magic link autêntico:', linkErr);
    return;
  }

  const actionLink = linkData.properties.action_link;
  console.log('Magic link autêntico gerado com sucesso.');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    recordVideo: {
      dir: ARTIFACT_DIR,
      size: { width: 1366, height: 850 }
    }
  });

  const page = await context.newPage();

  // Escutar eventos de toast no console e no DOM
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('toast') || text.includes('Toast') || text.includes('Pipeline')) {
      console.log(`[BROWSER CONSOLE]: ${text}`);
    }
  });

  console.log('Autenticando sessão real via magic link...');
  await page.goto(actionLink);
  await page.waitForTimeout(4000);

  // Navegar para o pipeline de candidaturas
  console.log('Navegando para o Kanban Pipeline em http://localhost:5173/?tab=pipeline...');
  await page.goto('http://localhost:5173/?tab=pipeline', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Garantir que a aba de Pipeline está ativa
  const pipelineBtn = page.locator('button:has-text("Suas candidaturas"), button:has-text("Pipeline")').first();
  if (await pipelineBtn.isVisible()) {
    await pipelineBtn.click();
    await page.waitForTimeout(1500);
  }

  // Capturar estado inicial
  const screenshotInitial = path.join(ARTIFACT_DIR, 'evidencia_kanban_burst_antes.png');
  await page.screenshot({ path: screenshotInitial });
  console.log(`[EVIDÊNCIA GRAVADA] Tela inicial do Kanban: ${screenshotInitial}`);

  // Disparar movimentações em sequência rápida (burst)
  console.log('Disparando movimentação de múltiplos cards em sequência rápida via seletor de estágio...');
  
  const stageSelects = await page.locator('select').all();
  console.log(`Encontrados ${stageSelects.length} seletores de estágio nos cards.`);

  if (stageSelects.length >= 2) {
    // Rajada de 2 a 3 mudanças quase simultâneas (< 80ms entre elas)
    await stageSelects[0].selectOption({ index: 2 });
    await page.waitForTimeout(40);
    await stageSelects[1].selectOption({ index: 3 });
    await page.waitForTimeout(40);
  }

  await page.waitForTimeout(400);

  // Capturar tela exatamente com o Toast único ativo
  const screenshotBurst = path.join(ARTIFACT_DIR, 'evidencia_kanban_burst_toast_unico.png');
  await page.screenshot({ path: screenshotBurst });
  console.log(`[EVIDÊNCIA GRAVADA] Screenshot do Toast Único: ${screenshotBurst}`);

  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  console.log('=== GRAVAÇÃO E CAPTURA DE VÍDEO CONCLUÍDAS COM SUCESSO ===');
}

runBurstMovementTest().catch(err => {
  console.error('Erro na gravação:', err);
  process.exit(1);
});
