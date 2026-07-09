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
  console.error("Erro ao carregar .env:", e.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Credenciais do Supabase ausentes no arquivo .env");
  process.exit(1);
}

async function testRealMatch() {
  console.log("=========================================");
  console.log("🧪 TESTANDO MATCH REAL DE VAGA VIA EDGE FUNCTION");
  console.log(`URL: ${supabaseUrl}/functions/v1/match-job`);
  console.log("=========================================\n");

  try {
    // 1. Criar e autenticar um usuário temporário para o teste
    console.log("⏳ Autenticando usuário temporário para teste...");
    const email = `test.match.${Date.now()}@example.com`;
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
    console.log(`✔ Autenticado. User ID: ${userId}`);

    // 1.5. Criar registro correspondente em profiles
    console.log("⏳ Criando perfil na tabela profiles...");
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: userId,
        full_name: 'Match Test User',
        headline: 'QA Automation Engineer'
      })
    });
    if (!profileRes.ok) {
      console.error("❌ Falha ao criar profile:", await profileRes.text());
      return;
    }

    // 2. Criar um registro mock de perfil de candidato e currículo
    console.log("\n⏳ Inserindo dados iniciais necessários no banco...");
    
    // Inserir resume_version
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
        file_url: 'https://example.com/curriculo.pdf',
        file_name: 'Curriculo_Alexandre.pdf',
        professional_goal: 'Software Engineer'
      })
    });
    if (!rvRes.ok) {
      console.error("❌ Falha ao criar resume_version:", await rvRes.text());
      return;
    }
    const rvData = await rvRes.json();
    const resumeVersionId = rvData[0]?.id;
    console.log(`   ✔ Criado resume_versions. ID: ${resumeVersionId}`);

    // Inserir career_profile
    const cpRes = await fetch(`${supabaseUrl}/rest/v1/career_profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        resume_version_id: resumeVersionId,
        personal: { name: 'Alexandre Silva' },
        experience: [{ title: 'Software Engineer', company: 'Stripe', duration: '5 years' }],
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        summary: 'Experiência de 5 anos com desenvolvimento web.'
      })
    });
    if (!cpRes.ok) {
      console.error("❌ Falha ao criar career_profile:", await cpRes.text());
      return;
    }
    const cpData = await cpRes.json();
    console.log(`   ✔ Criado career_profiles. ID: ${cpData[0]?.id}`);

    // Inserir vaga (job)
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
        title: 'Desenvolvedor React / Node Pleno',
        description: 'Vaga para engenheiro pleno de software. Requisitos: experiência com React, TypeScript, Node.js e Docker. Conhecimento em nuvem AWS é um diferencial.'
      })
    });
    if (!jobRes.ok) {
      console.error("❌ Falha ao criar job:", await jobRes.text());
      return;
    }
    const jobData = await jobRes.json();
    const jobId = jobData[0]?.id;
    console.log(`   ✔ Criado jobs. ID: ${jobId}`);

    // 3. Invocar a Edge Function match-job (com mockGemini: true para garantir processamento rápido no teste)
    console.log("\n⏳ Invocando Edge Function match-job...");
    const matchRes = await fetch(`${supabaseUrl}/functions/v1/match-job`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeVersionId,
        jobId,
        mockGemini: true
      })
    });

    if (!matchRes.ok) {
      console.error(`❌ ERRO AO INVOCAR EDGE FUNCTION: Status ${matchRes.status}`);
      console.error(await matchRes.text());
      return;
    }

    const matchData = await matchRes.json();
    console.log("✔ Resposta da Edge Function recebida com sucesso!");
    console.log("\n--- EVIDÊNCIA DE RETORNO DO MATCH ---");
    console.log(`ID do Match:    ${matchData.id}`);
    console.log(`User ID:        ${matchData.user_id}`);
    console.log(`Score:          ${matchData.match_score}%`);
    console.log(`Strengths:      ${JSON.stringify(matchData.strengths)}`);
    console.log(`Weaknesses:     ${JSON.stringify(matchData.weaknesses)}`);
    console.log(`Recommendation: ${matchData.recommendation}`);
    console.log("-------------------------------------\n");

    // 4. Buscar o registro em job_matches para confirmar a persistência
    console.log("⏳ Buscando registro persistido na tabela job_matches...");
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/job_matches?id=eq.${matchData.id}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const checkData = await checkRes.json();
    
    if (checkData && checkData.length > 0) {
      console.log("✔ SUCESSO! Registro encontrado na tabela job_matches:");
      console.log(JSON.stringify(checkData[0], null, 2));
    } else {
      console.error("❌ ERRO: Registro não encontrado na tabela job_matches!");
    }

  } catch (err: any) {
    console.error("❌ ERRO NA EXECUÇÃO DO TESTE:", err.message || err);
  }
}

testRealMatch();
