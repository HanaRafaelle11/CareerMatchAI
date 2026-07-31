import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../infrastructure/api/supabaseClient';
import type { BillingCycle, BillingType } from '../../domain/types/billingTypes';

export interface CheckoutPayload {
  planSlug: string;
  billingCycle: BillingCycle;
  billingType: BillingType;
  cpfCnpj?: string;
  mobilePhone?: string;
  name?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
  };
}

export interface CheckoutResult {
  success: boolean;
  subscriptionId?: string;
  gatewaySubscriptionId?: string;
  status?: string;
  invoiceId?: string;
  amount?: number;
  billingType?: BillingType;
  pixCopyPaste?: string;
  pixQrCodeUrl?: string;
  bankSlipUrl?: string;
}

export function useCheckout(userId?: string) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const pollingTimerRef = useRef<any>(null);

  // Limpar timer de polling ao desmontar o hook
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  const executeCheckout = async (payload: CheckoutPayload): Promise<CheckoutResult | null> => {
    setIsLoading(true);
    setError(null);
    setCheckoutResult(null);
    setPaymentConfirmed(false);

    try {
      if (!supabase) {
        throw new Error('Supabase Client não configurado no ambiente.');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const response = await supabase.functions.invoke('billing-checkout', {
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.error) {
        const msg = response.error.message || 'Erro ao processar o checkout.';
        throw new Error(msg);
      }

      const result: CheckoutResult = response.data;
      if (!result.success && !result.subscriptionId) {
        throw new Error((result as any).error || 'Falha ao gerar cobrança no gateway.');
      }

      setCheckoutResult(result);

      // Se o pagamento via Cartão de Crédito for aprovado na hora
      if (result.status === 'active') {
        setPaymentConfirmed(true);
        invalidateBillingCaches();
      } else if (result.invoiceId || result.subscriptionId) {
        // Se for PIX ou Boleto pendente, iniciar polling de confirmação
        startPolling(result.invoiceId, result.subscriptionId);
      }

      return result;
    } catch (err: any) {
      console.error('[useCheckout] Erro no checkout:', err);
      const errorMessage = err.message || 'Não foi possível concluir o checkout. Tente novamente.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (invoiceId?: string, subscriptionId?: string) => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 75; // Polling de 5 minutos (75 x 4s)

    pollingTimerRef.current = setInterval(async () => {
      attempts += 1;
      if (attempts > maxAttempts) {
        stopPolling();
        return;
      }

      try {
        if (!supabase) return;

        if (invoiceId) {
          const { data: invoice } = await supabase
            .from('invoices')
            .select('status, paid_at')
            .eq('id', invoiceId)
            .maybeSingle();

          if (invoice && (invoice.status === 'paid' || invoice.paid_at)) {
            setPaymentConfirmed(true);
            stopPolling();
            invalidateBillingCaches();
            return;
          }
        }

        if (subscriptionId) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('id', subscriptionId)
            .maybeSingle();

          if (sub && sub.status === 'active') {
            setPaymentConfirmed(true);
            stopPolling();
            invalidateBillingCaches();
            return;
          }
        }
      } catch (err) {
        console.warn('[useCheckout] Erro durante o polling de confirmação:', err);
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsPolling(false);
  };

  const invalidateBillingCaches = () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
    queryClient.invalidateQueries({ queryKey: ['my-profile-ai'] });
  };

  const resetCheckout = () => {
    stopPolling();
    setIsLoading(false);
    setError(null);
    setCheckoutResult(null);
    setPaymentConfirmed(false);
  };

  return {
    executeCheckout,
    checkoutResult,
    isLoading,
    error,
    isPolling,
    paymentConfirmed,
    resetCheckout,
    stopPolling
  };
}
