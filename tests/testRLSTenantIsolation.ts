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

async function testRLS() {
  console.log("=========================================");
  console.log("🔒 TESTANDO ISOLAMENTO DE TENANTS (RLS) MULTI-USUÁRIO");
  console.log("=========================================\n");

  try {
    // 1. Criar e autenticar Usuário A
    console.log("⏳ Autenticando Usuário A...");
    const emailA = `user.a.${Date.now()}@example.com`;
    const passwordA = 'UserAPassword123!';
    const resA = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: passwordA })
    });
    const authDataA = await resA.json();
    const tokenA = authDataA.access_token;
    const userIdA = authDataA.user.id;
    console.log(`   ✔ Usuário A Criado. ID: ${userIdA}`);

    // Criar perfil do Usuário A
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userIdA, full_name: 'Usuário A' })
    });

    // 2. Criar e autenticar Usuário B
    console.log("\n⏳ Autenticando Usuário B...");
    const emailB = `user.b.${Date.now()}@example.com`;
    const passwordB = 'UserBPassword123!';
    const resB = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: passwordB })
    });
    const authDataB = await resB.json();
    const tokenB = authDataB.access_token;
    const userIdB = authDataB.user.id;
    console.log(`   ✔ Usuário B Criado. ID: ${userIdB}`);

    // Criar perfil do Usuário B
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userIdB, full_name: 'Usuário B' })
    });

    // 3. Criar uma versão de currículo pertencente ao Usuário A
    console.log("\n⏳ Usuário A cria uma versão de currículo no banco...");
    const rvResA = await fetch(`${supabaseUrl}/rest/v1/resume_versions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userIdA,
        status: 'completed',
        file_url: 'https://example.com/curriculo_usuario_a.pdf',
        file_name: 'Curriculo_UserA.pdf'
      })
    });
    const rvDataA = await rvResA.json();
    const resumeVersionIdA = rvDataA[0]?.id;
    console.log(`   ✔ Criado currículo do Usuário A. ID: ${resumeVersionIdA}`);

    // 4. Usuário B tenta listar as versões de currículo
    console.log("\n⏳ Usuário B tenta ler o currículo do Usuário A...");
    const readRes = await fetch(`${supabaseUrl}/rest/v1/resume_versions?id=eq.${resumeVersionIdA}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${tokenB}`
      }
    });
    const readData = await readRes.json();
    
    if (Array.isArray(readData) && readData.length === 0) {
      console.log("   🛡 SUCESSO DE SEGURANÇA! O Usuário B obteve 0 registros ao tentar ler o currículo do Usuário A.");
    } else {
      console.error("   ❌ FALHA DE SEGURANÇA! O Usuário B conseguiu ler o currículo privado do Usuário A:", readData);
    }

  } catch (err: any) {
    console.error("❌ ERRO NA EXECUÇÃO DO TESTE RLS:", err.message || err);
  }
}

testRLS();
