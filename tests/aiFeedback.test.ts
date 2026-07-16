// tests/aiFeedback.test.ts
import { PipelineStep } from '../src/domain/models/types';

console.log("====================================================");
console.log("🧪 RUNNING AI POLLING INTERMEDIATE STATES MAPPING TESTS");
console.log("====================================================\n");

// Função mockada do useVocentro para converter logs de banco em PipelineStep[]
function mapLogsToSteps(logs: any[]): PipelineStep[] {
  const hasExtractStarted = logs.some(l => l.step === 'extracting_text');
  const hasExtractCompleted = logs.some(l => l.step === 'extracting_text' && l.status === 'completed');
  const hasGeminiStarted = logs.some(l => l.step === 'analyzing_profile');
  const hasGeminiCompleted = logs.some(l => l.step === 'analyzing_profile' && l.status === 'completed');
  const hasSkillsStarted = logs.some(l => l.step === 'identifying_skills');
  const hasSkillsCompleted = logs.some(l => l.step === 'identifying_skills' && l.status === 'completed');
  const hasSaveStarted = logs.some(l => l.step === 'creating_profile');
  const hasSaveCompleted = logs.some(l => l.step === 'creating_profile' && (l.status === 'completed' || l.status === 'success'));

  return [
    {
      id: 'reading_resume',
      label: hasExtractCompleted ? '✔ Lendo seu currículo' : hasExtractStarted ? 'Lendo seu currículo...' : 'Lendo seu currículo',
      status: hasExtractCompleted ? 'success' : hasExtractStarted ? 'running' : 'pending'
    },
    {
      id: 'identifying_experiences',
      label: hasGeminiCompleted ? '✔ Identificando experiências profissionais' : hasGeminiStarted ? 'Identificando experiências profissionais...' : 'Identificando experiências profissionais',
      status: hasGeminiCompleted ? 'success' : hasGeminiStarted ? 'running' : 'pending'
    },
    {
      id: 'extracting_skills',
      label: hasSkillsCompleted ? '✔ Extraindo competências' : hasSkillsStarted ? 'Extraindo competências...' : 'Extraindo competências',
      status: hasSkillsCompleted ? 'success' : hasSkillsStarted ? 'running' : 'pending'
    },
    {
      id: 'creating_profile',
      label: hasSaveCompleted ? '✔ Criando seu perfil profissional' : hasSaveStarted ? 'Criando seu perfil profissional...' : 'Criando seu perfil profissional',
      status: hasSaveCompleted ? 'success' : hasSaveStarted ? 'running' : 'pending'
    }
  ];
}

let allPassed = true;

// Cenário 1: Extraindo texto
const logs1 = [
  { step: 'extracting_text', status: 'running' }
];
const steps1 = mapLogsToSteps(logs1);
if (steps1[0].status !== 'running' || !steps1[0].label.includes('Lendo seu currículo')) {
  console.log("❌ Falha Cenário 1: Esperava Lendo seu currículo rodando. Obtido:", steps1[0]);
  allPassed = false;
} else {
  console.log("✔ Cenário 1: 'Lendo seu currículo' (status: running) mapeado com sucesso.");
}

// Cenário 2: Extração de texto concluída e analisando perfil com IA
const logs2 = [
  { step: 'extracting_text', status: 'completed' },
  { step: 'analyzing_profile', status: 'running' }
];
const steps2 = mapLogsToSteps(logs2);
if (
  steps2[0].status !== 'success' ||
  steps2[1].status !== 'running' ||
  !steps2[1].label.includes('Identificando experiências profissionais')
) {
  console.log("❌ Falha Cenário 2. Obtido:", steps2);
  allPassed = false;
} else {
  console.log("✔ Cenário 2: 'Identificando experiências profissionais' (status: running) mapeado com sucesso.");
}

// Cenário 3: Extraindo competências
const logs3 = [
  { step: 'extracting_text', status: 'completed' },
  { step: 'analyzing_profile', status: 'completed' },
  { step: 'identifying_skills', status: 'running' }
];
const steps3 = mapLogsToSteps(logs3);
if (
  steps3[0].status !== 'success' ||
  steps3[1].status !== 'success' ||
  steps3[2].status !== 'running' ||
  !steps3[2].label.includes('Extraindo competências')
) {
  console.log("❌ Falha Cenário 3. Obtido:", steps3);
  allPassed = false;
} else {
  console.log("✔ Cenário 3: 'Extraindo competências' (status: running) mapeado com sucesso.");
}

// Cenário 4: Criando perfil profissional
const logs4 = [
  { step: 'extracting_text', status: 'completed' },
  { step: 'analyzing_profile', status: 'completed' },
  { step: 'identifying_skills', status: 'completed' },
  { step: 'creating_profile', status: 'running' }
];
const steps4 = mapLogsToSteps(logs4);
if (
  steps4[0].status !== 'success' ||
  steps4[1].status !== 'success' ||
  steps4[2].status !== 'success' ||
  steps4[3].status !== 'running' ||
  !steps4[3].label.includes('Criando seu perfil profissional')
) {
  console.log("❌ Falha Cenário 4. Obtido:", steps4);
  allPassed = false;
} else {
  console.log("✔ Cenário 4: 'Criando seu perfil profissional' (status: running) mapeado com sucesso.");
}

console.log("----------------------------------------------------");
if (allPassed) {
  console.log("🎉 ALL AI FEEDBACK MAPPING TESTS PASSED!");
  process.exit(0);
} else {
  console.log("🚨 SOME TESTS FAILED.");
  process.exit(1);
}
