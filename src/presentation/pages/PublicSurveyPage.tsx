import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../infrastructure/api/supabaseClient';
import { tracker } from '../../infrastructure/analytics/tracker';
import { SurveyService } from '../../application/services/SurveyService';

import { 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  ChevronLeft, 
  HeartHandshake, 
  Star,
  AlertCircle,
  Lock,
  RefreshCw,
  Compass,
  Zap,
  MessageSquare,
  Flame,
  Award,
  Target
} from 'lucide-react';

export const PublicSurveyPage: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState<boolean>(false);
  const [apiError, setApiError] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{ id: string; email: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawToken, setRawToken] = useState<string>('');

  const validationTimeoutRef = useRef<any>(null);

  // Form State with preserved exact field names
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
    q11_nps: null as number | null,
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
    return () => {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, []);

  const validateTokenAndUser = async () => {
    setLoading(true);
    setErrorMsg(null);
    setApiError(false);

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token') || '';
    setRawToken(token);

    tracker.track('survey_token_validation_started', 'UserResearch', {
      survey_version: 'v1_founders_validation',
      url: window.location.href
    });

    // 10-second safety timeout so page NEVER hangs infinitely
    if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    validationTimeoutRef.current = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn('[PublicSurvey] Timeout de 10s atingido na validação do token.');
          setApiError(true);
          setErrorMsg('A resposta do servidor demorou mais que o esperado. Por favor tente novamente.');
          tracker.track('survey_token_validation_failed', 'UserResearch', { reason: 'timeout_10s' });
          return false;
        }
        return false;
      });
    }, 10000);

    try {
      if (!token) {
        // Fallback: check logged in session
        if (supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const uId = session.user.id;
              setUserInfo({
                id: uId,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Candidato'
              });
              await checkPreviousCompletion(uId);
              return;
            }
          } catch (authErr) {
            console.warn('[PublicSurvey] Erro na sessão de fallback:', authErr);
          }
        }
        setTokenValid(false);
        setErrorMsg('Este convite de pesquisa expirou ou não é válido. Caso tenha recebido um novo convite, utilize o link mais recente.');
        tracker.track('survey_token_validation_failed', 'UserResearch', { reason: 'missing_token' });
        return;
      }

      // Token format: base64 encoded JSON { u: userId, e: email } or raw userId
      let userId = token;
      let email = '';

      try {
        const decodedStr = atob(token);
        const decoded = JSON.parse(decodedStr);
        if (decoded && decoded.u) {
          userId = decoded.u;
          email = decoded.e || '';
        }
      } catch {
        // Raw string / UUID
        userId = token;
      }

      if (!supabase) {
        setUserInfo({ id: userId, email: email || 'usuario@vocentro.com.br', name: 'Usuário Fundador' });
        setTokenValid(true);
        tracker.track('survey_token_validation_success', 'UserResearch', { mode: 'no_supabase_fallback' });
        return;
      }

      // Check profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      const candidateName = profile?.full_name || (profile?.email || email).split('@')[0] || 'Usuário Fundador';
      const candidateEmail = profile?.email || email || 'usuario@vocentro.com.br';

      setUserInfo({ id: userId, email: candidateEmail, name: candidateName });

      // Log email_clicked and survey_opened events in survey_events
      if (searchParams.get('src') === 'email_cta' && supabase) {
        supabase.from('survey_events').insert({
          user_id: userId,
          event_name: 'email_clicked',
          metadata: { email: candidateEmail, timestamp: new Date().toISOString() }
        }).then(() => {});
      }

      if (supabase) {
        supabase.from('survey_events').insert({
          user_id: userId,
          event_name: 'survey_opened',
          metadata: { email: candidateEmail, timestamp: new Date().toISOString() }
        }).then(() => {});
      }

      // Check if user already submitted survey
      await checkPreviousCompletion(userId);
    } catch (err: any) {
      console.error('[PublicSurvey] Erro na validação do token:', err);
      setApiError(true);
      setErrorMsg('Ocorreu uma falha temporária ao conectar com o servidor.');
      tracker.track('survey_token_validation_failed', 'UserResearch', { error: err.message || 'unknown' });
    } finally {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
      setLoading(false);
    }
  };

  const checkPreviousCompletion = async (userId: string) => {
    try {
      const isDone = await SurveyService.hasCompletedSurvey(userId);
      if (isDone) {
        setAlreadyCompleted(true);
        setTokenValid(false);
        tracker.track('survey_token_validation_failed', 'UserResearch', { reason: 'already_completed' });
      } else {
        setTokenValid(true);
        tracker.track('survey_token_validation_success', 'UserResearch', { user_id: userId });
      }
    } catch (cErr) {
      console.warn('[PublicSurvey] Erro ao verificar resposta prévia:', cErr);
      setTokenValid(true);
    }
  };


  const handleStartSurvey = () => {
    setStep(1);
    tracker.trackSurveyStarted('beta_general', 'email_campaign');
    tracker.trackSurveyQuestionAnswered(1, 'urgency');
    if (supabase && userInfo) {
      supabase.from('survey_events').insert({
        user_id: userInfo.id,
        event_name: 'survey_started',
        question_number: 1,
        question_name: 'urgency',
        metadata: { timestamp: new Date().toISOString() }
      }).then(() => {});
    }
  };

  const handleNext = (nextStep: number, currentQuestionName: string) => {
    tracker.trackSurveyQuestionAnswered(step, currentQuestionName, {
      value: formData[currentQuestionName as keyof typeof formData]
    });
    if (supabase && userInfo) {
      supabase.from('survey_events').insert({
        user_id: userInfo.id,
        event_name: 'survey_question_viewed',
        question_number: nextStep,
        question_name: currentQuestionName,
        metadata: { timestamp: new Date().toISOString() }
      }).then(() => {});
    }
    setStep(nextStep);
  };


  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  // Submit survey through backend Edge Function submit-survey for token authorization and RLS protection
  const handleSubmitSurvey = async () => {
    if (!userInfo) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkbHBmcndlYnNtcG9odGNsbnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0ODA0MzksImV4cCI6MjA5OTA1NjQzOX0.3bpXJsBTfRprliYbd9V4UKk9TgspjuXpcF541p1IovU';
      const response = await fetch('https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/submit-survey', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: rawToken || userInfo.id,
          formData
        })
      });


      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.alreadyCompleted) {
          SurveyService.markSurveyCompleted(userInfo.id);
          setAlreadyCompleted(true);
          setTokenValid(false);
          return;
        }
        throw new Error(result.error || 'Ocorreu um erro ao salvar suas respostas. Por favor tente novamente.');
      }

      // Mark completed in SurveyService
      SurveyService.markSurveyCompleted(userInfo.id);

      // Track completion
      tracker.trackSurveyCompleted('beta_general', 'email_campaign', formData.q11_nps || 10, formData.q8_pro_intent);
      tracker.trackGiveawayRegistered(userInfo.email, userInfo.id);

      setStep(17);

    } catch (err: any) {
      console.error('[PublicSurvey] Erro ao enviar respostas:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao salvar suas respostas. Por favor tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 1. ESTADO: CARREGANDO SAAS PREMIUM ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
        <div className="flex flex-col items-center space-y-6 text-center max-w-sm">
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-lg opacity-40 animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#121927] border border-emerald-500/40 text-emerald-400 shadow-xl">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Estamos preparando seu convite de fundador 🚀
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validando credenciais seguras e personalizando sua experiência no VoCentro...
            </p>
          </div>

          <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── 2. ESTADO: PESQUISA JÁ PREENCHIDA ──
  if (alreadyCompleted) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#121927] border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Pesquisa Já Respondida!</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Você já enviou sua opinião sobre o VoCentro e sua participação na ação PRO ilimitada está confirmada. Muito obrigado por nos ajudar a construir o futuro da plataforma!
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

  // ── 3. ESTADO: ERRO AMIGÁVEL SEM STACK TRACE ──
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#121927] border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className={`inline-flex p-4 rounded-full border ${apiError ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40'}`}>
            {apiError ? <AlertCircle className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {apiError ? 'Falha Temporária de Conexão' : 'Convite Indisponível'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {errorMsg || 'Este convite de pesquisa expirou ou não é válido. Caso tenha recebido um novo convite, utilize o link mais recente.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {apiError && (
              <button
                onClick={validateTokenAndUser}
                className="w-full py-3 px-5 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition flex items-center justify-center gap-2 text-xs"
              >
                <RefreshCw className="w-4 h-4" /> Tentar novamente
              </button>
            )}
            <a
              href="https://vocentro.com.br"
              className="w-full py-3 px-5 rounded-xl font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition text-xs text-center"
            >
              Ir para o VoCentro
            </a>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = 16;
  const progressPercent = Math.min(100, Math.round((step / totalQuestions) * 100));

  // Visual Block Narrative Header
  const getBlockHeader = (stepNum: number) => {
    if (stepNum >= 1 && stepNum <= 2) return { title: 'BLOCO 1 • SEU MOMENTO & CONTEXTO', icon: <Compass className="w-4 h-4 text-emerald-400" /> };
    if (stepNum >= 3 && stepNum <= 4) return { title: 'BLOCO 2 • SUA CHEGADA AO VOCENTRO', icon: <Target className="w-4 h-4 text-cyan-400" /> };
    if (stepNum >= 5 && stepNum <= 6) return { title: 'BLOCO 3 • PRIMEIRO CONTATO & IA', icon: <Zap className="w-4 h-4 text-amber-400" /> };
    if (stepNum >= 7 && stepNum <= 8) return { title: 'BLOCO 4 • RECURSOS & VALOR PERCEBIDO', icon: <Flame className="w-4 h-4 text-emerald-400" /> };
    if (stepNum >= 9 && stepNum <= 10) return { title: 'BLOCO 5 • SATISFAÇÃO & RECOMENDAÇÃO', icon: <Star className="w-4 h-4 text-teal-400" /> };
    if (stepNum >= 11 && stepNum <= 12) return { title: 'BLOCO 6 • O QUE PODEMOS MELHORAR', icon: <MessageSquare className="w-4 h-4 text-rose-400" /> };
    if (stepNum >= 13 && stepNum <= 14) return { title: 'BLOCO 7 • O FUTURO & RECURSOS PRO', icon: <Award className="w-4 h-4 text-indigo-400" /> };
    if (stepNum >= 15 && stepNum <= 16) return { title: 'BLOCO 8 • ENCERRAMENTO & COMUNIDADE', icon: <HeartHandshake className="w-4 h-4 text-emerald-400" /> };
    return null;
  };

  const blockHeader = getBlockHeader(step);

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
              <h3 className="text-sm font-semibold text-white tracking-wide">VoCentro • Pesquisa de Usuários Fundadores</h3>
              <span className="text-[11px] text-slate-400">Construindo o produto junto com você</span>
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
          {/* STEP 0: Convite público com storytelling de cocriação */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Star className="w-3.5 h-3.5" />
                <span>Olá, {userInfo?.name}! Você está ajudando a construir o VoCentro</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Sua experiência decide o que vamos construir a seguir 🚀
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Você acompanhou o VoCentro desde o começo. Antes de abrirmos para milhares de pessoas, queremos ouvir quem esteve conosco para entender o que realmente gera valor no seu dia a dia profissional.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-3">
                <p className="font-medium text-emerald-400 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" /> Sua opinião tem impacto direto na nossa evolução.
                </p>
                <div className="flex flex-wrap gap-4 text-slate-400 pt-2 border-t border-slate-800 text-xs">
                  <span>⏱️ Leva poucos minutos</span>
                  <span>🎁 Agradecimento com 7 dias PRO</span>
                  <span>🔒 Protegido por LGPD</span>
                </div>
              </div>

              <button
                onClick={handleStartSurvey}
                className="w-full py-4 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                Responder Pesquisa
              </button>
            </div>
          )}

          {/* NARRATIVA CONVERSACIONAL DE 8 BLOCOS (16 PERGUNTAS PRESERVANDO NOMES DE CAMPOS) */}
          {step > 0 && step <= totalQuestions && (
            <div className="space-y-6">
              {blockHeader && (
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-emerald-400 tracking-wider">
                  {blockHeader.icon}
                  <span>{blockHeader.title}</span>
                </div>
              )}

              {/* QUESTÃO 1 (q16_urgency) */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Em quanto tempo você gostaria de conseguir uma nova oportunidade profissional?</h3>
                  <p className="text-xs text-slate-400">Queremos entender o seu momento atual para contextualizar suas respostas.</p>
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
                        onClick={() => {
                          setFormData({ ...formData, q16_urgency: opt });
                          handleNext(2, 'q16_urgency');
                        }}
                        className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 2 (q2_goal) */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Qual era seu principal objetivo quando se cadastrou no VoCentro?</h3>
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
                        className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 3 (q1_acquisition) */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Como você conheceu o VoCentro?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['LinkedIn', 'Indicação de alguém', 'Busca no Google', 'Redes sociais', 'Outro'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setFormData({ ...formData, q1_acquisition: opt });
                          handleNext(4, 'q1_acquisition');
                        }}
                        className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 4 (q3_previous_method) */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Antes do VoCentro, como você procurava oportunidades de trabalho?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['LinkedIn', 'Sites de vagas tradicionais', 'Indicações', 'Consultorias/recrutadores', 'Não tinha processo organizado'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q3_previous_method: opt }); handleNext(5, 'q3_previous_method'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 5 (q5_had_match) */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Você chegou a realizar um Match com alguma vaga no VoCentro?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Sim, várias vezes', 'Sim, uma vez', 'Ainda não'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q5_had_match: opt }); handleNext(6, 'q5_had_match'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 6 (q14_value_moment) */}
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Em qual momento você percebeu maior valor na plataforma?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Quando encontrei vaga pelo Match IA', 'Quando entendi minhas chances', 'Quando organizei candidaturas', 'Quando melhorei currículo', 'Quando treinei entrevista', 'Ainda não percebi valor'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q14_value_moment: opt }); handleNext(7, 'q14_value_moment'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 7 (q4_valued_feature) */}
              {step === 7 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Qual funcionalidade gerou mais valor ou utilidade para você?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Match com IA entre meu perfil e vagas', 'Análise de compatibilidade', 'Kanban para organizar candidaturas', 'Otimizador ATS', 'Simulador STAR', 'Copiloto de carreira'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q4_valued_feature: opt }); handleNext(8, 'q4_valued_feature'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 8 (q6_biggest_benefit) */}
              {step === 8 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Qual foi o maior benefício concreto que você percebeu usando o VoCentro?</h3>
                  <textarea rows={3} placeholder="Conte-nos em poucas palavras..." value={formData.q6_biggest_benefit} onChange={e => setFormData({...formData, q6_biggest_benefit: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500" />
                  <button disabled={!formData.q6_biggest_benefit.trim()} onClick={() => handleNext(9, 'q6_biggest_benefit')} className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 disabled:opacity-50 transition">Avançar</button>
                </div>
              )}

              {/* QUESTÃO 9 (q11_nps) */}
              {step === 9 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">De 0 a 10, qual a probabilidade de você recomendar o VoCentro a um amigo?</h3>
                  <p className="text-xs text-slate-400">Selecione uma nota de 0 (pouco provável) a 10 (muito provável):</p>
                  <div className="grid grid-cols-11 gap-1.5">
                    {Array.from({ length: 11 }, (_, i) => i).map(score => {
                      const isSelected = formData.q11_nps === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, q11_nps: score });
                            handleNext(10, 'q11_nps');
                          }}
                          className={`h-11 rounded-xl font-bold text-xs transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                  {formData.q11_nps === null && (
                    <p className="text-xs text-amber-400 font-medium">Selecione uma nota para continuar.</p>
                  )}
                </div>
              )}


              {/* QUESTÃO 10 (q13_pmf_missing_feature) */}
              {step === 10 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Se o VoCentro deixasse de existir amanhã, o que você sentiria mais falta?</h3>
                  <textarea rows={3} placeholder="Sua opinião sincera..." value={formData.q13_pmf_missing_feature} onChange={e => setFormData({...formData, q13_pmf_missing_feature: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500" />
                  <button disabled={!formData.q13_pmf_missing_feature.trim()} onClick={() => handleNext(11, 'q13_pmf_missing_feature')} className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 disabled:opacity-50 transition">Avançar</button>
                </div>
              )}

              {/* QUESTÃO 11 (q15_main_difficulty) */}
              {step === 11 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Qual é hoje sua maior dificuldade para conseguir uma oportunidade?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Encontrar vagas compatíveis comigo', 'Saber quais vagas realmente tenho chance', 'Melhorar meu currículo', 'Passar pelos filtros ATS', 'Me preparar para entrevistas', 'Organizar candidaturas', 'Outro'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q15_main_difficulty: opt }); handleNext(12, 'q15_main_difficulty'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 12 (q7_improvements) */}
              {step === 12 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">O que mais poderíamos melhorar ou adicionar na plataforma?</h3>
                  <textarea rows={3} placeholder="Dores, dificuldades ou sugestões..." value={formData.q7_improvements} onChange={e => setFormData({...formData, q7_improvements: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500" />
                  <button disabled={!formData.q7_improvements.trim()} onClick={() => handleNext(13, 'q7_improvements')} className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 disabled:opacity-50 transition">Avançar</button>
                </div>
              )}

              {/* QUESTÃO 13 (q8_pro_intent) */}
              {step === 13 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Você sentiria interesse em utilizar um plano PRO com recursos ilimitados?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Sim', 'Talvez', 'Não'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q8_pro_intent: opt }); handleNext(14, 'q8_pro_intent'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 14 (q9_fair_price e q10_subscription_driver) */}
              {step === 14 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Se existisse um plano PRO, qual valor mensal pareceria justo?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {['Até R$ 9,90', 'R$ 19,90', 'R$ 29,90', 'R$ 39,90', 'Mais de R$ 39,90', 'Eu não pagaria'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q9_fair_price: opt }); handleNext(15, 'q9_fair_price'); }} className="p-3.5 rounded-xl border text-center font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 15 (q10_subscription_driver) */}
              {step === 15 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">O que faria você considerar assinar a versão PRO do VoCentro?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Mais análises de vagas com IA', 'Currículo ATS ilimitado', 'Simulações de entrevistas ilimitadas', 'Copiloto de carreira', 'Outro'].map(opt => (
                      <button key={opt} onClick={() => { setFormData({ ...formData, q10_subscription_driver: opt }); handleNext(16, 'q10_subscription_driver'); }} className="p-3.5 rounded-xl border text-left font-medium bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 transition">{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTÃO 16 (q12_interview_opt_in & LGPD Consent) */}
              {step === 16 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">Gostaria de participar de entrevistas rápidas de 15 minutos para nos dar feedback direto?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['Sim', 'Não'].map(opt => (
                      <button 
                        key={opt} 
                        onClick={() => setFormData({ ...formData, q12_interview_opt_in: opt })} 
                        className={`p-3.5 rounded-xl border font-bold text-center transition ${formData.q12_interview_opt_in === opt ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {formData.q12_interview_opt_in && (
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer p-3.5 rounded-xl bg-slate-900 border border-slate-800">
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
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <button
                        disabled={submitting}
                        onClick={handleSubmitSurvey}
                        className="w-full py-4 rounded-xl font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-50 transition flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                      >
                        {submitting ? 'Salvando respostas com segurança...' : 'Concluir Pesquisa 🚀'}
                      </button>
                    </div>
                  )}
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
                  Sua opinião será usada para decidir as próximas funcionalidades e criar um produto cada vez melhor para sua carreira.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 max-w-md mx-auto space-y-1">
                <p className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Gift className="w-4 h-4" /> Ação de Agradecimento PRO Registrada
                </p>
                <p className="text-xs text-slate-400">
                  Sua participação na ação de 7 dias PRO ilimitados foi gravada com sucesso!
                </p>
              </div>

              <a
                href="https://vocentro.com.br/dashboard"
                className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition text-sm"
              >
                Voltar para o VoCentro 🚀
              </a>
            </div>
          )}

          {/* Controles de Navegação */}
          {step > 0 && step <= totalQuestions && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800 text-xs text-slate-400">
              <button onClick={handlePrev} disabled={step === 1} className="flex items-center gap-1 hover:text-white disabled:opacity-30 transition">
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
