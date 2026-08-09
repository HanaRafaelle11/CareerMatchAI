import { execSync } from 'child_process';
import fs from 'fs';

/**
 * Selective Edge Function Deployer
 * Prevents unnecessary deploy of all Edge Functions when only one function changed.
 * Avoids HTTP 522 Cloudflare/esm.sh timeout issues on unchanged functions (e.g. billing-portal).
 */
function deploySelectiveEdgeFunctions() {
  const args = process.argv.slice(2);
  const explicitFunction = args[0];

  let targetFunctions = [];

  if (explicitFunction && explicitFunction !== 'auto') {
    targetFunctions = [explicitFunction];
  } else {
    // Detect modified edge functions via git diff
    try {
      const diffOutput = execSync('git diff --name-only HEAD~1 HEAD || git diff --name-only', { encoding: 'utf8' });
      const changedFiles = diffOutput.split('\n').map(f => f.trim()).filter(Boolean);

      const functionMatches = new Set();
      changedFiles.forEach(file => {
        if (file.startsWith('supabase/functions/')) {
          const parts = file.split('/');
          if (parts[2]) {
            functionMatches.add(parts[2]);
          }
        }
      });

      targetFunctions = Array.from(functionMatches);
    } catch (err) {
      console.warn('[SelectiveDeploy] Não foi possível obter git diff, utilizando lista padrão mínima:', err.message);
      targetFunctions = ['send-survey-email'];
    }
  }

  if (targetFunctions.length === 0) {
    console.log('[SelectiveDeploy] Nenhuma Edge Function alterada detectada. Deploy ignorado com segurança.');
    return;
  }

  console.log(`[SelectiveDeploy] Edge Functions direcionadas para deploy: ${targetFunctions.join(', ')}`);

  const PROJECT_REF = 'bdlpfrwebsmpohtclnxf';
  const command = `npx supabase functions deploy ${targetFunctions.join(' ')} --project-ref ${PROJECT_REF}`;
  console.log(`[SelectiveDeploy] Executando: ${command}`);

  try {
    execSync(command, { stdio: 'inherit' });
    console.log('[SelectiveDeploy] ✓ Deploy concluído com sucesso!');
  } catch (err) {
    console.error('[SelectiveDeploy] ❌ Erro ao realizar deploy direcionado:', err.message);
    process.exit(1);
  }
}

deploySelectiveEdgeFunctions();
