// intent-resolver.ts

import { LOCAL_TAXONOMY } from "./taxonomy.ts";
import { calculateJaroWinklerSimilarity } from "./similarity-utils.ts";
import { normalizeQuery } from "./query-normalizer.ts";

export interface JobIntent {
  canonical_key: string;
  family: string;
  primary_titles: string[];
  secondary_titles: string[];
  _normalizedPrimary?: string[]; // Alvos pré-normalizados para otimizar similaridade
  _normalizedSecondary?: string[]; // Alvos pré-normalizados para otimizar similaridade
  negative_titles: string[];
  skills: string[];
  preferred_skills: string[];
  negative_keywords: string[];
  industry: string;
  department?: string;
  target_location?: string;
  raw_query?: string;
}

// ── LRU Cache em Memória ──
class SimpleLRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxEntries: number;

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
  }

  get(key: K): V | undefined {
    const hasKey = this.cache.has(key);
    if (hasKey) {
      const val = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, val);
      return val;
    }
    return undefined;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const keyToDelete = this.cache.keys().next().value;
      if (keyToDelete !== undefined) {
        this.cache.delete(keyToDelete);
      }
    }
    this.cache.set(key, value);
  }
}

const intentCache = new SimpleLRUCache<string, { canonical_role: string; confidence: number }>(100);

// ── Resolvedor Local Determinístico ──
function resolveLocally(keyword: string): { canonical_role: string; confidence: number } | null {
  const cleanKeyword = keyword.toLowerCase().trim()
    .replace(/\b(junior|júnior|jr|estágio|estagiário|intern|trainee|assistente|pleno|pl|mid|senior|sênior|sr|especialista|lead|lider|líder|principal|staff|director|diretor|gerente|manager|head|vp|coordenador|coordinator)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanKeyword) return null;

  // 1. Match exato da chave canônica do Grafo
  if (LOCAL_TAXONOMY[cleanKeyword]) {
    return { canonical_role: cleanKeyword, confidence: 1.0 };
  }

  // 2. Match exato com aliases ou cargos primários
  for (const [key, node] of Object.entries(LOCAL_TAXONOMY)) {
    const aliasesAndTitles = [...node.aliases, ...node.primary_titles, key.replace(/_/g, " ")];
    if (aliasesAndTitles.some(alias => alias.toLowerCase() === cleanKeyword)) {
      return { canonical_role: key, confidence: 1.0 };
    }
  }

  // 3. Match aproximado via Jaro-Winkler Similarity (limiar alto para precisão)
  for (const [key, node] of Object.entries(LOCAL_TAXONOMY)) {
    const aliasesAndTitles = [...node.aliases, ...node.primary_titles];
    for (const val of aliasesAndTitles) {
      const jaro = calculateJaroWinklerSimilarity(cleanKeyword, val.toLowerCase());
      if (jaro >= 0.85) {
        console.log(`[RESOLVER LOCAL] Resolved fuzzy: '${cleanKeyword}' -> '${key}' (confidence 0.95, Jaro: ${jaro.toFixed(2)})`);
        return { canonical_role: key, confidence: 0.95 };
      }
    }
  }

  return null;
}

// ── Chamada de Resiliência para Gemini ──
async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  const delays = [2000, 4000, 8000];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 5000));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, delays[attempt - 1] || 5000));
    }
  }
  throw new Error(`Failed to contact Gemini after ${maxRetries} attempts.`);
}

async function resolveWithGemini(
  keyword: string,
  geminiApiKey: string
): Promise<{ canonical_role: string; confidence: number } | null> {
  const taxonomyKeys = Object.keys(LOCAL_TAXONOMY).join(", ");
  
  const systemPrompt = `You are a search query intent classifier for a job aggregator. Your task is to resolve the user's query into one of the canonical role keys in our taxonomy.
The available canonical keys are: [${taxonomyKeys}].
If the query does not map reasonably to any of these keys, output "generic_search".
The output must be a valid JSON object matching this schema:
{
  "canonical_role": "resolved_key_string",
  "confidence": 0.00
}
Do not include any explanations, backticks, or markdown formatting, just the raw JSON.`;

  const prompt = `${systemPrompt}\n\nQuery: "${keyword}"\nOutput JSON:`;

  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];

  for (const model of modelsToTry) {
    try {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      const response = await fetchWithRetry(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) continue;

      const resJson = await response.json();
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const res: { canonical_role: string; confidence: number } = JSON.parse(text.trim());
      console.log(`[RESOLVER GEMINI] Resolved: '${keyword}' -> '${res.canonical_role}' (confidence: ${res.confidence})`);
      return res;
    } catch (err) {
      console.warn(`[RESOLVER GEMINI] Model ${model} failed:`, err.message);
    }
  }

  return null;
}

// ── Expansão de Intenções no Grafo de Taxonomia ──
export function expandIntent(canonicalKey: string): Record<string, number> {
  const expansion: Record<string, number> = { [canonicalKey]: 1.0 }; // Peso 1.0 para o nó principal
  const node = LOCAL_TAXONOMY[canonicalKey];
  if (node && node.edges) {
    for (const [targetKey, weight] of Object.entries(node.edges)) {
      expansion[targetKey] = weight; // Copia conexões adjacentes e pesos de afinidade
    }
  }
  return expansion;
}

// ── Resolvedor Híbrido Orquestrador ──
export async function resolveSearchIntent(
  keyword: string,
  geminiApiKey?: string
): Promise<{ intent: JobIntent; geminiUsed: boolean }> {
  const cacheKey = keyword.toLowerCase().trim();
  
  let result = intentCache.get(cacheKey);
  let geminiUsed = false;
  
  if (!result) {
    // 1. Resolução local determinística
    result = resolveLocally(keyword) || undefined;
    
    // 2. Fallback para LLM se disponível
    if (!result && geminiApiKey) {
      const geminiResult = await resolveWithGemini(keyword, geminiApiKey);
      if (geminiResult && geminiResult.canonical_role !== "generic_search") {
        result = geminiResult;
        geminiUsed = true;
      }
    }
    
    if (result) {
      intentCache.put(cacheKey, result);
    }
  }

  if (result) {
    const node = LOCAL_TAXONOMY[result.canonical_role];
    if (node) {
      const primaryList = [node.id.replace(/_/g, " "), ...node.primary_titles];
      const intent: JobIntent = {
        canonical_key: node.id,
        family: node.department,
        primary_titles: primaryList,
        secondary_titles: node.secondary_titles,
        _normalizedPrimary: primaryList.map(t => normalizeQuery(t)).filter(Boolean),
        _normalizedSecondary: node.secondary_titles.map(t => normalizeQuery(t)).filter(Boolean),
        negative_titles: node.negative_titles,
        skills: node.required_skills,
        preferred_skills: node.preferred_skills,
        negative_keywords: node.negative_keywords,
        industry: node.department,
        department: node.department
      };
      return { intent, geminiUsed };
    }
  }

  // Fallback padrão se não puder mapear
  const normKw = normalizeQuery(keyword);
  return {
    intent: {
      canonical_key: "generic_search",
      family: keyword,
      primary_titles: [keyword],
      secondary_titles: [],
      _normalizedPrimary: normKw ? [normKw] : [],
      _normalizedSecondary: [],
      negative_titles: [],
      skills: [],
      preferred_skills: [],
      negative_keywords: [],
      industry: "General"
    },
    geminiUsed: false
  };
}
