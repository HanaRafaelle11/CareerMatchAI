import { describe, it, expect } from 'vitest';
import { simplifySearchTitle, resolveOccupationFamilies } from '../../src/application/services/JobOccupationDictionary';

describe('Validação Semântica de Relevância de Busca e Cascata', () => {
  it('Cenário 2a: Mapear "Ouvidor Sênior" em Florianópolis na Cascata de 5 Camadas', () => {
    const rawTitle = 'Ouvidor Sênior';
    const variants = simplifySearchTitle(rawTitle);
    const families = resolveOccupationFamilies(rawTitle);

    console.log('\n=================== EVIDÊNCIA CENÁRIO 2a ===================');
    console.log('[2a TEST] Termo original (Camada 1):', rawTitle);
    console.log('[2a TEST] Variantes da Cascata (Camadas 1-4):', variants);
    console.log('[2a TEST] Famílias Ocupacionais (Camada 4):', families);
    console.log('============================================================\n');

    expect(variants).toContain('Ouvidor Sênior');
    expect(variants).toContain('Ouvidor');
    expect(variants).toContain('Compliance');
    expect(families).toContain('Ouvidor');
    expect(families).toContain('Relacionamento com Cliente');
    expect(families).toContain('Compliance');
  });

  it('Cenário 2b: Mapear "cozinheira" e isolar de Customer Success / SAC', () => {
    const rawTitle = 'cozinheira';
    const variants = simplifySearchTitle(rawTitle);
    const families = resolveOccupationFamilies(rawTitle);

    console.log('\n=================== EVIDÊNCIA CENÁRIO 2b ===================');
    console.log('[2b TEST] Termo original:', rawTitle);
    console.log('[2b TEST] Variantes da Cascata:', variants);
    console.log('[2b TEST] Famílias Ocupacionais:', families);
    console.log('============================================================\n');

    expect(families).toContain('Cozinheira');
    expect(families).toContain('Gastronomia');
    expect(families).not.toContain('Customer Success');
    expect(families).not.toContain('SAC');
    expect(families).not.toContain('Customer Experience');
  });
});
