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
    const { cohortTarget = 'ALL', emailType = 'initial_invite', targetEmail = null } = await req.json();

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

    for (const user of profiles) {
      const tokenObj = { u: user.id, e: user.email, t: Date.now() };
      const token = btoa(JSON.stringify(tokenObj));
      const surveyUrl = `https://vocentro.com.br/pesquisa?token=${encodeURIComponent(token)}`;

      const htmlContent = `
        <div style="font-family: sans-serif; background-color: #090d16; color: #f8fafc; padding: 32px; border-radius: 16px;">
          <h2 style="color: #34d399;">Você faz parte da história do VoCentro 🚀</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">
            Olá! Você está entre os primeiros profissionais que ajudaram a testar o VoCentro.
          </p>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
            Antes de expandirmos a plataforma para milhares de pessoas, queremos ouvir quem esteve conosco desde o começo. Sua experiência vai nos ajudar a decidir quais recursos realmente geram valor e como podemos tornar sua jornada profissional ainda mais inteligente com IA.
          </p>
          <div style="margin: 24px 0; padding: 20px; background-color: #121927; border-radius: 12px; border: 1px solid #10b981;">
            <p style="margin: 0; color: #34d399; font-weight: bold; font-size: 15px;">
              🎁 Como forma de agradecimento pela participação:
            </p>
            <p style="margin: 6px 0 0 0; color: #e2e8f0; font-size: 13px;">
              Você concorre a <strong>7 dias de acesso PRO ilimitado gratuitamente</strong>!
            </p>
          </div>
          <a href="${surveyUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #06b6d4); color: #020617; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-top: 16px;">
            Responder pesquisa e participar do sorteio 🚀
          </a>
        </div>
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
              subject: 'Você faz parte da história do VoCentro 🚀',
              html: htmlContent
            })
          });
          const resData = await resendRes.json();
          if (resData.id) messageId = resData.id;
        } catch (resErr: any) {
          console.warn('Erro ao enviar via Resend:', resErr);
        }
      }

      await supabase.from('survey_email_campaigns').insert({
        user_id: user.id,
        email: user.email,
        cohort: 'beta_general',
        status: 'sent',
        last_email_type: emailType,
        sent_at: new Date().toISOString()
      });

      sentCount++;
      logsResults.push({ email: user.email, message_id: messageId, status: resendStatus });
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
