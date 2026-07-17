import { type RawJob, type JobIntent } from "./connectors/BaseJobConnector.ts";

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

// ── Calculate Semantic Similarity Score ──
function calculateSemanticScore(
  j: RawJob,
  intent: JobIntent,
  workMode: 'remote' | 'hybrid' | 'onsite',
  seniority: 'junior' | 'pleno' | 'senior' | 'lead' | 'director',
  location: string,
  baseScores: any
): number {
  const titleClean = j.title.replace(/<\/?[^>]+(>|$)/g, "").trim();
  const titleLower = titleClean.toLowerCase();
  const descLower = j.description.toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;

  // 1. Título (40%)
  let titleScore = 0;
  
  const isExcluded = intent.excludedRoles.some(ex => {
    if (!ex) return false;
    const rx = new RegExp(`\\b${ex.toLowerCase()}\\b`, 'i');
    return rx.test(titleLower);
  });
  if (isExcluded) {
    return 0;
  }

  const canonicalLower = intent.canonicalRole.toLowerCase();
  if (titleLower.includes(canonicalLower)) {
    titleScore = 100;
  } else {
    let bestAliasMatch = 0;
    for (const alias of intent.aliases) {
      if (!alias) continue;
      const aliasLower = alias.toLowerCase();
      if (titleLower.includes(aliasLower)) {
        bestAliasMatch = 100;
        break;
      } else {
        const tokens = aliasLower.split(/\s+/).filter(t => t.length > 2);
        if (tokens.length > 0) {
          const matchCount = tokens.filter(t => titleLower.includes(t)).length;
          const pct = matchCount / tokens.length;
          if (pct > bestAliasMatch) {
            bestAliasMatch = pct * 80;
          }
        }
      }
    }
    titleScore = bestAliasMatch;
  }

  // 2. Departamento (20%)
  let deptScore = 0;
  const deptLower = intent.department.toLowerCase();
  if (titleLower.includes(deptLower)) {
    deptScore = 100;
  } else if (descLower.includes(deptLower)) {
    deptScore = 70;
  } else {
    const deptTokens = deptLower.split(/\s+/).filter(t => t.length > 2);
    if (deptTokens.length > 0) {
      const matchCount = deptTokens.filter(t => combinedText.includes(t)).length;
      deptScore = (matchCount / deptTokens.length) * 60;
    }
  }

  // 3. Skills (15%)
  let skillScore = 0;
  if (intent.skills && intent.skills.length > 0) {
    const matchedSkills = intent.skills.filter(skill => {
      if (!skill) return false;
      const rx = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'i');
      return rx.test(combinedText);
    });
    skillScore = (matchedSkills.length / intent.skills.length) * 100;
    if (skillScore > 100) skillScore = 100;
  } else {
    skillScore = 80;
  }

  // 4. Senioridade (10%)
  const seniorityScore = 80;

  // 5. Empresa (5%)
  const companyScore = baseScores.companyTrust;

  // 6. Descrição (5%)
  const descScore = baseScores.descriptionCompleteness;

  // 7. Localização (5%)
  let locScore = 100;
  if (location && location.toLowerCase() !== 'brasil' && location.toLowerCase() !== 'brazil') {
    const jobLoc = j.location.toLowerCase();
    const targetLoc = location.toLowerCase();
    if (jobLoc.includes(targetLoc) || targetLoc.includes(jobLoc)) {
      locScore = 100;
    } else {
      locScore = 40;
    }
  }

  const finalScore = Math.round(
    (titleScore * 0.40) +
    (deptScore * 0.20) +
    (skillScore * 0.15) +
    (seniorityScore * 0.10) +
    (companyScore * 0.05) +
    (descScore * 0.05) +
    (locScore * 0.05)
  );

  return finalScore;
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
  if (!min && !max) return {};

  const curr = (j.currency || "USD").toUpperCase();
  let rate = 1;
  if (curr === "USD") rate = 5.0;
  else if (curr === "EUR") rate = 5.4;
  else if (curr === "GBP") rate = 6.2;

  return {
    min: min ? Math.round(min * rate) : undefined,
    max: max ? Math.round(max * rate) : undefined
  };
}

// ── Normalize Work Mode ──
function normalizeWorkMode(j: RawJob): 'remote' | 'hybrid' | 'onsite' {
  if (j.workMode) return j.workMode;
  const text = (j.title + " " + j.description).toLowerCase();
  if (text.includes("remot") || text.includes("anywhere") || text.includes("home office") || text.includes("teletrabalho") || text.includes("distância")) {
    return "remote";
  }
  if (text.includes("hybrid") || text.includes("híbrido") || text.includes("presencial e remoto")) {
    return "hybrid";
  }
  return "onsite";
}

// ── Normalize Seniority ──
function normalizeSeniority(j: RawJob): 'junior' | 'pleno' | 'senior' | 'lead' | 'director' {
  if (j.seniority) return j.seniority;
  const title = j.title.toLowerCase();
  if (title.includes("junior") || title.includes("júnior") || title.includes("jr") || title.includes("estágio") || title.includes("estagiário") || title.includes("trainee")) {
    return "junior";
  }
  if (title.includes("senior") || title.includes("sênior") || title.includes("sr") || title.includes("pleno") || title.includes("pl")) {
    return title.includes("senior") || title.includes("sênior") || title.includes("sr") ? "senior" : "pleno";
  }
  if (title.includes("lead") || title.includes("lider") || title.includes("líder") || title.includes("coordenador") || title.includes("coordinator")) {
    return "lead";
  }
  if (title.includes("director") || title.includes("diretor") || title.includes("gerente") || title.includes("manager") || title.includes("head") || title.includes("vp")) {
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
  let providerQuality = 70;
  const platform = j.sourcePlatform.toLowerCase();
  if (["greenhouse", "lever", "ashby", "smartrecruiters"].includes(platform)) providerQuality = 95;
  else if (["adzuna", "remotive", "remoteok"].includes(platform)) providerQuality = 85;
  else if (["gupy", "abler"].includes(platform)) providerQuality = 90;

  let freshness = 90;
  if (j.publishedAt) {
    const ageMs = Date.now() - new Date(j.publishedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 1) freshness = 100;
    else if (ageDays <= 3) freshness = 90;
    else if (ageDays <= 7) freshness = 70;
    else if (ageDays <= 14) freshness = 40;
    else freshness = 20;
  }

  const cName = j.companyName.toLowerCase();
  let companyTrust = 90;
  if (cName.includes("confidencial") || cName.includes("empresa") || cName.length < 3) {
    companyTrust = 40;
  }

  let salaryConfidence = 20;
  if (salMinBRL) {
    salaryConfidence = j.salaryMin && j.salaryMax ? 100 : 80;
  }

  const descLen = j.description.length;
  let descriptionCompleteness = 30;
  if (descLen > 1500) descriptionCompleteness = 100;
  else if (descLen > 800) descriptionCompleteness = 80;
  else if (descLen > 400) descriptionCompleteness = 60;

  let remoteConfidence = 50;
  if (workMode === "remote") remoteConfidence = 100;
  else if (workMode === "hybrid") remoteConfidence = 80;
  else remoteConfidence = 70;

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

export function aggregateAndNormalizeJobs(
  jobs: RawJob[],
  intent?: JobIntent,
  location?: string
): NormalizedJob[] {
  const normalizedList: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const j of jobs) {
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

    const baseScores = calculateScores(j, mode, salaries.min);

    const descClean = j.description
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    let finalOverallScore = baseScores.overall;
    if (intent) {
      finalOverallScore = calculateSemanticScore(j, intent, mode, seniority, location || '', baseScores);
      
      if (finalOverallScore < 60) {
        continue;
      }
    }

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
      scores: {
        ...baseScores,
        overall: finalOverallScore
      }
    });
  }

  return normalizedList.sort((a, b) => b.scores.overall - a.scores.overall);
}
