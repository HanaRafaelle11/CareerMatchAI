import { describe, it, expect } from 'vitest';
import { PLAN_PRICING } from '../../src/domain/config/pricing';

describe('Centralização de Preços do Plano Pro (PLAN_PRICING)', () => {
  it('deve conter os valores oficiais dos planos semanal e mensal', () => {
    expect(PLAN_PRICING.proWeeklyPrice).toBe(9.90);
    expect(PLAN_PRICING.proWeeklyFormatted).toBe('R$ 9,90');
    expect(PLAN_PRICING.proMonthlyPrice).toBe(29.90);
    expect(PLAN_PRICING.proMonthlyFormatted).toBe('R$ 29,90');
  });

  it('deve formatar corretamente as mensagens para exibição em modais', () => {
    const weeklyText = `A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana`;
    const monthlyText = `Ou ${PLAN_PRICING.proMonthlyFormatted}/mês`;

    expect(weeklyText).toContain('R$ 9,90');
    expect(monthlyText).toContain('R$ 29,90');
  });
});
