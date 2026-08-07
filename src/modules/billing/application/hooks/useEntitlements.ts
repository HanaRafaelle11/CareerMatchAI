import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../infrastructure/api/supabaseClient';

export interface PaywallTriggerState {
  isOpen: boolean;
  feature: 'applications' | 'copilot' | 'resumes' | 'kanban' | 'journey' | 'analytics' | 'ia_training' | 'pdf_export' | 'weekly_limit' | 'default';
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}

export function getCalendarWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0: Sun, 1: Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getDaysUntilNextMonday(now: Date = new Date()): number {
  const current = new Date(now);
  const dayOfWeek = current.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  let days = (8 - dayOfWeek) % 7;
  if (days === 0) days = 7;
  return days;
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

  // Carregar vagas desbloqueadas do backend (Supabase) + cache local
  const checkStatus = useCallback(async () => {
    if (!userId || !supabase) {
      // Fallback local se não autenticado
      try {
        const stored = localStorage.getItem(weekStorageKey);
        setUnlockedJobIds(stored ? JSON.parse(stored) : []);
      } catch {
        setUnlockedJobIds([]);
      }
      setLoading(false);
      return;
    }

    try {
      // 1. Status de Assinatura PRO
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isUnexpiredCanceled = sub?.status === 'canceled' && sub?.current_period_end && new Date(sub.current_period_end) > new Date();
      const hasUnexpiredPeriod = Boolean(sub?.current_period_end && new Date(sub.current_period_end) > new Date());
      const userIsPro = Boolean(sub && (sub.status === 'active' || sub.status === 'trialing' || isUnexpiredCanceled || hasUnexpiredPeriod));
      setIsPro(userIsPro);

      // 2. Contar Candidaturas na Semana Calendário (Reset toda Segunda 00:00)
      const { count: appCount } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', weekStartIso);

      setWeeklyApplicationsCount(appCount || 0);

      // 3. Carregar Vagas Desbloqueadas nesta Semana de forma Autoritativa no Backend (activity_logs)
      const { data: unlockLogs } = await supabase
        .from('activity_logs')
        .select('entity_id')
        .eq('user_id', userId)
        .eq('event_type', 'job_unlocked')
        .gte('created_at', weekStartIso);

      const dbUnlocked = Array.from(new Set((unlockLogs || []).map(l => l.entity_id).filter(Boolean)));
      
      // Sincronizar com localStorage
      try {
        const stored = localStorage.getItem(weekStorageKey);
        const localList: string[] = stored ? JSON.parse(stored) : [];
        const merged = Array.from(new Set([...dbUnlocked, ...localList]));
        setUnlockedJobIds(merged);
        localStorage.setItem(weekStorageKey, JSON.stringify(merged));
      } catch {
        setUnlockedJobIds(dbUnlocked);
      }

      // 4. Contar Versões de Currículo Salvas
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
  }, [userId, weekStartIso, weekStorageKey]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Cota unificada semanal de vagas desbloqueadas (limite: 3 vagas/semana para Free)
  const weeklyActionCount = unlockedJobIds.length;
  const maxWeeklyActions = isPro ? Infinity : 3;

  const isJobUnlocked = (jobId: string): boolean => {
    if (isPro) return true;
    return unlockedJobIds.includes(jobId);
  };

  const canUnlockJob = (jobId: string): boolean => {
    if (isPro) return true;
    if (isJobUnlocked(jobId)) return true;
    return unlockedJobIds.length < 3;
  };

  const unlockJob = async (jobId: string): Promise<boolean> => {
    if (isPro) return true;
    if (isJobUnlocked(jobId)) return true;

    if (unlockedJobIds.length >= 3) {
      triggerPaywall('weekly_limit');
      if (userId && supabase) {
        supabase.from('activity_logs').insert({
          user_id: userId,
          event_type: 'free_job_limit_reached',
          entity: 'job',
          entity_id: jobId,
          metadata: { current_count: unlockedJobIds.length, limit: 3 }
        });
      }
      return false;
    }

    const next = Array.from(new Set([...unlockedJobIds, jobId]));
    setUnlockedJobIds(next);

    try {
      localStorage.setItem(weekStorageKey, JSON.stringify(next));
    } catch {}

    // Persistir desbloqueio no Backend de Forma Autoritativa
    if (userId && supabase) {
      try {
        await supabase.from('activity_logs').insert({
          user_id: userId,
          event_type: 'job_unlocked',
          entity: 'job',
          entity_id: jobId,
          metadata: {
            unlocked_at: new Date().toISOString(),
            week_start: weekStartIso.split('T')[0],
            unlocked_count: next.length
          }
        });
      } catch (err) {
        console.warn('[useEntitlements] Erro ao persistir desbloqueio no backend:', err);
      }
    }

    return true;
  };


  const triggerPaywall = (
    feature: PaywallTriggerState['feature'],
    title?: string,
    description?: string,
    primaryButtonText?: string,
    secondaryButtonText?: string
  ) => {
    setPaywallState({
      isOpen: true,
      feature,
      title,
      description,
      primaryButtonText,
      secondaryButtonText
    });

    // Grava evento de analytics no banco de dados (public.activity_logs)
    if (userId && supabase) {
      supabase.from('activity_logs').insert({
        user_id: userId,
        event_type: 'paywall_triggered',
        entity: 'billing_modal',
        entity_id: feature,
        metadata: {
          feature,
          title: title || null,
          description: description || null,
          triggered_at: new Date().toISOString(),
          location: typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : 'unknown'
        }
      }).then(({ error }) => {
        if (error) console.warn('[useEntitlements] Erro ao registrar paywall_triggered:', error.message);
      });
    }
  };

  const closePaywall = () => {
    if (userId && supabase && paywallState.isOpen) {
      supabase.from('activity_logs').insert({
        user_id: userId,
        event_type: 'paywall_dismissed',
        entity: 'billing_modal',
        entity_id: paywallState.feature || 'unknown',
        metadata: {
          feature: paywallState.feature || null,
          dismissed_at: new Date().toISOString(),
          location: typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : 'unknown'
        }
      }).then(({ error }) => {
        if (error) console.warn('[useEntitlements] Erro ao registrar paywall_dismissed:', error.message);
      });
    }
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
