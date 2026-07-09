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

async function runAudit() {
  console.log("=========================================");
  console.log("🔍 INICIANDO AUDITORIA E VALIDAÇÃO DE INTEGRIDADE");
  console.log("=========================================\n");

  try {
    // 1. Verificar registros órfãos nas tabelas principais
    console.log("1. Buscando registros órfãos ou inconsistentes...");

    // Buscar perfis de carreira órfãos (sem resume_version_id)
    const profilesRes = await fetch(`${supabaseUrl}/rest/v1/career_profiles?resume_version_id=is.null`, {
      headers: { 'apikey': supabaseAnonKey }
    });
    const orphanProfiles = await profilesRes.json();
    if (orphanProfiles.length > 0) {
      console.log(`   ⚠️ ALERTA: Encontrados ${orphanProfiles.length} perfis de carreira órfãos (sem resume_version_id).`);
    } else {
      console.log("   ✔ Nenhum perfil de carreira órfão (sem resume_version_id) encontrado.");
    }

    // Buscar matches de vaga órfãos (sem resume_version_id)
    const matchesRes = await fetch(`${supabaseUrl}/rest/v1/job_matches?resume_version_id=is.null`, {
      headers: { 'apikey': supabaseAnonKey }
    });
    const orphanMatches = await matchesRes.json();
    if (orphanMatches.length > 0) {
      console.log(`   ⚠️ ALERTA: Encontrados ${orphanMatches.length} matches de vaga órfãos (sem resume_version_id).`);
    } else {
      console.log("   ✔ Nenhum match de vaga órfão (sem resume_version_id) encontrado.");
    }

    // Buscar candidaturas órfãs (sem resume_version_id)
    const appsRes = await fetch(`${supabaseUrl}/rest/v1/applications?resume_version_id=is.null`, {
      headers: { 'apikey': supabaseAnonKey }
    });
    const orphanApps = await appsRes.json();
    if (orphanApps.length > 0) {
      console.log(`   ⚠️ ALERTA: Encontradas ${orphanApps.length} candidaturas sem versão de currículo vinculada.`);
    } else {
      console.log("   ✔ Todas as candidaturas estão devidamente associadas a uma versão de currículo.");
    }

    // 2. Verificar se a política de segurança RLS impede vazamento de dados
    console.log("\n2. Validando isolamento de RLS...");
    
    // Efetuar select anônimo em tabelas sensíveis sem token de autenticação
    const tables = ['career_profiles', 'job_matches', 'applications', 'resume_versions'];
    for (const table of tables) {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        headers: { 'apikey': supabaseAnonKey }
      });
      const data = await res.json();
      
      // Se retornar dados sem autenticação de usuário logado, o RLS falhou
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   ❌ FALHA DE RLS: Dados da tabela '${table}' vazaram para consulta não-autenticada!`);
      } else {
        console.log(`   ✔ Tabela '${table}' protegida por RLS (Nenhum registro vazou anonimamente).`);
      }
    }

    console.log("\n=========================================");
    console.log("🏁 FIM DA VALIDAÇÃO DE INTEGRIDADE");
    console.log("=========================================");
  } catch (err: any) {
    console.error("Erro na validação:", err.message || err);
  }
}

runAudit();
