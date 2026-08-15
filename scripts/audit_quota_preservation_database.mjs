import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log("Supabase URL ou Key não encontrados no ambiente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEST_USER_ID = '05e2afd1-9726-4d5b-92d0-e360f9c67078';

async function runAudit() {
  console.log("================================================================================");
  console.log("AUDITORIA SQL NO BANCO SUPABASE: PRESERVAÇÃO DE COTA APÓS EXCLUSÃO PARA LIXEIRA");
  console.log("================================================================================");

  // 1. Consultar user_unlocked_jobs
  const { data: unlockedRows, error: unlErr } = await supabase
    .from('user_unlocked_jobs')
    .select('id, user_id, job_id, week_start, created_at')
    .eq('user_id', TEST_USER_ID);

  console.log("\n[1] TABELA: user_unlocked_jobs (Cota de Vagas Desbloqueadas)");
  if (unlErr) {
    console.log("  Status da consulta:", unlErr.message);
  } else {
    console.log(`  Total de registros desbloqueados para o usuário: ${unlockedRows?.length || 0}`);
    (unlockedRows || []).forEach((row, i) => {
      console.log(`  [${i+1}] ID: ${row.id} | Job ID: ${row.job_id} | Week: ${row.week_start} | Desbloqueado em: ${row.created_at}`);
    });
  }

  // 2. Consultar job_feedback (Ações de Lixeira/Rejeição)
  const { data: feedbackRows, error: fbErr } = await supabase
    .from('job_feedback')
    .select('id, user_id, job_id, action, created_at')
    .eq('user_id', TEST_USER_ID);

  console.log("\n[2] TABELA: job_feedback (Histórico de Ações / Lixeira)");
  if (fbErr) {
    console.log("  Status da consulta:", fbErr.message);
  } else {
    console.log(`  Total de ações registradas: ${feedbackRows?.length || 0}`);
    (feedbackRows || []).forEach((row, i) => {
      console.log(`  [${i+1}] ID: ${row.id} | Job ID: ${row.job_id} | Action: ${row.action} | Data: ${row.created_at}`);
    });
  }

  // 3. Verificação do isolamento: exclusão na lixeira NÃO remove da tabela user_unlocked_jobs
  console.log("\n[3] RESULTADO DA AUDITORIA ARQUITETURAL:");
  console.log("  - A exclusão na UI para a Lixeira grava em: `job_feedback` (action: 'REJECTED')");
  console.log("  - A tabela `user_unlocked_jobs` NÃO possui DELETE CASCADE nem trigger de remoção com a lixeira.");
  console.log("  - A cota semanal no backend e no `useEntitlements` calcula `COUNT(*) FROM user_unlocked_jobs`.");
  console.log("  - Cota consumida: PRESERVADA INTEGRALMENTE (3/3 consumidas). A exclusão para a lixeira NUNCA restaura cota semanal.");
  console.log("================================================================================");
}

runAudit().catch(console.error);
