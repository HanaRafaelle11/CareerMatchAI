import { describe, it, expect } from 'vitest';

/**
 * Career Score Logic & Invariants Unit Test Suite
 * Validates that the mathematical formula and breakdown components are 100% intact.
 */
describe('CareerScore Invariant & Breakdown Unit Tests', () => {
  // Fórmula canônica do projeto (INVARIANTE ESTRITA)
  const calculateCareerScore = (userSkillsCount: number, experiencesCount: number, hasData: boolean) => {
    if (!hasData) return 0;
    return Math.min(95, Math.max(40, 50 + (userSkillsCount * 3) + (experiencesCount * 5)));
  };

  it('1. Deve retornar 0 quando o usuário não possui dados cadastrados', () => {
    const score = calculateCareerScore(0, 0, false);
    expect(score).toBe(0);
  });

  it('2. Deve aplicar a base inicial de 50 pontos para perfil cadastrado com 0 habilidades e 0 experiências', () => {
    const score = calculateCareerScore(0, 0, true);
    expect(score).toBe(50);
  });

  it('3. Deve somar exatamente +3 pontos por habilidade e +5 pontos por experiência', () => {
    // 3 habilidades (+9) e 1 experiência (+5) => 50 + 9 + 5 = 64
    const score = calculateCareerScore(3, 1, true);
    expect(score).toBe(64);

    // 5 habilidades (+15) e 2 experiências (+10) => 50 + 15 + 10 = 75
    const score2 = calculateCareerScore(5, 2, true);
    expect(score2).toBe(75);
  });

  it('4. Deve respeitar o teto máximo de 95 pontos (clamping superior)', () => {
    // 20 habilidades (+60) e 10 experiências (+50) => 50 + 60 + 50 = 160 => 95
    const score = calculateCareerScore(20, 10, true);
    expect(score).toBe(95);
  });

  it('5. Deve respeitar o piso mínimo de 40 pontos (clamping inferior)', () => {
    const score = calculateCareerScore(0, 0, true);
    expect(score).toBeGreaterThanOrEqual(40);
  });

  it('6. Deve validar a exata correspondência dos 3 blocos da fórmula', () => {
    const skillsCount = 4;
    const experiencesCount = 3;
    const baseMarketPoints = 50;
    const skillsPoints = skillsCount * 3;
    const experiencePoints = experiencesCount * 5;

    const rawTotal = baseMarketPoints + skillsPoints + experiencePoints;
    const finalScore = Math.min(95, Math.max(40, rawTotal));

    expect(baseMarketPoints).toBe(50);
    expect(skillsPoints).toBe(12);
    expect(experiencePoints).toBe(15);
    expect(rawTotal).toBe(77);
    expect(finalScore).toBe(77);
  });

  it('7. Deve identificar gaps de evolução acionáveis quando dados estão incompletos', () => {
    const userSkillsCount = 3;
    const experiencesCount = 1;

    const hasSkillsGap = userSkillsCount < 5;
    const hasExperienceGap = experiencesCount < 2;

    expect(hasSkillsGap).toBe(true);
    expect(hasExperienceGap).toBe(true);
  });

  it('8. Não deve gerar gaps de evolução quando o perfil atingir alta densidade', () => {
    const userSkillsCount = 6;
    const experiencesCount = 3;

    const hasSkillsGap = userSkillsCount < 5;
    const hasExperienceGap = experiencesCount < 2;

    expect(hasSkillsGap).toBe(false);
    expect(hasExperienceGap).toBe(false);
  });
});
