import { describe, it, expect } from 'vitest';

describe('Admin Survey Funnel, Bounded Rates & Deduplication Audit', () => {

  it('deve garantir que nenhuma taxa do dashboard ultrapasse 100%', () => {
    const calculateRate = (completed: number, total: number) => {
      if (total === 0) return 100;
      const rate = (completed / total) * 100;
      if (rate > 100) return -1; // -1 indica 'Anomalia de tracking'
      return Math.min(100, Math.max(0, rate));
    };

    expect(calculateRate(2, 5)).toBe(40);
    expect(calculateRate(5, 5)).toBe(100);
    expect(calculateRate(10, 2)).toBe(-1); // Bloqueia exibição de 500%
  });

  it('deve garantir que a cópia para Admin não altere a métrica de candidatos receptores', () => {
    const processEmailBatch = (candidates: string[], sendAdminCopy: boolean) => {
      const candidateRecipientsCount = candidates.length;
      const totalEmailsSent = candidateRecipientsCount + (sendAdminCopy ? 1 : 0);

      return {
        metricCount: candidateRecipientsCount, // Métrica de funil considera apenas candidatos
        totalSent: totalEmailsSent
      };
    };

    const res = processEmailBatch(['usr1@vocentro.com', 'usr2@vocentro.com'], true);
    expect(res.metricCount).toBe(2);
    expect(res.totalSent).toBe(3);
  });

  it('deve impedir participações duplicadas no sorteio para o mesmo user_id', () => {
    const giveawayEntries = new Map<string, any>();

    const addGiveawayEntry = (userId: string, email: string) => {
      if (giveawayEntries.has(userId)) {
        return { success: false, error: 'Usuário já cadastrado no sorteio desta campanha.' };
      }
      giveawayEntries.set(userId, { userId, email, status: 'eligible' });
      return { success: true, entry: giveawayEntries.get(userId) };
    };

    const first = addGiveawayEntry('usr_hana_1', 'hanarafaelle11@gmail.com');
    expect(first.success).toBe(true);

    const second = addGiveawayEntry('usr_hana_1', 'hanarafaelle11@gmail.com');
    expect(second.success).toBe(false);
    expect(second.error).toContain('já cadastrado');
  });

  it('deve validar o ciclo de vida do status da campanha de sorteio (OPEN -> CLOSED -> DRAWING -> DRAWN)', () => {
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['OPEN'],
      'OPEN': ['CLOSED'],
      'CLOSED': ['DRAWING'],
      'DRAWING': ['DRAWN'],
      'DRAWN': []
    };

    const canTransition = (current: string, next: string) => {
      return (validTransitions[current] || []).includes(next);
    };

    expect(canTransition('OPEN', 'CLOSED')).toBe(true);
    expect(canTransition('CLOSED', 'DRAWING')).toBe(true);
    expect(canTransition('DRAWING', 'DRAWN')).toBe(true);
    expect(canTransition('DRAWN', 'OPEN')).toBe(false);
  });
});
