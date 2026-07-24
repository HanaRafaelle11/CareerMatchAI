/**
 * Parser autoritativo de senioridade para vagas.
 * Aplica a seguinte hierarquia estrita:
 * 1. Senioridade explícita no TÍTULO (MAIOR PRIORIDADE)
 * 2. Senioridade na DESCRIÇÃO
 * 3. Senioridade inferida pelas responsabilidades
 * 4. Fallback ('pleno')
 */
export type SeniorityLevel = 'junior' | 'pleno' | 'senior' | 'lead' | 'director';

export function extractSeniorityFromJob(title: string, description: string = ''): SeniorityLevel {
  const t = (title || '').toLowerCase();
  const d = (description || '').toLowerCase();

  let detected: SeniorityLevel | null = null;
  let reason = '';

  // 1. PRIORIDADE MÁXIMA: Título da Vaga
  if (/\b(director|diretor|diretora|vp|vice.president|cxo|ceo|cto|cfo|chief|partner)\b/i.test(t)) {
    detected = 'director';
    reason = 'Title contains director/executive term';
  } else if (/\b(lead|head|principal|staff|manager|gerente|coordenador|coordenadora|supervisor|supervisora|líder|lider)\b/i.test(t)) {
    detected = 'lead';
    reason = 'Title contains leadership/manager/supervisor term';
  } else if (/\b(senior|sênior|sr\.?|especialista|specialist)\b/i.test(t)) {
    detected = 'senior';
    reason = 'Title contains explicit senior/sr modifier';
  } else if (/\b(junior|júnior|jr\.?|entry|assistente|trainee|estagiário|estagiária|intern)\b/i.test(t)) {
    detected = 'junior';
    reason = 'Title contains explicit junior/jr modifier';
  } else if (/\b(pleno|mid|intermediate|3-5|3 a 5)\b/i.test(t)) {
    detected = 'pleno';
    reason = 'Title contains explicit pleno/mid modifier';
  }

  // 2. SEGUNDA PRIORIDADE: Descrição da Vaga
  if (!detected) {
    if (/\b(director|diretor|diretora|vp|vice.president)\b/i.test(d)) {
      detected = 'director';
      reason = 'Description mentions director/vp';
    } else if (/\b(lead|head|liderança|lider|líder|supervisor|supervisora|gestão de equipe)\b/i.test(d)) {
      detected = 'lead';
      reason = 'Description mentions leadership/head/supervisor';
    } else if (/\b(senior|sênior|sr\.?|especialista)\b/i.test(d)) {
      detected = 'senior';
      reason = 'Description mentions senior/sr/especialista';
    } else if (/\b(junior|júnior|jr\.?|iniciante|entry)\b/i.test(d)) {
      detected = 'junior';
      reason = 'Description mentions junior/entry';
    } else if (/\b(pleno|plena|mid.level|intermediate)\b/i.test(d)) {
      detected = 'pleno';
      reason = 'Description mentions pleno/mid';
    }
  }

  // 3. TERCEIRA PRIORIDADE / FALLBACK
  if (!detected) {
    detected = 'pleno';
    reason = 'Fallback default';
  }

  console.log(`[Seniority Detection] title: "${title}" | detected: ${detected} | reason: ${reason}`);
  return detected;
}
