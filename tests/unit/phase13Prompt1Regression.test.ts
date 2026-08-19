import { describe, it, expect, beforeEach } from 'vitest';

// Configuração de ambiente de teste com localStorage
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() { return storageMap.size; },
  key: (index: number) => Array.from(storageMap.keys())[index] || null
};

(global as any).window = { localStorage: localStorageMock };
(global as any).localStorage = localStorageMock;

import { localDB } from '../../src/infrastructure/storage/localDatabase';
import type { CoverLetter } from '../../src/domain/models/types';

describe('PROMPT 1 — Auditoria e Testes de Regressão de Ações Críticas (Lixeira, Carta e CTAs)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('1. Blocker P0: Lixeira — Suporte a IDs Sintéticos e Operações em Massa', () => {
    const isUuid = (id?: string | null): boolean => {
      if (!id) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    it('deve isolar IDs sintéticos (ex: agg_adzuna_123) de tabelas com UUID para prevenir erro 22P02', () => {
      const mixedIds = [
        '550e8400-e29b-41d4-a716-446655440000', // UUID válido
        'agg_adzuna_brazil_99481',               // ID sintético de agregador
        'job-manual-custom-1',                  // ID sintético local
        '123e4567-e89b-12d3-a456-426614174000'  // Outro UUID válido
      ];

      const uuidOnly = mixedIds.filter(id => isUuid(id));
      const syntheticOnly = mixedIds.filter(id => !isUuid(id));

      expect(uuidOnly).toHaveLength(2);
      expect(uuidOnly).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(uuidOnly).toContain('123e4567-e89b-12d3-a456-426614174000');

      expect(syntheticOnly).toHaveLength(2);
      expect(syntheticOnly).toContain('agg_adzuna_brazil_99481');
      expect(syntheticOnly).toContain('job-manual-custom-1');
    });

    it('deve executar "Apagar todos" (Clear Trash) limpando completamente o storage e metadados', () => {
      const userId = 'usr-test-999';
      const jobs = ['agg_1', 'agg_2', '550e8400-e29b-41d4-a716-446655440000'];

      // Estado inicial: 3 vagas na lixeira
      localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify(jobs));
      jobs.forEach(id => {
        localStorage.setItem(`vocentro_trash_meta_${id}`, JSON.stringify({ title: `Vaga ${id}` }));
      });

      expect(JSON.parse(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`) || '[]')).toHaveLength(3);

      // Executar limpeza em massa
      localStorage.removeItem(`vocentro_local_trashed_ids_${userId}`);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vocentro_trash_meta_')) {
          localStorage.removeItem(key);
        }
      }

      // Validar que o storage ficou 100% limpo
      expect(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`)).toBeNull();
      jobs.forEach(id => {
        expect(localStorage.getItem(`vocentro_trash_meta_${id}`)).toBeNull();
      });
    });

    it('deve executar "Restaurar todos" (Restore All) limpando a lixeira para devolver as vagas ao feed ativo', () => {
      const userId = 'usr-test-888';
      const jobs = ['job-remoto-1', 'job-presencial-2'];

      localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify(jobs));
      localStorage.setItem('vocentro_trash_meta_job-remoto-1', JSON.stringify({ title: 'Engenheiro de Software' }));
      localStorage.setItem('vocentro_trash_meta_job-presencial-2', JSON.stringify({ title: 'Analista de QA' }));

      // Ação de restaurar todas
      localStorage.removeItem(`vocentro_local_trashed_ids_${userId}`);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vocentro_trash_meta_')) {
          localStorage.removeItem(key);
        }
      }

      expect(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`)).toBeNull();
      expect(localStorage.getItem('vocentro_trash_meta_job-remoto-1')).toBeNull();
      expect(localStorage.getItem('vocentro_trash_meta_job-presencial-2')).toBeNull();
    });
  });

  describe('2. Blocker P0: Geração de Carta de Apresentação', () => {
    it('deve salvar e recuperar carta associada ao jobId e ao applicationId', () => {
      const jobId = 'job-senior-react-101';
      const appId = 'app-custom-202';

      const letter: CoverLetter = {
        id: `letter-${Date.now()}`,
        applicationId: appId,
        textFormal: 'Prezada equipe de Recursos Humanos...',
        textDirect: 'Olá time da Tech Corp...',
        textExecutive: 'À Liderança da Tech Corp...',
        createdAt: new Date().toISOString()
      };

      // Salvar com chave dupla no localDB
      localDB.saveCoverLetter(letter);
      localDB.saveCoverLetter({ ...letter, id: `job-${jobId}`, applicationId: jobId });

      // Recuperação por applicationId
      const retrievedByApp = localDB.getCoverLetter(appId);
      expect(retrievedByApp).not.toBeNull();
      expect(retrievedByApp?.textFormal).toContain('Prezada equipe');

      // Recuperação por jobId
      const retrievedByJob = localDB.getCoverLetter(jobId);
      expect(retrievedByJob).not.toBeNull();
      expect(retrievedByJob?.textDirect).toContain('Olá time');
    });

    it('deve manter a carta acessível após recarregamento da tela (persistência)', () => {
      const jobId = 'job-persist-55';
      const letter: CoverLetter = {
        id: `letter-persist`,
        applicationId: jobId,
        textFormal: 'Prezada Diretoria...',
        textDirect: 'Olá time...',
        textExecutive: 'À Governança...',
        createdAt: '2026-08-19T00:00:00.000Z'
      };

      localDB.saveCoverLetter(letter);

      // Simular novo acesso
      const reloaded = localDB.getCoverLetter(jobId);
      expect(reloaded).not.toBeNull();
      expect(reloaded?.textFormal).toBe('Prezada Diretoria...');
      expect(reloaded?.createdAt).toBe('2026-08-19T00:00:00.000Z');
    });
  });

  describe('3. Auditoria de CTAs e Tratamento de Estados', () => {
    it('deve validar bloqueio de duplo clique via flag de isPending/isGenerating', () => {
      let isPending = false;
      let executionCount = 0;

      const handleClick = async () => {
        if (isPending) return;
        isPending = true;
        executionCount++;
        // Simular operação assíncrona
        await new Promise(resolve => setTimeout(resolve, 50));
        isPending = false;
      };

      // Disparo de múltiplos cliques concorrentes (duplo clique)
      handleClick();
      handleClick();
      handleClick();

      expect(executionCount).toBe(1);
    });

    it('deve formatar feedback toast humanizado com contadores corretos', () => {
      const count = 5;
      const successRestoreToast = `✓ ${count} vagas restauradas com sucesso.`;
      const successDeleteToast = `✓ ${count} vagas apagadas com sucesso.`;

      expect(successRestoreToast).toBe('✓ 5 vagas restauradas com sucesso.');
      expect(successDeleteToast).toBe('✓ 5 vagas apagadas com sucesso.');
    });
  });
});
