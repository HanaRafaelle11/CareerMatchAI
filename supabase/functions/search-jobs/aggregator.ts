import { type RawJob } from "./connectors/BaseJobConnector.ts";

export interface NormalizedJob extends RawJob {
  companyNameNormalized: string;
  locationNormalized: string;
  salaryMinBRL?: number;
  salaryMaxBRL?: number;
  workModeNormalized: 'remote' | 'hybrid' | 'onsite';
  seniorityNormalized: 'junior' | 'pleno' | 'senior' | 'lead' | 'director';
  requirementsNormalized: string[];
  benefitsNormalized: string[];
  languageNormalized: 'pt' | 'en' | 'es';
  scores: {
    providerQuality: number;
    freshness: number;
    companyTrust: number;
    salaryConfidence: number;
    descriptionCompleteness: number;
    remoteConfidence: number;
    overall: number;
  };
}

// ── Normalize Company Names ──
function normalizeCompany(name: string): string {
  if (!name) return "Empresa Confidencial";
  return name
    .replace(/\b(S\.?A\.?|L[tT][dD][aA]\.?|Inc\.?|Corp\.?|L[lL][cC]|GmbH|S\.?A\.?S\.?|Group|Grupo)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Normalize Locations ──
function normalizeLocation(loc: string): string {
  if (!loc) return "Brasil";
  const l = loc.toLowerCase();
  if (l.includes("remot") || l.includes("anywhere") || l.includes("home office") || l.includes("teletrabalho")) {
    return "Remoto";
  }
  if (l.includes("sao paulo") || l.includes("são paulo") || l.includes("sp")) {
    return "São Paulo, SP";
  }
  if (l.includes("rio de janeiro") || l.includes("rj")) {
    return "Rio de Janeiro, RJ";
  }
  if (l.includes("belo horizonte") || l.includes("bh") || l.includes("mg")) {
    return "Belo Horizonte, MG";
  }
  if (l.includes("curitiba") || l.includes("pr")) {
    return "Curitiba, PR";
  }
  if (l.includes("porto alegre") || l.includes("poa") || l.includes("rs")) {
    return "Porto Alegre, RS";
  }
  return loc.trim();
}

// ── Convert Salary to BRL ──
function normalizeSalary(j: RawJob): { min?: number; max?: number } {
  let min = j.salaryMin;
  let max = j.salaryMax;
  const currency = j.currency || "BRL";
  
  let rate = 1.0;
  if (currency === "USD") rate = 5.4;
  else if (currency === "EUR") rate = 5.9;
  else if (currency === "GBP") rate = 6.9;

  if (min) min = Math.round(min * rate);
  if (max) max = Math.round(max * rate);

  return { min, max };
}

// ── Normalize Work Mode ──
function normalizeWorkMode(j: RawJob): 'remote' | 'hybrid' | 'onsite' {
  if (j.workMode) return j.workMode;
  const text = (j.title + " " + j.description).toLowerCase();
  if (text.includes("hibrid") || text.includes("híbrid")) return "hybrid";
  if (text.includes("remot") || text.includes("remote") || text.includes("home office") || text.includes("anywhere")) return "remote";
  return "onsite";
}

// ── Normalize Seniority ──
function normalizeSeniority(j: RawJob): 'junior' | 'pleno' | 'senior' | 'lead' | 'director' {
  if (j.seniority) return j.seniority;
  const title = j.title.toLowerCase();
  if (title.includes("junior") || title.includes("júnior") || title.includes("jr") || title.includes("estagio") || title.includes("estágio")) {
    return "junior";
  }
  if (title.includes("senior") || title.includes("sênior") || title.includes("sr") || title.includes("staff") || title.includes("principal")) {
    return "senior";
  }
  if (title.includes("lead") || title.includes("lider") || title.includes("coordenador") || title.includes("gerente")) {
    return "lead";
  }
  if (title.includes("diretor") || title.includes("director") || title.includes("vp") || title.includes("head")) {
    return "director";
  }
  return "pleno";
}

// ── Extract Tech Stack Tags ──
const KNOWN_STACKS = [
  "React", "TypeScript", "Node.js", "Docker", "AWS", "Python", "Java",
  "PostgreSQL", "CSS", "HTML", "Vite", "GraphQL", "Figma", "Salesforce",
  "Git", "Kubernetes", "Next.js", "Vue", "Angular", "Go", "Ruby", "PHP"
];
function normalizeRequirements(j: RawJob): string[] {
  if (j.requirements && j.requirements.length > 0) return j.requirements;
  const text = (j.title + " " + j.description).toLowerCase();
  const reqs = KNOWN_STACKS.filter(stack => 
    new RegExp(`\\b${stack}\\b`, 'i').test(text)
  );
  return reqs.length > 0 ? reqs : ["Geral"];
}

// ── Extract Benefits ──
const KNOWN_BENEFITS = [
  { term: /vale refeição|vale-refeição|\bvr\b/i, normalized: "Vale Refeição" },
  { term: /vale alimentação|vale-alimentação|\bva\b/i, normalized: "Vale Alimentação" },
  { term: /plano de saúde|saúde|unimed|bradesco saúde/i, normalized: "Plano de Saúde" },
  { term: /plano odontológico|odonto/i, normalized: "Plano Odontológico" },
  { term: /vale transporte|vale-transporte|\bvt\b/i, normalized: "Vale Transporte" },
  { term: /gympass|academia/i, normalized: "Gympass" },
  { term: /participação nos lucros|\bplr\b/i, normalized: "PLR" }
];
function normalizeBenefits(j: RawJob): string[] {
  if (j.benefits && j.benefits.length > 0) return j.benefits;
  const text = j.description.toLowerCase();
  const benefits: string[] = [];
  KNOWN_BENEFITS.forEach(b => {
    if (b.term.test(text)) benefits.push(b.normalized);
  });
  return benefits;
}

// ── Detect Language ──
function detectLanguage(description: string): 'pt' | 'en' | 'es' {
  const text = description.toLowerCase();
  // Count common trigger words
  const ptCount = (text.match(/\b(o|a|e|da|do|em|para|com|vaga|requisitos)\b/g) || []).length;
  const enCount = (text.match(/\b(the|and|of|in|to|with|job|requirements|skills)\b/g) || []).length;
  const esCount = (text.match(/\b(el|la|y|de|en|para|con|trabajo|requisitos)\b/g) || []).length;

  if (enCount > ptCount && enCount > esCount) return "en";
  if (esCount > ptCount && esCount > enCount) return "es";
  return "pt";
}

// ── Calculate Quality Scores ──
function calculateScores(
  j: RawJob, 
  workMode: 'remote' | 'hybrid' | 'onsite',
  salMinBRL?: number
) {
  // 1. Provider Quality Score
  let providerQuality = 70;
  const platform = j.sourcePlatform.toLowerCase();
  if (["greenhouse", "lever", "ashby", "smartrecruiters"].includes(platform)) providerQuality = 95;
  else if (["adzuna", "remotive", "remoteok"].includes(platform)) providerQuality = 85;
  else if (["gupy", "abler"].includes(platform)) providerQuality = 90;

  // 2. Freshness Score
  let freshness = 90; // Default
  if (j.publishedAt) {
    const ageMs = Date.now() - new Date(j.publishedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 1) freshness = 100;
    else if (ageDays <= 3) freshness = 90;
    else if (ageDays <= 7) freshness = 70;
    else if (ageDays <= 14) freshness = 40;
    else freshness = 20;
  }

  // 3. Company Trust Score
  const cName = j.companyName.toLowerCase();
  let companyTrust = 90;
  if (cName.includes("confidencial") || cName.includes("empresa") || cName.length < 3) {
    companyTrust = 40;
  }

  // 4. Salary Confidence Score
  let salaryConfidence = 20; // Default if not provided
  if (salMinBRL) {
    salaryConfidence = j.salaryMin && j.salaryMax ? 100 : 80;
  }

  // 5. Description Completeness Score
  const descLen = j.description.length;
  let descriptionCompleteness = 30;
  if (descLen > 1500) descriptionCompleteness = 100;
  else if (descLen > 800) descriptionCompleteness = 80;
  else if (descLen > 400) descriptionCompleteness = 60;

  // 6. Remote Confidence Score
  let remoteConfidence = 50;
  if (workMode === "remote") remoteConfidence = 100;
  else if (workMode === "hybrid") remoteConfidence = 80;
  else remoteConfidence = 70;

  // 7. Overall Weighted Score
  const overall = Math.round(
    (providerQuality * 0.25) +
    (freshness * 0.15) +
    (companyTrust * 0.15) +
    (salaryConfidence * 0.10) +
    (descriptionCompleteness * 0.15) +
    (remoteConfidence * 0.20)
  );

  return {
    providerQuality,
    freshness,
    companyTrust,
    salaryConfidence,
    descriptionCompleteness,
    remoteConfidence,
    overall
  };
}

export function aggregateAndNormalizeJobs(jobs: RawJob[]): NormalizedJob[] {
  const normalizedList: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const j of jobs) {
    // Basic deduplication
    const companyNormalized = normalizeCompany(j.companyName);
    const titleClean = j.title.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const key = `${titleClean.toLowerCase()}|${companyNormalized.toLowerCase()}`;

    if (seen.has(key)) continue;
    seen.add(key);

    const locNormalized = normalizeLocation(j.location);
    const salaries = normalizeSalary(j);
    const mode = normalizeWorkMode(j);
    const seniority = normalizeSeniority(j);
    const reqs = normalizeRequirements(j);
    const benefits = normalizeBenefits(j);
    const lang = detectLanguage(j.description);

    const scores = calculateScores(j, mode, salaries.min);

    // Clean html from description
    const descClean = j.description
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    normalizedList.push({
      ...j,
      title: titleClean,
      description: descClean,
      companyNameNormalized: companyNormalized,
      locationNormalized: locNormalized,
      salaryMinBRL: salaries.min,
      salaryMaxBRL: salaries.max,
      workModeNormalized: mode,
      seniorityNormalized: seniority,
      requirementsNormalized: reqs,
      benefitsNormalized: benefits,
      languageNormalized: lang,
      scores
    });
  }

  // Sort descending by Overall Quality Score
  return normalizedList.sort((a, b) => b.scores.overall - a.scores.overall);
}
