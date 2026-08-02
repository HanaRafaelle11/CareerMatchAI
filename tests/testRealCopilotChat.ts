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

async function testRealCopilotChat() {
  console.log("=========================================");
  console.log("🧪 VALIDANDO ASSISTENTE COPILOTO REAL (GEMINI 3.6)");
  console.log(`URL: ${supabaseUrl}/functions/v1/chat-copilot`);
  console.log("=========================================\n");

  try {
    // 1. Criar usuário temporário para o teste
    console.log("⏳ Criando usuário confirmado via Admin API...");
    const email = `test.copilot.${Date.now()}@example.com`;
    const password = 'TestUserPassword123!';
    let userId = '';

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
        const adminData = await adminResponse.json();
        userId = adminData.id;
        console.log(`   ✔ Usuário admin criado. ID: ${userId}`);
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
    userId = authData.user.id;
    console.log(`✔ Autenticado. User ID: ${userId}`);

    // Inserir perfil mock para fornecer contexto real de carreira
    console.log("⏳ Criando dados de perfil e candidaturas simulados...");
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: userId,
        full_name: 'Guilherme Silva',
        headline: 'Frontend Engineer'
      })
    });

    const mockProfile = {
      user_id: userId,
      summary: 'Frontend Engineer com 4 anos de experiência em React e React Native.',
      skills: [{ name: 'React', proficiency: 'avançado' }, { name: 'TypeScript', proficiency: 'avançado' }],
      experience: [{ companyName: 'Google', role: 'Frontend Engineer', isCurrent: true, startDate: '1 ano atrás', endDate: 'Atual' }]
    };

    const mockApplications = [
      { id: 'app-1', jobTitle: 'Senior Frontend Developer', companyName: 'ASIS Tax Tech', status: 'interview' }
    ];

    const mockJobs = [
      { id: 'job-1', title: 'React Specialist', companyName: 'Linear Tech', description: 'Desenvolvimento React/TS' }
    ];

    // Realizar 3 perguntas em série
    const queries = [
      "onde vejo minhas candidaturas?",
      "como posso melhorar minha preparação?",
      "quais tecnologias devo dominar?"
    ];

    const history: any[] = [];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n💬 Perguntando (Turno ${i + 1}): "${query}"`);
      const startTime = Date.now();

      const chatRes = await fetch(`${supabaseUrl}/functions/v1/chat-copilot`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          history,
          context: {
            careerProfile: mockProfile,
            applications: mockApplications,
            jobs: mockJobs
          }
        })
      });

      const duration = Date.now() - startTime;
      if (!chatRes.ok) {
        console.error(`❌ Erro no Turno ${i + 1} (Status ${chatRes.status}):`, await chatRes.text());
        return;
      }

      const chatData = await chatRes.json();
      console.log(`✔ Resposta recebida em ${duration}ms!`);
      console.log(`🤖 Copiloto: "${chatData.reply}"`);

      // Salvar turnos no histórico da sessão
      history.push({ role: 'user', text: query });
      history.push({ role: 'assistant', text: chatData.reply });
    }

    console.log("\n=========================================");
    console.log("⏳ Consultando registros de consumo de tokens em ai_usage_logs...");
    const logsRes = await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs?user_id=eq.${userId}&feature=eq.copilot-chat`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const logsData = await logsRes.json();
    if (logsData && logsData.length > 0) {
      console.log("✔ CONSUMO CONFIRMADO NO BANCO DE DADOS:");
      console.log(`   Quantidade de Turnos Gravados: ${logsData.length}`);
      logsData.forEach((log: any, idx: number) => {
        console.log(`   Turno ${idx + 1}: Modelo: ${log.model} | Custo Estimado: $${log.estimated_cost}`);
      });
    } else {
      console.log("⚠️ Nenhum registro em ai_usage_logs.");
    }
    console.log("=========================================\n");

  } catch (err: any) {
    console.error("❌ ERRO NO TESTE DO COPILOTO:", err.message || err);
  }
}

testRealCopilotChat();
