import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cohortTarget = 'ALL', emailType = 'initial_invite', targetEmail = null, sendAdminCopy = true } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let profiles: any[] = [];
    if (targetEmail) {
      const { data } = await supabase.from('profiles').select('*').eq('email', targetEmail);
      profiles = data || [{ id: 'target_user', email: targetEmail, full_name: 'Hana Rafaelle' }];
    } else {
      const { data: allProfiles, error: pErr } = await supabase.from('profiles').select('*');
      if (pErr) throw pErr;

      const testPatterns = ['e2e', 'hardening', 'test', 'admin', 'vocentro.com.br', 'example.com', 'demo', 'qa'];
      profiles = (allProfiles || []).filter(p => {
        const email = (p.email || '').toLowerCase();
        const name = (p.full_name || '').toLowerCase();
        return !testPatterns.some(pat => email.includes(pat) || name.includes(pat));
      });
    }

    let sentCount = 0;
    const logsResults: any[] = [];

    // Dispatch for candidate profiles
    for (const user of profiles) {
      const tokenObj = { u: user.id, e: user.email, t: Date.now() };
      const token = btoa(JSON.stringify(tokenObj));
      const surveyUrl = `https://vocentro.com.br/pesquisa?token=${encodeURIComponent(token)}&src=email_cta`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Você está ajudando a construir o VoCentro</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #121927; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            
            <!-- Header -->
            <tr>
              <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #1e293b; text-align: left;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                        Vo<span style="color: #34d399;">Centro</span> 🚀
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <span style="display: inline-block; background-color: rgba(52, 211, 153, 0.15); color: #34d399; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; border: 1px solid rgba(52, 211, 153, 0.3);">
                        Usuário Fundador
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hero Body -->
            <tr>
              <td style="padding: 32px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3;">
                  Você está ajudando a construir o VoCentro 🚀
                </h1>
                
                <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6; margin: 0 0 16px 0;">
                  Olá! Você acompanhou o VoCentro desde uma fase em que ainda estávamos descobrindo o que realmente deveria ser construído.
                </p>

                <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px 0;">
                  Sua experiência e sua opinião sincera ajudam a decidir o que o VoCentro vai construir nas próximas semanas. Queremos ouvir quem esteve conosco desde o começo.
                </p>

                <p style="font-size: 13px; font-weight: 600; color: #34d399; margin: 0 0 24px 0;">
                  ⏱️ Leva poucos minutos.
                </p>

                <!-- Primary CTA Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                  <tr>
                    <td style="text-align: center;">
                      <a href="${surveyUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #020617; font-size: 15px; font-weight: 800; text-decoration: none; padding: 16px 36px; border-radius: 12px; shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                        RESPONDER PESQUISA
                      </a>
                    </td>
                  </tr>
                </table>

                <hr style="border: none; border-top: 1px solid #1e293b; margin: 28px 0;" />

                <!-- Why Your Opinion Matters -->
                <h3 style="font-size: 15px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0;">
                  Por que sua opinião importa?
                </h3>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 6px 0; color: #cbd5e1; font-size: 14px;">✓ Influenciar diretamente o desenvolvimento do produto</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #cbd5e1; font-size: 14px;">✓ Compartilhar suas maiores dores na busca profissional</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #cbd5e1; font-size: 14px;">✓ Ajudar a construir uma plataforma mais inteligente com IA</td>
                  </tr>
                </table>

                <!-- Thank You Card (Giveaway Date 14/08/2026) -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; border-radius: 12px; border: 1px solid rgba(52, 211, 153, 0.3);">
                  <tr>
                    <td style="padding: 18px; text-align: left;">
                      <p style="font-size: 13px; font-weight: 700; color: #34d399; margin: 0 0 4px 0;">
                        🎁 Ação de Agradecimento PRO:
                      </p>
                      <p style="font-size: 13px; color: #cbd5e1; margin: 0; line-height: 1.5;">
                        Ao concluir a pesquisa até <strong>14/08/2026 às 20:00</strong>, você garante sua participação na ação de <strong>7 dias de acesso PRO ilimitado gratuitamente</strong>.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px; border-top: 1px solid #1e293b; background-color: #0d131f; text-align: center;">
                <p style="font-size: 13px; font-weight: 600; color: #cbd5e1; margin: 0 0 4px 0;">
                  Obrigado por fazer parte dessa história.
                </p>
                <p style="font-size: 12px; color: #64748b; margin: 0;">
                  Equipe VoCentro 🚀 • <a href="https://vocentro.com.br" style="color: #34d399; text-decoration: none;">vocentro.com.br</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      let messageId = `msg_simulated_${Date.now()}`;
      let resendStatus = 'sent';

      if (RESEND_API_KEY) {
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'VoCentro <notificacoes@vocentro.com.br>',
              to: [user.email],
              subject: 'Você está ajudando a construir o VoCentro 🚀',
              html: htmlContent
            })
          });
          const resData = await resendRes.json();
          if (resData.id) messageId = resData.id;
        } catch (resErr: any) {
          console.warn('Erro Resend:', resErr);
        }
      }

      // Upsert email campaign record
      await supabase.from('survey_email_campaigns').upsert({
        user_id: user.id,
        email: user.email,
        cohort: 'beta_general',
        status: 'sent',
        last_email_type: emailType,
        sent_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      // Log email_sent event in survey_events
      await supabase.from('survey_events').insert({
        user_id: user.id,
        event_name: 'email_sent',
        metadata: { resend_message_id: messageId, email: user.email, draw_date: '14/08/2026 20:00' }
      });

      sentCount++;
      logsResults.push({ email: user.email, message_id: messageId, status: resendStatus });
    }

    // Handle Admin Copy separately without incrementing candidate funnel recipient metrics
    if (sendAdminCopy) {
      try {
        const adminEmail = 'hanarafaelle11@gmail.com';
        if (RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'VoCentro <notificacoes@vocentro.com.br>',
              to: [adminEmail],
              subject: '[CÓPIA ADMIN] Você está ajudando a construir o VoCentro 🚀',
              html: `
                <div style="background-color: #0f172a; padding: 12px; color: #34d399; font-family: sans-serif; font-size: 12px; border-bottom: 2px solid #34d399;">
                  📌 <strong>CÓPIA DE AUDITORIA ADMINISTRATIVA</strong> — Este e-mail é uma cópia de teste para o administrador e não afeta as métricas do funil de candidatos.
                </div>
              `
            })
          });
        }
      } catch (adminErr) {
        console.warn('Erro ao enviar cópia admin:', adminErr);
      }
    }

    return new Response(JSON.stringify({ success: true, count: sentCount, logs: logsResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
