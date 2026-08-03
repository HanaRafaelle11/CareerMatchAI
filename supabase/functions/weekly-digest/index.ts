// supabase/functions/weekly-digest/index.ts
// Envia e-mails de reengajamento e resumo semanal segmentado por estágio do funil
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('DIGEST_FROM_EMAIL') ?? 'VoCentro <noreply@vocentro.com.br>';
const MIN_SCORE = 80;

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

function cleanJobTitle(rawTitle: string): string {
  if (!rawTitle) return 'Vaga sem título';
  return rawTitle
    .replace(/\s*\((ongoing|closed|draft|active|urgente|em andamento|aberta|r&d)\)\s*$/gi, '')
    .replace(/\s*-\s*(ongoing|closed|draft|active|urgente)\s*$/gi, '')
    .trim();
}

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

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function isJobUrlActive(url: string): Promise<boolean> {
  if (!url || !url.startsWith('http')) return true;
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

    if (res.status === 404 || res.status === 410) return false;

    const htmlText = await res.text();
    const titleMatch = htmlText.match(/<title[^>]*>(.*?)<\/title>/i);
    const titleText = (titleMatch ? titleMatch[1] : '').toLowerCase();

    if (titleText.includes('404') || titleText.includes('não encontrada') || titleText.includes('vaga encerrada') || titleText.includes('vaga desativada')) {
      return false;
    }

    return true;
  } catch (_err) {
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
    const isDryRun = body?.dry_run === true || body?.dryRun === true;

    // ── 1. Buscar perfis de usuários ──
    let profiles: any[] = [];
    if (testEmail) {
      const { data: testProfiles, error: testErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, weekly_digest_enabled')
        .ilike('email', testEmail);

      if (testErr) throw testErr;
      if (!testProfiles || testProfiles.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, skipped: 0, error: `Nenhum usuário encontrado com o e-mail: ${testEmail}` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      profiles = testProfiles;
    } else {
      const { data: activeProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, weekly_digest_enabled')
        .not('email', 'is', null);

      if (profilesError) throw profilesError;
      profiles = activeProfiles || [];
    }

    // ── 2. Pré-carregar tabelas de estado para segmentação ──
    const [resumesRes, logsRes, matchesRes, sampleJobsRes] = await Promise.all([
      supabase.from('resumes').select('id, user_id'),
      supabase.from('resume_processing_logs').select('user_id, status, error_message'),
      supabase.from('matches').select('id, resume_id, score_overall, created_at, job_id'),
      supabase.from('jobs').select('id, title, company_name, location, source_url').limit(3)
    ]);

    const resumes = resumesRes.data || [];
    const processingLogs = logsRes.data || [];
    const matches = matchesRes.data || [];
    const sampleJobs = sampleJobsRes.data || [];

    const userResumesMap = new Map<string, any[]>();
    resumes.forEach(r => {
      if (!userResumesMap.has(r.user_id)) userResumesMap.set(r.user_id, []);
      userResumesMap.get(r.user_id)!.push(r);
    });

    const userFailedLogsSet = new Set<string>();
    processingLogs.forEach(l => {
      if (l.user_id && (l.status === 'error' || l.status === 'failed' || l.error_message)) {
        userFailedLogsSet.add(l.user_id);
      }
    });

    const resumeToUserMap = new Map<string, string>();
    resumes.forEach(r => resumeToUserMap.set(r.id, r.user_id));

    const userMatchesMap = new Map<string, any[]>();
    matches.forEach(m => {
      const uid = m.user_id || resumeToUserMap.get(m.resume_id);
      if (uid) {
        if (!userMatchesMap.has(uid)) userMatchesMap.set(uid, []);
        userMatchesMap.get(uid)!.push(m);
      }
    });

    // ── 3. Classificar usuários por segmento ──
    const segmentCounts = {
      segment_1_no_resume: 0,
      segment_2_failed_upload: 0,
      segment_3_resume_no_match: 0,
      segment_4_match_no_app: 0
    };

    const classifiedUsers: { profile: any; segment: number; userResumes: any[]; userMatches: any[] }[] = [];

    for (const p of profiles) {
      const uResumes = userResumesMap.get(p.id) || [];
      const hasResumes = uResumes.length > 0;
      const hasFailedLogs = userFailedLogsSet.has(p.id);
      const uMatches = userMatchesMap.get(p.id) || [];
      const hasMatches = uMatches.length > 0;

      let seg = 1;
      if (!hasResumes) {
        seg = hasFailedLogs ? 2 : 1;
      } else {
        seg = !hasMatches ? 3 : 4;
      }

      if (seg === 1) segmentCounts.segment_1_no_resume++;
      if (seg === 2) segmentCounts.segment_2_failed_upload++;
      if (seg === 3) segmentCounts.segment_3_resume_no_match++;
      if (seg === 4) segmentCounts.segment_4_match_no_app++;

      classifiedUsers.push({ profile: p, segment: seg, userResumes: uResumes, userMatches: uMatches });
    }

    // Se for MODO DRY-RUN: apenas retorna a contagem dos segmentos sem disparar e-mails
    if (isDryRun) {
      console.log('[weekly-digest] MODO DRY-RUN EXECUTADO. Nenhum e-mail foi disparado.');
      return new Response(
        JSON.stringify({
          mode: 'dry_run',
          total_profiles: profiles.length,
          segment_counts: segmentCounts,
          reconciled_breakdown: {
            segment_1_no_resume: `${segmentCounts.segment_1_no_resume} usuários (0 currículos)`,
            segment_2_failed_upload: `${segmentCounts.segment_2_failed_upload} usuários (falha técnica em resume_processing_logs)`,
            segment_3_resume_no_match: `${segmentCounts.segment_3_resume_no_match} usuários (currículo pronto, 0 matches)`,
            segment_4_match_no_app: `${segmentCounts.segment_4_match_no_app} usuários (match calculado em matches)`
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 4. Processar envio real por segmento ──
    const results: { userId: string; email: string; segment: number; status: string; error?: string }[] = [];

    for (const item of classifiedUsers) {
      const { profile, segment, userResumes } = item;
      const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'Olá';

      try {
        let subject = '';
        let htmlBody = '';

        if (segment === 1) {
          // SEGMENTO 1: NUNCA FEZ UPLOAD
          subject = `Complete seu cadastro no VoCentro enviando seu currículo`;
          htmlBody = buildSegment1Html(firstName);

        } else if (segment === 2) {
          // SEGMENTO 2: FALHA TÉCNICA NO UPLOAD
          subject = `Corrigimos o problema no envio do seu currículo no VoCentro`;
          htmlBody = buildSegment2Html(firstName);

        } else if (segment === 3) {
          // SEGMENTO 3: UPLOAD OK, SEM MATCH
          subject = `Seu currículo está pronto! Veja sua compatibilidade com as vagas`;
          htmlBody = buildSegment3Html(firstName, sampleJobs);

        } else {
          // SEGMENTO 4: MATCH GERADO, SEM RETORNO (Digest semanal)
          const resumeIds = userResumes.map(r => r.id);
          const { data: rawMatches } = await supabase
            .from('matches')
            .select('id, score_overall, created_at, job_id, jobs(id, title, company_name, source_url, location)')
            .in('resume_id', resumeIds)
            .gte('score_overall', MIN_SCORE)
            .order('score_overall', { ascending: false })
            .limit(10);

          const digestJobs: DigestJob[] = (rawMatches || []).map((m: any) => ({
            matchId: m.id,
            jobId: m.job_id,
            title: cleanJobTitle(m.jobs?.title || ''),
            company: m.jobs?.company_name || 'Empresa',
            score: m.score_overall,
            url: m.jobs?.source_url || 'https://vocentro.com.br/?tab=match',
            location: m.jobs?.location
          }));

          if (digestJobs.length === 0) {
            // Se não houver matches > 80%, envia o template do segmento 3 como ponte
            subject = `Seu currículo está pronto! Veja sua compatibilidade com as vagas`;
            htmlBody = buildSegment3Html(firstName, sampleJobs);
          } else {
            subject = `${testEmail ? '[TESTE] ' : ''}🎯 ${digestJobs.length} vaga${digestJobs.length > 1 ? 's' : ''} com alto match para você esta semana`;
            htmlBody = buildDigestHtml(firstName, digestJobs);
          }
        }

        // Envio via Resend
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: profile.email,
            subject,
            html: htmlBody,
            headers: {
              'List-Unsubscribe': `<https://vocentro.com.br/?tab=settings&subtab=notifications>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          }),
        });

        if (!emailResp.ok) {
          const errText = await emailResp.text();
          results.push({ userId: profile.id, email: profile.email, segment, status: 'send_error', error: errText });
          continue;
        }

        results.push({ userId: profile.id, email: profile.email, segment, status: 'sent' });

      } catch (err: any) {
        results.push({ userId: profile.id, email: profile.email, segment, status: 'error', error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ isTest: !!testEmail, segment_counts: segmentCounts, total: profiles.length, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ── TEMPLATES HTML POR SEGMENTO ──

// Segmento 1: Nunca fez upload
function buildSegment1Html(name: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">VoCentro</h1>
      <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Seu Copiloto de Carreira IA</p>
    </div>
    <div style="padding:32px 36px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Olá, ${escapeHtml(name)}! 👋</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        Notamos que você criou sua conta no VoCentro, mas ainda não enviou seu currículo para estruturação.
      </p>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
        O envio leva menos de 1 minuto e permite que nossa IA identifique automaticamente seu alinhamento com as principais oportunidades do mercado.
      </p>
      <div style="text-align:center;margin-top:28px;">
        <a href="https://vocentro.com.br/?tab=profile" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">Enviar meu currículo em PDF →</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Segmento 2: Falha técnica no upload
function buildSegment2Html(name: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">VoCentro</h1>
      <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Seu Copiloto de Carreira IA</p>
    </div>
    <div style="padding:32px 36px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Olá, ${escapeHtml(name)}! 👋</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        Identificamos que você tentou enviar seu currículo recentemente no VoCentro, mas um problema técnico no nosso processamento impediu a leitura correta do arquivo.
      </p>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
        <strong>Já corrigimos a falha!</strong> Pedimos desculpas pelo inconveniente e convidamos você a fazer o envio novamente para que nossa IA possa analisar seu perfil.
      </p>
      <div style="text-align:center;margin-top:28px;">
        <a href="https://vocentro.com.br/?tab=profile" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">Reenviar meu currículo agora →</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Segmento 3: Upload OK, sem match
function buildSegment3Html(name: string, sampleJobs: any[]): string {
  const jobsList = sampleJobs.map(j => `
    <li style="margin-bottom:8px;color:#334155;font-size:13px;">
      <strong>${escapeHtml(j.title)}</strong> na <em>${escapeHtml(j.company_name || 'Empresa')}</em>
    </li>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">VoCentro</h1>
      <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Seu Copiloto de Carreira IA</p>
    </div>
    <div style="padding:32px 36px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Olá, ${escapeHtml(name)}! 🎉</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        Seu currículo já foi processado e estruturado pela nossa IA com sucesso. Falta só 1 passo simples para você descobrir suas chances reais no mercado!
      </p>
      ${sampleJobs.length > 0 ? `
        <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:8px;">Vagas em alta prontas para calcular Match:</span>
          <ul style="margin:0;padding-left:18px;">
            ${jobsList}
          </ul>
        </div>
      ` : ''}
      <div style="text-align:center;margin-top:28px;">
        <a href="https://vocentro.com.br/?tab=match" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">Buscar vagas e ver meu Match →</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Segmento 4: Match gerado, sem retorno (Digest)
function buildDigestHtml(name: string, jobs: DigestJob[]): string {
  const rows = jobs.map(j => `
    <tr>
      <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;">
        <span style="display:inline-block;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;margin-bottom:8px;">${j.score}% match</span>
        <strong style="font-size:16px;color:#0f172a;line-height:1.3;display:block;">${escapeHtml(j.title)}</strong>
        <span style="font-size:13px;color:#64748b;font-weight:500;display:block;margin:4px 0 12px;">${escapeHtml(j.company)}${j.location ? ' · ' + escapeHtml(j.location) : ''}</span>
        <a href="${escapeHtml(j.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-size:12px;font-weight:700;padding:7px 16px;border-radius:8px;text-decoration:none;">Ver vaga →</a>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">VoCentro</h1>
      <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Seu Copiloto de Carreira IA</p>
    </div>
    <div style="padding:32px 36px;">
      <h2 style="margin:0 0 8px;font-size:19px;color:#0f172a;">Olá, ${escapeHtml(name)}! 👋</h2>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
        Encontramos <strong>${jobs.length} vaga${jobs.length > 1 ? 's' : ''}</strong> com alto índice de compatibilidade para o seu perfil esta semana. Confira:
      </p>
      <table style="width:100%;border-collapse:separate;border-spacing:0 16px;">${rows}</table>
      <div style="margin-top:32px;text-align:center;">
        <a href="https://vocentro.com.br/?tab=match" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;">Ver todas as vagas no VoCentro →</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
