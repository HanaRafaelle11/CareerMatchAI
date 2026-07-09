const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do arquivo .env
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
} catch (e) {
  console.error("Erro ao carregar .env:", e.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Credenciais do Supabase ausentes no arquivo .env");
  process.exit(1);
}

console.log("====================================================");
console.log("🚀 INICIANDO AUDITORIA E TESTES AUTOMATIZADOS CM-AI");
console.log(`- Supabase URL: ${supabaseUrl}`);
console.log("====================================================\n");

let userToken = '';
let currentUserId = '';

async function authenticateTestUser() {
  const email = `test.pipeline.${Date.now()}@example.com`;
  const password = 'SuperSecretPassword123!';
  
  // 1. Tentar Cadastrar o usuário de teste
  console.log(`⏳ Criando usuário de teste RLS: ${email}...`);
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
    console.log("   ✔ Usuário criado com sucesso.");
  } else {
    console.log("   ℹ Cadastrando falhou (possivelmente já existe), tentando login...");
    const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!loginResponse.ok) {
      const txt = await loginResponse.text();
      throw new Error(`Autenticação falhou totalmente: ${txt}`);
    }
    authData = await loginResponse.json();
  }

  userToken = authData.access_token;
  currentUserId = authData.user.id;
  
  // Criar perfil em public.profiles para satisfazer restrições de FK
  const profileUrl = `${supabaseUrl}/rest/v1/profiles`;
  const profileResponse = await fetch(profileUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: currentUserId,
      full_name: 'Test Pipeline User'
    })
  });
  if (!profileResponse.ok) {
    const txt = await profileResponse.text();
    console.warn(`   ⚠ Falha ao criar profile no banco (pode já existir): ${txt}`);
  } else {
    console.log("   ✔ Perfil correspondente criado na tabela 'profiles'.");
  }
  
  console.log(`   ✔ Autenticado. User ID: ${currentUserId}\n`);
}

async function logTestResult(name, promise) {
  process.stdout.write(`⏳ Testando: ${name}... `);
  const startTime = Date.now();
  try {
    const result = await promise;
    const duration = Date.now() - startTime;
    console.log(`\x1b[32m✔ PASSOU\x1b[0m (${duration}ms)`);
    if (result && result.details) {
      console.log(`   └─> Info: ${result.details}`);
    }
    return { success: true, result };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log(`\x1b[31m✘ FALHOU\x1b[0m (${duration}ms)`);
    console.log(`   └─> Erro: \x1b[33m${err.message}\x1b[0m`);
    return { success: false, error: err };
  }
}

async function uploadMockFile(fileName, content, mimeType) {
  const uploadUrl = `${supabaseUrl}/storage/v1/object/resumes/${currentUserId}/${Date.now()}_${fileName}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': mimeType
    },
    body: content
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Upload falhou: ${response.statusText} - ${txt}`);
  }

  const data = await response.json();
  return `${currentUserId}/${data.Key.split('/').pop()}`;
}

async function createMockResumeVersion(fileName, fileUrl) {
  const insertUrl = `${supabaseUrl}/rest/v1/resume_versions`;
  const response = await fetch(insertUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: currentUserId,
      file_url: fileUrl,
      file_name: fileName,
      status: 'uploaded'
    })
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Inserção no banco falhou: ${response.statusText} - ${txt}`);
  }

  const data = await response.json();
  return data[0];
}

async function runPipeline() {
  try {
    await authenticateTestUser();
  } catch (err) {
    console.error("Erro fatal de autenticação de teste:", err.message);
    process.exit(1);
  }

  // Teste 1: PDF inválido / corrompido
  await logTestResult("PDF Inválido ou Corrompido", (async () => {
    const storagePath = await uploadMockFile("corrupted.pdf", "corrupted-pdf-header-and-garbage-data-hello", "application/pdf");
    const version = await createMockResumeVersion("Currículo Corrompido Teste", `${supabaseUrl}/storage/v1/object/public/resumes/${storagePath}`);
    
    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storagePath,
        fileName: "corrupted.pdf",
        userId: currentUserId,
        resumeVersionId: version.id
      })
    });

    const body = await parseResponse.json();
    
    if (parseResponse.ok) {
      throw new Error(`Deveria ter falhado, mas retornou status ${parseResponse.status}`);
    }

    const statusCheckResponse = await fetch(`${supabaseUrl}/rest/v1/resume_versions?id=eq.${version.id}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const versions = await statusCheckResponse.json();
    if (versions[0].status !== 'failed') {
      throw new Error(`Esperava status 'failed', mas obteve: '${versions[0].status}'`);
    }

    // Verificar se o erro foi registrado na tabela resume_processing_errors
    const errorsCheckResponse = await fetch(`${supabaseUrl}/rest/v1/resume_processing_errors?resume_version_id=eq.${version.id}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const errorsList = await errorsCheckResponse.json();
    if (errorsList.length === 0) {
      throw new Error("Esperava um registro correspondente na tabela resume_processing_errors, mas nenhum erro foi registrado.");
    }

    // Verificar logs de etapas de processamento (resume_processing_logs)
    const logsCheckResponse = await fetch(`${supabaseUrl}/rest/v1/resume_processing_logs?resume_version_id=eq.${version.id}&step=eq.failed`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const logsList = await logsCheckResponse.json();
    if (logsList.length === 0) {
      throw new Error("Esperava log de etapa 'failed' registrado na tabela resume_processing_logs.");
    }

    return { details: `Erro registrado no DB. Log de processamento auditado: "${logsList[0].error_message}"` };
  })());

  // Teste 2: Currículo Vazio
  await logTestResult("Currículo Vazio", (async () => {
    const storagePath = await uploadMockFile("empty.txt", "    \n   \t   ", "text/plain");
    const version = await createMockResumeVersion("Currículo Vazio Teste", `${supabaseUrl}/storage/v1/object/public/resumes/${storagePath}`);

    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storagePath,
        fileName: "empty.txt",
        userId: currentUserId,
        resumeVersionId: version.id
      })
    });

    const body = await parseResponse.json();

    if (parseResponse.ok) {
      throw new Error(`Deveria ter falhado por falta de texto legível, mas obteve status ${parseResponse.status}`);
    }

    // Verificar se o log registrou falha
    const logsCheckResponse = await fetch(`${supabaseUrl}/rest/v1/resume_processing_logs?resume_version_id=eq.${version.id}&step=eq.failed`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const logsList = await logsCheckResponse.json();
    if (logsList.length === 0) {
      throw new Error("Esperava log de etapa 'failed' registrado na tabela resume_processing_logs para currículo vazio.");
    }

    return { details: `Falha graciosamente controlada no DB: "${logsList[0].error_message}"` };
  })());

  // Teste 3: Currículo Sem Experiência (Deve ser rejeitado de acordo com as regras da Fase 5)
  let successVersionId = '';
  await logTestResult("Currículo Sem Experiência Profissional (Deve falhar)", (async () => {
    const mockTxt = `
      NOME: Amanda Teste da Silva
      CONTATO: amanda.teste@email.com | (11) 99999-9999
      OBJETIVO: Ingressar na área de desenvolvimento de software.
      
      ESCOLARIDADE:
      - Bacharelado em Ciência da Computação, USP (Início: 2024 - Cursando)
      
      HABILIDADES:
      - Python (Básico)
      - Lógica de programação
      - Git e GitHub
    `;

    const storagePath = await uploadMockFile("no_experience.txt", mockTxt, "text/plain");
    const version = await createMockResumeVersion("Currículo Sem Exp Teste", `${supabaseUrl}/storage/v1/object/public/resumes/${storagePath}`);

    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'x-mock-gemini': 'true'
      },
      body: JSON.stringify({
        storagePath,
        fileName: "no_experience.txt",
        userId: currentUserId,
        resumeVersionId: version.id
      })
    });

    if (parseResponse.ok) {
      throw new Error(`Deveria ter falhado por falta de experiências profissionais, mas retornou status ${parseResponse.status}`);
    }

    // Verificar se o status no banco mudou para 'failed'
    const statusCheckResponse = await fetch(`${supabaseUrl}/rest/v1/resume_versions?id=eq.${version.id}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const versions = await statusCheckResponse.json();
    if (versions[0].status !== 'failed') {
      throw new Error(`Esperava status 'failed', mas obteve: '${versions[0].status}'`);
    }

    // Verificar se o log registrou falha
    const logsCheckResponse = await fetch(`${supabaseUrl}/rest/v1/resume_processing_logs?resume_version_id=eq.${version.id}&step=eq.failed`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const logsList = await logsCheckResponse.json();
    if (logsList.length === 0) {
      throw new Error("Esperava log de etapa 'failed' registrado na tabela resume_processing_logs para currículo sem experiência.");
    }

    return { details: `Rejeitado graciosamente conforme a Fase 5: "${logsList[0].error_message}"` };
  })());

  // Teste 4: Currículo Completo & Camada de Insights
  await logTestResult("Currículo Completo & Camada de Insights", (async () => {
    const mockTxt = `
      NOME: Hana Oliveira de Souza
      CONTATO: hana.oliveira@email.com | (11) 98888-8888 | linkedin.com/in/hana-oliveira
      Headline: Gerente de Customer Success e Operações B2B
      
      RESUMO:
      Mais de 10 anos liderando áreas de Customer Success e Operações B2B de SaaS e fintechs. Especialista em redução de Churn, NPS, CSAT e automações.
      
      EXPERIÊNCIA:
      - Omie: Supervisora de Customer Success & Operations (Jan/2021 até o momento)
        * Responsável pela retenção de 1500 contas de alta receita.
        * Reduzi o Churn trimestral em 4.5% através de planos estruturados de engajamento.
      - Acertpix: Gerente de Customer Success (Fev/2016 a Dez/2020)
        * Estruturei a área de CS do zero, implantando a ferramenta Salesforce.
      
      FORMAÇÃO:
      - MBA em Gestão Estratégica de Negócios, FGV (2018 - 2020)
      - Graduação em Administração de Empresas, Mackenzie (2012 - 2016)
      
      HABILIDADES:
      - Gestão de Churn, NPS, Health Score, Salesforce, Zendesk, Metodologias Ágeis, Língua Inglesa Avançada.
    `;

    const storagePath = await uploadMockFile("complex_resume.txt", mockTxt, "text/plain");
    const version = await createMockResumeVersion("Currículo Complexo Teste", `${supabaseUrl}/storage/v1/object/public/resumes/${storagePath}`);
    successVersionId = version.id;

    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'x-mock-gemini': 'true'
      },
      body: JSON.stringify({
        storagePath,
        fileName: "complex_resume.txt",
        userId: currentUserId,
        resumeVersionId: version.id
      })
    });

    if (!parseResponse.ok) {
      const txt = await parseResponse.text();
      throw new Error(`Erro no processamento do parser: ${txt}`);
    }

    const body = await parseResponse.json();

    if (!body.careerInsights || !body.careerInsights.seniority_prediction) {
      throw new Error("Camada de insights (career_insights) não foi gerada ou está incompleta.");
    }

    const seniority = body.careerInsights.seniority_prediction;
    if (typeof seniority.confidence !== 'number' || !seniority.reason) {
      throw new Error(`Campos inferidos incorretos no insights: ${JSON.stringify(seniority)}`);
    }

    // Validar taxonomia de senioridade
    const allowedSeniorities = ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Head', 'Director', 'VP'];
    if (!allowedSeniorities.includes(seniority.value)) {
      throw new Error(`Senioridade retornada '${seniority.value}' não pertence à taxonomia permitida.`);
    }

    // Validar source_type de telemetria nos insights
    if (seniority.source_type !== 'inferred') {
      throw new Error(`Seniority source_type esperado 'inferred', obteve: '${seniority.source_type}'`);
    }

    // Validar ATS Keywords separados
    const profile = body.careerProfile;
    if (!profile.ats_keywords || !profile.ats_keywords.existing_keywords || !profile.ats_keywords.missing_keywords) {
      throw new Error(`ATS keywords não foram divididos corretamente: ${JSON.stringify(profile.ats_keywords)}`);
    }

    // Validar Metodologias estruturadas com source_type
    const methodologies = body.careerInsights.methodologies;
    if (!Array.isArray(methodologies) || methodologies.length === 0 || !methodologies[0].methodology_name || !methodologies[0].source_type) {
      throw new Error(`Metodologias não foram estruturadas corretamente: ${JSON.stringify(methodologies)}`);
    }

    // Verificar logs de etapas de processamento (resume_processing_logs)
    const logsCheckResponse = await fetch(`${supabaseUrl}/rest/v1/resume_processing_logs?resume_version_id=eq.${version.id}&step=eq.save_completed`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`
      }
    });
    const logsList = await logsCheckResponse.json();
    if (logsList.length === 0) {
      throw new Error("Esperava log de etapa 'save_completed' registrado na tabela resume_processing_logs.");
    }

    return { details: `Senioridade: '${seniority.value}' (${seniority.source_type}). Logs de processamento 'save_completed' confirmados no DB.` };
  })());

  // Teste 5: Falha no Gemini (ID Inválido de Versão)
  await logTestResult("Proteção & Falha Controlada do Gemini", (async () => {
    const storagePath = await uploadMockFile("fake.txt", "Fake resume content for key failure test", "text/plain");

    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storagePath,
        fileName: "fake.txt",
        userId: currentUserId,
        resumeVersionId: '00000000-0000-0000-0000-000000000000'
      })
    });

    if (parseResponse.ok) {
      throw new Error("Esperava-se falha de processamento, mas a requisição obteve sucesso.");
    }

    const body = await parseResponse.json();
    if (!body.error) {
      throw new Error("Mensagem de erro explicativa não foi retornada.");
    }

    return { details: `Falha graciosamente capturada e explicada: "${body.error}"` };
  })());

  // Teste 6: Rate Limiting por Usuário
  await logTestResult("Rate Limiting por Usuário", (async () => {
    const storagePath = await uploadMockFile("rate_limit_test.txt", "Lorem ipsum dolor sit amet", "text/plain");
    
    // Inserir vaga mock
    const jobInsertUrl = `${supabaseUrl}/rest/v1/jobs`;
    const jobResponse = await fetch(jobInsertUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: currentUserId,
        title: 'Gerente de Customer Success Enterprise',
        description: 'Liderar onboarding, retenção e churn de grandes contas SaaS.'
      })
    });
    
    if (!jobResponse.ok) {
      const txt = await jobResponse.text();
      throw new Error(`Falha ao criar vaga de teste: ${txt}`);
    }
    const insertedJobs = await jobResponse.json();
    const testJobId = insertedJobs[0].id;

    let hitLimiter = false;
    let errorMsg = '';

    for (let i = 0; i < 12; i++) {
      const response = await fetch(`${supabaseUrl}/functions/v1/match-job`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
          'x-mock-gemini': 'true'
        },
        body: JSON.stringify({
          resumeVersionId: successVersionId,
          jobId: testJobId,
          userId: currentUserId
        })
      });

      if (!response.ok) {
        const body = await response.json();
        if (body.error && body.error.includes("Limite de requisições excedido")) {
          hitLimiter = true;
          errorMsg = body.error;
          break;
        }
      }
    }

    if (!hitLimiter) {
      throw new Error("Rate limit de 10 requisições/hora não foi disparado.");
    }

    return { details: `Rate limit disparado com sucesso! Mensagem bloqueante: "${errorMsg}"` };
  })());
  
  console.log("\n====================================================");
  console.log("🏁 PIPELINE DE AUDITORIA E TESTES CONCLUÍDO");
  console.log("====================================================");
}

runPipeline();
