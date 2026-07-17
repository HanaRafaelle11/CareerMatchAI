// similarity-utils.ts

// ── Cosine Similarity (Bag of Words) ──
// Mede a proximidade angular de ocorrência de tokens no título. Ordem independente.
export function calculateCosineSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(Boolean);
  const words2 = str2.split(/\s+/).filter(Boolean);
  if (words1.length === 0 || words2.length === 0) return 0.0;

  const allWords = Array.from(new Set([...words1, ...words2]));
  
  const vec1 = allWords.map(w => words1.filter(x => x === w).length);
  const vec2 = allWords.map(w => words2.filter(x => x === w).length);
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  for (let i = 0; i < allWords.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// ── Jaro-Winkler Similarity ──
// Mede a correspondência de caracteres com ênfase no prefixo comum. Excelente tolerância a erros e typos.
export function calculateJaroWinklerSimilarity(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 && len2 === 0) return 1.0;
  if (len1 === 0 || len2 === 0) return 0.0;
  
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const matches1 = Array(len1).fill(false);
  const matches2 = Array(len2).fill(false);
  
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(len2 - 1, i + matchWindow);
    for (let j = start; j <= end; j++) {
      if (!matches2[j] && s1[i] === s2[j]) {
        matches1[i] = true;
        matches2[j] = true;
        matches++;
        break;
      }
    }
  }
  if (matches === 0) return 0.0;
  
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (matches1[i]) {
      while (!matches2[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(len1, len2));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + prefix * 0.1 * (1 - jaro);
}
