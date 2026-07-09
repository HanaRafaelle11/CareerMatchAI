import { sanitizeFileName } from '../src/application/utils/fileUtils';

const testCases = [
  {
    input: "Currículo - Rafaela Souza.pdf",
    expected: "Curriculo_-_Rafaela_Souza.pdf"
  },
  {
    input: "João Silva CV.pdf",
    expected: "Joao_Silva_CV.pdf"
  },
  {
    input: "Resume (Final).pdf",
    expected: "Resume__Final_.pdf"
  }
];

console.log("=========================================");
console.log("🧪 RUNNING SANITIZE FILENAME TESTS");
console.log("=========================================");

let allPassed = true;

testCases.forEach(({ input, expected }, idx) => {
  const sanitized = sanitizeFileName(input);
  const timestamp = "1783568869448";
  const simulatedSave = `${timestamp}_${sanitized}`;
  const expectedSave = `${timestamp}_${expected}`;

  if (sanitized === expected && simulatedSave === expectedSave) {
    console.log(`✔ Test ${idx + 1} Passed:`);
    console.log(`  Input:  "${input}"`);
    console.log(`  Output: "${sanitized}"`);
    console.log(`  Saved:  "${simulatedSave}"`);
  } else {
    console.log(`❌ Test ${idx + 1} Failed:`);
    console.log(`  Input:    "${input}"`);
    console.log(`  Expected: "${expected}"`);
    console.log(`  Got:      "${sanitized}"`);
    console.log(`  Saved:    "${simulatedSave}"`);
    allPassed = false;
  }
  console.log("-----------------------------------------");
});

if (allPassed) {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.log("🚨 SOME TESTS FAILED.");
  process.exit(1);
}
