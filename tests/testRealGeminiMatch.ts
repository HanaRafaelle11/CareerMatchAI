import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
let supabaseUrl = '';
let supabaseAnonKey = '';
let supabaseServiceRoleKey = '';

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    const serviceRoleMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    
    if (urlMatch) supabaseUrl = urlMatch[1].replace(/"/g, '').trim();
    if (keyMatch) supabaseAnonKey = keyMatch[1].replace(/"/g, '').trim();
    if (serviceRoleMatch) supabaseServiceRoleKey = serviceRoleMatch[1].replace(/"/g, '').trim();
  }
} catch (e: any) {
  console.error("Erro ao carregar .env:", e.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Credenciais do Supabase ausentes no arquivo .env");
  process.exit(1);
}

async function testRealGemini() {
  console.log("=========================================");
  console.log("🧪 VALIDANDO MATCH REAL COM GEMINI API (NO MOCK)");
  console.log(`URL: ${supabaseUrl}/functions/v1/match-job`);
  console.log("=========================================\n");

  try {
    // 1. Criar usuário confirmado via Admin API (bypassing limits)
    console.log("⏳ Criando usuário confirmado via Admin API...");
    const email = `test.gemini.${Date.now()}@example.com`;
    const password = 'TestUserPassword123!';

    if (supabaseServiceRoleKey) {
      const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true
        })
      });
      if (adminResponse.ok) {
        console.log("   ✔ Usuário admin criado sem enviar e-mail.");
      } else {
        const adminErr = await adminResponse.text();
        console.warn(`   [WARN] Admin signup falhou: ${adminErr}. Tentando normal...`);
      }
    }

    // Fazer login para obter o token
    console.log("⏳ Autenticando usuário...");
    const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const authData = await loginResponse.json();

    if (!authData || !authData.user) {
      throw new Error(`Falha na autenticação. Detalhes: ${JSON.stringify(authData)}`);
    }

    const userToken = authData.access_token;
    const userId = authData.user.id;
    console.log(`✔ Autenticado. User ID: ${userId}`);

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
        full_name: 'Alexandre Silva',
        headline: 'Software Engineer'
      })
    });

    // 2. Inserir dados de teste reais
    console.log("\n⏳ Gravando currículo e perfil estruturado para análise...");
    
    const rRes = await fetch(`${supabaseUrl}/rest/v1/resumes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        file_path: 'resumes/curriculo_alexandre.pdf',
        file_url: 'https://example.com/curriculo_alexandre.pdf',
        raw_text: 'Desenvolvedor com 5 anos de experiência focado em React e ecossistema Node.'
      })
    });
    const rData = await rRes.json();
    if (!rData || rData.length === 0) {
      throw new Error(`Falha ao criar registro na tabela resumes: ${JSON.stringify(rData)}`);
    }
    const resumeId = rData[0].id;
    console.log(`   ✔ Registro criado na tabela resumes. ID: ${resumeId}`);

    const rvRes = await fetch(`${supabaseUrl}/rest/v1/resume_versions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        status: 'completed',
        file_url: 'https://example.com/curriculo_alexandre.pdf',
        file_name: 'Curriculo_Alexandre.pdf',
        professional_goal: 'Software Engineer'
      })
    });
    const rvData = await rvRes.json();
    const resumeVersionId = rvData[0]?.id;

    await fetch(`${supabaseUrl}/rest/v1/career_profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        resume_version_id: resumeVersionId,
        personal: { name: 'Alexandre Silva' },
        experience: [
          { title: 'Software Engineer', company: 'Linear Technologies', duration: '3 anos' },
          { title: 'Desenvolvedor Frontend', company: 'Startup Local', duration: '2 anos' }
        ],
        skills: ['React', 'Node.js', 'TypeScript', 'Git', 'Docker', 'AWS'],
        summary: 'Desenvolvedor com 5 anos de experiência focado em React e ecossistema Node.'
      })
    });

    const jobRes = await fetch(`${supabaseUrl}/rest/v1/jobs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        title: 'Desenvolvedor Full Stack Sênior (Node / React / AWS)',
        description: 'Buscamos engenheiro de software sênior para atuar com React, TypeScript, Node.js, contêineres Docker e serviços de nuvem AWS. Requisitos: mais de 4 anos de experiência.'
      })
    });
    const jobData = await jobRes.json();
    const jobId = jobData[0]?.id;

    // 3. Invocar Edge Function match-job (SEM mockGemini ou headers mock)
    console.log("\n⏳ Efetuando chamada real para a API do Gemini via Edge Function (sem mocks)...");
    const startTime = Date.now();
    const matchRes = await fetch(`${supabaseUrl}/functions/v1/match-job`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeVersionId,
        jobId
      })
    });

    const duration = Date.now() - startTime;
    if (!matchRes.ok) {
      console.error(`❌ ERRO NO RETORNO DA EDGE FUNCTION (Status ${matchRes.status}):`);
      console.error(await matchRes.text());
      return;
    }

    const matchData = await matchRes.json();
    console.log(`✔ Resposta recebida em ${duration}ms!`);
 
    console.log("\n--- EVIDÊNCIA DE RETORNO REAL DO GEMINI ---");
    console.log(`Score de Match:        ${matchData.score_overall}%`);
    console.log(`Strengths (Pontos f.): ${JSON.stringify(matchData.explanation?.strengths, null, 2)}`);
    console.log(`Weaknesses (Gaps):     ${JSON.stringify(matchData.explanation?.weaknesses, null, 2)}`);
    console.log(`Recommendation:        ${matchData.explanation?.details?.technical}`);
    console.log("-------------------------------------------\n");

    // 4. Buscar consumo na tabela ai_usage_logs
    console.log("⏳ Consultando registros de consumo de tokens em ai_usage_logs...");
    const logsRes = await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs?user_id=eq.${userId}&feature=eq.job-matching`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const logsData = await logsRes.json();
    
    if (logsData && logsData.length > 0) {
      console.log("✔ CONSUMO CONFIRMADO NO BANCO DE DADOS:");
      console.log(`   Modelo Usado:   ${logsData[0].model}`);
      console.log(`   Tokens Entrada: ${logsData[0].input_tokens}`);
      console.log(`   Tokens Saída:   ${logsData[0].output_tokens}`);
      console.log(`   Custo Estimado: $${logsData[0].estimated_cost}`);
    } else {
      console.log("⚠️ Nenhum registro de consumo encontrado em ai_usage_logs para este teste.");
    }

  } catch (err: any) {
    console.error("❌ ERRO NA EXECUÇÃO DO TESTE REAL:", err.message || err);
  }
}

testRealGemini();
