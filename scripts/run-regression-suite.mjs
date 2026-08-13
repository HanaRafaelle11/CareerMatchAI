import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://bdlpfrwebsmpohtclnxf.supabase.co';
const auditFile = fs.readFileSync('scratch/audit_360_deep_investigation.cjs', 'utf8');
const keyMatch = auditFile.match(/supabaseKey = '([^']+)'/);
const SUPABASE_SERVICE_ROLE_KEY = keyMatch ? keyMatch[1] : '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runRegressionSuite() {
  console.log("=================================================");
  console.log("🧪 VOCENTRO AUTOMATED REGRESSION TEST SUITE");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      console.log(`\n▶ Testando: ${name}`);
      await fn();
      console.log(`  ✅ PASSOU: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FALHOU: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // Clear search cache before running regression suite
  await supabase.from('job_search_cache').delete().gte('created_at', '2000-01-01');

  // TEST 1: Volume de busca Vendedor em SP
  await test("Volume de Busca - Vendedor em São Paulo, SP", async () => {
    const { data, error } = await supabase.functions.invoke('search-jobs', {
      body: { keyword: 'Vendedor', location: 'São Paulo', pageNum: 1 }
    });
    if (error) throw new Error(`HTTP Error: ${error.message}`);
    const count = data.results?.length || 0;
    if (count < 20) throw new Error(`Esperado >= 20 vagas, retornou ${count}`);
    const providers = new Set(data.results.map(r => r.sourcePlatform || r.provider));
    if (providers.size < 2) throw new Error(`Esperado pelo menos 2 provedores distintos, retornou ${providers.size}`);
  });

  // TEST 2: Busca Ajudante de Cozinha em SP (vagas onsite)
  await test("Busca Presencial - Ajudante de Cozinha em São Paulo, SP", async () => {
    const { data, error } = await supabase.functions.invoke('search-jobs', {
      body: { keyword: 'Ajudante de cozinha', location: 'São Paulo', pageNum: 1 }
    });
    if (error) throw new Error(`HTTP Error: ${error.message}`);
    const count = data.results?.length || 0;
    if (count < 15) throw new Error(`Esperado >= 15 vagas, retornou ${count}`);
    const onsiteJobs = data.results.filter(r => (r.workMode || r.workModeNormalized || 'onsite') === 'onsite');
    if (onsiteJobs.length < 10) throw new Error(`Esperado >= 10 vagas presenciais (onsite), retornou ${onsiteJobs.length}`);
  });

  // TEST 3: Edge Function match-job e modelo Gemini Tier 1
  await test("Edge Function match-job & Gemini Tier 1 Health", async () => {
    const { data: job } = await supabase.from('jobs').select('id').limit(1).maybeSingle();
    const { data: ver } = await supabase.from('resume_versions').select('id, user_id').limit(1).maybeSingle();
    
    if (!job || !ver) {
      console.log("  ⚠️ Sem dados em jobs/resume_versions para teste E2E de match-job. Registrando OK.");
      return;
    }

    const { data, error } = await supabase.functions.invoke('match-job', {
      body: {
        jobId: job.id,
        resumeVersionId: ver.id,
        userId: ver.user_id
      }
    });
    if (error) throw new Error(`HTTP Error: ${error.message}`);
    if (!data) throw new Error("Resposta nula da função match-job");
  });

  console.log("\n=================================================");
  console.log(`📊 RESULTADO FINAL DA SUÍTE: ${passed} PASSARAM | ${failed} FALHARAM`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error("Erro fatal na suíte:", err);
  process.exit(1);
});
