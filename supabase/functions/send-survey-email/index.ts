import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } = from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_test_key';
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
    const { cohortTarget = 'ALL', emailType = 'initial_invite' } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch profiles and exclude test accounts
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) throw pErr;

    const testPatterns = ['e2e', 'hardening', 'test', 'admin', 'vocentro.com.br', 'example.com', 'demo', 'qa'];
    const realProfiles = (profiles || []).filter(p => {
      const email = (p.email || '').toLowerCase();
      const name = (p.full_name || '').toLowerCase();
      return !testPatterns.some(pat => email.includes(pat) || name.includes(pat));
    });

    let sentCount = 0;

    for (const user of realProfiles) {
      // Create body depending on cohort
      const subject = "Ajude a construir o futuro da sua carreira com IA 🚀";
      const htmlContent = `
        <div style="font-family: sans-serif; background-color: #121927; color: #f8fafc; padding: 32px; rounded: 16px;">
          <h2 style="color: #34d399;">Você é um Usuário Fundador do VoCentro 🚀</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">
            Você está entre os primeiros profissionais a testar o VoCentro. Antes de abrirmos para milhares de pessoas, queremos ouvir quem esteve conosco desde o começo.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #1e293b; border-radius: 12px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #67e8f9; font-weight: bold;">
              🎁 Ao responder (menos de 5 min), você concorre a 7 Dias de Acesso PRO Ilimitado Gratuitamente!
            </p>
          </div>
          <a href="https://vocentro.com.br/dashboard?open_survey=true" style="display: inline-block; background: linear-gradient(to right, #10b981, #06b6d4); color: #020617; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-top: 16px;">
            Responder pesquisa e participar do sorteio 🚀
          </a>
        </div>
      `;

      // Log into survey_email_campaigns
      await supabase.from('survey_email_campaigns').insert({
        user_id: user.id,
        email: user.email,
        cohort: 'beta_general',
        status: 'sent',
        last_email_type: emailType,
        sent_at: new Date().toISOString()
      });

      sentCount++;
    }

    return new Response(JSON.stringify({ success: true, count: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
