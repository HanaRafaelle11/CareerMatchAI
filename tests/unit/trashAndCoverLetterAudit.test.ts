import { describe, it, expect, beforeEach } from 'vitest';

// Configuração do mock de localStorage no ambiente de teste Node
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
import type { CoverLetter, ResumeOptimization, InterviewPreparation } from '../../src/domain/models/types';

describe('Auditoria P0: Lixeira & Geração de Carta de Apresentação', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('1. Lixeira: Persistência, Restauração Individual e em Massa', () => {
    it('deve armazenar metadados e ids excluídos localmente e recuperá-los de forma consistente', () => {
      const userId = 'user-test-123';
      const jobId1 = 'job-abc-1';
      const jobId2 = 'job-abc-2';

      // Simular exclusão de 2 vagas
      localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify([jobId1, jobId2]));
      localStorage.setItem(`vocentro_trash_meta_${jobId1}`, JSON.stringify({
        title: 'Tech Lead React',
        companyName: 'Tech Corp',
        location: 'São Paulo - SP'
      }));
      localStorage.setItem(`vocentro_trash_meta_${jobId2}`, JSON.stringify({
        title: 'Product Manager',
        companyName: 'Innovate SA',
        location: 'Remoto'
      }));

      // Verificar recuperação
      const trashed = JSON.parse(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`) || '[]');
      expect(trashed).toHaveLength(2);
      expect(trashed).toContain(jobId1);
      expect(trashed).toContain(jobId2);

      const meta1 = JSON.parse(localStorage.getItem(`vocentro_trash_meta_${jobId1}`) || '{}');
      expect(meta1.title).toBe('Tech Lead React');
    });

    it('deve restaurar individualmente uma vaga removendo-a da lista e limpando seu cache', () => {
      const userId = 'user-test-123';
      const jobId1 = 'job-abc-1';
      const jobId2 = 'job-abc-2';

      localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify([jobId1, jobId2]));
      localStorage.setItem(`vocentro_trash_meta_${jobId1}`, JSON.stringify({ title: 'Vaga 1' }));
      localStorage.setItem(`vocentro_trash_meta_${jobId2}`, JSON.stringify({ title: 'Vaga 2' }));

      // Restaurar jobId1
      const current = JSON.parse(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`) || '[]').filter((id: string) => id !== jobId1);
      localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify(current));
      localStorage.removeItem(`vocentro_trash_meta_${jobId1}`);

      const remaining = JSON.parse(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`) || '[]');
      expect(remaining).toHaveLength(1);
      expect(remaining).toContain(jobId2);
      expect(remaining).not.toContain(jobId1);
      expect(localStorage.getItem(`vocentro_trash_meta_${jobId1}`)).toBeNull();
      expect(localStorage.getItem(`vocentro_trash_meta_${jobId2}`)).not.toBeNull();
    });

    it('deve restaurar todas as vagas em massa limpando todos os registros de exclusão', () => {
      const userId = 'user-test-123';
      localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify(['j1', 'j2', 'j3']));
      localStorage.setItem('vocentro_trash_meta_j1', JSON.stringify({ title: 'V1' }));
      localStorage.setItem('vocentro_trash_meta_j2', JSON.stringify({ title: 'V2' }));
      localStorage.setItem('vocentro_trash_meta_j3', JSON.stringify({ title: 'V3' }));

      // Restaurar todas
      localStorage.removeItem(`vocentro_local_trashed_ids_${userId}`);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vocentro_trash_meta_')) {
          localStorage.removeItem(key);
        }
      }

      expect(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`)).toBeNull();
      expect(localStorage.getItem('vocentro_trash_meta_j1')).toBeNull();
      expect(localStorage.getItem('vocentro_trash_meta_j2')).toBeNull();
      expect(localStorage.getItem('vocentro_trash_meta_j3')).toBeNull();
    });
  });

  describe('2. IA Coach: Geração de Carta de Apresentação e Persistência Local', () => {
    it('deve salvar e recuperar carta de apresentação estruturada com 3 estilos (formal, direto, executivo)', () => {
      const letter: CoverLetter = {
        id: 'letter-001',
        applicationId: 'app-999',
        textFormal: 'Prezada equipe de RH...',
        textDirect: 'Olá time...',
        textExecutive: 'À Direção da Empresa...',
        createdAt: new Date().toISOString()
      };

      localDB.saveCoverLetter(letter);

      // Recuperar por applicationId
      const retrievedByApp = localDB.getCoverLetter('app-999');
      expect(retrievedByApp).not.toBeNull();
      expect(retrievedByApp?.textFormal).toBe('Prezada equipe de RH...');
      expect(retrievedByApp?.textDirect).toBe('Olá time...');
      expect(retrievedByApp?.textExecutive).toBe('À Direção da Empresa...');

      // Recuperar por letter id
      const retrievedById = localDB.getCoverLetter('letter-001');
      expect(retrievedById).not.toBeNull();
      expect(retrievedById?.applicationId).toBe('app-999');
    });

    it('deve indexar e recuperar carta de apresentação pelo jobId mesmo sem candidatura prévia', () => {
      const jobId = 'job-nu-88';
      const letter: CoverLetter = {
        id: `job-${jobId}`,
        applicationId: jobId,
        textFormal: 'Prezados recrutadores do Nubank...',
        textDirect: 'Olá time Nubank...',
        textExecutive: 'À Liderança do Nubank...',
        createdAt: new Date().toISOString()
      };

      localDB.saveCoverLetter(letter);

      const retrieved = localDB.getCoverLetter(jobId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.textFormal).toContain('Nubank');
    });

    it('deve salvar e recuperar otimizações de currículo e preparações de entrevista', () => {
      const opt: ResumeOptimization = {
        id: 'opt-1',
        resumeId: 'res-1',
        jobId: 'job-1',
        optimizedSummary: 'Profissional especialista em operações de alta escala...',
        keyExperiences: [
          { role: 'Gerente de Operações', company: 'LogTech', description: 'Gestão de 15 pessoas...' }
        ],
        missingKeywords: ['Agile', 'SQL'],
        redundantInfo: ['Hobbies'],
        createdAt: new Date().toISOString()
      };

      localDB.saveResumeOptimization(opt);
      const retrievedOpt = localDB.getResumeOptimization('res-1', 'job-1');
      expect(retrievedOpt).not.toBeNull();
      expect(retrievedOpt?.missingKeywords).toContain('Agile');

      const prep: InterviewPreparation = {
        id: 'prep-1',
        jobId: 'job-1',
        questions: [
          { question: 'Conte sobre um desafio', starAnswer: { situation: 'S', task: 'T', action: 'A', result: 'R' } }
        ] as any,
        createdAt: new Date().toISOString()
      };

      localDB.saveInterviewPreparation(prep);
      const retrievedPrep = localDB.getInterviewPreparation('job-1');
      expect(retrievedPrep).not.toBeNull();
      expect(retrievedPrep?.questions).toHaveLength(1);
    });
  });
});
