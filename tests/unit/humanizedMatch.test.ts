import { describe, it, expect } from 'vitest';
import type { Job, Resume } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

// Funções de apoio do domínio e apresentação humanizada
export function getSemanticFit(score: number) {
  if (score >= 80) return { label: 'Alta aderência', band: 'high' };
  if (score >= 65) return { label: 'Boa aderência', band: 'good' };
  if (score >= 45) return { label: 'Aderência moderada', band: 'moderate' };
  return { label: 'Em desenvolvimento', band: 'low' };
}

export function segregateJobRequirements(
  requirements: string[],
  candidateSkills: string[],
  candidateExperiences: { role?: string; companyName?: string; description?: string }[],
  candidateLanguages: string[],
  candidateCertifications: string[]
) {
  const isLanguageReq = (req: string) => /\b(ingl[êe]s|english|espanhol|spanish|franc[êe]s|idioma|fluente|avan[çc]ado|intermedi[áa]rio)\b/i.test(req);
  const isCertificationReq = (req: string) => /\b(certifica[çc][ãa]o|certified|pmp|cpa|scrum master|psm|aws certified|itil|cfa)\b/i.test(req);
  const isLicenseReq = (req: string) => /\b(cnh|habilita[çc][ãa]o|crea|oab|crf|registro profissional)\b/i.test(req);

  const matchedItems: string[] = [];
  const realGaps: string[] = [];
  const unassessedItems: { req: string; reason: string }[] = [];

  const userSkillNames = new Set([
    ...candidateSkills.map(s => s.toLowerCase()),
    ...candidateCertifications.map(c => c.toLowerCase()),
    ...candidateLanguages.map(l => l.toLowerCase())
  ]);

  requirements.forEach(req => {
    const reqLower = req.toLowerCase();

    // 1. Verifica se há evidência de posse
    const matchesSkill = Array.from(userSkillNames).some(sk => sk.includes(reqLower) || reqLower.includes(sk));
    const matchesExp = candidateExperiences.some(e => {
      const text = `${e.role || ''} ${e.companyName || ''} ${e.description || ''}`.toLowerCase();
      return text.includes(reqLower);
    });

    if (matchesSkill || matchesExp) {
      matchedItems.push(req);
      return;
    }

    // 2. Se não bateu, verifica se é um dado não informado no perfil
    if (isLanguageReq(req) && candidateLanguages.length === 0) {
      unassessedItems.push({
        req,
        reason: 'Seu nível de idioma não está cadastrado no perfil.'
      });
      return;
    }

    if (isCertificationReq(req) && candidateCertifications.length === 0) {
      unassessedItems.push({
        req,
        reason: 'Você ainda não cadastrou sua seção de certificações.'
      });
      return;
    }

    if (isLicenseReq(req)) {
      unassessedItems.push({
        req,
        reason: 'Informação de registro/licença não preenchida.'
      });
      return;
    }

    // 3. Caso contrário, classifica como gap de desenvolvimento de mercado
    realGaps.push(req);
  });

  return { matchedItems, realGaps, unassessedItems };
}

export function getDominantCta(
  score: number,
  hasSourceUrl: boolean,
  unassessedCount: number,
  realGapsCount: number
): { id: string; label: string } {
  if (score >= 80 && hasSourceUrl) {
    return { id: 'apply_now', label: 'Candidatar-se Agora' };
  }
  if (score >= 60) {
    return { id: 'optimize_resume', label: 'Ajustar Currículo para Esta Vaga' };
  }
  if (unassessedCount > 0) {
    return { id: 'complete_profile', label: 'Completar Dados no Perfil' };
  }
  return { id: 'improve_skills', label: 'Adicionar Competências' };
}

describe('Fase 3 — Validação de Match Humanizado e Separação de Gaps', () => {

  const jobReqs = [
    'React',
    'TypeScript',
    'Inglês avançado',
    'Docker e Kubernetes',
    'Certificação AWS'
  ];

  const candidateSkills = ['React', 'TypeScript', 'Next.js'];
  const candidateExperiences = [
    {
      role: 'Desenvolvedor Frontend Sênior',
      companyName: 'Empresa A',
      description: 'Desenvolvimento de aplicações com React e TypeScript.'
    }
  ];

  describe('1. Classificação Semântica de Faixas de Fit', () => {
    it('deve classificar score >= 80 como "Alta aderência"', () => {
      const fit = getSemanticFit(88);
      expect(fit.label).toBe('Alta aderência');
      expect(fit.band).toBe('high');
    });

    it('deve classificar score entre 65 e 79 como "Boa aderência"', () => {
      const fit = getSemanticFit(72);
      expect(fit.label).toBe('Boa aderência');
      expect(fit.band).toBe('good');
    });

    it('deve classificar score entre 45 e 64 como "Aderência moderada"', () => {
      const fit = getSemanticFit(52);
      expect(fit.label).toBe('Aderência moderada');
      expect(fit.band).toBe('moderate');
    });

    it('deve classificar score < 45 como "Em desenvolvimento"', () => {
      const fit = getSemanticFit(30);
      expect(fit.label).toBe('Em desenvolvimento');
      expect(fit.band).toBe('low');
    });
  });

  describe('2. Segregação Estrita: Possui vs Gap Real vs Não Informado', () => {
    it('deve identificar competências comprovadas (Possui)', () => {
      const { matchedItems } = segregateJobRequirements(
        jobReqs,
        candidateSkills,
        candidateExperiences,
        [], // Sem idiomas
        []  // Sem certificações
      );

      expect(matchedItems).toContain('React');
      expect(matchedItems).toContain('TypeScript');
    });

    it('deve segregar idiomas e certificações não preenchidas no bloco "Não Informado"', () => {
      const { matchedItems, realGaps, unassessedItems } = segregateJobRequirements(
        jobReqs,
        candidateSkills,
        candidateExperiences,
        [], // Sem idiomas cadastrados
        []  // Sem certificações cadastradas
      );

      // Não informados
      const unassessedReqs = unassessedItems.map(u => u.req);
      expect(unassessedReqs).toContain('Inglês avançado');
      expect(unassessedReqs).toContain('Certificação AWS');

      // Gaps reais de mercado
      expect(realGaps).toContain('Docker e Kubernetes');

      // Inglês e Certificação NÃO devem aparecer em realGaps como falta de habilidade
      expect(realGaps).not.toContain('Inglês avançado');
      expect(realGaps).not.toContain('Certificação AWS');
    });

    it('deve mover idioma para Possui ou Gap Real quando o usuário tiver idiomas cadastrados', () => {
      const candidateLanguages = ['Inglês básico', 'Português nativo'];
      const { matchedItems, realGaps, unassessedItems } = segregateJobRequirements(
        jobReqs,
        candidateSkills,
        candidateExperiences,
        candidateLanguages,
        ['Certificação AWS']
      );

      // Certificação AWS agora bate
      expect(matchedItems).toContain('Certificação AWS');

      // Inglês avançado agora é um gap real analisado, não mais dado não informado
      const unassessedReqs = unassessedItems.map(u => u.req);
      expect(unassessedReqs).not.toContain('Inglês avançado');
      expect(realGaps).toContain('Inglês avançado');
    });
  });

  describe('3. Seleção do CTA Principal Dominante por Contexto', () => {
    it('deve selecionar "Candidatar-se Agora" para fit alto com link', () => {
      const cta = getDominantCta(85, true, 0, 0);
      expect(cta.id).toBe('apply_now');
      expect(cta.label).toBe('Candidatar-se Agora');
    });

    it('deve selecionar "Ajustar Currículo para Esta Vaga" para score intermediário (60-79)', () => {
      const cta = getDominantCta(70, true, 0, 1);
      expect(cta.id).toBe('optimize_resume');
      expect(cta.label).toBe('Ajustar Currículo para Esta Vaga');
    });

    it('deve selecionar "Completar Dados no Perfil" quando houver dados não informados em score menor', () => {
      const cta = getDominantCta(50, true, 2, 1);
      expect(cta.id).toBe('complete_profile');
      expect(cta.label).toBe('Completar Dados no Perfil');
    });

    it('deve selecionar "Adicionar Competências" quando houver gaps reais em score menor sem dados ausentes', () => {
      const cta = getDominantCta(40, true, 0, 3);
      expect(cta.id).toBe('improve_skills');
      expect(cta.label).toBe('Adicionar Competências');
    });
  });
});
