// src/presentation/hooks/useExperiment.ts
import { useState, useEffect, useMemo } from 'react';
import { ExperimentService } from '../../application/services/ExperimentService';
import type { ExperimentVariant } from '../../application/services/ExperimentService';
import { supabase, isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';

export interface UseExperimentResult {
  variant: ExperimentVariant;
  isControl: boolean;
  isVariantA: boolean;
  isVariantB: boolean;
  trackExposure: (metadata?: any) => void;
  trackConversion: (metricName: string, value?: number, metadata?: any) => void;
}

export function useExperiment(experimentId: string): UseExperimentResult {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && session?.user?.id) {
          setUserId(session.user.id);
        }
      }
    };
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const variant = useMemo(() => {
    return ExperimentService.assignVariant(experimentId, userId);
  }, [experimentId, userId]);

  const trackExposure = (metadata: any = {}) => {
    ExperimentService.trackExposure(experimentId, variant, metadata);
  };

  const trackConversion = (metricName: string, value: number = 1, metadata: any = {}) => {
    ExperimentService.trackConversion(experimentId, variant, metricName, value, metadata);
  };

  return {
    variant,
    isControl: variant === 'CONTROL',
    isVariantA: variant === 'VARIANT_A',
    isVariantB: variant === 'VARIANT_B',
    trackExposure,
    trackConversion
  };
}
