// tests/errorExperience.test.ts
import { AppError } from '../src/application/errors/AppError';

console.log("====================================================");
console.log("🧪 RUNNING ERROR EXPERIENCE PAYLOAD TRANSLATION TESTS");
console.log("====================================================\n");

let allPassed = true;

function assertError(
  testName: string, 
  rawError: any, 
  expectedCode: string, 
  expectedTitle: string, 
  expectedMessage: string,
  expectedRetryable: boolean,
  expectedAction?: string
) {
  try {
    const appError = AppError.from(rawError);
    
    const codeMatch = appError.code === expectedCode;
    const titleMatch = appError.title === expectedTitle;
    const msgMatch = appError.message === expectedMessage;
    const retryMatch = appError.retryable === expectedRetryable;
    const actionMatch = expectedAction ? appError.action === expectedAction : true;

    if (codeMatch && titleMatch && msgMatch && retryMatch && actionMatch) {
      console.log(`✔ [PASS] ${testName}`);
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      console.log(`   Got: code=${appError.code}, title="${appError.title}", msg="${appError.message}", retryable=${appError.retryable}, action="${appError.action}"`);
      console.log(`   Exp: code=${expectedCode}, title="${expectedTitle}", msg="${expectedMessage}", retryable=${expectedRetryable}, action="${expectedAction || 'n/a'}"`);
      allPassed = false;
    }
  } catch (err: any) {
    console.log(`❌ [FAIL] ${testName} threw exception:`, err.message);
    allPassed = false;
  }
}

// 1. Gemini Errors
assertError(
  "Gemini Timeout",
  { error: { code: "AI_TIMEOUT" } },
  "AI_TIMEOUT",
  "Não conseguimos concluir sua análise",
  "A inteligência artificial encontrou uma instabilidade temporária.",
  true,
  "Tentar novamente"
);

assertError(
  "Gemini Quota Exceeded",
  new Error("API rate limit exceeded, quota exhausted"),
  "AI_RESPONSE_INVALID", // fallback code, mapped through content check
  "Não conseguimos concluir sua análise",
  "A inteligência artificial encontrou uma instabilidade temporária.",
  true,
  "Tentar novamente"
);

assertError(
  "Gemini Invalid JSON parsing",
  new Error("SyntaxError: Unexpected token < in JSON at position 0"),
  "AI_RESPONSE_INVALID",
  "Não conseguimos concluir sua análise",
  "A inteligência artificial encontrou uma instabilidade temporária.",
  true,
  "Tentar novamente"
);

// 2. Adzuna Errors
assertError(
  "Adzuna Search Unreachable",
  { error: { code: "JOB_SEARCH_UNAVAILABLE" } },
  "JOB_SEARCH_UNAVAILABLE",
  "Busca de Vagas Indisponível",
  "Não conseguimos buscar vagas agora.",
  true,
  "Tentar Novamente"
);

assertError(
  "Adzuna Empty Results",
  { error: { code: "JOB_SEARCH_EMPTY" } },
  "JOB_SEARCH_EMPTY",
  "Nenhuma vaga compatível",
  "Não encontramos vagas públicas com os filtros fornecidos. Tente ajustar os termos ou remover a cidade da busca.",
  false,
  "Ajustar Filtros"
);

// 3. Upload Errors
assertError(
  "Upload Corrupted PDF",
  { error: { code: "PARSE_ERROR" } },
  "PARSE_ERROR",
  "Estrutura de Currículo Inválida",
  "Não conseguimos extrair o texto desse currículo. Verifique se o arquivo não está protegido por senha ou corrompido.",
  false,
  "Enviar novo currículo"
);

assertError(
  "Upload Size Exceeded",
  new Error("RESUME_UPLOAD_INVALID: File size exceeds 10MB limit"),
  "RESUME_UPLOAD_INVALID",
  "Não conseguimos ler esse arquivo",
  "Envie um arquivo em formato PDF com até 10MB de tamanho.",
  false,
  "Enviar novo currículo"
);

console.log("----------------------------------------------------");
if (allPassed) {
  console.log("🎉 ALL ERROR TRANSLATION TESTS PASSED!");
  process.exit(0);
} else {
  console.log("🚨 SOME ERROR TRANSLATION TESTS FAILED.");
  process.exit(1);
}
