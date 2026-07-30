export const APPLIED_STATUSES = [
  '📨 Me candidatei',
  '👥 Entrevista com recrutador',
  '🎯 Entrevista com gestor',
  '🧩 Case técnico',
  '🤝 Fit cultural',
  '🏆 Oferta recebida',
  '✅ Aceita',
  'applied',
  'hr',
  'interview',
  'offer',
  'hired'
] as const;

export const SAVED_STATUSES = [
  '🔎 Encontrada',
  '⭐ Tenho interesse',
  '📝 Vou me candidatar',
  '📝 Candidatura planejada',
  'found',
  'saved'
] as const;

export const REJECTED_STATUSES = [
  '❌ Rejeitada',
  '🚫 Fora do meu objetivo',
  '👻 Sem resposta',
  'rejected',
  'deleted'
] as const;

export function isAppliedStatus(status: string): boolean {
  return (APPLIED_STATUSES as readonly string[]).includes(status);
}

export function isSavedStatus(status: string): boolean {
  return (SAVED_STATUSES as readonly string[]).includes(status);
}

export function isRejectedStatus(status: string): boolean {
  return (REJECTED_STATUSES as readonly string[]).includes(status);
}
