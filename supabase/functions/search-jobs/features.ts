// features.ts

import { NormalizedJob } from "./aggregator.ts";
import { JobIntent } from "./intent-resolver.ts";
import { normalizeQuery } from "./query-normalizer.ts";
import { calculateCosineSimilarity, calculateJaroWinklerSimilarity } from "./similarity-utils.ts";

export interface Feature {
  readonly name: string;
  readonly key: string;
  calculate(job: NormalizedJob, intent: JobIntent): number;
}

// ── 1. Title Similarity Feature ──
export const TitleSimilarityFeature: Feature = {
  name: "Title Similarity",
  key: "TitleSimilarity",
  calculate(job, intent) {
    // Se a similaridade ponderada de grafo foi salva durante candidate recall, aproveitá-la
    if ((job as any)._titleSim !== undefined) {
      return (job as any)._titleSim;
    }

    const normJobTitle = (job as any)._normalizedTitle || normalizeQuery(job.title);
    if (!normJobTitle) return 0.0;

    let maxSim = 0.0;
    
    // Consumir alvos pré-normalizados do intent para performance
    const primaryTargets = intent._normalizedPrimary || [intent.canonical_key.replace(/_/g, " "), ...intent.primary_titles].map(t => normalizeQuery(t)).filter(Boolean);
    const secondaryTargets = intent._normalizedSecondary || intent.secondary_titles.map(t => normalizeQuery(t)).filter(Boolean);
    const targets = [...primaryTargets, ...secondaryTargets];

    for (const normTarget of targets) {
      const cosine = calculateCosineSimilarity(normJobTitle, normTarget);
      const jaroWinkler = calculateJaroWinklerSimilarity(normJobTitle, normTarget);

      // Composição equilibrada de 2 métricas lexicográficas
      let combined = (cosine * 0.5) + (jaroWinkler * 0.5);

      const words1 = normJobTitle.split(/\s+/).filter(Boolean);
      const words2 = normTarget.split(/\s+/).filter(Boolean);
      const commonTokens = words1.filter(w => words2.includes(w));

      // Se não compartilham nenhuma palavra em comum e não é um erro ortográfico óbvio (Jaro-Winkler < 0.85)
      if (commonTokens.length === 0 && jaroWinkler < 0.85) {
        combined = 0.0;
      } else {
        // Penalizar se o match de tokens consistir apenas de sufixos corporativos genéricos
        const GENERIC_SUFFIXES = new Set([
          "engineer", "developer", "manager", "specialist", "analyst",
          "assistant", "representative", "operator", "consultant", "coordinator",
          "tech", "senior", "junior", "pleno", "sr", "jr", "pl"
        ]);
        const hasOnlyGenericMatches = words1.length > 1 && words2.length > 1 && 
                                      commonTokens.length > 0 && 
                                      commonTokens.every(t => GENERIC_SUFFIXES.has(t));
        if (hasOnlyGenericMatches) {
          combined = combined * 0.2;
        }
      }

      if (combined > maxSim) {
        maxSim = combined;
      }
    }
    return maxSim;
  }
};

// ── 2. Skills Coverage Feature ──
export const SkillsCoverageFeature: Feature = {
  name: "Skills Coverage",
  key: "SkillsCoverage",
  calculate(job, intent) {
    const reqSkills = intent.skills || [];
    const prefSkills = intent.preferred_skills || [];
    const allSkills = [...reqSkills, ...prefSkills].filter(Boolean);
    if (allSkills.length === 0) return 1.0;

    const normText = normalizeQuery(`${job.title} ${job.description}`);
    let matched = 0;

    for (const skill of allSkills) {
      const normSkill = normalizeQuery(skill);
      if (!normSkill) continue;

      const escaped = normSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`\\b${escaped}\\b`, 'i');
      if (rx.test(normText)) {
        matched++;
      }
    }
    return matched / allSkills.length;
  }
};

// ── 3. Department Feature ──
export const DepartmentFeature: Feature = {
  name: "Department Similarity",
  key: "DepartmentSimilarity",
  calculate(job, intent) {
    if (!intent.department) return 0.5;
    const normTitle = normalizeQuery(job.title);
    const normDept = normalizeQuery(intent.department);
    const normDesc = normalizeQuery(job.description);

    if (normTitle.includes(normDept)) return 1.0;
    if (normDesc.includes(normDept)) return 0.7;
    return 0.2;
  }
};

// ── 3. Description Relevance Feature ──
export const DescriptionRelevanceFeature: Feature = {
  name: "Description Relevance",
  key: "DescriptionRelevance",
  calculate(job, intent) {
    const descLower = normalizeQuery(job.description);
    if (!descLower) return 0.0;

    const termsToMatch = [
      intent.canonical_key.replace(/_/g, " "),
      ...intent.primary_titles,
      ...intent.secondary_titles,
      ...intent.skills,
      ...intent.preferred_skills
    ].map(t => normalizeQuery(t)).filter(Boolean);

    if (termsToMatch.length === 0) return 1.0;

    let matchCount = 0;
    for (const term of termsToMatch) {
      if (descLower.includes(term)) {
        matchCount++;
      }
    }

    return Math.min(1.0, matchCount / Math.min(10, termsToMatch.length));
  }
};

// ── 4. Freshness Feature ──
export const FreshnessFeature: Feature = {
  name: "Job Freshness",
  key: "Freshness",
  calculate(job, intent) {
    if (!job.publishedAt) return 0.2;

    const ageMs = Date.now() - new Date(job.publishedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays <= 1) return 1.0;
    if (ageDays <= 3) return 0.9;
    if (ageDays <= 7) return 0.7;
    if (ageDays <= 14) return 0.4;
    return 0.2;
  }
};

// ── 5. Company Trust Feature ──
export const CompanyTrustFeature: Feature = {
  name: "Company Trust",
  key: "CompanyQuality",
  calculate(job, intent) {
    const companyName = (job.companyName || "").toLowerCase();
    if (companyName.includes("confidencial") || companyName.includes("empresa") || companyName.length < 3) {
      return 0.4;
    }
    return 0.9;
  }
};

// ── Registro de Features Ativas ──
export const FEATURE_REGISTRY: Feature[] = [
  TitleSimilarityFeature,
  SkillsCoverageFeature,
  DescriptionRelevanceFeature,
  DepartmentFeature,
  CompanyTrustFeature,
  FreshnessFeature
];
