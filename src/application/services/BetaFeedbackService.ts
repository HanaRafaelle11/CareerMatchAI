import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { BetaFeedbackRating, BetaFeedback } from '../../domain/models/types';

export class BetaFeedbackService {
  /**
   * Envia o feedback do usuário sobre o Beta do VoCentro
   */
  static async sendFeedback(
    userId: string | undefined,
    feature: string,
    rating: BetaFeedbackRating,
    comment?: string
  ): Promise<BetaFeedback> {
    const record: BetaFeedback = {
      id: `fb-beta-${Date.now()}`,
      userId,
      feature,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('beta_feedback').insert({
          user_id: userId || null,
          feature,
          rating,
          comment: comment || null
        });
      } catch (err) {
        console.warn('[BetaFeedbackService] Erro ao gravar feedback no Supabase:', err);
      }
    }

    localDB.saveBetaFeedback(record);

    // Evento de analytics tracker: beta_feedback_sent
    tracker.track('beta_feedback_sent', 'ProductBeta', {
      feature,
      rating,
      has_comment: !!comment
    });

    return record;
  }
}
