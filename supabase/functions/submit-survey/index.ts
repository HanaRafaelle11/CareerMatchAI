import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, formData } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Este convite de pesquisa expirou ou não é válido. Caso tenha recebido um novo convite, utilize o link mais recente.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Decode token
    let userId = '';
    let email = '';
    let timestamp = 0;

    try {
      const decodedStr = atob(token);
      const decoded = JSON.parse(decodedStr);
      if (decoded && decoded.u) {
        userId = decoded.u;
        email = decoded.e || '';
        timestamp = decoded.t || 0;
      }
    } catch {
      // Fallback: check if token is valid raw UUID string
      if (token.includes('-') && token.length >= 32) {
        userId = token;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Este convite de pesquisa expirou ou não é válido. Caso tenha recebido um novo convite, utilize o link mais recente.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Check token expiration (30 days max)
    if (timestamp > 0) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > thirtyDaysMs) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Este convite de pesquisa expirou. Por favor solicite um novo acesso.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Connect to Supabase using Service Role Key (secure backend environment)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Validate user exists in profiles or auth
    const { data: profile } = await supabase.from('profiles').select('id, email').eq('id', userId).maybeSingle();
    const targetEmail = profile?.email || email || 'usuario@vocentro.com.br';

    // 5. Idempotency Check: Check if user already submitted this survey version
    const { data: existingResponse } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('user_id', userId)
      .eq('survey_version', 'v1_founders_validation')
      .maybeSingle();

    if (existingResponse) {
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyCompleted: true,
        message: 'Você já respondeu a esta pesquisa de fundadores. Muito obrigado por ajudar a construir o VoCentro!' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Upsert into survey_responses (idempotent, handling unique_user_survey_version safely)
    const { data: surveyRes, error: surveyErr } = await supabase
      .from('survey_responses')
      .upsert({
        user_id: userId,
        research_cohort: 'beta_general',
        high_intent: false,
        channel: 'email',
        invitation_source: 'email_campaign',
        survey_version: 'v1_founders_validation',
        q1_acquisition: formData.q1_acquisition,
        q2_goal: formData.q2_goal,
        q3_previous_method: formData.q3_previous_method,
        q4_valued_feature: formData.q4_valued_feature,
        q4_why: formData.q4_why,
        q5_had_match: formData.q5_had_match,
        q5_match_changed_view: formData.q5_match_changed_view,
        q6_biggest_benefit: formData.q6_biggest_benefit,
        q7_improvements: formData.q7_improvements,
        q8_pro_intent: formData.q8_pro_intent,
        q9_fair_price: formData.q9_fair_price,
        q10_subscription_driver: formData.q10_subscription_driver,
        q11_nps: formData.q11_nps,
        q12_interview_opt_in: formData.q12_interview_opt_in,
        q13_pmf_missing_feature: formData.q13_pmf_missing_feature,
        q14_value_moment: formData.q14_value_moment,
        q15_main_difficulty: formData.q15_main_difficulty,
        q16_urgency: formData.q16_urgency
      }, { onConflict: 'user_id,survey_version' })
      .select('id')
      .single();

    if (surveyErr) throw surveyErr;

    const surveyId = surveyRes.id;

    // 7. Insert/Update research_contacts (LGPD Decoupled)
    const permissionStatus = formData.research_contact_permission ? 'granted' : 'revoked';
    await supabase.from('research_contacts').upsert({
      user_id: userId,
      email: targetEmail,
      whatsapp_phone: formData.whatsapp_phone || null,
      permission_status: permissionStatus,
      permission_updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // 8. Upsert into giveaway_participants (idempotent)
    await supabase.from('giveaway_participants').upsert({
      user_id: userId,
      email: targetEmail,
      survey_response_id: surveyId,
      status: 'eligible',
      participated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // 9. Update survey_email_campaigns
    await supabase.from('survey_email_campaigns').update({
      status: 'responded',
      last_activity_at: new Date().toISOString()
    }).eq('user_id', userId);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Pesquisa enviada com sucesso!' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });


  } catch (err: any) {
    console.error('[submit-survey] Erro:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Ocorreu um erro ao salvar suas respostas. Por favor tente novamente.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
