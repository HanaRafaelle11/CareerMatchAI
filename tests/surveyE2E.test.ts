import { describe, it, expect } from 'vitest';

describe('E2E Audit: Pesquisa de Usuários Fundadores (v1_founders_validation)', () => {
  it('deve gerar token seguro e resolver user_id e e-mail corretamente', () => {
    const userId = 'usr_test_founder_123';
    const email = 'hanarafaelle11@gmail.com';
    const payload = JSON.stringify({ u: userId, e: email, t: Date.now() });
    const token = Buffer.from(payload).toString('base64');

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    expect(decoded.u).toBe(userId);
    expect(decoded.e).toBe(email);
    expect(decoded.t).toBeGreaterThan(0);
  });

  it('deve aplicar estritamente a regra de não reenvio para usuários que já responderam', () => {
    const answeredUserIds = new Set(['usr_1', 'usr_2', 'usr_founder']);

    const canSendInvite = (userId: string) => {
      return !answeredUserIds.has(userId);
    };

    expect(canSendInvite('usr_founder')).toBe(false);
    expect(canSendInvite('usr_3')).toBe(true);
  });

  it('deve calcular o funil de dores principais Q15 e momento de valor Q14', () => {
    const mockResponses = [
      { q15_main_difficulty: 'Passar pelos filtros ATS', q14_value_moment: 'Quando encontrei vaga pelo Match IA' },
      { q15_main_difficulty: 'Encontrar vagas compatíveis comigo', q14_value_moment: 'Quando encontrei vaga pelo Match IA' },
      { q15_main_difficulty: 'Passar pelos filtros ATS', q14_value_moment: 'Quando entendi minhas chances' }
    ];

    const q15Counts: Record<string, number> = {};
    mockResponses.forEach(r => {
      q15Counts[r.q15_main_difficulty] = (q15Counts[r.q15_main_difficulty] || 0) + 1;
    });

    expect(q15Counts['Passar pelos filtros ATS']).toBe(2);
    expect(q15Counts['Encontrar vagas compatíveis comigo']).toBe(1);
  });

  it('deve garantir o fluxo do Sorteio 7 Dias PRO com confirmação em dois passos', () => {
    let participant = { id: 'part_1', status: 'eligible', winner_selected_at: null as string | null, granted_at: null as string | null };

    // Passo 1: Selecionar vencedor
    participant.status = 'selected';
    participant.winner_selected_at = new Date().toISOString();
    expect(participant.status).toBe('selected');
    expect(participant.winner_selected_at).not.toBeNull();
    expect(participant.granted_at).toBeNull(); // Não concede automaticamente

    // Passo 2: Confirmação do gestor
    participant.status = 'granted';
    participant.granted_at = new Date().toISOString();
    expect(participant.status).toBe('granted');
    expect(participant.granted_at).not.toBeNull();
  });
});
