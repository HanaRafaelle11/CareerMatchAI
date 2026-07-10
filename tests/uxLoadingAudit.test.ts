// tests/uxLoadingAudit.test.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

// Lista de padrões proibidos (literais que indicam loadings genéricos de UX ruim)
const forbiddenPatterns = [
  /"Loading\.\.\."/i,
  /'Loading\.\.\.'/i,
  /`Loading\.\.\.`/i,
  /["'`]\s*Aguarde\s*\.\.\.\s*["'`]/i,
  />\s*Loading\s*\.\.\.\s*</i,
  />\s*Aguarde\s*\.\.\.\s*</i
];

function walkDir(dir: string, callback: (filePath: string) => void) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      callback(filePath);
    }
  });
}

console.log("====================================================");
console.log("🔍 INICIANDO AUDITORIA ESTÁTICA DE UX LOADING STATES");
console.log("====================================================\n");

let failures = 0;

walkDir(srcDir, (filePath) => {
  // Ignorar arquivos que sejam definidores de lógica de tratamento de erro ou mocks de teste
  if (filePath.includes('AppError.ts') || filePath.includes('mock') || filePath.includes('test')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    forbiddenPatterns.forEach((pattern) => {
      if (pattern.test(line)) {
        console.log(`❌ FALHA: Encontrado padrão genérico de loading: ${pattern}`);
        console.log(`   Arquivo: file:///${filePath.replace(/\\/g, '/')}#L${idx + 1}`);
        console.log(`   Linha ${idx + 1}: "${line.trim()}"`);
        failures++;
      }
    });
  });
});

if (failures > 0) {
  console.log(`\n🚨 AUDITORIA CONCLUÍDA: Encontradas ${failures} violações de UX Loading.`);
  process.exit(1);
} else {
  console.log("\n🎉 PARABÉNS! Nenhuma string de loading genérico foi encontrada nos componentes.");
  process.exit(0);
}
