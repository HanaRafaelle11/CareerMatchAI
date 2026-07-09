import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { AppError } from '../src/application/errors/AppError.js';
import { supabase, isSupabaseConfigured } from '../src/infrastructure/api/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    
    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
  }
} catch (e: any) {
  console.error("Erro ao carregar .env:", e.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Credenciais do Supabase ausentes no arquivo .env");
  process.exit(1);
}

// Auxiliar para calcular o progresso como feito no componente ProcessingState
function calculateProgressSimulated(steps: any[]) {
  if (!steps || steps.length === 0) return 0;
  const completedCount = steps.filter(s => s.status === 'success').length;
  const runningCount = steps.filter(s => s.status === 'running').length;
  
  const stepWeight = 100 / steps.length;
  const baseProgress = completedCount * stepWeight;
  const runningBonus = runningCount * (stepWeight / 2);
  
  return Math.min(100, Math.round(baseProgress + runningBonus));
}

async function runUXPremiumTests() {
  console.log("====================================================");
  console.log("🧪 INICIANDO TESTES DE SPRINT UX PREMIUM & TELEMETRIA");
  console.log(`- Supabase URL: ${supabaseUrl}`);
  console.log("====================================================\n");

  try {
    // --------------------------------------------------------
    // 1. TESTE: ERROR MAPPING TEST
    // --------------------------------------------------------
    console.log("⏳ Testando: Error Mapping (Conversões do AppError)...");
    
    // a. Testar erro de conexão de rede
    const networkError = AppError.from(new Error("Failed to fetch from host"));
    if (networkError.code !== 'NETWORK_ERROR' || networkError.severity !== 'error') {
      throw new Error(`Mapeamento incorreto para conexão: ${JSON.stringify(networkError)}`);
    }
    console.log("   ✔ Network Connection Error mapeado para 'NETWORK_ERROR'.");

    // b. Testar erro de sessão JWT
    const jwtError = AppError.from({ message: "JWT expired or token invalid" });
    if (jwtError.code !== 'AUTH_SESSION_EXPIRED' || jwtError.title !== 'Sessão Expirada') {
      throw new Error(`Mapeamento incorreto para JWT: ${JSON.stringify(jwtError)}`);
    }
    console.log("   ✔ Sessão expirada mapeada para 'AUTH_SESSION_EXPIRED'.");

    // c. Testar violação de RLS
    const rlsError = AppError.from(new Error("new row violates row-level security policy"));
    if (rlsError.code !== 'RLS_BLOCKED' || rlsError.severity !== 'error') {
      throw new Error(`Mapeamento incorreto para RLS: ${JSON.stringify(rlsError)}`);
    }
    console.log("   ✔ Segurança RLS bloqueada mapeada para 'RLS_BLOCKED'.");

    // d. Testar erro estruturado de Edge Function (AI_TIMEOUT)
    const functionError = AppError.from({
      errorDetails: {
        code: "AI_TIMEOUT",
        userMessage: "Nossa IA demorou muito a calcular a compatibilidade da vaga.",
        retryable: true
      }
    });
    if (functionError.code !== 'AI_TIMEOUT' || !functionError.retryable) {
      throw new Error(`Mapeamento incorreto para erro de função: ${JSON.stringify(functionError)}`);
    }
    console.log("   ✔ Erro estruturado Deno mapeado para 'AI_TIMEOUT'.");

    console.log("👍 TESTE DE ERROR MAPPING CONCLUÍDO COM SUCESSO!\n");

    // --------------------------------------------------------
    // 2. TESTE: PROCESSING STATE TEST (PROGRESS PERCENTAGE)
    // --------------------------------------------------------
    console.log("⏳ Testando: Calculador de Progresso (ProcessingState)...");
    
    // Testar progresso inicial: 1 rodando, 3 pendentes (4 passos)
    const initialSteps = [
      { id: '1', status: 'running' },
      { id: '2', status: 'pending' },
      { id: '3', status: 'pending' },
      { id: '4', status: 'pending' }
    ];
    const initialProgress = calculateProgressSimulated(initialSteps);
    if (initialProgress !== 13) {
      throw new Error(`Progresso inicial incorreto. Esperava 13%, obteve ${initialProgress}%`);
    }
    console.log("   ✔ Progresso inicial (1 running, 3 pending) calculado em 13%.");

    // Testar progresso mediano: 2 completos, 1 rodando, 1 pendente
    const midSteps = [
      { id: '1', status: 'success' },
      { id: '2', status: 'success' },
      { id: '3', status: 'running' },
      { id: '4', status: 'pending' }
    ];
    const midProgress = calculateProgressSimulated(midSteps);
    if (midProgress !== 63) {
      throw new Error(`Progresso mediano incorreto. Esperava 63%, obteve ${midProgress}%`);
    }
    console.log("   ✔ Progresso intermediário (2 success, 1 running, 1 pending) calculado em 63%.");

    // Testar completo: 4 completos
    const finalSteps = [
      { id: '1', status: 'success' },
      { id: '2', status: 'success' },
      { id: '3', status: 'success' },
      { id: '4', status: 'success' }
    ];
    const finalProgress = calculateProgressSimulated(finalSteps);
    if (finalProgress !== 100) {
      throw new Error(`Progresso final incorreto. Esperava 100%, obteve ${finalProgress}%`);
    }
    console.log("   ✔ Progresso final (4 success) calculado em 100%.");

    console.log("👍 TESTE DE PROCESSING STATE CONCLUÍDO COM SUCESSO!\n");

    // --------------------------------------------------------
    // 3. TESTE: TELEMETRY TEST (DATABASE REGISTRATION)
    // --------------------------------------------------------
    console.log("⏳ Testando: Telemetria (Gravação de application_errors)...");
    
    // Criar e autenticar um usuário de teste
    const email = `test.ux.${Date.now()}@example.com`;
    const password = 'TestUserPassword123!';
    
    const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    let authData;
    if (signupResponse.ok) {
      authData = await signupResponse.json();
    } else {
      const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      authData = await loginResponse.json();
    }

    const userToken = authData.access_token;
    const userId = authData.user.id;
    console.log(`   ✔ Autenticado usuário de teste RLS. User ID: ${userId}`);

    // Criar perfil
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: userId,
        full_name: 'UX Premium Test User',
        headline: 'QA Specialist'
      })
    });

    // Instanciar cliente autenticado
    const authHeaders = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // Gravar log de erro via Telemetria
    console.log("   ⏳ Gravando log de erro simulado no DB...");
    const errorLogResponse = await fetch(`${supabaseUrl}/rest/v1/application_errors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        user_id: userId,
        error_code: 'AI_TIMEOUT',
        component: 'tests/uxPremiumValidation.ts',
        message: 'Nossa inteligência artificial está demorando mais que o esperado.',
        stack_trace: 'Error: Connection Timeout\n  at runUXPremiumTests (tests/uxPremiumValidation.ts)'
      })
    });

    if (!errorLogResponse.ok) {
      const text = await errorLogResponse.text();
      throw new Error(`Falha ao gravar erro de telemetria no banco: ${text}`);
    }

    const loggedErrors = await errorLogResponse.json();
    const logId = loggedErrors[0]?.id;
    if (!logId) {
      throw new Error("Log gravado no DB não retornou ID válido.");
    }
    console.log(`   ✔ Log gravado com sucesso na tabela application_errors. ID: ${logId}`);

    // Consultar log gravado para confirmar consistência
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/application_errors?id=eq.${logId}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const verifyData = await verifyResponse.json();
    if (!verifyData || verifyData.length === 0 || verifyData[0].error_code !== 'AI_TIMEOUT') {
      throw new Error("Erro de consistência: registro recuperado não corresponde ao gravado.");
    }
    console.log("   ✔ Log de erro verificado com sucesso no banco de dados.");

    console.log("👍 TESTE DE TELEMETRIA CONCLUÍDO COM SUCESSO!\n");

    console.log("====================================================");
    console.log("🏁 TODOS OS TESTES DE UX PREMIUM PASSARAM COM SUCESSO!");
    console.log("====================================================");

  } catch (err: any) {
    console.error("❌ ERRO NA EXECUÇÃO DOS TESTES DE UX:", err.message || err);
    process.exit(1);
  }
}

runUXPremiumTests();
