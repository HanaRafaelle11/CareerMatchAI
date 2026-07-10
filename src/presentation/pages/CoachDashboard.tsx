import { useState, type FormEvent } from 'react';
import { CardGlass } from '../components/CardGlass';
import { MarketIntelligenceService } from '../../application/services/MarketIntelligenceService';
import type { Application, CareerProfile, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { calcYearsFromExperiences } from '../../application/services/matchingEngine';
import { 
  Award, Play, MessageSquare, Send, 
  BarChart3, RefreshCcw, Star, UserCheck
} from 'lucide-react';

interface CoachDashboardProps {
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  applications: Application[];
  jobs: Job[];
  startSimulation: (appId: string) => Promise<any>;
  sendMessage: (args: { sim: any; role: 'interviewer' | 'candidate'; text: string }) => Promise<any>;
  getSimulationQuery: (appId: string) => any;
  triggerDailyChecks: () => Promise<any>;
}

export function CoachDashboard({
  careerProfile: _careerProfile,
  careerProfileNew,
  applications,
  jobs,
  startSimulation,
  sendMessage,
  getSimulationQuery,
  triggerDailyChecks
}: CoachDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'recruiter'>('simulator');
  
  // Dados do perfil consolidado para personalizar respostas
  const profileName = careerProfileNew?.personal?.fullName?.split(' ')[0] || 'Profissional';
  const profileHeadline = careerProfileNew?.personal?.headline || 'Especialista';
  const profileYears = careerProfileNew ? calcYearsFromExperiences(careerProfileNew.experience) : 0;
  const profileSkills = careerProfileNew?.skills.slice(0, 5).map(s => s.name).join(', ') || 'suas competências principais';
  const profileRole = careerProfileNew?.experience?.[0]?.role || profileHeadline;
  
  // 1. Processo seletivo ativo para simular
  const activeApps = applications.filter(a => 
    !['🏆 Oferta recebida', '✅ Aceita', '❌ Rejeitada', '🚫 Fora do meu objetivo'].includes(a.status)
  );
  const [selectedAppId, setSelectedAppId] = useState(activeApps[0]?.id || '');

  // Hook query para simulação
  const { data: simulation = null, isLoading: loadingSim } = getSimulationQuery(selectedAppId);

  // Input de resposta do candidato
  const [candidateResponse, setCandidateResponse] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Estatísticas e Heurísticas
  const marketTrends = MarketIntelligenceService.getMarketTrends(jobs);

  // AI Recruiter Chat States — personalizado com dados reais do perfil
  const initialRecruiterMsg = careerProfileNew
    ? `Olá, ${profileName}! Analisei seu perfil como ${profileRole} com ${profileYears} anos de experiência e competências como ${profileSkills}. Estou aqui para orientar sua busca de forma personalizada. Você prefere focar em vagas sênior/lead, preparação para entrevistas ou estratégia de candidatura?`
    : 'Olá! Sou o seu AI Recruiter. Analiso todo o seu histórico de candidaturas, currículos e feedback de empresas para atuar como seu consultor de carreira pessoal. Como posso guiar sua busca hoje?';

  const [recruiterChat, setRecruiterChat] = useState<Array<{ role: 'recruiter' | 'candidate', text: string }>>([
    {
      role: 'recruiter',
      text: initialRecruiterMsg
    }
  ]);

  const [recruiterInput, setRecruiterInput] = useState('');

  const handleStartSim = async () => {
    if (!selectedAppId) return;
    try {
      await startSimulation(selectedAppId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendResponse = async (e: FormEvent) => {
    e.preventDefault();
    if (!simulation || !candidateResponse.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        sim: simulation,
        role: 'candidate',
        text: candidateResponse.trim()
      });
      setCandidateResponse('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendRecruiterMessage = (e?: FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const userText = (directText || recruiterInput).trim();
    if (!userText) return;

    const newChat = [...recruiterChat, { role: 'candidate' as const, text: userText }];
    setRecruiterChat(newChat);
    setRecruiterInput('');

    // Responsive advisor feedback
    setTimeout(() => {
      let reply = '';
      const textLower = userText.toLowerCase();
      
      if (!applications || applications.length === 0) {
        reply = "Você ainda não possui candidaturas suficientes para gerar recomendações baseadas em histórico.";
      } else {
        const totalApps = applications.length;
        const totalInterviews = applications.filter(a => 
          ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)
        ).length;
        
        const conversionRate = totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0;

        if (textLower.includes('cs') || textLower.includes('customer success') || textLower.includes('remoto')) {
          reply = `Analisei seu histórico de candidaturas em relação a vagas remotas. Com base nas suas ${totalApps} candidatura(s) ativas, o sistema recomenda focar em posições alinhadas ao seu perfil de Customer Success.`;
        } else if (textLower.includes('diagnóstico') || textLower.includes('saas') || textLower.includes('mercado')) {
          reply = `Seu diagnóstico aponta atividade no mercado. Sua taxa geral de avanço para entrevistas reais com base no seu histórico é de ${conversionRate}%.`;
        } else {
          reply = `Com base nas suas candidaturas reais, identificamos que você possui ${totalApps} candidatura(s) cadastrada(s) e ${totalInterviews} entrevista(s) registrada(s). Continue atualizando seus processos para obter direcionamentos de competências.`;
        }
      }

      setRecruiterChat(prev => [...prev, { role: 'recruiter' as const, text: reply }]);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-2">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
            Desenvolvimento & Coach de Carreira
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
            Prepare-se para entrevistas ou consulte o AI Recruiter baseado no seu histórico real.
          </p>
        </div>
        <button
          onClick={triggerDailyChecks}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all"
        >
          <RefreshCcw size={14} />
          Verificar Novas Vagas
        </button>
      </div>

      {/* Subtabs switcher */}
      <div className="flex border-b border-slate-800 dark:border-slate-800 light:border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeSubTab === 'simulator' ? 'text-brand-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeSubTab === 'simulator' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
          <MessageSquare size={15} />
          Simulador de Entrevista
        </button>
        <button
          onClick={() => setActiveSubTab('recruiter')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeSubTab === 'recruiter' ? 'text-brand-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeSubTab === 'recruiter' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
          <UserCheck size={15} />
          AI Recruiter (Consultor)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: Simulator */}
          {activeSubTab === 'simulator' && (
            <CardGlass className="p-6 space-y-6 flex flex-col min-h-[480px] animate-slide-in">
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-900">
                  <MessageSquare size={18} className="text-brand-500" />
                  Simulador de Entrevista por IA
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Selecione uma candidatura em andamento para iniciar a sabatina simulada baseada em técnicas STAR.
                </p>
              </div>

              {activeApps.length === 0 ? (
                <div className="flex-1 py-16 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 text-center space-y-2">
                  <span>Nenhuma candidatura ativa registrada para simular.</span>
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex gap-3">
                    <select
                      value={selectedAppId}
                      onChange={e => setSelectedAppId(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl p-2.5 outline-none focus:border-brand-500"
                    >
                      {activeApps.map(app => (
                        <option key={app.id} value={app.id}>{app.jobTitle} em {app.companyName}</option>
                      ))}
                    </select>
                    {!simulation && (
                      <button
                        onClick={handleStartSim}
                        disabled={loadingSim}
                        className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Play size={12} />
                        Iniciar Sabatina
                      </button>
                    )}
                  </div>

                  {simulation ? (
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex-1 max-h-[300px] overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-900/30 border border-slate-900/60 text-xs">
                        {simulation.chatHistory.map((msg: any, i: number) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                              msg.role === 'interviewer'
                                ? 'bg-slate-900 border border-slate-850 text-slate-300 self-start mr-auto'
                                : 'bg-brand-500/10 border border-brand-500/20 text-brand-400 self-end ml-auto'
                            }`}
                          >
                            <strong className="block mb-0.5 text-[10px] uppercase font-bold text-slate-500">
                              {msg.role === 'interviewer' ? 'Recrutador IA' : 'Você'}
                            </strong>
                            {msg.text}
                          </div>
                        ))}
                      </div>

                      {simulation.evaluations && (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <Star size={16} className="fill-emerald-400" />
                            Avaliação de Performance
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-2.5 rounded bg-slate-900/40 border border-slate-850">
                              <span className="text-[10px] text-slate-500 uppercase font-bold block">Clareza</span>
                              <strong className="text-sm text-slate-200">{simulation.evaluations.clarity}/100</strong>
                            </div>
                            <div className="p-2.5 rounded bg-slate-900/40 border border-slate-850">
                              <span className="text-[10px] text-slate-500 uppercase font-bold block">Objetividade</span>
                              <strong className="text-sm text-slate-200">{simulation.evaluations.objectivity}/100</strong>
                            </div>
                            <div className="p-2.5 rounded bg-slate-900/40 border border-slate-850">
                              <span className="text-[10px] text-slate-500 uppercase font-bold block">Aderência</span>
                              <strong className="text-sm text-slate-200">{simulation.evaluations.adherence}/100</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {!simulation.evaluations && (
                        <form onSubmit={handleSendResponse} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Sua resposta..."
                            value={candidateResponse}
                            onChange={e => setCandidateResponse(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                          />
                          <button
                            type="submit"
                            disabled={!candidateResponse.trim() || isSending}
                            className="px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
                          >
                            <Send size={14} />
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center py-20 text-slate-500 text-xs">
                      <span>Pronto para simular.</span>
                    </div>
                  )}
                </div>
              )}
            </CardGlass>
          )}

          {/* TAB 2: AI Recruiter Console */}
          {activeSubTab === 'recruiter' && (
            <CardGlass className="p-6 space-y-6 flex flex-col min-h-[480px] animate-slide-in">
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-900">
                  <UserCheck size={18} className="text-brand-500" />
                  AI Recruiter Console (Beta)
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  Converse com o sistema para extrair direcionamentos de carreira com base no seu histórico exclusivo.
                </p>
              </div>

              {/* Chat Recruiter log */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex-grow max-h-[300px] overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-900/30 border border-slate-900/60 text-xs flex flex-col">
                  {recruiterChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                        msg.role === 'recruiter'
                          ? 'bg-slate-900 border border-slate-850 text-slate-300 self-start mr-auto'
                          : 'bg-brand-500/10 border border-brand-500/20 text-brand-400 self-end ml-auto'
                      }`}
                    >
                      <strong className="block mb-0.5 text-[9px] uppercase font-bold text-slate-500">
                        {msg.role === 'recruiter' ? 'AI Recruiter Advisor' : 'Você'}
                      </strong>
                      <span className="whitespace-pre-line">{msg.text}</span>
                    </div>
                  ))}
                </div>

                {/* Suggestions Quick keys */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <button 
                    onClick={() => handleSendRecruiterMessage(undefined, 'Quero CS remoto pagando +15k')}
                    type="button"
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl"
                  >
                    🔍 Vagas CS remoto &gt; 15k?
                  </button>
                  <button 
                    onClick={() => {
                      setRecruiterInput("Análise de SaaS e diagnóstico de mercado");
                    }}
                    type="button"
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl"
                  >
                    📊 Diagnóstico SaaS B2B
                  </button>
                </div>

                <form onSubmit={handleSendRecruiterMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua dúvida de carreira (Ex: CS remoto, gaps técnicos...)"
                    value={recruiterInput}
                    onChange={e => setRecruiterInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={!recruiterInput.trim()}
                    className="px-4.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </CardGlass>
          )}
        </div>

        {/* Coluna 3: Gaps and demand */}
        <div className="space-y-6">
          <CardGlass className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-200 pb-2 border-b border-slate-900 flex items-center gap-1.5">
              <Award size={18} className="text-emerald-500" />
              Diagnóstico Consolidado
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Forças</span>
                <p className="text-slate-300">Gestão de Churn, NPS, Liderança de Equipes de CS e Playbooks SaaS.</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Gaps Recomendados</span>
                <p className="text-slate-300">Falta proficiência em Salesforce e modelagem de dados com SQL.</p>
              </div>
            </div>
          </CardGlass>

          <CardGlass className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-200 pb-2 border-b border-slate-900 flex items-center gap-1.5">
              <BarChart3 size={18} className="text-brand-500" />
              Monitor de Demanda Real
            </h3>
            <p className="text-[10px] text-slate-500">Habilidades mais exigidas nas vagas monitoradas.</p>
            <div className="space-y-3">
              {marketTrends.slice(0, 4).map((trend, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">{trend.keyword}</span>
                    <span className="text-slate-500 text-[10px]">{trend.percentage}% das vagas</span>
                  </div>
                  <div className="w-full h-1.5 rounded bg-slate-900 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-600 to-indigo-500" style={{ width: `${trend.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardGlass>
        </div>
      </div>
    </div>
  );
}
