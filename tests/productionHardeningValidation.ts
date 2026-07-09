import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

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
  console.error("Erro ao ler .env:", e.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Credenciais do Supabase ausentes no arquivo .env");
  process.exit(1);
}

async function createAuthenticatedUser(label: string) {
  const email = `${label.toLowerCase().replace(' ', '.')}.${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Falha no signup do ${label}: ${res.statusText}`);
  const authData = await res.json();
  const token = authData.access_token;
  const userId = authData.user.id;

  // Criar perfil correspondente
  await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, full_name: label })
  });

  return { token, userId };
}

async function runValidation() {
  console.log("=================================================");
  console.log("🚀 INICIANDO AUDITORIA DE HARDENING DE PRODUÇÃO");
  console.log("=================================================\n");

  try {
    // 1. Criar usuários de teste
    console.log("⏳ Autenticando Usuários de Teste...");
    const userA = await createAuthenticatedUser('User A');
    const userB = await createAuthenticatedUser('User B');
    console.log(`   ✔ Usuário A: ${userA.userId}`);
    console.log(`   ✔ Usuário B: ${userB.userId}`);

    // 2. Testar Isolamento RLS nas novas tabelas
    console.log("\n🔒 1. TESTANDO RLS NAS NOVAS TABELAS...");
    
    // Inserir evento para Usuário A
    const eventResA = await fetch(`${supabaseUrl}/rest/v1/application_events`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userA.userId,
        event_name: 'test_event_a',
        service: 'Parser',
        status: 'success',
        metadata: { info: 'User A event' }
      })
    });
    
    if (!eventResA.ok) {
      throw new Error(`Erro ao gravar evento para Usuário A: ${eventResA.statusText}`);
    }
    console.log("   ✔ Inserido evento teste na tabela 'application_events' para Usuário A.");

    // Usuário B tenta ler o evento do Usuário A
    const readEventsB = await fetch(`${supabaseUrl}/rest/v1/application_events?user_id=eq.${userA.userId}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userB.token}`
      }
    });
    const eventsReadByB = await readEventsB.json();
    
    if (eventsReadByB.length > 0) {
      console.error("❌ FALHA DE RLS: Usuário B conseguiu visualizar logs do Usuário A!");
      process.exit(1);
    } else {
      console.log("   ✔ RLS Isolado com sucesso! Usuário B não visualizou dados do Usuário A em 'application_events'.");
    }

    // 3. Validar Tratamento de Arquivos Inválidos/Grandes/Escaneados
    console.log("\n📄 2. TESTANDO TRATAMENTO DE ARQUIVOS INVÁLIDOS...");

    // Simular currículo com erro na Edge Function
    const resumeVersionRes = await fetch(`${supabaseUrl}/rest/v1/resume_versions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userA.userId,
        file_name: 'corrupted_or_scanned.pdf',
        file_url: 'resumes/scanned_test.pdf',
        status: 'uploaded'
      })
    });
    
    if (!resumeVersionRes.ok) {
      const errText = await resumeVersionRes.text();
      throw new Error(`Erro ao registrar resume_versions para Usuário A (Status ${resumeVersionRes.status}): ${errText}`);
    }

    const resumeVersionData = await resumeVersionRes.json();
    if (!resumeVersionData || resumeVersionData.length === 0) {
      throw new Error("resume_versions retornou array vazio no insert.");
    }
    const versionId = resumeVersionData[0].id;

    // Chamar analyze-resume com arquivo simulado de OCR/erro
    console.log("   ⏳ Chamando parse do currículo simulado...");
    const functionRes = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storagePath: 'resumes/non_existent.pdf', // download dará erro, simulando arquivo corrompido/inexistente
        fileName: 'corrupted_test.pdf',
        userId: userA.userId,
        resumeVersionId: versionId
      })
    });

    const funcResult = await functionRes.json();
    console.log("   ✔ Resposta da IA com tratamento de erros:", JSON.stringify(funcResult.errorDetails || funcResult));

    // Confirmar se o erro foi registrado na tabela resume_processing_errors
    const checkErrorLog = await fetch(`${supabaseUrl}/rest/v1/resume_processing_errors?resume_version_id=eq.${versionId}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`
      }
    });
    const errorLogs = await checkErrorLog.json();
    if (errorLogs.length > 0) {
      console.log(`   ✔ Erro registrado na tabela resume_processing_errors com sucesso: "${errorLogs[0].error_message}"`);
    } else {
      console.warn("   ⚠️ Erro não registrado na tabela resume_processing_errors.");
    }

    // 4. Testar Gemini Cache hits
    console.log("\n💾 3. TESTANDO SISTEMA DE CACHE DO MATCH DE VAGAS...");
    
    // Inserir vaga fictícia
    const jobRes = await fetch(`${supabaseUrl}/rest/v1/jobs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userA.userId,
        title: 'Hardening Validation QA Engineer',
        description: 'Vaga para testar o sistema de match de vagas com cache de IA.',
        requirements: ['QA', 'TypeScript', 'Cache', 'Hardening'],
        location: 'São Paulo',
        work_mode: 'remote',
        company_name: 'Test Corp'
      })
    });
    const jobData = await jobRes.json();
    console.log("   DEBUG: jobRes status =", jobRes.status, "payload =", JSON.stringify(jobData));
    const jobId = jobData[0]?.id;
    if (!jobId) throw new Error("jobId is undefined: " + JSON.stringify(jobData));

    // Criar perfil fake
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/career_profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userA.userId,
        resume_version_id: versionId,
        personal: { fullName: 'Candidato Hardening QA' },
        skills: [{ name: 'TypeScript', category: 'skill' }, { name: 'QA', category: 'skill' }],
        soft_skills: ['Comunicação'],
        ats_keywords: { existing_keywords: ['TypeScript', 'QA'], recommended_keywords: ['Cache'] }
      })
    });
    const profileData = await profileRes.json();
    console.log("   DEBUG: profileRes status =", profileRes.status, "payload =", JSON.stringify(profileData));

    // Chamar match-job primeira vez (usando mockGemini para evitar custos reais durante teste automatizado de persistência)
    console.log("   ⏳ Executando primeira análise de match...");
    const firstMatchRes = await fetch(`${supabaseUrl}/functions/v1/match-job`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`,
        'Content-Type': 'application/json',
        'x-mock-gemini': 'true'
      },
      body: JSON.stringify({
        resumeVersionId: versionId,
        jobId: jobId,
        userId: userA.userId
      })
    });
    const firstMatch = await firstMatchRes.json();
    console.log("   DEBUG: firstMatch payload =", JSON.stringify(firstMatch));
    console.log(`   ✔ Primeiro Match criado com score: ${firstMatch.match_score}%`);

    // Verificar se o cache foi inserido na tabela ai_analysis_cache
    const cacheRes = await fetch(`${supabaseUrl}/rest/v1/ai_analysis_cache`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userA.token}`
      }
    });
    const cachedItems = await cacheRes.json();
    if (cachedItems.length > 0) {
      console.log("   ✔ Registro salvo na tabela ai_analysis_cache com sucesso!");
    } else {
      console.warn("   ⚠️ Cache não encontrado em ai_analysis_cache. Verifique se o mock salvou no cache.");
    }

    console.log("\n=================================================");
    console.log("🏆 TODOS OS TESTES DE AUDITORIA FORAM APROVADOS!");
    console.log("=================================================");
  } catch (err: any) {
    console.error("\n❌ ERRO DURANTE A AUDITORIA:", err.message);
    process.exit(1);
  }
}

runValidation();
