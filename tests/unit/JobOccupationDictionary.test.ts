import { describe, it, expect } from 'vitest';
import { resolveOccupationFamilies, simplifySearchTitle } from '../../src/application/services/JobOccupationDictionary';

describe('JobOccupationDictionary', () => {
  describe('resolveOccupationFamilies', () => {
    it('deve mapear "Ouvidor Sênior" para a família de Ouvidoria / Relacionamento com Cliente', () => {
      const family = resolveOccupationFamilies('Ouvidor');
      expect(family).toContain('Ouvidor');
      expect(family).toContain('Relacionamento com Cliente');
    });

    it('deve mapear "cozinheira" para a família de Gastronomia', () => {
      const family = resolveOccupationFamilies('cozinheira');
      expect(family).toContain('Cozinheira');
      expect(family).toContain('Gastronomia');
    });

    it('deve mapear "Customer Success" para a família CS/CX', () => {
      const family = resolveOccupationFamilies('Customer Success');
      expect(family).toContain('Customer Success');
      expect(family).toContain('Sucesso do Cliente');
    });

    it('deve retornar array vazio para cargos desconhecidos', () => {
      const family = resolveOccupationFamilies('Astronauta Quântico');
      expect(family).toEqual([]);
    });
  });

  describe('simplifySearchTitle (Cascata de Títulos)', () => {
    it('deve gerar os candidatos em ordem de especificidade para "Ouvidor Sênior"', () => {
      const candidates = simplifySearchTitle('Ouvidor Sênior');
      // [0] literal completo
      expect(candidates[0]).toBe('Ouvidor Sênior');
      // [1] sem qualificador "Sênior"
      expect(candidates[1]).toBe('Ouvidor');
      // Contém termos canônicos da família
      expect(candidates).toContain('Relacionamento com Cliente');
    });

    it('deve extrair partes de títulos compostos com conectores', () => {
      const candidates = simplifySearchTitle('Supervisor de Customer Success & Operações');
      expect(candidates[0]).toBe('Supervisor de Customer Success & Operações');
      // Deve conter "Customer Success" e "Operações" como candidatos individuais
      expect(candidates.some(c => c.toLowerCase().includes('customer success'))).toBe(true);
      expect(candidates.some(c => c.toLowerCase().includes('operações'))).toBe(true);
    });

    it('deve simplificar "Cozinheira Pleno" para "Cozinheira" e incluir "Gastronomia"', () => {
      const candidates = simplifySearchTitle('Cozinheira Pleno');
      expect(candidates[0]).toBe('Cozinheira Pleno');
      expect(candidates[1]).toBe('Cozinheira');
      expect(candidates).toContain('Gastronomia');
    });
  });
});
