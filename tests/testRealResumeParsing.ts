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

async function testRealResumeParsing() {
  console.log("=========================================");
  console.log("🧪 VALIDANDO PARSING REAL DE CURRÍCULO (GEMINI 3.6)");
  console.log(`URL: ${supabaseUrl}/functions/v1/analyze-resume`);
  console.log("=========================================\n");

  try {
    // 1. Criar usuário confirmado via Admin API (bypassing limits)
    console.log("⏳ Criando usuário confirmado via Admin API...");
    const email = `test.parser.${Date.now()}@example.com`;
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
        console.log("   ✔ Usuário admin criado.");
      } else {
        const adminErr = await adminResponse.text();
        console.warn(`   [WARN] Admin signup falhou: ${adminErr}`);
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

    // Criar perfil correspondente na tabela profiles
    console.log("⏳ Criando perfil correspondente na tabela profiles...");
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
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
    if (!profileRes.ok) {
      const profileErr = await profileRes.text();
      console.warn(`   [WARN] Criação de perfil falhou: ${profileErr}`);
    } else {
      console.log("   ✔ Perfil criado com sucesso!");
    }

    // 2. Upload de arquivo de teste para a storage do Supabase
    console.log("\n⏳ Fazendo upload do currículo de teste para o Storage...");
    const fileName = 'curriculo_teste.txt';
    const storagePath = `${userId}/${fileName}`;
    const cvTextContent = `Alexandre Silva
Email: alexandre@example.com
Telefone: (11) 99999-9999

Resumo Profissional:
Engenheiro de Software com mais de 5 anos de experiência prática, especializado em desenvolvimento web robusto, arquitetura na nuvem e contêineres.

Experiência Profissional:
- Engenheiro de Software Sênior na Linear Technologies (3 anos)
  Atuação com desenvolvimento frontend usando React, TypeScript e backend em Node.js. Configuração de containers Docker e infraestrutura AWS.
- Desenvolvedor Web na Startup Local (2 anos)
  Criação de interfaces responsivas e APIs RESTful em JavaScript.

Competências Técnicas:
React, Node.js, TypeScript, Git, Docker, AWS, PostgreSQL, REST APIs.

Educação:
Bacharelado em Ciência da Computação - Universidade de São Paulo (USP)`;

    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/resumes/${storagePath}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'text/plain'
      },
      body: cvTextContent
    });

    if (!uploadResponse.ok) {
      const uploadErr = await uploadResponse.text();
      throw new Error(`Erro ao fazer upload do arquivo de teste: ${uploadErr}`);
    }
    console.log("   ✔ Arquivo carregado com sucesso na storage!");

    // 3. Criar registro na tabela resume_versions
    console.log("\n⏳ Criando versão do currículo na tabela resume_versions...");
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
        status: 'uploaded',
        file_url: `${supabaseUrl}/storage/v1/object/resumes/${storagePath}`,
        file_name: fileName,
        professional_goal: 'Software Engineer'
      })
    });
    const rvText = await rvRes.text();
    console.log(`   [DEBUG RV] Status: ${rvRes.status}`);
    console.log(`   [DEBUG RV] Response: ${rvText}`);
    const rvData = JSON.parse(rvText);
    if (!rvData || rvData.length === 0 || !rvData[0]) {
      throw new Error(`Erro ao criar resume_version: ${rvText}`);
    }
    const resumeVersionId = rvData[0].id;
    console.log(`   ✔ Registro resume_versions criado. ID: ${resumeVersionId}`);

    // 4. Invocar Edge Function analyze-resume
    console.log("\n⏳ Disparando parsing de IA com o Gemini 3.6 via Edge Function...");
    const startTime = Date.now();
    const parseRes = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storagePath,
        fileName,
        userId,
        resumeVersionId
      })
    });

    const duration = Date.now() - startTime;
    if (!parseRes.ok) {
      console.error(`❌ ERRO NO PARSING DO CURRÍCULO (Status ${parseRes.status}):`);
      console.error(await parseRes.text());
      return;
    }

    const parseData = await parseRes.json();
    console.log(`✔ Resposta do Parsing recebida em ${duration}ms!`);

    console.log("\n--- EVIDÊNCIA DE RETORNO DO PARSING (GEMINI 3.6) ---");
    console.log("Status final:", parseData.status);
    console.log("Chaves estruturadas no banco:");
    
    // Consultar o perfil de carreira criado no banco
    const cpRes = await fetch(`${supabaseUrl}/rest/v1/career_profiles?resume_version_id=eq.${resumeVersionId}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const cpData = await cpRes.json();
    if (cpData && cpData.length > 0) {
      console.log("   ✔ career_profiles criado com sucesso!");
      console.log("   Resumo Consolidado:", cpData[0].summary);
      console.log("   Skills Identificadas:", JSON.stringify(cpData[0].skills));
      console.log("   Experiências Extraídas:", JSON.stringify(cpData[0].experience, null, 2));
    } else {
      console.warn("   ⚠️ Nenhum career_profile encontrado.");
    }
    console.log("----------------------------------------------------\n");

    // 5. Verificar tokens na tabela ai_usage_logs
    console.log("⏳ Consultando consumo em ai_usage_logs...");
    const logsRes = await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs?user_id=eq.${userId}&feature=eq.resume-parsing`, {
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
      console.log("⚠️ Nenhum registro em ai_usage_logs.");
    }

  } catch (err: any) {
    console.error("❌ ERRO NA EXECUÇÃO DO PARSING:", err.message || err);
  }
}

testRealResumeParsing();
