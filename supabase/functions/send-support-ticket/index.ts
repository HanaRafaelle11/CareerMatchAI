// supabase/functions/send-support-ticket/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('DIGEST_FROM_EMAIL') ?? 'VoCentro Suporte <noreply@vocentro.com.br>';
const SUPPORT_DESTINATION_EMAIL = 'suporte@vocentro.com.br';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const authHeader = req.headers.get('Authorization');
    
    let userEmail = 'nao-identificado@vocentro.com.br';
    let userName = 'Usuário do Sistema';
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || userEmail;
        userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0];
      }
    }

    const body = await req.json();
    const { subject, message, attachmentUrl } = body;

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Assunto e mensagem são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Gravar registro no banco de dados na tabela beta_feedback
    const { data: feedbackRecord, error: dbError } = await supabase
      .from('beta_feedback')
      .insert({
        user_id: userId,
        feature: 'support_ticket',
        rating: 'SUPPORT',
        comment: `[Assunto: ${subject}] ${message}${attachmentUrl ? `\n\nAnexo: ${attachmentUrl}` : ''}`,
      })
      .select('id, created_at')
      .single();

    if (dbError) {
      console.error('[send-support-ticket] Erro ao gravar feedback no DB:', dbError);
    }

    // 2. Disparar e-mail via Resend para suporte@vocentro.com.br
    let emailSent = false;
    let resendId = null;

    if (RESEND_API_KEY) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">📬 Novo Chamado de Suporte / Feedback — VoCentro</h2>
          <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
            Um usuário enviou uma nova mensagem pela plataforma.
          </p>

          <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Nome:</td>
              <td style="padding: 8px 0;">${escapeHtml(userName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">E-mail:</td>
              <td style="padding: 8px 0;">${escapeHtml(userEmail)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">User ID:</td>
              <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${userId || 'Anônimo'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Assunto:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #2563eb;">${escapeHtml(subject)}</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #334155; margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>

          ${attachmentUrl ? `
            <div style="margin-top: 15px; padding: 12px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e40af;">📎 Anexo enviado:</p>
              <p style="margin: 4px 0 0 0; font-size: 12px;"><a href="${escapeHtml(attachmentUrl)}" target="_blank" style="color: #2563eb; word-break: break-all;">${escapeHtml(attachmentUrl)}</a></p>
            </div>
          ` : ''}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0 15px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            VoCentro Platform Support System • ID do Ticket: ${feedbackRecord?.id || 'N/A'}
          </p>
        </div>
      `;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [SUPPORT_DESTINATION_EMAIL],
          reply_to: userEmail,
          subject: `[VoCentro Suporte] ${subject}`,
          html: emailHtml,
        }),
      });

      if (resendRes.ok) {
        const resendData = await resendRes.json();
        emailSent = true;
        resendId = resendData.id;
      } else {
        const errText = await resendRes.text();
        console.error('[send-support-ticket] Erro na API do Resend:', errText);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recebemos sua mensagem, responderemos em breve!',
        ticketId: feedbackRecord?.id,
        emailSent,
        resendId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-support-ticket] Erro ao processar suporte/feedback:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno ao enviar suporte/feedback.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
