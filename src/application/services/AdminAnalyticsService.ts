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

export class AdminAnalyticsService {
  /**
   * Calcula métricas oficiais de usuários ativos (DAU/WAU/MAU) e Stickiness.
   * Invariante Matemático: WAU >= DAU e MAU >= WAU.
   */
  static calculateActiveUserMetrics(events: Array<{ user_id?: string | null; created_at?: string }>, referenceDate: Date = new Date()): ActiveUserCounts {
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

    let dau = dauUsers.size;
    let wau = wauUsers.size;
    let mau = mauUsers.size;

    // Garantia matemática de aninhamento
    if (wau < dau) wau = dau;
    if (mau < wau) mau = wau;

    const stickiness = mau > 0 ? Number(((dau / mau) * 100).toFixed(1)) : 0;

    return {
      dau,
      wau,
      mau,
      stickiness
    };
  }

  /**
   * Calcula as taxas do funil de ativação a partir de dados reais.
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
   * Filtra uma lista de usuários isolando contas reais de contas internas/teste.
   */
  static filterProductionUsers<T extends { email?: string | null; is_test_account?: boolean | null }>(users: T[]): T[] {
    return (users || []).filter(u => !AdminAuditService.isTestOrInternalAccount(u));
  }
}
