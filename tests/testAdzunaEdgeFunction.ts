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

async function testAdzuna() {
  console.log("=========================================");
  console.log("🧪 TESTANDO BUSCA DE VAGAS ADZUNA VIA EDGE FUNCTION");
  console.log(`URL: ${supabaseUrl}/functions/v1/search-jobs`);
  console.log("=========================================\n");

  try {
    // 1. Criar e autenticar usuário temporário de teste
    console.log("⏳ Autenticando usuário temporário para teste de RLS...");
    const email = `test.adzuna.${Date.now()}@example.com`;
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
      if (!loginResponse.ok) {
        throw new Error("Não foi possível autenticar o usuário temporário.");
      }
      authData = await loginResponse.json();
    }

    const userToken = authData.access_token;
    console.log("✔ Autenticado com sucesso.");

    // 2. Chamar a Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/search-jobs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keyword: 'Customer Success Manager',
        location: 'São Paulo',
        pageNum: 1
      })
    });

    const body = await response.json();
    
    if (!response.ok) {
      console.log(`❌ FALHOU: Status ${response.status}`);
      console.log("Erro:", body);
      return;
    }

    console.log(`✔ SUCESSO! Status: ${response.status}`);
    console.log(`Quantidade de vagas retornadas: ${body.results?.length || 0}`);
    if (body.results && body.results.length > 0) {
      console.log("\nPrimeiras vagas encontradas:");
      body.results.slice(0, 3).forEach((v: any, index: number) => {
        console.log(`\n[${index + 1}] ${v.title}`);
        console.log(`    Empresa: ${v.company?.display_name || 'Não informada'}`);
        console.log(`    Local:   ${v.location?.display_name || 'Não informada'}`);
      });
    } else {
      console.log("Nenhuma vaga retornada. Verifique se as chaves da API Adzuna estão configuradas no Supabase.");
    }
  } catch (err: any) {
    console.error("❌ ERRO DE CONEXÃO:", err.message || err);
  }
}

testAdzuna();
