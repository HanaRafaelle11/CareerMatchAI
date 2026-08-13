import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Selective & Dependents-Aware Edge Function Deployer with Network Resilience
 * - Detects modified Edge Functions via git diff.
 * - CRITICAL FIX: If `supabase/functions/_shared/` is modified (or argument is 'all'),
 *   re-deploys ALL Edge Functions to ensure shared dependencies (e.g. geminiModels.ts)
 *   are propagated to every dependent function.
 */
function deploySelectiveEdgeFunctions() {
  const args = process.argv.slice(2);
  const explicitFunction = args[0];

  const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
  const allFunctions = fs.readdirSync(functionsDir).filter(name => {
    const fullPath = path.join(functionsDir, name);
    return fs.statSync(fullPath).isDirectory() && !name.startsWith('_') && !name.startsWith('.');
  });

  let targetFunctions = [];

  if (explicitFunction && explicitFunction !== 'auto') {
    if (explicitFunction === 'all') {
      targetFunctions = allFunctions;
    } else {
      targetFunctions = [explicitFunction];
    }
  } else {
    try {
      const diffOutput = execSync('git diff --name-only HEAD~1 HEAD || git diff --name-only', { encoding: 'utf8' });
      const changedFiles = diffOutput.split('\n').map(f => f.trim()).filter(Boolean);

      const functionMatches = new Set();
      let sharedChanged = false;

      changedFiles.forEach(file => {
        if (file.startsWith('supabase/functions/')) {
          const parts = file.split('/');
          if (parts[2]) {
            if (parts[2] === '_shared') {
              sharedChanged = true;
            } else if (allFunctions.includes(parts[2])) {
              functionMatches.add(parts[2]);
            }
          }
        }
      });

      if (sharedChanged) {
        console.log('[SelectiveDeploy] ⚠️ Alteração detectada em supabase/functions/_shared/. Acionando deploy de TODAS as 17 Edge Functions para garantir atualização de dependências compartilhadas.');
        targetFunctions = allFunctions;
      } else {
        targetFunctions = Array.from(functionMatches);
      }
    } catch (err) {
      console.warn('[SelectiveDeploy] Não foi possível obter git diff, executando deploy completo por segurança:', err.message);
      targetFunctions = allFunctions;
    }
  }

  if (targetFunctions.length === 0) {
    console.log('[SelectiveDeploy] Nenhuma Edge Function alterada detectada. Deploy ignorado com segurança.');
    return;
  }

  console.log(`[SelectiveDeploy] ${targetFunctions.length} Edge Functions direcionadas para deploy: ${targetFunctions.join(', ')}`);

  const PROJECT_REF = 'bdlpfrwebsmpohtclnxf';
  const command = `npx supabase functions deploy ${targetFunctions.join(' ')} --project-ref ${PROJECT_REF}`;
  console.log(`[SelectiveDeploy] Executando: ${command}`);

  const maxAttempts = 3;
  let attempt = 1;
  let success = false;

  while (attempt <= maxAttempts && !success) {
    try {
      if (attempt > 1) {
        console.log(`[SelectiveDeploy] Retry #${attempt}/${maxAttempts} após falha de rede/CDN...`);
      }
      execSync(command, { stdio: 'inherit' });
      success = true;
      console.log('[SelectiveDeploy] ✓ Deploy concluído com sucesso!');
    } catch (err) {
      console.error(`[SelectiveDeploy] ⚠️ Tentativa ${attempt}/${maxAttempts} falhou: ${err.message}`);
      if (attempt < maxAttempts) {
        const backoffMs = attempt * 3000;
        console.log(`[SelectiveDeploy] Aguardando ${backoffMs / 1000}s para retentar...`);
        execSync(`node -e "setTimeout(() => {}, ${backoffMs})"`);
      } else {
        console.error('[SelectiveDeploy] ❌ Todas as tentativas de deploy falharam.');
        process.exit(1);
      }
      attempt++;
    }
  }
}

deploySelectiveEdgeFunctions();
