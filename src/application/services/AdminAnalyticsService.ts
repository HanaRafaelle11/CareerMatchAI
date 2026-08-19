import { AdminAuditService } from './AdminAuditService';

export interface ActiveUserCounts {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number; // (DAU / MAU) * 100
}

export interface ActivationFunnelMetrics {
  totalRegistered: number;
  uploadedResume: number;
  viewedMatch: number;
  appliedOrSaved: number;
  proConverted: number;
  uploadRate: number;    // (uploadedResume / totalRegistered) * 100
  matchViewRate: number; // (viewedMatch / uploadedResume) * 100
  applyRate: number;     // (appliedOrSaved / viewedMatch) * 100
  proConversionRate: number; // (proConverted / totalRegistered) * 100
}

export interface FreshnessStatus {
  status: 'fresh' | 'aging' | 'stale';
  label: string;
  minutesAgo: number;
}

export interface TimeToValueMetrics {
  p50Minutes: number;
  p75Minutes: number;
  p90Minutes: number;
  avgMinutes: number;
  sampleCount: number;
}

export interface AiCostBreakdown {
  totalTokens: number;
  totalCalls: number;
  totalCostBrl: number;
  costPerActiveUserBrl: number;
  featureBreakdown: Record<string, { calls: number; tokens: number; costBrl: number }>;
}

export type AnalyticsResult<T> =
  | { status: 'success'; data: T; updatedAt: string }
  | { status: 'error'; error: string; updatedAt: string };

export class AdminAnalyticsService {
  // Tarifas oficiais SKU Google Cloud Gemini 3.6 Flash:
  // Input: R$ 0,000008705 / token
  // Output: R$ 0,0000436254 / token
  public static readonly INPUT_TOKEN_RATE_BRL = 0.000008705;
  public static readonly OUTPUT_TOKEN_RATE_BRL = 0.0000436254;

  /**
   * Calcula métricas de usuários ativos (DAU/WAU/MAU) e Stickiness.
   * Deduplicação estrita por user_id.
   * Janelas temporais: rolling 24h, rolling 7d (7x24h), rolling 30d (30x24h).
   */
  static calculateActiveUserMetrics(
    events: Array<{ user_id?: string | null; created_at?: string }>,
    referenceDate: Date = new Date()
  ): ActiveUserCounts {
    const refTime = referenceDate.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    const dauUsers = new Set<string>();
    const wauUsers = new Set<string>();
    const mauUsers = new Set<string>();

    events.forEach(evt => {
      if (!evt.user_id) return;
      const evtTime = evt.created_at ? new Date(evt.created_at).getTime() : 0;
      if (!evtTime || isNaN(evtTime)) return;

      const diff = refTime - evtTime;
      if (diff >= 0 && diff <= oneDayMs) {
        dauUsers.add(evt.user_id);
      }
      if (diff >= 0 && diff <= sevenDaysMs) {
        wauUsers.add(evt.user_id);
      }
      if (diff >= 0 && diff <= thirtyDaysMs) {
        mauUsers.add(evt.user_id);
      }
    });

    const dau = dauUsers.size;
    const wau = wauUsers.size;
    const mau = mauUsers.size;

    // Stickiness oficial
    const stickiness = mau > 0 ? Number(((dau / mau) * 100).toFixed(1)) : 0;

    return {
      dau,
      wau,
      mau,
      stickiness
    };
  }

  /**
   * Calcula as taxas do funil de ativação a partir de contagens de usuários únicos.
   * Zero constantes inventadas ou mockadas.
   */
  static calculateActivationFunnel(data: {
    totalRegistered: number;
    uploadedResume: number;
    viewedMatch: number;
    appliedOrSaved: number;
    proConverted: number;
  }): ActivationFunnelMetrics {
    const { totalRegistered, uploadedResume, viewedMatch, appliedOrSaved, proConverted } = data;

    const uploadRate = totalRegistered > 0 ? Number(((uploadedResume / totalRegistered) * 100).toFixed(1)) : 0;
    const matchViewRate = uploadedResume > 0 ? Number(((viewedMatch / uploadedResume) * 100).toFixed(1)) : 0;
    const applyRate = viewedMatch > 0 ? Number(((appliedOrSaved / viewedMatch) * 100).toFixed(1)) : 0;
    const proConversionRate = totalRegistered > 0 ? Number(((proConverted / totalRegistered) * 100).toFixed(1)) : 0;

    return {
      totalRegistered,
      uploadedResume,
      viewedMatch,
      appliedOrSaved,
      proConverted,
      uploadRate,
      matchViewRate,
      applyRate,
      proConversionRate
    };
  }

  /**
   * Calcula percentis de Time to Value (TTFV) em minutos
   */
  static calculateTimeToValue(durationsMinutes: number[]): TimeToValueMetrics {
    const valid = durationsMinutes.filter(d => typeof d === 'number' && !isNaN(d) && d >= 0).sort((a, b) => a - b);
    if (valid.length === 0) {
      return { p50Minutes: 0, p75Minutes: 0, p90Minutes: 0, avgMinutes: 0, sampleCount: 0 };
    }

    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * valid.length) - 1;
      return valid[Math.max(0, Math.min(index, valid.length - 1))];
    };

    const sum = valid.reduce((acc, cur) => acc + cur, 0);
    const avg = Number((sum / valid.length).toFixed(1));

    return {
      p50Minutes: Number(getPercentile(50).toFixed(1)),
      p75Minutes: Number(getPercentile(75).toFixed(1)),
      p90Minutes: Number(getPercentile(90).toFixed(1)),
      avgMinutes: avg,
      sampleCount: valid.length
    };
  }

  /**
   * Calcula o custo de IA e quebra por funcionalidade a partir dos logs de tokens
   */
  static calculateAiCosts(
    logs: Array<{ feature?: string; input_tokens?: number; output_tokens?: number }>,
    activeUsersCount = 1
  ): AiCostBreakdown {
    let totalTokens = 0;
    let totalCostBrl = 0;
    const featureBreakdown: Record<string, { calls: number; tokens: number; costBrl: number }> = {};

    logs.forEach(log => {
      const inp = log.input_tokens || 0;
      const out = log.output_tokens || 0;
      const tokens = inp + out;
      totalTokens += tokens;

      const cost = (inp * this.INPUT_TOKEN_RATE_BRL) + (out * this.OUTPUT_TOKEN_RATE_BRL);
      totalCostBrl += cost;

      const feat = log.feature || 'other';
      if (!featureBreakdown[feat]) {
        featureBreakdown[feat] = { calls: 0, tokens: 0, costBrl: 0 };
      }
      featureBreakdown[feat].calls += 1;
      featureBreakdown[feat].tokens += tokens;
      featureBreakdown[feat].costBrl = Number((featureBreakdown[feat].costBrl + cost).toFixed(4));
    });

    const safeActiveUsers = Math.max(1, activeUsersCount);
    const costPerActiveUser = Number((totalCostBrl / safeActiveUsers).toFixed(2));

    return {
      totalTokens,
      totalCalls: logs.length,
      totalCostBrl: Number(totalCostBrl.toFixed(2)),
      costPerActiveUserBrl: costPerActiveUser,
      featureBreakdown
    };
  }

  /**
   * Avalia a frescura (freshness) de um dado em relação ao horário atual
   */
  static getFreshness(timestamp: string | Date, now: Date = new Date()): FreshnessStatus {
    const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp.getTime();
    if (isNaN(time)) {
      return { status: 'stale', label: 'Data indisponível', minutesAgo: -1 };
    }

    const diffMs = Math.max(0, now.getTime() - time);
    const minutesAgo = Math.floor(diffMs / (60 * 1000));

    if (minutesAgo < 5) {
      return { status: 'fresh', label: minutesAgo === 0 ? 'Atualizado agora' : `Atualizado há ${minutesAgo} min`, minutesAgo };
    }
    if (minutesAgo <= 30) {
      return { status: 'aging', label: `Atualizado há ${minutesAgo} min`, minutesAgo };
    }
    return { status: 'stale', label: `Dados desatualizados (${minutesAgo} min)`, minutesAgo };
  }

  /**
   * Filtra uma lista de usuários isolando contas reais de contas internas/teste.
   */
  static filterProductionUsers<T extends { email?: string | null; is_test_account?: boolean | null }>(users: T[]): T[] {
    return (users || []).filter(u => !AdminAuditService.isTestOrInternalAccount(u));
  }
}
