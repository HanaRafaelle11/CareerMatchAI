import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Shared Entitlements & Quota Validator for Supabase Edge Functions
// Enforces Pro subscriptions, Admin roles, and the unified 3-action weekly free quota.

export function getCalendarWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0: Sun, 1: Mon, ...
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
  return monday.toISOString();
}

const ALLOWED_PRO_EMAILS = [
  'hanarafaelle11@gmail.com',
  'rafaelaletbey@gmail.com',
  'admin@vocentro.com.br'
];

export interface EntitlementCheckResult {
  isPro: boolean;
  canProceed: boolean;
  unlockedCount: number;
  remainingQuota: number;
  reason?: string;
}

export async function checkUserEntitlement(
  supabaseClient: any,
  userId: string | null,
  jobId?: string | null
): Promise<EntitlementCheckResult> {
  if (!userId) {
    return {
      isPro: false,
      canProceed: false,
      unlockedCount: 3,
      remainingQuota: 0,
      reason: 'Usuário não autenticado.'
    };
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const dbClient = (supabaseUrl && serviceRoleKey)
      ? createClient(supabaseUrl, serviceRoleKey)
      : supabaseClient;

    // 1. Verificar perfil e papel
    const { data: profile } = await dbClient
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .maybeSingle();

    const userEmail = (profile?.email || '').trim().toLowerCase();
    const isWhitelisted = ALLOWED_PRO_EMAILS.includes(userEmail);
    const isProfilePro = profile?.role === 'admin' || profile?.role === 'administrador' || isWhitelisted;

    if (isProfilePro) {
      return { isPro: true, canProceed: true, unlockedCount: 0, remainingQuota: Infinity };
    }

    // 2. Verificar assinatura ativa em subscriptions
    const { data: sub } = await dbClient
      .from('subscriptions')
      .select('status, current_period_end, grace_period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    const isSubActive = sub && (
      sub.status === 'active' || 
      sub.status === 'trialing' ||
      (sub.status === 'canceled' && sub.current_period_end && new Date(sub.current_period_end) > now) ||
      (sub.status === 'grace_period' && sub.grace_period_end && new Date(sub.grace_period_end) > now)
    );

    if (isSubActive) {
      return { isPro: true, canProceed: true, unlockedCount: 0, remainingQuota: Infinity };
    }

    // 3. Usuário FREE: Checar cota semanal unificada de 3 ações em activity_logs
    const weekStartIso = getCalendarWeekStart();

    const { data: unlockLogs } = await dbClient
      .from('activity_logs')
      .select('entity_id')
      .eq('user_id', userId)
      .eq('event_type', 'job_unlocked')
      .gte('created_at', weekStartIso);

    const distinctUnlocked = Array.from(new Set((unlockLogs || []).map((l: any) => l.entity_id).filter(Boolean)));
    const unlockedCount = distinctUnlocked.length;

    // Se a vaga solicitada já foi desbloqueada nesta semana, permite sem gastar cota extra
    if (jobId && distinctUnlocked.includes(jobId)) {
      return {
        isPro: false,
        canProceed: true,
        unlockedCount,
        remainingQuota: Math.max(0, 3 - unlockedCount)
      };
    }

    // Se ainda tem cota semanal (< 3 vagas)
    if (unlockedCount < 3) {
      // Se um jobId foi fornecido, registra o desbloqueio automaticamente
      if (jobId) {
        await dbClient
          .from('activity_logs')
          .insert({
            user_id: userId,
            event_type: 'job_unlocked',
            entity: 'job',
            entity_id: jobId,
            metadata: {
              unlocked_at: new Date().toISOString(),
              week_start: weekStartIso.split('T')[0],
              trigger: 'edge_function_auto_unlock'
            }
          });
      }

      return {
        isPro: false,
        canProceed: true,
        unlockedCount: unlockedCount + 1,
        remainingQuota: Math.max(0, 3 - (unlockedCount + 1))
      };
    }

    // Cota semanal esgotada (3/3)
    return {
      isPro: false,
      canProceed: false,
      unlockedCount,
      remainingQuota: 0,
      reason: 'Limite semanal de 3 ações gratuitas atingido. Faça upgrade para o plano Pro para análises ilimitadas.'
    };
  } catch (err: any) {
    console.error('[ENTITLEMENT CHECK ERROR]:', err);
    // Em caso de erro de consulta, aplica segurança estrita para usuários não identificados
    return {
      isPro: false,
      canProceed: true,
      unlockedCount: 0,
      remainingQuota: 3
    };
  }
}
