// query-normalizer.ts

const ABBREVIATIONS: Record<string, string> = {
  "csm": "customer success manager",
  "cx": "customer experience",
  "pm": "product manager",
  "po": "product owner",
  "sdr": "sales development representative",
  "bdr": "business development representative",
  "sre": "site reliability engineer",
  "dev": "developer",
  "sr": "senior",
  "jr": "junior",
  "pl": "pleno",
  "cs": "customer success",
  "qa": "quality assurance"
};

const STOPWORDS = new Set([
  "de", "a", "o", "e", "da", "do", "em", "para", "com", "vaga", "oportunidade",
  "opportunity", "job", "in", "for", "with", "and", "the", "an", "at", "to", "by", "of"
]);

// ── Suffix Stemming ──
export function stem(word: string): string {
  if (word.length <= 3) return word;
  
  // English plurals
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && !word.endsWith("ees") && !word.endsWith("aes")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("as") && !word.endsWith("is") && !word.endsWith("us")) return word.slice(0, -1);
  
  // Portuguese gender and plurals (e.g. desenvolvedores/desenvolvedora -> desenvolvedor)
  if (word.endsWith("ores") || word.endsWith("oras")) return word.slice(0, -4) + "or";
  if (word.endsWith("ora") && !word.endsWith("fora")) return word.slice(0, -3) + "or";
  if (word.endsWith("istas")) return word.slice(0, -1);
  if (word.endsWith("s") && (word.endsWith("as") || word.endsWith("os"))) return word.slice(0, -1);
  
  return word;
}

// ── Roman Numerals Conversion ──
function normalizeRomanNumerals(text: string): string {
  const romanMap: Record<string, string> = {
    " i ": " 1 ",
    " ii ": " 2 ",
    " iii ": " 3 ",
    " iv ": " 4 ",
    " v ": " 5 ",
    " vi ": " 6 ",
    " vii ": " 7 ",
    " viii ": " 8 ",
    " ix ": " 9 ",
    " x ": " 10 "
  };
  let spaced = " " + text + " ";
  for (const [roman, num] of Object.entries(romanMap)) {
    spaced = spaced.replaceAll(roman, num);
  }
  return spaced.trim();
}

// ── Split camelCase, snake_case, and kebab-case ──
function splitTerms(text: string): string {
  // camelCase split
  let result = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  // kebab-case and snake_case split
  result = result.replace(/[-_]/g, ' ');
  return result;
}

// ── Normalize Query (Phase 0) ──
export function normalizeQuery(text: string): string {
  if (!text) return "";
  
  // 1. Accent Normalization (remove diacritics)
  let norm = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  // 2. camelCase, snake_case, kebab-case Splitting
  norm = splitTerms(norm);

  // 3. Emoji & Punctuation removal
  norm = norm.replace(/[^a-z0-9\s]/g, " ");
  
  // 4. Roman numerals
  norm = normalizeRomanNumerals(norm);

  let tokens = norm.split(/\s+/).filter(t => t.length > 0);
  
  // 5. Abbreviations Expansion
  tokens = tokens.map(token => ABBREVIATIONS[token] || token);
  
  // 6. Stopwords Removal
  tokens = tokens.filter(token => !STOPWORDS.has(token));
  
  // 7. Suffix Stemming
  tokens = tokens.map(token => stem(token));
  
  return tokens.join(" ");
}
