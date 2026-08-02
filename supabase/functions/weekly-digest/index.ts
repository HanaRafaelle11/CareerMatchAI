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
  title: string;
  company: string;
  score: number;
  url: string;
  location?: string;
}

Deno.serve(async (req) => {
  // Aceita GET (cron) e POST (chamada manual/teste)
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
      // Modo normal de produção: usuários com weekly_digest_enabled = true
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
        JSON.stringify({ sent: 0, skipped: 0, message: 'Nenhum usuário com digest ativo para processar' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[weekly-digest] Processando ${profiles.length} usuário(s) (isTest=${!!testEmail})`);

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const results: { userId: string; email: string; status: string; error?: string; matched?: number }[] = [];

    for (const profile of profiles) {
      try {
        // Busca os currículos (resumes) do usuário
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

        // ── 2. Buscar matches de alta qualidade em public.matches ──
        // Schema real:
        //   matches: id, resume_id, job_id, score_overall, created_at
        //   jobs: title, company_name, source_url, location
        let { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('id, score_overall, created_at, jobs(title, company_name, source_url, location)')
          .in('resume_id', resumeIds)
          .gte('score_overall', MIN_SCORE)
          .gte('created_at', since.toISOString())
          .order('score_overall', { ascending: false })
          .limit(10);

        // Se for modo teste e não houver matches na última semana, busca os últimos matches com score >= MIN_SCORE
        if (testEmail && (!matches || matches.length === 0)) {
          console.log(`[weekly-digest] [TESTE] Nenhum match recente nos últimos 7 dias. Buscando histórico completo de matches...`);
          const fallbackQuery = await supabase
            .from('matches')
            .select('id, score_overall, created_at, jobs(title, company_name, source_url, location)')
            .in('resume_id', resumeIds)
            .gte('score_overall', MIN_SCORE)
            .order('score_overall', { ascending: false })
            .limit(10);
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

        const digestJobs: DigestJob[] = matches.map((m: any) => ({
          matchId: m.id,
          title: m.jobs?.title ?? 'Vaga sem título',
          company: m.jobs?.company_name ?? m.jobs?.companyName ?? 'Empresa Parceira',
          score: m.score_overall,
          url: m.jobs?.source_url ?? 'https://vocentro.com.br/app',
          location: m.jobs?.location ?? undefined,
        }));

        // ── 3. Enviar e-mail via Resend ──
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
          }),
        });

        if (!emailResp.ok) {
          const errText = await emailResp.text();
          console.error(`[weekly-digest] Resend erro para ${profile.email}:`, errText);
          results.push({ userId: profile.id, email: profile.email, status: 'send_error', error: errText });
          continue;
        }

        console.log(`[weekly-digest] E-mail enviado com sucesso para ${profile.email} (${digestJobs.length} vagas)`);
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


// ── HTML do e-mail ──
function buildDigestHtml(name: string, jobs: DigestJob[]): string {
  const rows = jobs
    .map(
      (j) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f0f0f0;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <span style="
              display:inline-block;
              background:#dcfce7;
              color:#16a34a;
              font-size:11px;
              font-weight:700;
              padding:2px 8px;
              border-radius:99px;
            ">${j.score}% match</span>
          </div>
          <strong style="font-size:15px;color:#111;">${escapeHtml(j.title)}</strong><br/>
          <span style="font-size:13px;color:#555;">${escapeHtml(j.company)}${j.location ? ' · ' + escapeHtml(j.location) : ''}</span><br/>
          <a href="${escapeHtml(j.url)}" style="
            display:inline-block;
            margin-top:6px;
            color:#2563eb;
            font-size:13px;
            font-weight:600;
            text-decoration:none;
          ">Ver vaga →</a>
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">VoCentro</h1>
      <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Seu Copiloto de Carreira IA</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#111;">Olá, ${escapeHtml(name)}! 👋</h2>
      <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
        Encontramos <strong>${jobs.length} vaga${jobs.length > 1 ? 's' : ''}</strong> com alto índice de compatibilidade
        para o seu perfil esta semana. Confira:
      </p>

      <table style="width:100%;border-collapse:collapse;">${rows}</table>

      <div style="margin-top:24px;text-align:center;">
        <a href="https://vocentro.com.br/app"
           style="
             display:inline-block;
             background:linear-gradient(135deg,#2563eb,#1d4ed8);
             color:#fff;
             font-size:14px;
             font-weight:700;
             padding:12px 28px;
             border-radius:10px;
             text-decoration:none;
           ">Ver todas as vagas no VoCentro →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa;">
      <p style="margin:0;font-size:11px;color:#999;line-height:1.6;">
        Você recebe este e-mail porque o resumo semanal está ativado na sua conta.<br/>
        <a href="https://vocentro.com.br/app" style="color:#2563eb;">Gerenciar preferências em Configurações → Notificações</a>
      </p>
    </div>

  </div>
</body>
</html>`;
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
