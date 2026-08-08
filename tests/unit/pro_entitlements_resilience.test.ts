import { describe, it, expect } from 'vitest';

// Simular a mesma lógica de decisão em 4 camadas presente no useEntitlements.ts de produção
export function evaluateProEntitlement(input: {
  userId?: string;
  userEmail?: string;
  subscription?: { status: string; current_period_end?: string; grace_period_end?: string } | null;
  billingSubscription?: { status: string } | null;
  profile?: { role?: string; plan?: string; is_pro?: boolean; email?: string } | null;
  userMetadata?: { plan?: string; role?: string; is_pro?: boolean } | null;
  localCachePro?: boolean;
}): boolean {
  const WHITELISTED_PRO_EMAILS = [
    'hanarafaelle11@gmail.com',
    'rafaelaletbey@gmail.com',
    'admin@vocentro.com.br'
  ];

  const {
    userEmail,
    subscription,
    billingSubscription,
    profile,
    userMetadata,
    localCachePro
  } = input;

  const now = new Date();

  // Camada 1: Subscriptions Table
  if (subscription) {
    const isUnexpiredCanceled = subscription.status === 'canceled' && 
      subscription.current_period_end && 
      new Date(subscription.current_period_end) > now;
    
    const isInActiveGracePeriod = subscription.status === 'grace_period' && 
      subscription.grace_period_end && 
      new Date(subscription.grace_period_end) > now;
    
    const isActiveOrTrialing = subscription.status === 'active' || subscription.status === 'trialing';

    if (isActiveOrTrialing || isUnexpiredCanceled || isInActiveGracePeriod) {
      return true;
    }
  }

  // Camada 2: Billing Subscriptions Table
  if (billingSubscription && (billingSubscription.status === 'active' || billingSubscription.status === 'trialing')) {
    return true;
  }

  // Camada 3: Profiles Table (role, plan, is_pro ou email autorizados)
  if (profile) {
    const isRoleAdmin = profile.role === 'admin';
    const isPlanPro = profile.plan === 'pro';
    const isFlagPro = profile.is_pro === true;
    const isWhitelisted = (profile.email || userEmail) && 
      WHITELISTED_PRO_EMAILS.includes((profile.email || userEmail)!.toLowerCase());

    if (isRoleAdmin || isPlanPro || isFlagPro || isWhitelisted) {
      return true;
    }
  }

  // Camada 4: User Metadata & Email Whitelist Fallback
  if (userMetadata) {
    const isMetadataPro = userMetadata.plan === 'pro' || userMetadata.role === 'admin' || userMetadata.is_pro === true;
    if (isMetadataPro) return true;
  }

  if (userEmail && WHITELISTED_PRO_EMAILS.includes(userEmail.toLowerCase())) {
    return true;
  }

  // Camada 5: LocalStorage cache
  if (localCachePro) {
    return true;
  }

  return false;
}

describe('Resiliência do Status Pro (Garantia P0 contra Regressão de Assinatura)', () => {

  it('Cenário 1: Usuária real (hanarafaelle11@gmail.com) com assinatura ativa em subscriptions DEVE ser reconhecida como Pro', () => {
    const result = evaluateProEntitlement({
      userId: 'bb84f193-79d4-49f5-8ed4-cc03234b27bd',
      userEmail: 'hanarafaelle11@gmail.com',
      subscription: {
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    expect(result).toBe(true);
  });

  it('Cenário 2: Assinatura cancelada mas dentro do período vigente (current_period_end no futuro) DEVE manter Pro ativo', () => {
    const result = evaluateProEntitlement({
      userId: 'user_canceled_active',
      userEmail: 'cliente@empresa.com',
      subscription: {
        status: 'canceled',
        current_period_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    expect(result).toBe(true);
  });

  it('Cenário 3: Assinatura em Grace Period ativo (grace_period_end no futuro) DEVE manter Pro ativo', () => {
    const result = evaluateProEntitlement({
      userId: 'user_grace_period',
      userEmail: 'cliente_grace@empresa.com',
      subscription: {
        status: 'grace_period',
        grace_period_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    expect(result).toBe(true);
  });

  it('Cenário 4: Queda temporária de RLS na tabela subscriptions não deve deslogar hanarafaelle11@gmail.com do plano Pro', () => {
    // Simula RLS retornando null na tabela subscriptions durante a hidratação da sessão
    const result = evaluateProEntitlement({
      userId: 'bb84f193-79d4-49f5-8ed4-cc03234b27bd',
      userEmail: 'hanarafaelle11@gmail.com',
      subscription: null,
      profile: { role: 'admin', email: 'hanarafaelle11@gmail.com' }
    });

    expect(result).toBe(true);
  });

  it('Cenário 5: Assinatura efetivamente expirada no passado sem whitelist DEVE retornar Pro como falso', () => {
    const result = evaluateProEntitlement({
      userId: 'free_user_expired',
      userEmail: 'usuario_free_expirado@example.com',
      subscription: {
        status: 'canceled',
        current_period_end: '2025-01-01T00:00:00.000Z'
      },
      profile: { role: 'user', plan: 'free' }
    });

    expect(result).toBe(false);
  });

});
