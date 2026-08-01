import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../infrastructure/api/supabaseClient';

export interface PaywallTriggerState {
  isOpen: boolean;
  feature: 'applications' | 'copilot' | 'resumes' | 'kanban' | 'journey' | 'analytics' | 'ia_training' | 'pdf_export' | 'default';
  title?: string;
  description?: string;
}

export function getCalendarWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0: Sun, 1: Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function useEntitlements(userId?: string) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeklyApplicationsCount, setWeeklyApplicationsCount] = useState(0);
  const [unlockedJobIds, setUnlockedJobIds] = useState<string[]>([]);
  const [resumeVersionsCount, setResumeVersionsCount] = useState(0);
  const [paywallState, setPaywallState] = useState<PaywallTriggerState>({
    isOpen: false,
    feature: 'default'
  });

  const weekStartIso = getCalendarWeekStart().toISOString();
  const weekStorageKey = `vocentro_unlocked_jobs_${weekStartIso.split('T')[0]}`;

  // Carregar vagas já desbloqueadas pelo candidato na semana corrente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(weekStorageKey);
      if (stored) {
        setUnlockedJobIds(JSON.parse(stored));
      } else {
        setUnlockedJobIds([]);
      }
    } catch {
      setUnlockedJobIds([]);
    }
  }, [weekStorageKey]);

  const checkStatus = useCallback(async () => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }

    try {
      // 1. Verificar Assinatura Ativa
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle();

      const userIsPro = Boolean(sub && (sub.status === 'active' || sub.status === 'trialing'));
      setIsPro(userIsPro);

      // 2. Contar Candidaturas na Semana Calendário (Reset toda Segunda 00:00)
      const { count: appCount } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', weekStartIso);

      setWeeklyApplicationsCount(appCount || 0);

      // 3. Contar Versões de Currículo Salvas
      const { count: resumeCount } = await supabase
        .from('resume_versions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      setResumeVersionsCount(resumeCount || 0);
    } catch (err) {
      console.warn('[useEntitlements] Aviso ao checar limites de plano:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, weekStartIso]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Cota unificada semanal de ações (vagas desbloqueadas + candidaturas + IA resume/letter)
  const weeklyActionCount = Math.max(weeklyApplicationsCount, unlockedJobIds.length);
  const maxWeeklyActions = isPro ? Infinity : 3;

  const isJobUnlocked = (jobId: string): boolean => {
    if (isPro) return true;
    return unlockedJobIds.includes(jobId);
  };

  const canUnlockJob = (jobId: string): boolean => {
    if (isPro) return true;
    if (isJobUnlocked(jobId)) return true;
    return weeklyActionCount < 3;
  };

  const unlockJob = (jobId: string): boolean => {
    if (isPro) return true;
    if (isJobUnlocked(jobId)) return true;
    if (weeklyActionCount >= 3) {
      triggerPaywall('applications', 'Cota Semanal de 3 Vagas Atingida 🚀', 'No plano Gratuito, você pode desbloquear até 3 vagas por semana (reset toda segunda às 00:00). Faça o upgrade para o Pro para acesso ilimitado!');
      return false;
    }
    const next = [...unlockedJobIds, jobId];
    setUnlockedJobIds(next);
    try {
      localStorage.setItem(weekStorageKey, JSON.stringify(next));
    } catch {}
    return true;
  };

  const triggerPaywall = (
    feature: PaywallTriggerState['feature'],
    title?: string,
    description?: string
  ) => {
    setPaywallState({
      isOpen: true,
      feature,
      title,
      description
    });
  };

  const closePaywall = () => {
    setPaywallState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    isPro,
    loading,
    weeklyActionCount,
    maxWeeklyActions,
    weeklyApplicationsCount,
    unlockedJobIds,

    isJobUnlocked,
    canUnlockJob,
    unlockJob,

    canCreateApplication: (jobId?: string) => isPro || (jobId ? isJobUnlocked(jobId) : weeklyActionCount < 3),
    canImproveResume: (jobId?: string) => isPro || (jobId ? isJobUnlocked(jobId) : weeklyActionCount < 3),
    canGenerateCoverLetter: (jobId?: string) => isPro || (jobId ? isJobUnlocked(jobId) : weeklyActionCount < 3),

    resumeVersionsCount,
    maxResumeVersions: isPro ? Infinity : 1,
    canCreateResumeVersion: isPro || resumeVersionsCount < 1,

    canUseCopilot: isPro,
    canUseAiTraining: isPro,
    canExportPdf: isPro,
    canUseKanban: isPro,
    canUseAnalytics: isPro,
    journeyHistoryDays: isPro ? Infinity : 14,

    paywallState,
    triggerPaywall,
    closePaywall,
    refreshEntitlements: checkStatus
  };
}
