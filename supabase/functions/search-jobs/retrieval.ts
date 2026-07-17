import { type NormalizedJob } from "./aggregator.ts";
import { type JobIntent } from "./connectors/BaseJobConnector.ts";
import { LOCAL_TAXONOMY } from "./taxonomy.ts";
import { expandIntent } from "./intent-resolver.ts";
import { normalizeQuery } from "./query-normalizer.ts";
import { FEATURE_REGISTRY, TitleSimilarityFeature } from "./features.ts";

export interface RetrievalResult {
  candidates: NormalizedJob[];
  rejectedByTitleCount: number;
  hitsTitle: number;
  hitsAlias: number;
  hitsSkills: number;
  hitsDescription: number;
}

export function retrieveCandidates(
  parsedJobs: NormalizedJob[],
  intent: JobIntent | null,
  debug: boolean = false
): RetrievalResult {
  let hitsTitle = 0;
  let hitsAlias = 0;
  let hitsSkills = 0;
  let hitsDescription = 0;
  let rejectedByTitleCount = 0;
  const candidates: NormalizedJob[] = [];

  if (!intent) {
    return {
      candidates: [...parsedJobs],
      rejectedByTitleCount: 0,
      hitsTitle: 0,
      hitsAlias: 0,
      hitsSkills: 0,
      hitsDescription: 0
    };
  }

  const expandedIntents = expandIntent(intent.canonical_key);

  const titleSimFeature = FEATURE_REGISTRY.find(f => f.key === "TitleSimilarity");
  const skillsFeature = FEATURE_REGISTRY.find(f => f.key === "SkillsCoverage");
  const descFeature = FEATURE_REGISTRY.find(f => f.key === "DescriptionRelevance");

  for (const j of parsedJobs) {
    // 1. Buscar a similaridade de título máxima expandida no Grafo direcionado
    let maxWeightedSim = 0.0;
    let bestExpandedKey = intent.canonical_key;

    for (const [expandedKey, expansionWeight] of Object.entries(expandedIntents)) {
      const expandedNode = LOCAL_TAXONOMY[expandedKey];
      if (!expandedNode) continue;

      const tempIntent = {
        canonical_key: expandedNode.id,
        primary_titles: expandedNode.primary_titles,
        secondary_titles: expandedNode.secondary_titles,
        raw_query: intent.raw_query,
        _normalizedPrimary: [expandedNode.id.replace(/_/g, " "), ...expandedNode.primary_titles].map(t => normalizeQuery(t)).filter(Boolean),
        _normalizedSecondary: expandedNode.secondary_titles.map(t => normalizeQuery(t)).filter(Boolean)
      };
      const sim = TitleSimilarityFeature.calculate(j, tempIntent as any);
      const weightedSim = sim * expansionWeight;
      if (weightedSim > maxWeightedSim) {
        maxWeightedSim = weightedSim;
        bestExpandedKey = expandedKey;
      }
    }

    // Salvar similaridade ponderada e nó correspondente de match no objeto temporário
    (j as any)._titleSim = maxWeightedSim;
    (j as any)._matchedCanonicalKey = bestExpandedKey;

    const titleLower = j.title.toLowerCase();
    const descLower = j.description.toLowerCase();

    const matchedNode = LOCAL_TAXONOMY[bestExpandedKey] || LOCAL_TAXONOMY[intent.canonical_key];

    // Validação de Skills
    const nodeSkills = matchedNode ? [...(matchedNode.required_skills || []), ...(matchedNode.preferred_skills || [])] : [];
    let matchedSkillsCount = 0;
    nodeSkills.forEach(skill => {
      const normSkill = normalizeQuery(skill);
      if (normSkill && descLower.includes(normSkill)) {
        matchedSkillsCount++;
      }
    });
    const hasAnySkill = matchedSkillsCount > 0;
    const totalSkillsCount = nodeSkills.length;

    // Validação de Aliases/Títulos
    const nodeAliases = matchedNode ? [...(matchedNode.aliases || []), ...(matchedNode.primary_titles || []), ...(matchedNode.secondary_titles || [])] : [];
    let matchedAliasStr = "";
    for (const alias of nodeAliases) {
      const normAlias = normalizeQuery(alias);
      if (normAlias && (titleLower.includes(normAlias) || descLower.includes(normAlias))) {
        matchedAliasStr = alias;
        break;
      }
    }
    const hasAnyAlias = matchedAliasStr !== "";

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

    const titleSim = titleSimFeature ? titleSimFeature.calculate(j, domainIntent as any) : 0.0;
    const skillsSim = skillsFeature ? skillsFeature.calculate(j, domainIntent as any) : 0.0;
    const descRelevance = descFeature ? descFeature.calculate(j, domainIntent as any) : 0.0;

    const titleConfidence = titleSim;
    
    let aliasConfidence = 0.0;
    if (hasAnyAlias) {
      const normTitle = normalizeQuery(j.title);
      const primaryAliases = matchedNode ? matchedNode.primary_titles.map(a => normalizeQuery(a)) : [];
      const secondaryAliases = matchedNode ? matchedNode.secondary_titles.map(a => normalizeQuery(a)) : [];
      if (primaryAliases.some(a => normTitle.includes(a))) {
        aliasConfidence = 1.0;
      } else if (secondaryAliases.some(a => normTitle.includes(a))) {
        aliasConfidence = 0.8;
      } else {
        aliasConfidence = 0.5;
      }
    }

    const skillsConfidence = skillsSim;
    const descriptionConfidence = descRelevance;

    // Always accept candidates returned from connector search to avoid recall restrictions
    const isAcceptedCandidate = true;

    if (titleConfidence > 0.0) hitsTitle++;
    if (aliasConfidence > 0.0) hitsAlias++;
    if (skillsConfidence > 0.0) hitsSkills++;
    if (descriptionConfidence > 0.0) hitsDescription++;

    // Salvar metadados ricos em retrievalEvidence
    (j as any)._retrievalEvidence = {
      title: {
        score: Number(titleConfidence.toFixed(2)),
        source: bestExpandedKey === intent.canonical_key ? "raw_query" : "taxonomy_graph",
        matchedTerm: bestExpandedKey.replace(/_/g, " "),
        method: "cosine_title"
      },
      alias: {
        score: Number(aliasConfidence.toFixed(2)),
        matchedAlias: matchedAliasStr || "N/A",
        method: "taxonomy_aliases"
      },
      skills: {
        score: Number(skillsConfidence.toFixed(2)),
        matched: matchedSkillsCount,
        total: totalSkillsCount,
        method: "skills_overlap"
      },
      description: {
        score: Number(descriptionConfidence.toFixed(2)),
        matchedTerm: intent.raw_query || "N/A",
        method: "keyword_overlap"
      }
    };

    candidates.push(j);
  }

  return {
    candidates,
    rejectedByTitleCount,
    hitsTitle,
    hitsAlias,
    hitsSkills,
    hitsDescription
  };
}
