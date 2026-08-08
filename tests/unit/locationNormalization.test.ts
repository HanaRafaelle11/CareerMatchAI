import { describe, it, expect } from 'vitest';

describe('Normalização de Localização (Adzuna ↔ UI)', () => {
  // Réplica da função de extração de cidade usada no useJobDiscovery
  const extractCityName = (locStr: string): string => {
    if (!locStr) return '';
    return locStr
      .replace(/,.*$/, '')           // remove tudo após vírgula
      .replace(/\s+[A-Z]{2}$/i, '')  // remove sigla UF ao final
      .trim()
      .toLowerCase();
  };

  it('deve extrair "florianópolis" de "Florianópolis, Santa Catarina" (formato Adzuna)', () => {
    const city = extractCityName('Florianópolis, Santa Catarina');
    expect(city).toBe('florianópolis');
  });

  it('deve extrair "florianópolis" de "Florianópolis SC" (formato UI)', () => {
    const city = extractCityName('Florianópolis SC');
    expect(city).toBe('florianópolis');
  });

  it('deve casar "Florianópolis, Santa Catarina" com "Florianópolis SC" na comparação de cidade', () => {
    const adzunaLoc = 'Florianópolis, Santa Catarina';
    const uiLoc = 'Florianópolis SC';

    const cityAdzuna = extractCityName(adzunaLoc);
    const cityUi = extractCityName(uiLoc);

    expect(cityAdzuna).toBe(cityUi);
    expect(cityAdzuna.includes(cityUi) || cityUi.includes(cityAdzuna)).toBe(true);
  });

  it('deve extrair "são paulo" de "São Paulo, SP" e "São Paulo SP"', () => {
    expect(extractCityName('São Paulo, SP')).toBe('são paulo');
    expect(extractCityName('São Paulo SP')).toBe('são paulo');
  });
});
