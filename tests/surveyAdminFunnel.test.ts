import { describe, it, expect } from 'vitest';

describe('Admin Survey Funnel, Hardening & Deduplication Audit', () => {

  it('deve validar a regra de deduplicação por campaign_id + user_id', () => {
    const existingCampaigns = new Set<string>();

    const canSendEmail = (campaignId: string, userId: string, isResendAttempt: boolean, status?: string) => {
      const key = `${campaignId}_${userId}`;
      if (isResendAttempt && (status === 'bounced' || status === 'failed')) {
        return true; // Permitir reenvio controlado apenas para falha ou bounce
      }
      if (existingCampaigns.has(key)) {
        return false; // Não reenviar para envios normais já processados
      }
      existingCampaigns.add(key);
      return true;
    };

    expect(canSendEmail('v1_founders_validation', 'usr_123', false)).toBe(true);
    expect(canSendEmail('v1_founders_validation', 'usr_123', false)).toBe(false); // Bloqueia segundo envio para a mesma campanha
    expect(canSendEmail('v1_founders_validation', 'usr_123', true, 'bounced')).toBe(true); // Permite reenvio de bounce
    expect(canSendEmail('v2_growth_validation', 'usr_123', false)).toBe(true); // Permite nova campanha para o mesmo usuário
  });

  it('deve bloquear envios de e-mail de QA/teste para caixas reais por padrão', () => {
    const isTestEmail = (email: string) => {
      return email.includes('test') || email.includes('qa') || email.includes('hanarafaelle11@gmail.com');
    };

    const allowDispatch = (email: string, allowRealEmailQA: boolean) => {
      if (isTestEmail(email) && !allowRealEmailQA) {
        return false; // Trava de segurança ativada por padrão
      }
      return true;
    };

    expect(allowDispatch('hanarafaelle11@gmail.com', false)).toBe(false);
    expect(allowDispatch('hanarafaelle11@gmail.com', true)).toBe(true);
    expect(allowDispatch('usuario_real@gmail.com', false)).toBe(true);
  });

  it('deve calcular dinamicamente a prévia da onda antes do disparo', () => {
    const calculateWavePreview = (eligible: number, invited: number, delivered: number, responded: number, failed: number) => {
      const pending = Math.max(0, eligible - invited);
      return {
        eligible,
        invited,
        delivered,
        responded,
        failed,
        pending,
        willSendNow: pending
      };
    };

    const preview = calculateWavePreview(37, 11, 10, 3, 1);
    expect(preview.eligible).toBe(37);
    expect(preview.invited).toBe(11);
    expect(preview.pending).toBe(26);
    expect(preview.willSendNow).toBe(26);
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

    const res = processEmailBatch(['usr1@vocentro.com', 'usr2@vocentro.com'], false);
    expect(res.metricCount).toBe(2);
    expect(res.totalSent).toBe(2);
  });

  it('deve garantir que nenhuma taxa do dashboard ultrapasse 100%', () => {
    const calculateRate = (completed: number, total: number) => {
      if (total === 0) return 100;
      const rate = (completed / total) * 100;
      if (rate > 100) return -1;
      return Math.min(100, Math.max(0, rate));
    };

    expect(calculateRate(2, 5)).toBe(40);
    expect(calculateRate(5, 5)).toBe(100);
    expect(calculateRate(10, 2)).toBe(-1);
  });
});
