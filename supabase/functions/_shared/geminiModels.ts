// Fonte Única de Verdade para Modelos Gemini e Fallback em Edge Functions (Vocentro)
// RASTRO DE AUDITORIA (13/08/2026):
// - Tier 1: 'gemini-flash-latest' -> Mapeado pela Google API para modelVersion: 'gemini-3.6-flash'
// - Tier 2: 'gemini-flash-lite-latest' -> Mapeado pela Google API para modelVersion: 'gemini-3.5-flash-lite'
// - Tier 3: 'gemma-4-26b-a4b-it' -> Modelo Open-Weights do Google AI API (Verificado HTTP 200 OK)
// - Tier 4: Fallback Determinístico Local em Memória (Com telemetria match_source: 'fallback_deterministic')

export const GEMINI_MODEL_CHAIN = [
  'gemini-flash-latest',       // Tier 1 Primário (Flash Estável de Produção)
  'gemini-flash-lite-latest',  // Tier 2 Fallback Secundário (Flash Lite de Baixíssimo Custo)
  'gemma-4-26b-a4b-it'         // Tier 3 Fallback Terciário (Gemma 4 Open Weights via Google AI)
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
