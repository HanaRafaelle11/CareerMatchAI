import { type NormalizedJob } from "./aggregator.ts";
import { type JobIntent } from "./connectors/BaseJobConnector.ts";
import { LOCAL_TAXONOMY } from "./taxonomy.ts";
import { expandIntent } from "./intent-resolver.ts";
import { normalizeQuery } from "./query-normalizer.ts";
import { FEATURE_REGISTRY } from "./features.ts";
import { FEATURE_WEIGHTS } from "./ranking-config.ts";
import { formatExplainability } from "./explainability.ts";

export function rankCandidates(
  candidates: NormalizedJob[],
  intent: JobIntent | null
) {
  if (!intent) {
    // Se não há intenção, garante scores default
    for (const j of candidates) {
      j.scores.overall = j.scores.overall || 10;
    }
    return;
  }

  const expandedIntents = expandIntent(intent.canonical_key);

  for (const j of candidates) {
    const bestExpandedKey = (j as any)._matchedCanonicalKey || intent.canonical_key;
    const matchedNode = LOCAL_TAXONOMY[bestExpandedKey] || LOCAL_TAXONOMY[intent.canonical_key];

    const domainIntent = matchedNode ? {
      ...intent,
      canonical_key: matchedNode.id,
      family: matchedNode.department,
      primary_titles: [matchedNode.id.replace(/_/g, " "), ...matchedNode.primary_titles],
      secondary_titles: matchedNode.secondary_titles,
      skills: matchedNode.required_skills,
      preferred_skills: matchedNode.preferred_skills,
      negative_keywords: matchedNode.negative_keywords,
      department: matchedNode.department,
      _normalizedPrimary: [matchedNode.id.replace(/_/g, " "), ...matchedNode.primary_titles].map(t => normalizeQuery(t)).filter(Boolean),
      _normalizedSecondary: matchedNode.secondary_titles.map(t => normalizeQuery(t)).filter(Boolean)
    } : intent;

    // Calcular cada Feature cadastrada
    const featuresScore: Record<string, number> = {};
    let weightedSum = 0.0;
    let sumActiveWeights = 0.0;

    for (const feat of FEATURE_REGISTRY) {
      const score = feat.calculate(j, domainIntent as any);
      featuresScore[feat.key] = score;

      const weight = FEATURE_WEIGHTS[feat.key] || 0.0;
      weightedSum += score * weight;

      if (intent.canonical_key === "generic_search") {
        if (feat.key === "TitleSimilarity" || feat.key === "DescriptionRelevance" || feat.key === "Freshness") {
          sumActiveWeights += weight;
        }
      }
    }

    // Identificar metadados de correspondência de título e competências para explainability
    const matchedTitleStr = matchedNode ? (matchedNode.primary_titles[0] || matchedNode.id.replace(/_/g, " ")) : intent.canonical_key;

    // Competências Encontradas
    const descLower = j.description.toLowerCase();
    const nodeSkills = matchedNode ? [...(matchedNode.required_skills || []), ...(matchedNode.preferred_skills || [])] : [];
    const matchedSkillsList = nodeSkills.filter(skill => {
      const normSkill = normalizeQuery(skill);
      return normSkill && descLower.includes(normSkill);
    });

    const boosts: string[] = [];
    const penaltiesList: string[] = [];

    let overallScore = 0;
    if (intent.canonical_key === "generic_search" && sumActiveWeights > 0) {
      overallScore = Math.max(0, Math.min(100, Math.round((weightedSum / sumActiveWeights) * 100)));
    } else {
      overallScore = Math.max(0, Math.min(100, Math.round(weightedSum * 100)));
    }

    // ── 3. Aplicar Multiplicador Leve do Grafo (GraphDistance) ──
    const graphWeight = expandedIntents[bestExpandedKey] || 1.0;
    overallScore = Math.round(overallScore * (0.9 + graphWeight * 0.1));

    // ── 4. Calibrar Confiança Baseada em Regras Simples ──
    const titleSim = featuresScore["TitleSimilarity"] || 0.0;
    const skillsSim = featuresScore["SkillsCoverage"] || 0.0;

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (titleSim > 0.75 && skillsSim > 0.60) {
      confidence = 'high';
    } else if (titleSim > 0.45 || skillsSim > 0.40) {
      confidence = 'medium';
    }

    // Formatar explainability e atribuir pontuações finais
    formatExplainability(
      j,
      domainIntent as any,
      overallScore,
      confidence,
      featuresScore,
      matchedTitleStr,
      matchedSkillsList,
      boosts,
      penaltiesList
    );
  }
}
