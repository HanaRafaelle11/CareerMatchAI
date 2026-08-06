import { execSync } from 'child_process';
import fs from 'fs';

console.log('Iniciando auditoria Lighthouse em https://vocentro.com.br ...');
try {
  const cmd = `npx -y lighthouse https://vocentro.com.br --preset=desktop --output=json --output-path=./lh-results.json --chrome-flags="--headless=new --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('Auditoria concluída com sucesso!');
} catch (e) {
  console.error('Erro na auditoria Lighthouse:', e);
}
