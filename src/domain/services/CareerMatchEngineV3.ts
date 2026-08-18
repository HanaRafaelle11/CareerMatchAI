/**
 * CareerMatchEngineV3 - Motor de Matching Orientado a Objetivo (Fase 3)
 * 
 * Implementa o cálculo determinístico de:
 * 1. Score 1: Career Fit Score (Compatibilidade com Perfil Atual)
 * 2. Score 2: Career Goal / Transition Potential Score (Potencial para Objetivo Declarado)
 * 3. As 5 Dimensões Estruturadas (Experiência, Competências, Senioridade, Contexto, Objetivo)
 * 4. Matriz de 3 Estados de Competências (Possui, Parcialmente/Transferível, Precisa Desenvolver)
 * 5. Classificação de Distância de Transição (near, moderate, challenging, distant)
 * 6. Explicações Humanizadas e Determinísticas (sem números mágicos ou alucinações de IA)
 */

import type { Job, Resume, CareerGoal } from '../models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { MATCHING_WEIGHTS } from './MatchingWeights';
import { TransferableSkillsService, type TransitionType } from './TransferableSkillsService';
import { calcYearsFromExperiences, buildFlatSkillsFromProfile, isTechnicalOrDomainReq } from '../../application/services/matchingEngine';

export interface V3MatchDimensions {
  experience: number;  // 0 a 100
  skills: number;      // 0 a 100
  seniority: number;   // 0 a 100
  context: number;     // 0 a 100
  careerGoal: number;  // 0 a 100
}

export interface V3SkillsAssessment {
  matched: string[];        // Você já possui
  transferable: string[];   // Possui parcialmente / transferíveis
  missing: string[];        // Você precisa desenvolver
}

export interface V3TransitionClassification {
  type: TransitionType;
  label: string;
  confidence: number;
  isCareerTransition: boolean;
}

export interface V3Explanation {
  fitHeadline: string;
  goalHeadline: string;
  strengths: string[];
  gaps: string[];
  transferabilityReason?: string;
}

export interface CareerMatchV3Result {
  careerFitScore: number;
  careerGoalScore: number | null;
  dimensions: V3MatchDimensions;
  transition: V3TransitionClassification;
  skillsAssessment: V3SkillsAssessment;
  explanation: V3Explanation;
  confidenceScore: number;
}

// Mapa semântico de sinônimos para checagem determinística
const SYNONYM_MAP: Record<string, string[]> = {
  'react': ['react.js', 'reactjs', 'next.js', 'nextjs', 'frontend', 'front-end'],
  'typescript': ['ts', 'javascript', 'js'],
  'node.js': ['nodejs', 'node', 'express', 'nestjs', 'backend', 'back-end'],
  'postgresql': ['postgres', 'sql', 'mysql', 'banco de dados', 'database'],
  'customer success': ['cs', 'csm', 'retenção', 'churn', 'nps', 'csat', 'health score', 'onboarding', 'cx', 'sucesso do cliente'],
  'saas': ['software as a service', 'b2b saas', 'enterprise saas'],
  'liderança': ['gestão de times', 'people management', 'team lead', 'mentor', 'mentoria', 'líder', 'gerência'],
  'agile': ['ágil', 'scrum', 'kanban', 'sprint'],
  'analytics': ['análise de dados', 'data analysis', 'bi', 'business intelligence', 'tableau', 'power bi'],
  'sql': ['banco de dados', 'queries', 'consultas sql'],
  'vendas': ['sales', 'comercial', 'receita', 'pipeline', 'prospecção']
};

export class CareerMatchEngineV3 {
  /**
   * Executa o cálculo determinístico completo do Match V3
   */
  static calculate(
    job: Job,
    resume?: Resume | null,
    careerProfileNew?: CareerProfileNew | null,
    careerGoal?: CareerGoal | null
  ): CareerMatchV3Result {
    // ── 1. EXTRAÇÃO DE CORPUS E COMPREENSÃO DE PERFIL ──
    const flatSkills = careerProfileNew
      ? buildFlatSkillsFromProfile(careerProfileNew)
      : (resume?.skills || []).map(s => (typeof s === 'string' ? s : (s as any)?.name || '').toLowerCase()).filter(Boolean);

    const userExperiences = careerProfileNew?.experience || resume?.experiences || [];
    const currentRole = careerProfileNew?.experience?.[0]?.role ?? (resume as any)?.structured_data?.experience?.[0]?.role ?? '';
    const yearsOfExperience = calcYearsFromExperiences(
      careerProfileNew?.experience ?? [],
      resume?.yearsOfExperience,
      currentRole
    );

    const experiencesText = userExperiences
      .map((e: any) => `${e.role || ''} ${e.companyName || ''} ${e.description || ''} ${(e.highlights || []).join(' ')}`)
      .join(' ')
      .toLowerCase();

    // ── 2. REQUISITOS DA VAGA ──
    const rawReqs = (job.requirements || []).map(r => r.trim()).filter(Boolean);
    const technicalReqs = rawReqs.filter(isTechnicalOrDomainReq);
    const targetReqs = technicalReqs.length > 0 ? technicalReqs : rawReqs;

    // ── 3. DIMENSÃO 2: COMPETÊNCIAS (MATCHED, TRANSFERABLE, MISSING) ──
    const matchedSkills: string[] = [];
    const missingSkillsRaw: string[] = [];

    targetReqs.forEach(req => {
      const reqLower = req.toLowerCase().trim();
      const directMatch = flatSkills.some(s => s === reqLower || s.includes(reqLower) || reqLower.includes(s));
      const expMatch = experiencesText.includes(reqLower);

      let synonymMatch = false;
      for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
        const terms = [key, ...synonyms];
        if (terms.includes(reqLower) && terms.some(t => flatSkills.some(s => s.includes(t) || t.includes(s)))) {
          synonymMatch = true;
          break;
        }
      }

      if (directMatch || expMatch || synonymMatch) {
        matchedSkills.push(req);
      } else {
        missingSkillsRaw.push(req);
      }
    });

    // Avaliação de competências transferíveis
    const { transferableSkills, transferableReasons, transferabilityScore } =
      TransferableSkillsService.assessTransferableSkills(
        flatSkills,
        experiencesText,
        missingSkillsRaw,
        currentRole,
        job.title
      );

    // Identificar quais dos gaps são parcialmente cobertos por competências transferíveis
    const finalMissingSkills = missingSkillsRaw.filter(req => {
      return !transferableSkills.some(t => req.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(req.toLowerCase()));
    });

    const totalReqsCount = Math.max(targetReqs.length, 1);
    const skillsDimensionScore = Math.min(100, Math.round((matchedSkills.length / totalReqsCount) * 100));

    // ── 4. DIMENSÃO 1: EXPERIÊNCIA ──
    const titleLower = (job.title || '').toLowerCase();
    const currentRoleLower = currentRole.toLowerCase();
    let experienceDimensionScore = 60;

    if (currentRoleLower && (titleLower.includes(currentRoleLower) || currentRoleLower.includes(titleLower))) {
      experienceDimensionScore = 95;
    } else if (userExperiences.some((e: any) => (e.role || '').toLowerCase().includes(titleLower) || titleLower.includes((e.role || '').toLowerCase()))) {
      experienceDimensionScore = 88;
    } else if (yearsOfExperience >= 5) {
      experienceDimensionScore = 75;
    } else if (yearsOfExperience >= 2) {
      experienceDimensionScore = 65;
    } else {
      experienceDimensionScore = 45;
    }

    // ── 5. DIMENSÃO 3: SENIORIDADE ──
    const seniorityMap: Record<string, { min: number; max: number }> = {
      'junior': { min: 0, max: 2 },
      'pleno': { min: 2, max: 5 },
      'senior': { min: 5, max: 10 },
      'lead': { min: 7, max: 15 },
      'director': { min: 10, max: 25 }
    };
    const jobSeniority = (job.seniority || 'senior').toLowerCase();
    const seniorityRange = seniorityMap[jobSeniority] || { min: 2, max: 5 };

    let seniorityDimensionScore = 100;
    if (yearsOfExperience < seniorityRange.min) {
      seniorityDimensionScore = Math.max(40, 100 - (seniorityRange.min - yearsOfExperience) * 20);
    } else if (yearsOfExperience > seniorityRange.max) {
      seniorityDimensionScore = Math.max(80, 100 - (yearsOfExperience - seniorityRange.max) * 5);
    }

    // ── 6. DIMENSÃO 4: CONTEXTO / DOMÍNIO ──
    let contextDimensionScore = 70;
    const isSaasJob = /saas|b2b|enterprise|software/i.test(titleLower) || /saas|b2b|enterprise/i.test(job.description || '');
    const isSaasCandidate = /saas|b2b|software|tech|tecnologia/i.test(experiencesText) || flatSkills.some(s => /saas|b2b|software|cloud|api/i.test(s));

    if (isSaasJob && isSaasCandidate) {
      contextDimensionScore = 90;
    } else if (isSaasJob || isSaasCandidate) {
      contextDimensionScore = 75;
    }

    // Localização / Modalidade
    let locationScore = 100;
    if (job.workMode === 'onsite' && (job.location || '').toLowerCase() !== 'remoto') {
      locationScore = 75;
    } else if (job.workMode === 'hybrid') {
      locationScore = 85;
    }

    // ── 7. SCORE 1: CAREER FIT SCORE (Aderência Atual) ──
    const wFit = MATCHING_WEIGHTS.fit;
    const rawFitScore = (
      (skillsDimensionScore * wFit.skills) +
      (experienceDimensionScore * wFit.experience) +
      (seniorityDimensionScore * wFit.seniority) +
      (contextDimensionScore * wFit.domainContext) +
      (locationScore * wFit.workModeLocation)
    );

    // Ajuste de realismo quando as skills técnicas forem nulas em áreas técnicas estritas
    let fitMultiplier = 1.0;
    if (skillsDimensionScore === 0 && targetReqs.length >= 3) {
      fitMultiplier = 0.25;
    } else if (skillsDimensionScore < 20) {
      fitMultiplier = 0.50;
    }

    const careerFitScore = Math.max(0, Math.min(100, Math.round(rawFitScore * fitMultiplier)));

    // ── 8. DIMENSÃO 5 E SCORE 2: CAREER GOAL / TRANSITION POTENTIAL ──
    const hasCareerGoal = Boolean(careerGoal && careerGoal.intentType);
    let careerGoalScore: number | null = null;
    let goalDimensionScore = 50;

    const isCareerTransition = careerGoal?.intentType === 'career_transition';
    const targetArea = (careerGoal?.targetArea || '').toLowerCase();
    const targetRoles = (careerGoal?.targetRoles || []).map(r => r.toLowerCase());

    if (hasCareerGoal) {
      // 1. Alinhamento com cargo e área desejada
      let roleGoalAlignment = 50;
      const directTargetRoleMatch = targetRoles.some(tr => tr && (titleLower.includes(tr) || tr.includes(titleLower)));
      const areaMatch = targetArea && (titleLower.includes(targetArea) || (job.description || '').toLowerCase().includes(targetArea));

      if (directTargetRoleMatch) {
        roleGoalAlignment = 95;
      } else if (areaMatch) {
        roleGoalAlignment = 85;
      } else {
        const titleTokens = titleLower.split(/[\s,./()\-+]+/).filter(t => t.length > 3);
        const goalTokens = [
          ...targetRoles.flatMap(tr => tr.split(/[\s,./()\-]+/)),
          ...targetArea.split(/[\s,./()\-]+/)
        ].filter(t => t.length > 3);
        const overlapCount = titleTokens.filter(t => goalTokens.includes(t)).length;
        if (overlapCount > 0) {
          roleGoalAlignment = Math.min(80, 50 + overlapCount * 15);
        } else {
          // Sem sobreposição entre a vaga e o objetivo declarado
          roleGoalAlignment = 15;
        }
      }

      // 2. Pontes de domínio e oportunidade de fechamento de skill gap
      const effectiveSkillsForGoal = Math.max(transferabilityScore, skillsDimensionScore);
      const skillGapOpportunity = finalMissingSkills.length > 0
        ? (roleGoalAlignment > 50 ? Math.min(90, 60 + finalMissingSkills.length * 8) : 20)
        : (skillsDimensionScore >= 80 ? 90 : 60);
      const seniorityTrajectory = seniorityDimensionScore >= 80 ? 95 : 70;
      const domainBridgeScore = roleGoalAlignment > 50 ? contextDimensionScore : Math.min(contextDimensionScore, 30);

      const wGoal = MATCHING_WEIGHTS.goal;
      const rawGoalScore = (
        (roleGoalAlignment * wGoal.targetRoleAlignment) +
        (effectiveSkillsForGoal * wGoal.transferableSkills) +
        (domainBridgeScore * wGoal.domainBridge) +
        (skillGapOpportunity * wGoal.skillGapOpportunity) +
        (seniorityTrajectory * wGoal.seniorityTrajectory)
      );

      goalDimensionScore = Math.round(roleGoalAlignment);
      careerGoalScore = Math.max(0, Math.min(100, Math.round(rawGoalScore)));

      // Invariante: Para career_transition com forte alinhamento de cargo-alvo, não punir o goal score com o fit atual baixo!
      if (isCareerTransition && (directTargetRoleMatch || areaMatch) && careerGoalScore < 70) {
        careerGoalScore = Math.min(95, careerGoalScore + 20);
      }
    }

    // ── 9. CLASSIFICAÇÃO DE DISTÂNCIA DE TRANSIÇÃO ──
    const roleSimilarity = goalDimensionScore;
    const transitionClassification = TransferableSkillsService.determineTransitionDistance(
      isCareerTransition,
      skillsDimensionScore,
      transferabilityScore,
      roleSimilarity
    );

    // ── 10. GERAÇÃO DE EXPLICAÇÕES HUMANIZADAS E DETERMINÍSTICAS ──
    const strengths: string[] = [];
    const gaps: string[] = [];

    if (matchedSkills.length > 0) {
      strengths.push(`Você atende a ${matchedSkills.length} requisito(s) central(is): ${matchedSkills.slice(0, 3).join(', ')}.`);
    }
    if (transferableSkills.length > 0) {
      strengths.push(`Competências transferíveis identificadas: ${transferableSkills.slice(0, 3).join(', ')}.`);
    }
    if (experienceDimensionScore >= 80) {
      strengths.push(`Seu histórico profissional possui forte aderência ao escopo de ${job.title}.`);
    }

    if (finalMissingSkills.length > 0) {
      gaps.push(`Requisitos a desenvolver: ${finalMissingSkills.slice(0, 3).join(', ')}.`);
    }

    let fitHeadline = `Esta vaga tem ${careerFitScore}% de compatibilidade direta com seu histórico profissional atual.`;
    if (careerFitScore >= 80) {
      fitHeadline = `Excelente compatibilidade (${careerFitScore}%): suas experiências e competências atendem com folga aos requisitos centrais.`;
    } else if (careerFitScore >= 60) {
      fitHeadline = `Boa oportunidade (${careerFitScore}%): atende aos pilares principais da vaga de ${job.title}.`;
    } else if (careerFitScore >= 40) {
      fitHeadline = `Aderência moderada (${careerFitScore}%): seu perfil possui pontos em comum, mas requer desenvolvimento em competências técnicas específicas.`;
    } else {
      fitHeadline = `Oportunidade em área ou escopo diferente do seu histórico atual (${careerFitScore}% de aderência direta).`;
    }

    let goalHeadline = '';
    if (hasCareerGoal) {
      if (isCareerTransition) {
        goalHeadline = `Potencial de transição de ${careerGoalScore}%: a vaga desenvolve competências estratégicas para seu objetivo em ${careerGoal?.targetArea || 'sua nova área'}.`;
      } else {
        goalHeadline = `Alinhamento de objetivo de ${careerGoalScore}% com suas metas de carreira declaradas.`;
      }
    } else {
      goalHeadline = 'Defina seu objetivo profissional na aba Perfil para calcular seu potencial de carreira.';
    }

    const transferabilityReason = transferableReasons.length > 0
      ? transferableReasons.slice(0, 2).join(' ')
      : undefined;

    // ── 11. CONFIDENCE SCORE ──
    let confidenceScore = 85;
    if (!resume && !careerProfileNew) confidenceScore = 40;
    if (rawReqs.length === 0) confidenceScore -= 20;
    if (userExperiences.length === 0) confidenceScore -= 15;
    confidenceScore = Math.max(30, Math.min(100, confidenceScore));

    return {
      careerFitScore,
      careerGoalScore,
      dimensions: {
        experience: experienceDimensionScore,
        skills: skillsDimensionScore,
        seniority: seniorityDimensionScore,
        context: contextDimensionScore,
        careerGoal: goalDimensionScore
      },
      transition: {
        type: transitionClassification.type,
        label: transitionClassification.label,
        confidence: transitionClassification.confidence,
        isCareerTransition
      },
      skillsAssessment: {
        matched: matchedSkills,
        transferable: transferableSkills,
        missing: finalMissingSkills
      },
      explanation: {
        fitHeadline,
        goalHeadline,
        strengths,
        gaps,
        transferabilityReason
      },
      confidenceScore
    };
  }
}
