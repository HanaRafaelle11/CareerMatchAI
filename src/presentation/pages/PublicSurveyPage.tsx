import React, { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/api/supabaseClient';
import { tracker } from '../../infrastructure/analytics/tracker';
import { 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  ChevronLeft, 
  HeartHandshake, 
  Star,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';

export const PublicSurveyPage: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{ id: string; email: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    q1_acquisition: '',
    q2_goal: '',
    q3_previous_method: '',
    q4_valued_feature: '',
    q4_why: '',
    q5_had_match: '',
    q5_match_changed_view: '',
    q6_biggest_benefit: '',
    q7_improvements: '',
    q8_pro_intent: '',
    q9_fair_price: '',
    q10_subscription_driver: '',
    q11_nps: 10,
    q12_interview_opt_in: '',
    q13_pmf_missing_feature: '',
    q14_value_moment: '',
    q15_main_difficulty: '',
    q16_urgency: '',
    whatsapp_phone: '',
    research_contact_permission: true
  });

  useEffect(() => {
    validateTokenAndUser();
  }, []);

  const validateTokenAndUser = async () => {
    setLoading(true);
    setErrorMsg(null);

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    if (!token) {
      // Fallback: check logged in session
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserInfo({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Candidato'
          });
          checkPreviousCompletion(session.user.id);
          return;
        }
      }
      setTokenValid(false);
      setErrorMsg('Token de acesso à pesquisa não fornecido ou inválido.');
      setLoading(false);
      return;
    }

    try {
      // Token format: base64 encoded JSON { u: userId, e: email } or raw userId
      let userId = token;
      let email = '';

      try {
        const decoded = JSON.parse(atob(token));
        if (decoded.u) {
          userId = decoded.u;
          email = decoded.e || '';
        }
      } catch {
        // Raw UUID or token string
        userId = token;
      }

      if (!supabase) {
        setUserInfo({ id: userId, email: email || 'usuario@vocentro.com.br', name: 'Usuário Fundador' });
        setTokenValid(true);
        setLoading(false);
        return;
      }

      // Check if user exists in profiles or auth
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (profile) {
        setUserInfo({
          id: profile.id,
          email: profile.email || email,
          name: profile.full_name || profile.email?.split('@')[0] || 'Usuário Fundador'
        });
        await checkPreviousCompletion(profile.id);
      } else {
        // Valid token payload even if profile table row pending
        setUserInfo({ id: userId, email: email || 'usuario@vocentro.com.br', name: 'Usuário Fundador' });
        setTokenValid(true);
      }
    } catch (err: any) {
      console.error('[PublicSurvey] Erro de validação do token:', err);
      setTokenValid(false);
      setErrorMsg('Token expirado ou inválido. Por favor, solicite um novo acesso.');
    } finally {
      setLoading(false);
    }
  };

  const checkPreviousCompletion = async (userId: string) => {
    if (!supabase) {
      setTokenValid(true);
      return;
    }
    const { data: existing } = await supabase.from('survey_responses').select('id').eq('user_id', userId).maybeSingle();
    if (existing) {
      setAlreadyCompleted(true);
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  };

  const handleStartSurvey = () => {
    setStep(1);
    tracker.trackSurveyStarted('beta_general', 'email_campaign');
    tracker.trackSurveyQuestionAnswered(1, 'acquisition');
  };

  const handleNext = (nextStep: number, currentQuestionName: string) => {
    tracker.trackSurveyQuestionAnswered(step, currentQuestionName, {
      value: formData[currentQuestionName as keyof typeof formData]
    });
    setStep(nextStep);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitSurvey = async () => {
    if (!userInfo) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado');

      // 1. Save survey_responses (No PII)
      const { data: surveyRes, error: surveyErr } = await supabase
        .from('survey_responses')
        .insert({
          user_id: userInfo.id,
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
        })
        .select('id')
        .single();

      if (surveyErr) throw surveyErr;

      const surveyId = surveyRes.id;

      // 2. Save research_contacts (LGPD Decoupled)
      await supabase.from('research_contacts').upsert({
        user_id: userInfo.id,
        email: userInfo.email,
        whatsapp_phone: formData.whatsapp_phone || null,
        permission_status: formData.research_contact_permission ? 'granted' : 'revoked',
        permission_updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      // 3. Save giveaway_participants
      await supabase.from('giveaway_participants').insert({
        user_id: userInfo.id,
        email: userInfo.email,
        survey_response_id: surveyId,
        status: 'eligible',
        participated_at: new Date().toISOString()
      });

      // 4. Update campaign status to 'responded'
      await supabase.from('survey_email_campaigns').update({
        status: 'responded',
        last_activity_at: new Date().toISOString()
      }).eq('user_id', userInfo.id);

      // Track completion
      tracker.trackSurveyCompleted('beta_general', 'email_campaign', formData.q11_nps, formData.q8_pro_intent);
      tracker.trackGiveawayRegistered(userInfo.email, surveyId);

      setStep(17);
    } catch (err: any) {
      console.error('[PublicSurvey] Erro ao salvar:', err);
      setErrorMsg(err.message || 'Erro ao enviar respostas. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-slate-400">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Validando token seguro da pesquisa...</span>
        </div>
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#121927] border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Pesquisa Já Respondida!</h2>
            <p className="text-sm text-slate-300">
              Você já enviou sua opinião sobre o VoCentro e está participando do sorteio de 7 Dias PRO. Muito obrigado!
            </p>
          </div>
          <a
            href="https://vocentro.com.br/dashboard"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
          >
            Acessar o VoCentro 🚀
          </a>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#121927] border border-rose-500/30 text-center space-y-6 shadow-2xl">
          <div className="inline-flex p-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Link de Acesso Indisponível</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {errorMsg || 'Este link de pesquisa é inválido ou expirou.'}
            </p>
          </div>
          <a
            href="https://vocentro.com.br"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition text-xs"
          >
            Ir para a página principal
          </a>
        </div>
      </div>
    );
  }

  const totalQuestions = 16;
  const progressPercent = Math.min(100, Math.round((step / totalQuestions) * 100));

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
      <div className="w-full max-w-2xl bg-[#121927] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d131f]">
          <div className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">VoCentro • Pesquisa Fundadores</h3>
              <span className="text-[11px] text-slate-400">Canal Seguro via E-mail</span>
            </div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        {step > 0 && step <= totalQuestions && (
          <div className="w-full bg-slate-800/50 h-1.5">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 transition-all duration-300 ease-out" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* STEP 0: Convite público */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                <Star className="w-3.5 h-3.5" />
                <span>Olá, {userInfo?.name}! Você é um Usuário Fundador</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Ajude a construir o futuro da sua carreira com IA 🚀
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Você está entre os primeiros profissionais a testar o VoCentro. Antes de abrirmos para milhares de pessoas, queremos ouvir quem esteve conosco desde o começo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2">
                <p className="font-medium text-emerald-400 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" /> Sua opinião ajudará a definir as próximas funcionalidades.
                </p>
                <div className="flex flex-wrap gap-4 text-slate-400 pt-2 border-t border-slate-800 text-xs">
                  <span>⏱️ Leva menos de 5 min</span>
                  <span>🎁 Concorre a 7 dias PRO Ilimitado</span>
                  <span>🔒 Dados protegidos por LGPD</span>
                </div>
              </div>

              <button
                onClick={handleStartSurvey}
                className="w-full py-4 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" />
                Responder pesquisa e participar do sorteio
              </button>
            </div>
          )}

          {/* PERGUNTAS 1 a 16 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 1 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Como você conheceu o VoCentro?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {['LinkedIn', 'Indicação de alguém', 'Busca no Google', 'Redes sociais', 'Outro'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFormData({ ...formData, q1_acquisition: opt });
                      handleNext(2, 'q1_acquisition');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q1_acquisition === opt ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 2 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Qual era seu principal objetivo quando entrou no VoCentro?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  'Encontrar vagas mais compatíveis comigo',
                  'Melhorar meu currículo',
                  'Me preparar para entrevistas',
                  'Organizar minhas candidaturas',
                  'Entender minhas chances em uma vaga',
                  'Outro'
                ].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFormData({ ...formData, q2_goal: opt });
                      handleNext(3, 'q2_goal');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q2_goal === opt ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 3 a 15 resumidas estruturadas */}
          {step >= 3 && step <= 15 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta {step} de {totalQuestions}</div>
              {step === 3 && (
                <>
                  <h3 className="text-lg font-bold text-white">Antes do VoCentro, como você normalmente procurava emprego?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['LinkedIn', 'Sites de vagas tradicionais', 'Indicações', 'Consultorias/recrutadores', 'Não tinha processo organizado'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q3_previous_method: opt }); handleNext(4, 'q3_previous_method'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 4 && (
                <>
                  <h3 className="text-lg font-bold text-white">Qual funcionalidade gerou mais valor para você?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Match com IA entre meu perfil e vagas', 'Análise de compatibilidade', 'Kanban para organizar candidaturas', 'Otimizador ATS', 'Simulador STAR', 'Copiloto de carreira'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q4_valued_feature: opt }); handleNext(5, 'q4_valued_feature'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 5 && (
                <>
                  <h3 className="text-lg font-bold text-white">Você chegou a realizar um Match com alguma vaga?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Sim, várias vezes', 'Sim, uma vez', 'Ainda não'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q5_had_match: opt }); handleNext(6, 'q5_had_match'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 6 && (
                <>
                  <h3 className="text-lg font-bold text-white">Qual foi o maior benefício que você percebeu usando o VoCentro?</h3>
                  <textarea rows={3} placeholder="Escreva livremente..." value={formData.q6_biggest_benefit} onChange={e => setFormData({...formData, q6_biggest_benefit: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500" />
                  <button disabled={!formData.q6_biggest_benefit.trim()} onClick={() => handleNext(7, 'q6_biggest_benefit')} className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 disabled:opacity-50">Avançar</button>
                </>
              )}
              {step === 7 && (
                <>
                  <h3 className="text-lg font-bold text-white">O que mais poderia melhorar na plataforma?</h3>
                  <textarea rows={3} placeholder="Diga-nos dores ou melhorias..." value={formData.q7_improvements} onChange={e => setFormData({...formData, q7_improvements: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500" />
                  <button disabled={!formData.q7_improvements.trim()} onClick={() => handleNext(8, 'q7_improvements')} className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 disabled:opacity-50">Avançar</button>
                </>
              )}
              {step === 8 && (
                <>
                  <h3 className="text-lg font-bold text-white">Sentiu vontade de usar recursos ilimitados ou PRO?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Sim', 'Talvez', 'Não'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q8_pro_intent: opt }); handleNext(9, 'q8_pro_intent'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 9 && (
                <>
                  <h3 className="text-lg font-bold text-white">Se existisse um plano PRO, qual valor mensal pareceria justo?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {['Até R$ 9,90', 'R$ 19,90', 'R$ 29,90', 'R$ 39,90', 'Mais de R$ 39,90', 'Eu não pagaria'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q9_fair_price: opt }); handleNext(10, 'q9_fair_price'); }} className="p-3.5 rounded-xl border text-center font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 10 && (
                <>
                  <h3 className="text-lg font-bold text-white">O que faria você assinar o VoCentro?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Mais análises de vagas com IA', 'Currículo ATS ilimitado', 'Simulações de entrevistas ilimitadas', 'Copiloto de carreira', 'Outro'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q10_subscription_driver: opt }); handleNext(11, 'q10_subscription_driver'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 11 && (
                <>
                  <h3 className="text-lg font-bold text-white">Você recomendaria o VoCentro para alguém? (NPS 0-10)</h3>
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({ length: 11 }, (_, i) => i).map(score => (
                      <button key={score} onClick={() => { setFormData({ ...formData, q11_nps: score }); handleNext(12, 'q11_nps'); }} className="h-10 rounded font-bold text-xs bg-slate-900 border border-slate-800 text-slate-200 hover:bg-emerald-500 hover:text-slate-950">{score}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 12 && (
                <>
                  <h3 className="text-lg font-bold text-white">Gostaria de participar de entrevistas rápidas de 15 minutos?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['Sim', 'Não'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q12_interview_opt_in: opt }); handleNext(13, 'q12_interview_opt_in'); }} className="p-3.5 rounded-xl border font-bold text-center bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 13 && (
                <>
                  <h3 className="text-lg font-bold text-white">Se o VoCentro deixasse de existir amanhã, o que você sentiria mais falta?</h3>
                  <textarea rows={3} placeholder="Sua percepção..." value={formData.q13_pmf_missing_feature} onChange={e => setFormData({...formData, q13_pmf_missing_feature: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500" />
                  <button disabled={!formData.q13_pmf_missing_feature.trim()} onClick={() => handleNext(14, 'q13_pmf_missing_feature')} className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 disabled:opacity-50">Avançar</button>
                </>
              )}
              {step === 14 && (
                <>
                  <h3 className="text-lg font-bold text-white">Em qual momento você percebeu maior valor?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Quando encontrei vaga pelo Match IA', 'Quando entendi minhas chances', 'Quando organizei candidaturas', 'Quando melhorei currículo', 'Quando treinei entrevista', 'Ainda não percebi valor'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q14_value_moment: opt }); handleNext(15, 'q14_value_moment'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 15 && (
                <>
                  <h3 className="text-lg font-bold text-white">Qual é hoje sua maior dificuldade para conseguir uma oportunidade?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Encontrar vagas compatíveis comigo', 'Saber quais vagas realmente tenho chance', 'Melhorar meu currículo', 'Passar pelos filtros ATS', 'Me preparar para entrevistas', 'Organizar candidaturas', 'Outro'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q15_main_difficulty: opt }); handleNext(16, 'q15_main_difficulty'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">{opt}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* PERGUNTA 16 & Consentimento LGPD */}
          {step === 16 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 16 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Em quanto tempo você gostaria de conseguir uma nova oportunidade profissional?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  'Estou procurando urgentemente (até 30 dias)',
                  'Nos próximos 3 meses',
                  'Nos próximos 6 meses',
                  'Apenas estou explorando possibilidades',
                  'Não estou buscando agora'
                ].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFormData({ ...formData, q16_urgency: opt })}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q16_urgency === opt ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {formData.q16_urgency && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.research_contact_permission}
                      onChange={(e) => setFormData({ ...formData, research_contact_permission: e.target.checked })}
                      className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                    />
                    <span>
                      Autorizo o VoCentro a entrar em contato comigo para entrevistas, testes de novas funcionalidades e pesquisas futuras (LGPD).
                    </span>
                  </label>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    disabled={submitting}
                    onClick={handleSubmitSurvey}
                    className="w-full py-4 rounded-xl font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Salvando respostas...' : 'Concluir pesquisa e entrar no sorteio PRO 🚀'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 17: Conclusão */}
          {step === 17 && (
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Obrigado por ajudar a construir o VoCentro 💙
                </h2>
                <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Sua opinião será usada para melhorar a plataforma e criar ferramentas que realmente ajudem sua carreira.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 max-w-md mx-auto space-y-1">
                <p className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Gift className="w-4 h-4" /> Inscrição Confirmada no Sorteio PRO
                </p>
                <p className="text-xs text-slate-400">
                  Sua participação nos 7 dias de acesso PRO ilimitado está registrada!
                </p>
              </div>

              <a
                href="https://vocentro.com.br/dashboard"
                className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition"
              >
                Voltar para o VoCentro 🚀
              </a>
            </div>
          )}

          {/* Controles de Navegação */}
          {step > 0 && step <= totalQuestions && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800 text-xs text-slate-400">
              <button onClick={handlePrev} disabled={step === 1} className="flex items-center gap-1 hover:text-white disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span>{step} de {totalQuestions}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
