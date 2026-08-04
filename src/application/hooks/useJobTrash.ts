import { useState, useEffect, useCallback } from 'react';
import type { Job } from '../../domain/models/types';

export interface TrashedJob {
  id: string;
  title: string;
  companyName: string;
  location?: string;
  deletedAt: string;
  originalJob?: Job;
}

export function useJobTrash(userId?: string) {
  const storageKey = `vocentro_job_trash_${userId || 'guest'}`;

  const [trashedJobs, setTrashedJobs] = useState<TrashedJob[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(trashedJobs));
    } catch (err) {
      console.error('Erro ao salvar lixeira no localStorage:', err);
    }
  }, [trashedJobs, storageKey]);

  const trashedJobIds = new Set(trashedJobs.map(t => t.id));

  const moveToTrash = useCallback((job: Job | { id: string; title: string; companyName?: string; location?: string }) => {
    const newItem: TrashedJob = {
      id: job.id,
      title: job.title || 'Vaga Sem Título',
      companyName: (job as any).companyName || (job as any).company_name || 'Empresa Confidencial',
      location: job.location || 'Brasil',
      deletedAt: new Date().toISOString(),
      originalJob: 'companyId' in job ? (job as Job) : undefined
    };

    setTrashedJobs(prev => {
      if (prev.some(item => item.id === job.id)) return prev;
      return [newItem, ...prev];
    });
  }, []);

  const restoreFromTrash = useCallback((jobId: string) => {
    setTrashedJobs(prev => prev.filter(item => item.id !== jobId));
  }, []);

  const removeFromTrash = useCallback((jobId: string) => {
    setTrashedJobs(prev => prev.filter(item => item.id !== jobId));
  }, []);

  const clearTrash = useCallback(() => {
    setTrashedJobs([]);
  }, []);

  return {
    trashedJobs,
    trashedJobIds,
    moveToTrash,
    restoreFromTrash,
    removeFromTrash,
    clearTrash
  };
}
