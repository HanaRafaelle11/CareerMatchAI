import React, { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/api/supabaseClient';
import { tracker } from '../../infrastructure/analytics/tracker';
import { 
  Sparkles, 
  Gift, 
  X, 
  CheckCircle2, 
  ChevronLeft, 
  HeartHandshake, 
  Star,
  AlertCircle
} from 'lucide-react';


interface ProductValidationSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  cohort: 'activated' | 'not_activated' | 'beta_general';
  isHighIntent?: boolean;
}

export const ProductValidationSurveyModal: React.FC<ProductValidationSurveyModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  cohort,
  isHighIntent = false
}) => {
  const [step, setStep] = useState<number>(0); // 0: Invitation Banner, 1-16: Questions, 17: Completion
  const [loading, setLoading] = useState<boolean>(false);
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
    if (isOpen) {
      tracker.trackSurveyCampaignViewed(cohort, 'dashboard_modal');
    }
  }, [isOpen, cohort]);

  if (!isOpen) return null;

  // Cohort-based humanized messaging
  const getCohortMessage = () => {
    if (cohort === 'activated') {
      return "Você está entre os primeiros profissionais que experimentaram o potencial do VoCentro. Queremos entender o que mais ajudou sua jornada para continuar construindo uma ferramenta útil para sua carreira.";
    }
    if (cohort === 'not_activated') {
      return "Você chegou a conhecer o VoCentro, mas queremos entender o que dificultou sua experiência inicial. Sua opinião vai nos ajudar a remover barreiras para novos profissionais.";
    }
    return "Você fez parte dos primeiros testes do VoCentro. Queremos ouvir sua opinião para definir os próximos passos da plataforma.";
  };

  const handleStartSurvey = () => {
    setStep(1);
    tracker.trackSurveyStarted(cohort, 'dashboard_modal');
    tracker.trackSurveyQuestionAnswered(1, 'acquisition', { cohort });
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

  const handleDismiss = () => {
    if (step > 0 && step < 17) {
      tracker.trackSurveyAbandoned(step, `question_${step}`, cohort);
    }
    localStorage.setItem(`survey_dismissed_${userId}`, Date.now().toString());
    onClose();
  };

  const handleSubmitSurvey = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!supabase) throw new Error('Cliente Supabase não configurado');

      // 1. Insert into survey_responses (No PII)
      const { data: surveyRes, error: surveyErr } = await supabase
        .from('survey_responses')

        .insert({
          user_id: userId,
          research_cohort: cohort,
          high_intent: isHighIntent,
          channel: 'in_app',
          invitation_source: 'dashboard_modal',
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

      // 2. Insert/Update research_contacts (LGPD Decoupled PII)
      const { error: contactErr } = await supabase
        .from('research_contacts')
        .upsert({
          user_id: userId,
          email: userEmail,
          whatsapp_phone: formData.whatsapp_phone || null,
          permission_status: formData.research_contact_permission ? 'granted' : 'revoked',
          permission_updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (contactErr) console.warn('[Survey] Erro não fatal em research_contacts:', contactErr);

      // 3. Insert into giveaway_participants (7-Day PRO Giveaway Entry)
      const { error: giveawayErr } = await supabase
        .from('giveaway_participants')
        .insert({
          user_id: userId,
          email: userEmail,
          survey_response_id: surveyId,
          status: 'eligible',
          participated_at: new Date().toISOString()
        });

      if (giveawayErr) console.warn('[Survey] Erro não fatal em giveaway_participants:', giveawayErr);

      // 4. Analytics Track Completion
      tracker.trackSurveyCompleted(cohort, 'dashboard_modal', formData.q11_nps, formData.q8_pro_intent);
      tracker.trackGiveawayRegistered(userEmail, surveyId);

      // Save completion locally to prevent re-opening
      localStorage.setItem(`survey_completed_${userId}`, 'true');

      setStep(17); // Move to completion screen
    } catch (err: any) {
      console.error('[Survey] Erro ao salvar pesquisa:', err);
      setErrorMsg(err.message || 'Erro ao enviar respostas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = 16;
  const progressPercent = Math.min(100, Math.round((step / totalQuestions) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121927] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d131f]">
          <div className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Pesquisa de Usuários Fundadores
              </h3>
              <span className="text-[11px] text-slate-400">VoCentro v1_founders_validation</span>
            </div>
          </div>
          <button 
            onClick={handleDismiss} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

        {/* Content Body */}
        <div className="p-6 sm:p-8">

          {/* STEP 0: BANNER DE CONVITE HUMANIZADO */}
          {step === 0 && (
            <div className="space-y-6 text-center sm:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                <Star className="w-3.5 h-3.5" />
                <span>Convite Exclusivo para Usuário Fundador</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Ajude a construir o futuro da sua carreira com IA 🚀
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Você faz parte dos primeiros profissionais a testar o VoCentro. Antes de abrirmos para milhares de pessoas, queremos ouvir quem esteve conosco desde o começo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2">
                <p className="font-medium text-emerald-400 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" /> {getCohortMessage()}
                </p>
                <div className="flex flex-wrap gap-4 text-slate-400 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1">⏱️ Leva menos de 5 min</span>
                  <span className="flex items-center gap-1">🎁 Concorre a 7 dias PRO Ilimitado</span>
                  <span className="flex items-center gap-1">🔒 Respostas protegidas por LGPD</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleStartSurvey}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  Responder pesquisa e participar do sorteio
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
          )}

          {/* PERGUNTA 1: Aquisição */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 1 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Como você conheceu o VoCentro?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {['LinkedIn', 'Indicação de alguém', 'Busca no Google', 'Redes sociais', 'Outro'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q1_acquisition: option });
                      handleNext(2, 'q1_acquisition');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q1_acquisition === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 2: Objetivo */}
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
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q2_goal: option });
                      handleNext(3, 'q2_goal');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q2_goal === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 3: Método Anterior */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 3 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Antes do VoCentro, como você normalmente procurava emprego?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  'LinkedIn',
                  'Sites de vagas tradicionais',
                  'Indicações',
                  'Consultorias/recrutadores',
                  'Não tinha um processo organizado'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q3_previous_method: option });
                      handleNext(4, 'q3_previous_method');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q3_previous_method === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 4: Funcionalidade mais valorizada */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 4 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Qual funcionalidade do VoCentro gerou mais valor para você?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  'Match com IA entre meu perfil e vagas',
                  'Análise de compatibilidade da vaga',
                  'Kanban para organizar candidaturas',
                  'Otimizador de currículo ATS',
                  'Simulador de entrevista STAR',
                  'Copiloto de carreira com IA'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q4_valued_feature: option });
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q4_valued_feature === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {formData.q4_valued_feature && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs text-slate-300 font-medium">Conte rapidamente por quê?</label>
                  <input
                    type="text"
                    placeholder="Ex: Me poupou muito tempo lendo requisitos..."
                    value={formData.q4_why}
                    onChange={(e) => setFormData({ ...formData, q4_why: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleNext(5, 'q4_valued_feature')}
                    className="w-full mt-3 py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                  >
                    Avançar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PERGUNTA 5: Match e mudança de visão */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 5 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Você chegou a realizar um Match com alguma vaga?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {['Sim, várias vezes', 'Sim, uma vez', 'Ainda não'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q5_had_match: option });
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q5_had_match === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {formData.q5_had_match && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  {formData.q5_had_match.includes('Sim') && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 font-medium">A análise de Match mudou sua forma de avaliar vagas?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Sim, bastante', 'Um pouco', 'Não mudou'].map((subOpt) => (
                          <button
                            key={subOpt}
                            onClick={() => setFormData({ ...formData, q5_match_changed_view: subOpt })}
                            className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-all ${
                              formData.q5_match_changed_view === subOpt
                                ? 'bg-teal-500/20 border-teal-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            {subOpt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleNext(6, 'q5_had_match')}
                    className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                  >
                    Avançar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PERGUNTA 6: Maior Benefício */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 6 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Qual foi o maior benefício que você percebeu usando o VoCentro?</h3>
              <textarea
                rows={3}
                placeholder="Escreva livremente sua percepção de valor..."
                value={formData.q6_biggest_benefit}
                onChange={(e) => setFormData({ ...formData, q6_biggest_benefit: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
              <button
                disabled={!formData.q6_biggest_benefit.trim()}
                onClick={() => handleNext(7, 'q6_biggest_benefit')}
                className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                Avançar
              </button>
            </div>
          )}

          {/* PERGUNTA 7: O que melhorar */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 7 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">O que mais poderia melhorar na plataforma?</h3>
              <textarea
                rows={3}
                placeholder="Diga-nos dores, sugestões ou erros que encontrou..."
                value={formData.q7_improvements}
                onChange={(e) => setFormData({ ...formData, q7_improvements: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
              <button
                disabled={!formData.q7_improvements.trim()}
                onClick={() => handleNext(8, 'q7_improvements')}
                className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                Avançar
              </button>
            </div>
          )}

          {/* PERGUNTA 8: Interesse em Recursos PRO */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 8 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Em algum momento você sentiu vontade de usar recursos ilimitados ou recursos PRO?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {['Sim', 'Talvez', 'Não'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q8_pro_intent: option });
                      handleNext(9, 'q8_pro_intent');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q8_pro_intent === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 9: Preço Justo */}
          {step === 9 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 9 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Se existisse um plano PRO do VoCentro, qual valor mensal pareceria justo?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {['Até R$ 9,90', 'R$ 19,90', 'R$ 29,90', 'R$ 39,90', 'Mais de R$ 39,90', 'Eu não pagaria'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q9_fair_price: option });
                      handleNext(10, 'q9_fair_price');
                    }}
                    className={`p-3.5 rounded-xl border text-center font-medium transition-all ${
                      formData.q9_fair_price === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 10: O que faria assinar */}
          {step === 10 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 10 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">O que faria você assinar o VoCentro?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  'Mais análises de vagas com IA',
                  'Currículo ATS ilimitado',
                  'Simulações de entrevistas ilimitadas',
                  'Copiloto de carreira personalizado',
                  'Alertas de vagas compatíveis',
                  'Outro'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q10_subscription_driver: option });
                      handleNext(11, 'q10_subscription_driver');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q10_subscription_driver === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 11: NPS (0-10) */}
          {step === 11 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 11 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Você recomendaria o VoCentro para alguém procurando emprego?</h3>
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>0 (Pouco provável)</span>
                <span>10 (Muito provável)</span>
              </div>
              <div className="grid grid-cols-11 gap-1 sm:gap-2">
                {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                  <button
                    key={score}
                    onClick={() => {
                      setFormData({ ...formData, q11_nps: score });
                      handleNext(12, 'q11_nps');
                    }}
                    className={`h-11 rounded-lg border font-bold text-sm transition-all ${
                      formData.q11_nps === score
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-110 shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 12: Entrevista */}
          {step === 12 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 12 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Gostaria de participar de entrevistas rápidas de 15 minutos para ajudar a construir novas funcionalidades?</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Sim', 'Não'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setFormData({ ...formData, q12_interview_opt_in: option })}
                    className={`p-3.5 rounded-xl border font-bold text-center transition-all ${
                      formData.q12_interview_opt_in === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {formData.q12_interview_opt_in === 'Sim' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs text-slate-300 font-medium">WhatsApp para contato (opcional):</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp_phone}
                    onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {formData.q12_interview_opt_in && (
                <button
                  onClick={() => handleNext(13, 'q12_interview_opt_in')}
                  className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  Avançar
                </button>
              )}
            </div>
          )}

          {/* PERGUNTA 13: PMF Question */}
          {step === 13 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 13 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Se o VoCentro deixasse de existir amanhã, o que você sentiria mais falta?</h3>
              <textarea
                rows={3}
                placeholder="Ex: Da clareza da compatibilidade com a vaga, do Kanban..."
                value={formData.q13_pmf_missing_feature}
                onChange={(e) => setFormData({ ...formData, q13_pmf_missing_feature: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
              <button
                disabled={!formData.q13_pmf_missing_feature.trim()}
                onClick={() => handleNext(14, 'q13_pmf_missing_feature')}
                className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                Avançar
              </button>
            </div>
          )}

          {/* PERGUNTA 14: Momento de Valor */}
          {step === 14 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 14 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Em qual momento você percebeu maior valor?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  'Quando encontrei uma vaga compatível pelo Match IA',
                  'Quando entendi minhas chances em uma vaga',
                  'Quando organizei minhas candidaturas',
                  'Quando melhorei meu currículo',
                  'Quando treinei entrevista',
                  'Ainda não percebi valor'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q14_value_moment: option });
                      handleNext(15, 'q14_value_moment');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q14_value_moment === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 15: Dor Principal */}
          {step === 15 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pergunta 15 de {totalQuestions}</div>
              <h3 className="text-lg font-bold text-white">Qual é hoje sua maior dificuldade para conseguir uma oportunidade?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  'Encontrar vagas compatíveis comigo',
                  'Saber quais vagas realmente tenho chance',
                  'Melhorar meu currículo',
                  'Passar pelos filtros ATS',
                  'Me preparar para entrevistas',
                  'Organizar minhas candidaturas',
                  'Outro'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFormData({ ...formData, q15_main_difficulty: option });
                      handleNext(16, 'q15_main_difficulty');
                    }}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q15_main_difficulty === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PERGUNTA 16: Urgência & Consentimento LGPD */}
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
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => setFormData({ ...formData, q16_urgency: option })}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      formData.q16_urgency === option
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {formData.q16_urgency && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-900/80 border border-slate-800">
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
                    disabled={loading}
                    onClick={handleSubmitSurvey}
                    className="w-full py-3.5 rounded-xl font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Salvando respostas...' : 'Concluir pesquisa e entrar no sorteio PRO'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 17: TELA FINAL DE AGRADECIMENTO & CONFIRMAÇÃO DO SORTEIO */}
          {step === 17 && (
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Obrigado por ajudar a construir o VoCentro 💙
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Sua opinião será usada para melhorar a plataforma e criar ferramentas que realmente ajudem profissionais a conquistarem melhores oportunidades.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 max-w-md mx-auto space-y-1">
                <p className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Gift className="w-4 h-4" /> Inscrição Confirmada no Sorteio PRO
                </p>
                <p className="text-xs text-slate-400">
                  Você já está participando do sorteio de 7 dias de acesso PRO ilimitado.
                </p>
              </div>

              <button
                onClick={onClose}
                className="py-3 px-8 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Voltar para o VoCentro 🚀
              </button>
            </div>
          )}

          {/* Navigation Controls */}
          {step > 0 && step <= totalQuestions && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center gap-1 hover:text-white disabled:opacity-30 transition-colors"
              >
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
