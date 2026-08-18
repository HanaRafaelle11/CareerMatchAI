import { useState, useEffect, useCallback } from 'react';
import type { CareerGoal, CareerGoalIntentType } from '../../domain/models/types';
import { careerGoalService } from '../services/CareerGoalService';

export function useCareerGoal(userId?: string) {
  const [goal, setGoal] = useState<CareerGoal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoal = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await careerGoalService.getGoal(userId);
      setGoal(data);
    } catch (err: any) {
      console.warn('[useCareerGoal] Erro ao carregar objetivo:', err);
      setError(err?.message || 'Erro ao carregar objetivo');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  const saveGoal = useCallback(async (data: {
    intentType: CareerGoalIntentType;
    targetArea?: string;
    targetRoles?: string[];
    targetSeniority?: 'junior' | 'pleno' | 'senior' | 'lead' | 'specialist';
    targetLocation?: string;
    targetWorkModes?: Array<'remote' | 'hybrid' | 'onsite'>;
    desiredSalary?: string;
    transferableSkills?: string[];
  }): Promise<CareerGoal> => {
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    const payload: CareerGoal = {
      id: goal?.id || `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      intentType: data.intentType,
      targetArea: data.targetArea || '',
      targetRoles: data.targetRoles || [],
      targetSeniority: data.targetSeniority,
      targetLocation: data.targetLocation || '',
      targetWorkModes: data.targetWorkModes || ['remote'],
      desiredSalary: data.desiredSalary || '',
      transferableSkills: data.transferableSkills || [],
      createdAt: goal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Atualização otimista imediata
    setGoal(payload);

    try {
      const saved = await careerGoalService.saveGoal(payload);
      setGoal(saved);
      return saved;
    } catch (err: any) {
      console.warn('[useCareerGoal] Falha ao persistir remotamente, mantido estado local:', err);
      return payload;
    }
  }, [userId, goal]);

  return {
    goal,
    isLoading,
    error,
    saveGoal,
    refreshGoal: loadGoal,
    isCareerTransition: goal?.intentType === 'career_transition',
    isSameArea: goal?.intentType === 'same_area_continue' || goal?.intentType === 'same_area_grow',
    isExploring: goal?.intentType === 'exploring',
    hasGoal: Boolean(goal && goal.intentType)
  };
}
