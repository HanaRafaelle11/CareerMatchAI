// supabase/functions/weekly-digest/index.ts
// Envia resumo semanal de vagas com alto match via Resend
// Agendado via pg_cron toda segunda-feira às 12h UTC
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('DIGEST_FROM_EMAIL') ?? 'VoCentro <noreply@vocentro.com.br>';
const MIN_SCORE = 80; // score_overall mínimo para entrar no digest

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface DigestJob {
  matchId: string;
  jobId: string;
  title: string;
  company: string;
  score: number;
  url: string;
  location?: string;
}

// Item 1: Limpeza de títulos de vagas (remove vazamentos de status internos como "(Ongoing)", "(Closed)", etc.)
function cleanJobTitle(rawTitle: string): string {
  if (!rawTitle) return 'Vaga sem título';
  return rawTitle
    .replace(/\s*\((ongoing|closed|draft|active|urgente|em andamento|aberta|r&d)\)\s*$/gi, '')
    .replace(/\s*-\s*(ongoing|closed|draft|active|urgente)\s*$/gi, '')
    .trim();
}

// Item 2: Verifica se a empresa é confidencial/genérica para priorização
function isConfidentialCompany(c: string): boolean {
  if (!c) return true;
  const lower = c.toLowerCase().trim();
  return (
    lower.includes('confidencial') ||
    lower.includes('empresa parceira') ||
    lower.includes('empresa oculta') ||
    lower === 'empresa' ||
    lower === 'empresa confidencial ?' ||
    lower === 'empresa confidencial'
  );
}

// ── Auxiliar: Verifica se a URL da vaga ainda está ativa ──
async function isJobUrlActive(url: string): Promise<boolean> {
  if (!url || !url.startsWith('http')) return true; // Se for URL interna/dummy, considera ativa
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeoutId);

    if (res.status === 404 || res.status === 410) {
      console.log(`[weekly-digest] Vaga 404/410 em: ${url}`);
      return false;
    }

    // Checa o título da página (<title>...</title>) para detectar páginas 404 / encerradas
    const htmlText = await res.text();
    const titleMatch = htmlText.match(/<title[^>]*>(.*?)<\/title>/i);
    const titleText = (titleMatch ? titleMatch[1] : '').toLowerCase();

    if (titleText.includes('404') || titleText.includes('não encontrada') || titleText.includes('vaga encerrada') || titleText.includes('vaga desativada')) {
      console.log(`[weekly-digest] Vaga inativa detectada no title ("${titleText}") de: ${url}`);
      return false;
    }

    return true;
  } catch (err: any) {
    // Em caso de timeout ou bloqueio de ping, mantemos a vaga por segurança (evita falso negativo)
    console.warn(`[weekly-digest] Aviso no ping da URL (${url}):`, err.message);
    return true;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (_e) {
        body = {};
      }
    }

    const testEmail = body?.test_email ? String(body.test_email).trim() : null;

    // ── 1. Buscar usuário(s) para notificar ──
    let profiles: any[] = [];

    if (testEmail) {
      console.log(`[weekly-digest] MODO TESTE: buscando apenas o e-mail "${testEmail}"`);
      const { data: testProfiles, error: testErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, weekly_digest_enabled')
        .ilike('email', testEmail);

      if (testErr) throw testErr;
      if (!testProfiles || testProfiles.length === 0) {
        return new Response(
          JSON.stringify({
            sent: 0,
            skipped: 0,
            error: `Nenhum usuário encontrado em 'profiles' com o e-mail: ${testEmail}`
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      profiles = testProfiles;
    } else {
      // Modo produção: apenas usuários com weekly_digest_enabled = true
      const { data: activeProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, weekly_digest_enabled')
        .eq('weekly_digest_enabled', true)
        .not('email', 'is', null);

      if (profilesError) throw profilesError;
      profiles = activeProfiles || [];
    }

    if (profiles.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: 0, message: 'Nenhum usuário ativo para enviar digest' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[weekly-digest] Processando ${profiles.length} usuário(s) (isTest=${!!testEmail})`);

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const results: { userId: string; email: string; status: string; error?: string; matched?: number }[] = [];

    for (const profile of profiles) {
      try {
        // ── 2a. Buscar candidaturas existentes do usuário ──
        const [appRes1, appRes2] = await Promise.all([
          supabase.from('applications').select('job_id, job_title, company_name').eq('user_id', profile.id),
          supabase.from('job_applications').select('job_id, job_title, company_name').eq('user_id', profile.id)
        ]);

        const appliedJobIds = new Set<string>();
        const appliedJobKeys = new Set<string>();

        const addApplied = (item: any) => {
          if (item.job_id) appliedJobIds.add(item.job_id);
          if (item.job_title) {
            const cleanTitle = cleanJobTitle(item.job_title);
            const key = `${cleanTitle.toLowerCase().trim()}|${(item.company_name || '').toLowerCase().trim()}`;
            appliedJobKeys.add(key);
          }
        };

        (appRes1.data || []).forEach(addApplied);
        (appRes2.data || []).forEach(addApplied);

        // ── 2b. Buscar currículos do usuário ──
        const { data: userResumes, error: resumesError } = await supabase
          .from('resumes')
          .select('id')
          .eq('user_id', profile.id);

        if (resumesError) {
          results.push({ userId: profile.id, email: profile.email, status: 'error', error: resumesError.message });
          continue;
        }

        if (!userResumes || userResumes.length === 0) {
          results.push({ userId: profile.id, email: profile.email, status: 'skipped_no_resumes', matched: 0 });
          continue;
        }

        const resumeIds = userResumes.map(r => r.id);

        // ── 2c. Query dos matches ──
        let { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('id, score_overall, created_at, job_id, jobs(id, title, company_name, source_url, location)')
          .in('resume_id', resumeIds)
          .gte('score_overall', MIN_SCORE)
          .gte('created_at', since.toISOString())
          .order('score_overall', { ascending: false })
          .limit(30);

        // Fallback no modo teste se não houver matches nos últimos 7 dias
        if (testEmail && (!matches || matches.length === 0)) {
          console.log(`[weekly-digest] [TESTE] Nenhum match nos últimos 7 dias. Buscando histórico de matches...`);
          const fallbackQuery = await supabase
            .from('matches')
            .select('id, score_overall, created_at, job_id, jobs(id, title, company_name, source_url, location)')
            .in('resume_id', resumeIds)
            .gte('score_overall', MIN_SCORE)
            .order('score_overall', { ascending: false })
            .limit(30);
          matches = fallbackQuery.data;
          matchesError = fallbackQuery.error;
        }

        if (matchesError) {
          console.error(`[weekly-digest] Erro ao buscar matches para ${profile.id}:`, matchesError);
          results.push({ userId: profile.id, email: profile.email, status: 'error', error: matchesError.message });
          continue;
        }

        if (!matches || matches.length === 0) {
          results.push({ userId: profile.id, email: profile.email, status: 'skipped_no_matches', matched: 0 });
          continue;
        }

        // ── 2d. Deduplicação, Filtro e Pings de Vaga Ativa ──
        const seenJobIds = new Set<string>();
        const seenJobKeys = new Set<string>();
        const candidateJobs: DigestJob[] = [];

        for (const m of matches) {
          const job = (m as any).jobs;
          if (!job) continue;

          const jobId = job.id || m.job_id;
          const cleanTitle = cleanJobTitle(job.title); // Item 1: limpa status interno como (Ongoing)
          const company = (job.company_name || job.companyName || 'Empresa').trim();
          const jobKey = `${cleanTitle.toLowerCase().trim()}|${company.toLowerCase().trim()}`;

          // Deduplicação (mantém o match de maior score por vaga)
          if (jobId && seenJobIds.has(jobId)) continue;
          if (seenJobKeys.has(jobKey)) continue;

          // Exclusão de Vagas Candidatadas
          if (jobId && appliedJobIds.has(jobId)) continue;
          if (appliedJobKeys.has(jobKey)) continue;

          const sourceUrl = job.source_url || 'https://vocentro.com.br/?tab=match';

          // Ping HTTP para confirmar URL ativa
          const activeOnWeb = await isJobUrlActive(sourceUrl);
          if (!activeOnWeb) continue;

          if (jobId) seenJobIds.add(jobId);
          seenJobKeys.add(jobKey);

          candidateJobs.push({
            matchId: m.id,
            jobId: jobId,
            title: cleanTitle,
            company: company,
            score: m.score_overall,
            url: sourceUrl,
            location: job.location || undefined,
          });
        }

        // Item 2: Ordenar vagas priorizando empresas com nome real sobre "Empresa Confidencial"
        candidateJobs.sort((a, b) => {
          const aConf = isConfidentialCompany(a.company);
          const bConf = isConfidentialCompany(b.company);
          if (aConf && !bConf) return 1; // Confidencial vai para baixo
          if (!aConf && bConf) return -1; // Empresa real vai para cima
          return b.score - a.score; // Secundário: maior score primeiro
        });

        // Limita às 10 melhores vagas ordenadas
        const digestJobs = candidateJobs.slice(0, 10);

        if (digestJobs.length === 0) {
          results.push({ userId: profile.id, email: profile.email, status: 'skipped_no_active_matches', matched: 0 });
          continue;
        }

        // ── 3. Enviar e-mail via Resend ──
        const unsubscribeUrl = 'https://vocentro.com.br/?tab=settings&subtab=notifications';

        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: profile.email,
            subject: `${testEmail ? '[TESTE] ' : ''}🎯 ${digestJobs.length} vaga${digestJobs.length > 1 ? 's' : ''} com alto match para você esta semana`,
            html: buildDigestHtml(profile.full_name ?? 'Olá', digestJobs),
            text: buildDigestText(profile.full_name ?? 'Olá', digestJobs),
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          }),
        });

        if (!emailResp.ok) {
          const errText = await emailResp.text();
          console.error(`[weekly-digest] Resend erro para ${profile.email}:`, errText);
          results.push({ userId: profile.id, email: profile.email, status: 'send_error', error: errText });
          continue;
        }

        console.log(`[weekly-digest] E-mail enviado com sucesso para ${profile.email} (${digestJobs.length} vagas únicas)`);
        results.push({ userId: profile.id, email: profile.email, status: 'sent', matched: digestJobs.length });

      } catch (userErr: any) {
        console.error(`[weekly-digest] Erro inesperado para ${profile.id}:`, userErr);
        results.push({ userId: profile.id, email: profile.email, status: 'error', error: String(userErr) });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const skipped = results.filter((r) => r.status.startsWith('skipped')).length;
    const errors = results.filter((r) => r.status === 'error' || r.status === 'send_error').length;

    return new Response(
      JSON.stringify({ isTest: !!testEmail, sent, skipped, errors, total: profiles.length, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    const errMsg = err?.message || err?.error_description || (typeof err === 'object' ? JSON.stringify(err) : String(err));
    console.error('[weekly-digest] Erro fatal:', errMsg, err);
    return new Response(
      JSON.stringify({ error: errMsg, details: err }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Item 5: Faixas de cores dinâmicas para os selos de match
function getScoreBadgeStyles(score: number): { bg: string; color: string; border: string } {
  if (score >= 90) {
    return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }; // 90%+ Verde
  } else if (score >= 80) {
    return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' }; // 80-89% Amarelo/Âmbar
  } else {
    return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }; // < 80% Cinza
  }
}

// Items 3, 4, 5: Template HTML reformulado com cards estilizados, botões proeminentes e hierarquia visual refinada
function buildDigestHtml(name: string, jobs: DigestJob[]): string {
  const settingsUrl = 'https://vocentro.com.br/?tab=settings&subtab=notifications';
  const catalogUrl = 'https://vocentro.com.br/?tab=match';

  const rows = jobs
    .map((j) => {
      const badge = getScoreBadgeStyles(j.score);
      return `
      <tr>
        <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;padding-bottom:10px;">
                <span style="
                  display:inline-block;
                  background:${badge.bg};
                  color:${badge.color};
                  border:1px solid ${badge.border};
                  font-size:11px;
                  font-weight:700;
                  padding:3px 10px;
                  border-radius:99px;
                ">${j.score}% match</span>
              </td>
            </tr>
            <tr>
              <td style="vertical-align:top;padding-bottom:6px;">
                <strong style="font-size:16px;color:#0f172a;line-height:1.3;display:block;">${escapeHtml(j.title)}</strong>
              </td>
            </tr>
            <tr>
              <td style="vertical-align:top;padding-bottom:16px;">
                <span style="font-size:13px;color:#64748b;font-weight:500;">${escapeHtml(j.company)}${j.location ? ' · ' + escapeHtml(j.location) : ''}</span>
              </td>
            </tr>
            <tr>
              <td style="vertical-align:top;">
                <a href="${escapeHtml(j.url)}" target="_blank" rel="noopener noreferrer" style="
                  display:inline-block;
                  background-color:#eff6ff;
                  color:#1d4ed8;
                  border:1px solid #bfdbfe;
                  font-size:12px;
                  font-weight:700;
                  padding:7px 16px;
                  border-radius:8px;
                  text-decoration:none;
                ">Ver vaga →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb);padding:32px 36px;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">VoCentro</h1>
      <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;font-weight:500;">Seu Copiloto de Carreira IA</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px;">
      <h2 style="margin:0 0 8px;font-size:19px;color:#0f172a;font-weight:700;">Olá, ${escapeHtml(name)}! 👋</h2>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
        Encontramos <strong>${jobs.length} vaga${jobs.length > 1 ? 's' : ''}</strong> com alto índice de compatibilidade para o seu perfil esta semana. Confira as principais oportunidades:
      </p>

      <!-- Lista de Vagas Cards com Espaçamento de 16px -->
      <table style="width:100%;border-collapse:separate;border-spacing:0 16px;">
        ${rows}
      </table>

      <div style="margin-top:32px;text-align:center;">
        <a href="${catalogUrl}"
           style="
             display:inline-block;
             background:linear-gradient(135deg,#2563eb,#1d4ed8);
             color:#ffffff;
             font-size:14px;
             font-weight:700;
             padding:14px 32px;
             border-radius:12px;
             text-decoration:none;
             box-shadow:0 4px 12px rgba(37,99,235,0.25);
           ">Ver todas as vagas no VoCentro →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 36px;border-top:1px solid #f1f5f9;background:#f8fafc;">
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
        Você recebe este e-mail porque o resumo semanal está ativado na sua conta.<br/>
        <a href="${settingsUrl}" style="color:#2563eb;text-decoration:underline;font-weight:600;">Gerenciar preferências em Configurações → Notificações</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// Versão Plain Text para entregabilidade
function buildDigestText(name: string, jobs: DigestJob[]): string {
  const settingsUrl = 'https://vocentro.com.br/?tab=settings&subtab=notifications';
  const catalogUrl = 'https://vocentro.com.br/?tab=match';

  const jobLines = jobs
    .map(
      (j, i) =>
        `${i + 1}. ${j.title} - ${j.company} (${j.score}% match)\n   Link: ${j.url}`
    )
    .join('\n\n');

  return `Olá, ${name}!

Encontramos ${jobs.length} vaga(s) com alto índice de compatibilidade para o seu perfil esta semana:

${jobLines}

Ver todas as vagas no VoCentro: ${catalogUrl}

--
Você recebe este e-mail porque o resumo semanal está ativado no VoCentro.
Gerenciar preferências de notificação: ${settingsUrl}`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
