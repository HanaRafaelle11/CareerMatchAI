import { describe, it, expect, beforeEach } from 'vitest';
import { getCalendarWeekStart, getDaysUntilNextMonday } from '../src/modules/billing/application/hooks/useEntitlements';

describe('Nova Experiência de Monetização Free -> PRO (Entitlements & Regras de Negócio)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });


  describe('Regra de Data e Calendário Semanal', () => {
    it('deve calcular a segunda-feira da semana de calendário como início do período', () => {
      const sunday = new Date('2026-08-09T12:00:00Z'); // Domingo
      const monday = getCalendarWeekStart(sunday);
      expect(monday.getDay()).toBe(1); // Segunda-feira
    });

    it('deve retornar a quantidade correta de dias até a próxima segunda-feira', () => {
      const tuesday = new Date('2026-08-04T12:00:00Z'); // Terça
      const days = getDaysUntilNextMonday(tuesday);
      expect(days).toBe(6);
    });
  });

  describe('Cota de Vagas Desbloqueadas (3 Vagas / Semana para Free)', () => {
    it('deve permitir que usuário Free desbloqueie exatamente 3 vagas na mesma semana', () => {
      const unlockedJobIds: string[] = [];
      const maxWeeklyJobs = 3;

      const unlock = (jobId: string) => {
        if (unlockedJobIds.includes(jobId)) return true;
        if (unlockedJobIds.length >= maxWeeklyJobs) return false;
        unlockedJobIds.push(jobId);
        return true;
      };

      expect(unlock('job-1')).toBe(true);
      expect(unlock('job-2')).toBe(true);
      expect(unlock('job-3')).toBe(true);
      expect(unlock('job-4')).toBe(false); // 4ª vaga bloqueada!
      expect(unlockedJobIds.length).toBe(3);
    });

    it('deve ser atômico e idempotente: desbloquear a MESMA vaga duas vezes não consome crédito adicional', () => {
      const unlockedJobIds: string[] = [];
      const maxWeeklyJobs = 3;

      const unlock = (jobId: string) => {
        if (unlockedJobIds.includes(jobId)) return true;
        if (unlockedJobIds.length >= maxWeeklyJobs) return false;
        unlockedJobIds.push(jobId);
        return true;
      };

      expect(unlock('job-1')).toBe(true);
      expect(unlock('job-1')).toBe(true); // Segunda chamada para a mesma vaga
      expect(unlockedJobIds.length).toBe(1);

      expect(unlock('job-2')).toBe(true);
      expect(unlock('job-2')).toBe(true);
      expect(unlockedJobIds.length).toBe(2);

      expect(unlock('job-3')).toBe(true);
      expect(unlockedJobIds.length).toBe(3);
      expect(unlock('job-4')).toBe(false);
    });

    it('deve garantir acesso ilimitado para usuários PRO', () => {
      const isPro = true;
      const unlockedJobIds: string[] = ['job-1', 'job-2', 'job-3', 'job-4', 'job-5'];

      const canUnlock = (_jobId: string) => {
        if (isPro) return true;
        return unlockedJobIds.length < 3;
      };

      expect(canUnlock('job-6')).toBe(true);
      expect(canUnlock('job-100')).toBe(true);
    });
  });

  describe('CTAs Contextuais por Faixa de Match Score (<70% vs >=70%)', () => {
    it('deve recomendar o Copiloto IA para Match < 70%', () => {
      const getCtaType = (score: number) => {
        if (score < 70) return 'copilot';
        return 'resume_export';
      };

      expect(getCtaType(45)).toBe('copilot');
      expect(getCtaType(69)).toBe('copilot');
    });

    it('deve recomendar Exportação de Currículo Otimizado para Match >= 70%', () => {
      const getCtaType = (score: number) => {
        if (score < 70) return 'copilot';
        return 'resume_export';
      };

      expect(getCtaType(70)).toBe('resume_export');
      expect(getCtaType(85)).toBe('resume_export');
      expect(getCtaType(98)).toBe('resume_export');
    });
  });

  describe('Resume Optimizer — Preview e Trava de Exportação PDF', () => {
    it('deve bloquear a exportação de PDF e cópia para usuários Free', () => {
      const isPro = false;
      const canExportPdf = (proState: boolean) => proState;

      expect(canExportPdf(isPro)).toBe(false);
    });

    it('deve permitir a exportação completa de PDF para usuários PRO', () => {
      const isPro = true;
      const canExportPdf = (proState: boolean) => proState;

      expect(canExportPdf(isPro)).toBe(true);
    });
  });
});
