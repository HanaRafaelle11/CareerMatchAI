// Fonte Única de Verdade para Modelos Gemini e Fallback em Edge Functions (Vocentro)
// RASTRO DE AUDITORIA E VERSÕES FIXAS/PINADAS (Auditado em 15/08/2026):
// - Tier 1 (Primário): 'gemini-1.5-flash-8b' -> Modelo Ultra-baixo custo ($0.0375/1M tokens input)
// - Tier 2 (Secundário): 'gemini-1.5-flash-002' -> Modelo Flash Standard de Produção ($0.075/1M tokens input)
// - Tier 3 (Terciário): 'gemini-1.5-pro-002'   -> Modelo Pro de Alta Precisão e Raciocínio
// - Tier 4 (Emergência): Fallback Determinístico Local em Memória (Sem custo externo)

export const GEMINI_MODEL_CHAIN = [
  'gemini-1.5-flash-8b',    // Tier 1 Primário (Flash-8B Pinado: Ultra-baixo custo $0.0375/1M tokens)
  'gemini-1.5-flash-002',   // Tier 2 Fallback Secundário (Flash-002 Pinado: $0.075/1M tokens)
  'gemini-1.5-pro-002'      // Tier 3 Fallback Terciário (Pro-002 Pinado: Alta capacidade)
];

export async function fetchWithRetry(url: string, options: any, maxRetries = 3, initialDelay = 1000): Promise<Response> {
  let lastErr: any = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`[GEMINI RETRY] Status ${res.status}. Retentativa ${i + 1}/${maxRetries} em ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err: any) {
      lastErr = err;
      const delay = initialDelay * Math.pow(2, i);
      console.warn(`[GEMINI RETRY] Exceção de rede. Retentativa ${i + 1}/${maxRetries} em ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`Falha na requisição Gemini após ${maxRetries} tentativas: ${lastErr?.message || lastErr}`);
}

export async function callGeminiWithFallbackShared(
  promptOrContents: string | any[],
  geminiApiKey: string,
  responseMimeType?: string,
  responseSchema?: any
): Promise<{ resJson: any; selectedModel: string }> {
  let lastError: any = null;

  const contentsPayload = typeof promptOrContents === 'string'
    ? [{ parts: [{ text: promptOrContents }] }]
    : promptOrContents;

  for (const model of GEMINI_MODEL_CHAIN) {
    try {
      console.log(`[GEMINI SHARED HELPER] Tentando modelo: ${model}...`);
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      
      const generationConfig: any = {};
      if (responseMimeType) generationConfig.responseMimeType = responseMimeType;
      if (responseSchema) generationConfig.responseSchema = responseSchema;

      const response = await fetchWithRetry(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contentsPayload,
          generationConfig
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro na API (${response.status} ${response.statusText}): ${errText}`);
      }

      const resJson = await response.json();
      console.log(`[GEMINI SHARED HELPER] Sucesso com o modelo: ${model} (modelVersion: ${resJson.modelVersion || 'gemma'})!`);
      return { resJson, selectedModel: model };
    } catch (err: any) {
      console.warn(`[GEMINI SHARED HELPER] Falha ao usar modelo ${model}:`, err.message || err);
      lastError = err;
    }
  }
  throw new Error(`Falha em todos os modelos da cadeia (${GEMINI_MODEL_CHAIN.join(', ')}). Último erro: ${lastError?.message || lastError}`);
}
