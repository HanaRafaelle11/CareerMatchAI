// tests/mobileUXAudit.test.ts
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log("=========================================");
console.log("🚀 EXECUTING PLAYWRIGHT MOBILE RESPONSIVENESS TESTS VIA TSX WRAPPER");
console.log("=========================================\n");

try {
  execSync('npx playwright test tests/e2e/mobileUXAudit.spec.ts', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  console.log("\n🎉 MOBILE RESPONSIVENESS TESTS PASSED!");
  process.exit(0);
} catch (err: any) {
  console.error("\n🚨 PLAYWRIGHT TEST EXECUTION FAILED.");
  process.exit(1);
}
