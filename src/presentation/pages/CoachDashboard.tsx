import { useState, useEffect, type FormEvent } from 'react';
import { CardGlass } from '../components/CardGlass';
import { MarketIntelligenceService } from '../../application/services/MarketIntelligenceService';
import type { Application, CareerProfile, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { calcYearsFromExperiences } from '../../application/services/matchingEngine';
import { tracker } from '../../infrastructure/analytics/tracker';
import { 
  Award, Play, MessageSquare, Send, 
  RefreshCcw, Star, UserCheck, Loader2, BarChart3
} from 'lucide-react';
import { ProgressRing, Badge } from '../components/ds';

interface CoachDashboardProps {
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  applications: Application[];
  jobs: Job[];
  matches?: any[];
  startSimulation: (appId: string, reset?: boolean) => Promise<any>;
  sendMessage: (args: { sim: any; role: 'interviewer' | 'candidate'; text: string }) => Promise<any>;
  getSimulationQuery: (appId: string) => any;
  triggerDailyChecks: () => Promise<any>;
  initialSelectedAppId?: string | null;
  onClearInitialSelectedAppId?: () => void;
}

export function CoachDashboard({
  careerProfile: _careerProfile,
  careerProfileNew,
  applications,
  jobs,
  matches,
  startSimulation,
  sendMessage,
  getSimulationQuery,
  triggerDailyChecks,
  initialSelectedAppId,
  onClearInitialSelectedAppId
}: CoachDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'recruiter'>('simulator');
  const [isCheckingVagas, setIsCheckingVagas] = useState(false);
  
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

  useEffect(() => {
    if (initialSelectedAppId) {
      setSelectedAppId(initialSelectedAppId);
      onClearInitialSelectedAppId?.();
    }
  }, [initialSelectedAppId, onClearInitialSelectedAppId]);

  // Hook query para simulação
  const { data: simulation = null, isLoading: loadingSim } = getSimulationQuery(selectedAppId);

  // Input de resposta do candidato
  const [candidateResponse, setCandidateResponse] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Estatísticas e Heurísticas
  const matchedJobIds = new Set((matches || []).map((m: any) => m.jobId || m.job_id));
  const activeJobs = jobs.filter(j => matchedJobIds.has(j.id));
  const marketTrends = MarketIntelligenceService.getMarketTrends(activeJobs, careerProfileNew);

  // Mentor IA Vocentro Chat States — personalizado com dados reais do perfil
  const initialRecruiterMsg = careerProfileNew
    ? `Olá, ${profileName}! Analisei seu perfil como ${profileRole} com ${profileYears} anos de experiência e competências como ${profileSkills}. Estou aqui para guiar sua evolução profissional de forma personalizada. Você prefere focar em preparação para entrevistas, estratégia de carreira ou mapeamento de gaps de competência?`
    : 'Olá! Sou o seu Mentor IA Vocentro. Analiso todo o seu histórico profissional, currículos e feedbacks para te colocar no centro das melhores oportunidades. Como posso ajudar na sua evolução de carreira hoje?';

  const [recruiterChat, setRecruiterChat] = useState<Array<{ role: 'recruiter' | 'candidate', text: string }>>([
    {
      role: 'recruiter',
      text: initialRecruiterMsg
    }
  ]);

  useEffect(() => {
    setRecruiterChat(prev => {
      if (prev.length <= 1) {
        return [{ role: 'recruiter' as const, text: initialRecruiterMsg }];
      }
      return prev;
    });
  }, [initialRecruiterMsg]);

  const [recruiterInput, setRecruiterInput] = useState('');

  const handleStartSim = async () => {
    if (!selectedAppId) return;
    try {
      await startSimulation(selectedAppId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartSim = async () => {
    if (!selectedAppId) return;
    const confirm = window.confirm("Deseja realmente reiniciar o simulador de entrevista? Todo o progresso e avaliação desta rodada serão apagados.");
    if (!confirm) return;
    try {
      await startSimulation(selectedAppId, true);
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
    tracker.track('coach_message', 'coach', { query: userText });

    // Responsive advisor feedback
    setTimeout(() => {
      let reply = '';
      const textLower = userText.toLowerCase();
      
      // Verificar se a última mensagem foi a resposta padrão de direcionamento
      const lastRecruiterMsg = recruiterChat[recruiterChat.length - 1];
      const wasLastMsgDefault = lastRecruiterMsg && lastRecruiterMsg.role === 'recruiter' && lastRecruiterMsg.text.startsWith('Entendi perfeitamente sua colocação');

      // Respostas dinâmicas baseadas em heurísticas inteligentes
      if (textLower.includes('como') || textLower.includes('onde') || textLower.includes('fazer isso') || textLower.includes('fazer')) {
        reply = `Você pode fazer isso de duas maneiras muito simples:\n\n1. **Cadastrar/Colar Vagas**: Vá até a aba **Encontrar Vagas** no menu lateral esquerdo. Lá você pode pesquisar oportunidades ou clicar em "Colar Vaga Manualmente" para analisar a compatibilidade do seu currículo com a vaga e adicioná-la à sua estratégia.\n2. **Ajustar Preferências e Metas**: Clique na aba **Ajustes** no menu lateral para atualizar suas pretensões salariais e preferências de trabalho.`;
      } else if (textLower.includes('ajuda') || textLower.includes('como funciona') || textLower.includes('o que você faz') || textLower.includes('ajudar')) {
        reply = `Como seu AI Recruiter Advisor, posso atuar em várias frentes para acelerar sua recolocação:\n\n1. **Simulação de Entrevistas**: Preparação com rodadas de perguntas STAR e feedback instantâneo.\n2. **Diagnóstico de Match**: Analisar a aderência técnica e comportamental do seu currículo frente a qualquer vaga.\n3. **Insights de Conversão**: Mapear gargalos e estimar sua taxa de sucesso nas etapas.\n4. **Negociação Salarial**: Direcionar pretensões baseadas na senioridade e modelo de trabalho.`;
      } else if (textLower.includes('remoto') || textLower.includes(profileRole.toLowerCase()) || textLower.includes('vaga') || textLower.includes('salário') || textLower.includes('15k') || textLower.includes('+15k')) {
        reply = `Excelente meta! Vagas de ${profileRole} remotas ou seniores na faixa de R$ 15k+ costumam exigir proficiência avançada em termos estratégicos específicos da área (tais como ${profileSkills}) e liderança de projetos complexos.\n\nCom base no seu perfil, sugiro mapear as principais vagas que se encaixam nesta meta e adicioná-las na aba **Estratégia** para diagnosticarmos se há gaps específicos de termos ou ferramentas.`;
      } else if (textLower.includes('olá') || textLower.includes('oi') || textLower.includes('bom dia') || textLower.includes('boa tarde')) {
        reply = `Olá, ${profileName}! Como posso te auxiliar em sua jornada profissional hoje? Quer conversar sobre vagas de interesse, simular uma entrevista ou analisar sua estratégia salarial?`;
      } else if (wasLastMsgDefault) {
        reply = `Compreendo seu interesse. Para que possamos aprofundar em análises estatísticas e feedbacks mais ricos, é fundamental termos dados reais na sua conta. Qual o próximo passo ou dúvida de carreira que você gostaria de explorar agora?`;
      } else {
        reply = `Entendi perfeitamente sua colocação. Na minha atuação como conselheiro de carreira, a melhor forma de atingirmos esse objetivo é vinculando suas ideias a vagas reais de mercado.\n\nSugiro colar a descrição de uma vaga na aba **Match de Vagas** ou cadastrar metas de salário em configurações para refinarmos nossa orientação.`;
      }

      // Adicionar observação contextual amigável se houver poucas ou nenhuma vaga cadastrada
      const hasStrategyMention = reply.includes('aba Estratégia') || reply.includes('aba Ajustes') || reply.includes('aba Encontrar Vagas');
      if ((!applications || applications.length === 0) && !hasStrategyMention) {
        reply += `\n\n*(Nota: Você ainda não tem vagas na sua aba de Estratégia. Cadastre vagas por lá para desbloquear o monitoramento completo de conversão e negociação de salário!)*`;
      } else if (applications && applications.length > 0 && applications.length < 5 && !reply.includes('candidatura') && !hasStrategyMention) {
        reply += `\n\n*(Nota: Identificamos ${applications.length} vaga(s) cadastrada(s). Cadastre pelo menos 5 vagas para projetarmos suas taxas estatísticas de avanço e identificar gargalos!)*`;
      }

      setRecruiterChat(prev => [...prev, { role: 'recruiter' as const, text: reply }]);
    }, 600);
  };

  const handleVerificarVagas = async () => {
    try {
      setIsCheckingVagas(true);
      await triggerDailyChecks();
      alert('Vagas verificadas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao verificar novas vagas.');
    } finally {
      setIsCheckingVagas(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-0">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
            Evolução Profissional & Mentor IA
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1 font-sans">
            Prepare-se para processos seletivos ou consulte o Mentor IA Vocentro para traçar sua estratégia.
          </p>
        </div>
        <button
          onClick={handleVerificarVagas}
          disabled={isCheckingVagas}
          className="px-4 py-2.5 rounded-[14px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer font-sans"
        >
          {isCheckingVagas ? (
            <Loader2 size={14} className="animate-spin text-brand-accent" />
          ) : (
            <RefreshCcw size={14} />
          )}
          {isCheckingVagas ? 'Verificando...' : 'Verificar Novas Vagas'}
        </button>
      </div>

      {/* Subtabs switcher */}
      <div className="flex border-b border-slate-800 dark:border-slate-800 light:border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 cursor-pointer font-sans ${
            activeSubTab === 'simulator' ? 'text-brand-accent font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeSubTab === 'simulator' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-accent" />}
          <MessageSquare size={15} />
          Simulador de Entrevista
        </button>
        <button
          onClick={() => setActiveSubTab('recruiter')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 cursor-pointer font-sans ${
            activeSubTab === 'recruiter' ? 'text-brand-accent font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeSubTab === 'recruiter' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-accent" />}
          <UserCheck size={15} />
          Mentor IA (Consultor)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: Simulator */}
          {activeSubTab === 'simulator' && (
            <CardGlass className="p-6 space-y-6 flex flex-col min-h-[480px] animate-slide-in">
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-905">
                  <MessageSquare size={18} className="text-brand-accent" />
                  Mentor IA Vocentro - Simulador de Entrevista
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-sans">
                  Selecione uma candidatura em andamento para iniciar a simulação focada no método STAR.
                </p>
              </div>

              {activeApps.length === 0 ? (
                <div className="flex-1 py-16 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-[14px] text-xs text-slate-500 text-center space-y-2 font-sans">
                  <span>Nenhuma candidatura ativa registrada para simular.</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-[420px]">
                  {simulation ? (
                    <div className="flex-1 flex flex-col gap-4 font-sans">
                      {/* Active simulation header */}
                      <div className="flex items-center justify-between p-3 rounded-[14px] bg-slate-950/30 border border-slate-900 text-xs">
                        <div className="min-w-0">
                          <span className="text-[10px] text-brand-accent font-bold uppercase tracking-wider block font-mono">Simulação Ativa</span>
                          <span className="text-slate-350 font-semibold truncate block max-w-xs md:max-w-md">
                            {activeApps.find(app => app.id === selectedAppId)?.jobTitle} em {activeApps.find(app => app.id === selectedAppId)?.companyName}
                          </span>
                        </div>
                        <button
                          onClick={handleRestartSim}
                          className="px-3 py-1.5 rounded-lg border border-slate-850 hover:border-slate-800 text-slate-400 font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <RefreshCcw size={10} />
                          Reiniciar
                        </button>
                      </div>

                      {/* Chat History */}
                      <div className="flex-grow max-h-[350px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950/20 border border-slate-900/60 text-xs flex flex-col">
                        {simulation.chatHistory.map((msg: any, i: number) => {
                          const isInterviewer = msg.role === 'interviewer';
                          return (
                            <div key={i} className="space-y-2 flex flex-col w-full">
                              <div
                                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                                  isInterviewer
                                    ? 'bg-slate-900 border border-slate-850 text-slate-350 self-start mr-auto'
                                    : 'bg-brand-500/15 border border-brand-500/20 text-brand-400 self-end ml-auto'
                                }`}
                              >
                                <strong className="block mb-0.5 text-[9px] uppercase font-bold text-slate-500 font-mono">
                                  {isInterviewer ? 'Mentor IA Vocentro' : 'Você'}
                                </strong>
                                <span className="whitespace-pre-line">{msg.text}</span>
                              </div>
                              
                              {/* Rich dynamic turn evaluation */}
                              {!isInterviewer && msg.evaluation && (
                                <div className="self-end ml-auto mr-2 max-w-[80%] p-3.5 rounded-2xl bg-slate-950/65 border border-slate-900 text-[10px] text-slate-300 space-y-2 animate-fade-in shadow-lg">
                                  <div className="flex items-center justify-between gap-4 font-bold pb-1.5 border-b border-slate-900">
                                    <span className="text-emerald-400">⭐ Turno: {msg.evaluation.score}/100</span>
                                    <span className="text-slate-500 uppercase tracking-wider text-[8px]">Dificuldade: {msg.evaluation.difficulty}</span>
                                  </div>
                                  
                                  {/* STAR framework breakdown */}
                                  <div className="grid grid-cols-2 gap-2 text-[9px] py-1">
                                    <div className="p-2 rounded-xl bg-slate-900/50">
                                      <strong className="text-brand-400 block font-bold mb-0.5">Situação:</strong>
                                      <span className="text-slate-400 font-sans">{msg.evaluation.star.situation}</span>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-900/50">
                                      <strong className="text-indigo-400 block font-bold mb-0.5">Tarefa:</strong>
                                      <span className="text-slate-400 font-sans">{msg.evaluation.star.task}</span>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-900/50">
                                      <strong className="text-sky-400 block font-bold mb-0.5">Ação:</strong>
                                      <span className="text-slate-400 font-sans">{msg.evaluation.star.action}</span>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-900/50">
                                      <strong className="text-emerald-400 block font-bold mb-0.5">Resultado:</strong>
                                      <span className="text-slate-400 font-sans">{msg.evaluation.star.result}</span>
                                    </div>
                                  </div>

                                  {/* Scores breakdown */}
                                  <div className="flex justify-between gap-3 text-[9px] pt-2 text-slate-400 font-semibold border-t border-slate-900">
                                    <span>Técnico: <strong className="text-slate-200">{msg.evaluation.technicalScore}%</strong></span>
                                    <span>Clareza: <strong className="text-slate-200">{msg.evaluation.clarityScore}%</strong></span>
                                    <span>Comunicação: <strong className="text-slate-200">{msg.evaluation.communicationScore}%</strong></span>
                                    <span>Confiança: <strong className="text-slate-200">{msg.evaluation.confidenceScore}%</strong></span>
                                  </div>

                                  {msg.evaluation.feedback && (
                                    <p className="italic text-slate-400 leading-relaxed pt-1.5 font-sans">
                                      "{msg.evaluation.feedback}"
                                    </p>
                                  )}
                                  
                                  {msg.evaluation.positives?.length > 0 && (
                                    <div className="text-emerald-400">
                                      <strong>✓ Pontos Fortes:</strong> {msg.evaluation.positives.join(', ')}
                                    </div>
                                  )}
                                  {msg.evaluation.improvements?.length > 0 && (
                                    <div className="text-amber-400">
                                      <strong>⚠️ Oportunidades:</strong> {msg.evaluation.improvements.join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {isSending && (
                          <div className="p-3 rounded-2xl max-w-[85%] bg-slate-900 border border-slate-850 text-slate-350 self-start mr-auto animate-pulse flex items-center gap-2 font-sans">
                            <Loader2 size={12} className="animate-spin text-brand-accent" />
                            <span className="text-[10px] text-slate-400">O Mentor IA Vocentro está avaliando sua resposta e formulando o feedback...</span>
                          </div>
                        )}
                      </div>

                      {/* Evaluations */}
                      {simulation.evaluations && (() => {
                        const evaluations = simulation.evaluations as any;
                        const isNewSchema = evaluations.scoreOverall !== undefined;

                        if (isNewSchema) {
                          return (
                            <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-6 animate-fade-in text-xs">
                              {/* Header */}
                              <div className="flex items-center justify-between gap-4 border-b border-slate-900 pb-3">
                                <div className="flex items-center gap-2 font-display font-bold text-slate-200 text-sm">
                                  <Star size={16} className="text-amber-400 fill-amber-400" />
                                  <span>Relatório Consolidado de IA</span>
                                </div>
                                <div className="text-slate-500 text-[10px]">
                                  Duração: <strong className="text-slate-350">{Math.floor((evaluations.duration_seconds || simulation.duration_seconds || 0) / 60)}m {((evaluations.duration_seconds || simulation.duration_seconds || 0) % 60)}s</strong>
                                </div>
                              </div>

                              {/* Progress Rings Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex flex-col items-center justify-center text-center space-y-1">
                                  <ProgressRing value={evaluations.scoreOverall || 0} size={50} strokeWidth={5} />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Nota Geral</span>
                                  <strong className="text-lg text-slate-200">{evaluations.scoreOverall}%</strong>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex flex-col items-center justify-center text-center space-y-1">
                                  <ProgressRing value={evaluations.jobAdherence || 0} size={50} strokeWidth={5} />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Aderência à Vaga</span>
                                  <strong className="text-lg text-slate-200">{evaluations.jobAdherence}%</strong>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex flex-col items-center justify-center text-center space-y-1">
                                  <ProgressRing value={evaluations.approvalProbability || 0} size={50} strokeWidth={5} />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Chance de Aprovação</span>
                                  <strong className="text-lg text-slate-200">{evaluations.approvalProbability}%</strong>
                                </div>
                              </div>

                              {/* Detailed Feedback Categories */}
                              <div className="space-y-4">
                                <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl space-y-1">
                                  <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Análise de Competências STAR</strong>
                                  <p className="text-slate-350 leading-relaxed font-sans">{evaluations.starAnalysis}</p>
                                </div>

                                <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl space-y-1">
                                  <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avaliação de Adequação Técnica</strong>
                                  <p className="text-slate-350 leading-relaxed font-sans">{evaluations.technicalAnalysis}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl space-y-1">
                                    <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comunicação & Expressão</strong>
                                    <p className="text-slate-350 leading-relaxed font-sans">{evaluations.communicationAnalysis}</p>
                                    <p className="text-slate-400 text-[10px] mt-1.5 italic font-sans">{evaluations.postureAnalysis}</p>
                                  </div>
                                  <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl space-y-1">
                                    <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clareza & Segurança</strong>
                                    <p className="text-slate-350 leading-relaxed font-sans">{evaluations.clarityAnalysis}</p>
                                    <p className="text-slate-400 text-[10px] mt-1.5 italic font-sans">Foco: {evaluations.objectivityAnalysis} | Confiança: {evaluations.confidenceAnalysis}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Strengths / Weaknesses Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-900 pt-4">
                                <div className="space-y-2">
                                  <strong className="text-emerald-400 font-semibold block text-[10px] uppercase tracking-wider">✓ Pontos Fortes Identificados:</strong>
                                  <ul className="list-disc pl-4 space-y-1.5 text-slate-350 font-sans">
                                    {evaluations.strengths?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <strong className="text-amber-400 font-semibold block text-[10px] uppercase tracking-wider">⚠️ Gaps e Pontos Fracos:</strong>
                                  <ul className="list-disc pl-4 space-y-1.5 text-slate-350 font-sans">
                                    {evaluations.weaknesses?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                                  </ul>
                                </div>
                              </div>

                              {/* Key Highlights */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                                  <strong className="text-emerald-400 font-semibold block text-[10px] uppercase tracking-wider">🌟 Melhor Resposta:</strong>
                                  <p className="text-slate-350 leading-relaxed font-sans">{evaluations.bestAnswers?.[0] || 'Respostas consistentes e alinhadas.'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-1">
                                  <strong className="text-amber-400 font-semibold block text-[10px] uppercase tracking-wider">🚨 Maior Desafio:</strong>
                                  <p className="text-slate-350 leading-relaxed font-sans">{evaluations.worstAnswers?.[0] || 'Gaps textuais não identificados.'}</p>
                                </div>
                              </div>

                              {/* Improvement Plan */}
                              <div className="p-4.5 bg-brand-500/5 border border-brand-500/10 rounded-2xl space-y-2">
                                <strong className="text-brand-400 font-bold text-[10px] uppercase tracking-wider block">📋 Plano de Preparação e Ação</strong>
                                <ul className="list-decimal pl-4 space-y-1.5 text-slate-350 font-sans">
                                  {evaluations.improvementPlan?.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                                </ul>
                              </div>

                              {/* Cost Metrics */}
                              <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-900 pt-3">
                                <span>Tokens de Execução: <strong className="text-slate-400">{(evaluations.tokens_used || simulation.tokens_used || 0).toLocaleString()} tokens</strong></span>
                                <span>Custo Estimado da IA: <strong className="text-slate-450">USD ${(evaluations.estimated_cost || simulation.estimated_cost || 0).toFixed(4)}</strong></span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={handleRestartSim}
                                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                                >
                                  Treinar Novamente
                                </button>
                                <button
                                  onClick={() => {
                                    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                                      JSON.stringify(simulation, null, 2)
                                    )}`;
                                    const downloadAnchor = document.createElement('a');
                                    downloadAnchor.setAttribute('href', jsonString);
                                    downloadAnchor.setAttribute('download', `feedback_entrevista_${simulation.id}.json`);
                                    document.body.appendChild(downloadAnchor);
                                    downloadAnchor.click();
                                    downloadAnchor.remove();
                                  }}
                                  className="flex-1 py-2.5 bg-brand-650 hover:bg-brand-600 rounded-xl text-white font-bold text-xs transition-all cursor-pointer"
                                >
                                  Exportar Feedback
                                </button>
                              </div>
                            </div>
                          );
                        }

                        const avgScore = Math.round(
                          ((evaluations.clarity || 0) + 
                           (evaluations.objectivity || 0) + 
                           (evaluations.adherence || 0)) / 3
                        );
                        const hasStarPattern = simulation.chatHistory.some((msg: any) => 
                          msg.role === 'candidate' && 
                          /resultado|ação|acao|situação|situacao|meta|objetivo|consegui|resolvi/i.test(msg.text)
                        );

                        return (
                          <div className="p-4 rounded-xl bg-surface-container/30 border border-outline-variant/10 space-y-4 animate-fade-in text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                                <Star size={16} className="text-amber-400 fill-amber-400" />
                                <span>Avaliação Final da IA (Offline Fallback)</span>
                              </div>
                              <Badge variant={avgScore >= 80 ? 'success' : avgScore >= 50 ? 'warning' : 'error'}>
                                Score: {avgScore}/100
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/10">
                              <div className="flex flex-col items-center sm:border-r border-outline-variant/10 shrink-0 py-1">
                                <ProgressRing value={avgScore} size={40} strokeWidth={4} />
                                <span className="text-[10px] font-bold text-on-surface mt-1 block">Aderência Geral</span>
                              </div>

                              <div className="sm:col-span-3 grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded bg-surface-container-highest/20 border border-outline-variant/10">
                                  <span className="text-[9px] text-on-surface-variant font-medium block">Clareza</span>
                                  <strong className="text-xs text-on-surface">{evaluations.clarity}%</strong>
                                </div>
                                <div className="p-2 rounded bg-surface-container-highest/20 border border-outline-variant/10">
                                  <span className="text-[9px] text-on-surface-variant font-medium block">Objetividade</span>
                                  <strong className="text-xs text-on-surface">{evaluations.objectivity}%</strong>
                                </div>
                                <div className="p-2 rounded bg-surface-container-highest/20 border border-outline-variant/10">
                                  <span className="text-[9px] text-on-surface-variant font-medium block">Aderência STAR</span>
                                  <strong className="text-xs text-on-surface">{evaluations.adherence}%</strong>
                                </div>
                              </div>
                            </div>

                            {/* Método STAR Breakdown Card */}
                            <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-on-surface text-[10px] uppercase tracking-wider block">Diagnóstico de Resposta STAR</span>
                                <Badge variant={hasStarPattern ? 'success' : 'warning'} size="sm">
                                  {hasStarPattern ? 'Estrutura STAR Identificada' : 'Estrutura STAR Pendente'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[9px]">
                                <div className="p-2 rounded bg-surface-container-high border border-outline-variant/10">
                                  <strong className="text-primary block font-bold mb-0.5">Situação / Tarefa:</strong>
                                  <span className="text-on-surface-variant">Contexto do desafio e seus objetivos explicados.</span>
                                </div>
                                <div className="p-2 rounded bg-surface-container-high border border-outline-variant/10">
                                  <strong className="text-emerald-400 block font-bold mb-0.5">Ações / Resultados:</strong>
                                  <span className="text-on-surface-variant">
                                    {hasStarPattern 
                                      ? 'Você usou termos de ação e indicou resultados tangíveis.'
                                      : 'Faltam termos que conectem suas ações diretas a resultados/métricas.'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {evaluations.strengths && evaluations.strengths.length > 0 && (
                                <div className="space-y-1">
                                  <strong className="text-emerald-400 font-semibold block">✓ Pontos Fortes:</strong>
                                  <ul className="list-disc pl-4 space-y-0.5 text-on-surface-variant">
                                    {evaluations.strengths.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                                  </ul>
                                </div>
                              )}
                              {evaluations.improvements && evaluations.improvements.length > 0 && (
                                <div className="space-y-1">
                                  <strong className="text-amber-400 font-semibold block">⚠️ Oportunidades de Melhoria:</strong>
                                  <ul className="list-disc pl-4 space-y-0.5 text-on-surface-variant">
                                    {evaluations.improvements.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Reply Input Form */}
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
                    <div className="flex-grow flex flex-col justify-center items-center text-center py-4 px-2 space-y-4 font-sans">
                      <div className="w-12 h-12 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                        <MessageSquare size={24} />
                      </div>
                      <div className="max-w-md space-y-1.5">
                        <h4 className="font-display font-bold text-base text-slate-200">
                          Treine suas Entrevistas com o Mentor IA
                        </h4>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          Nossa inteligência simula uma rodada completa de perguntas baseadas na vaga que você escolher. 
                          Suas respostas serão avaliadas segundo o método **STAR** (Situação, Tarefa, Ação e Resultado).
                        </p>
                      </div>
                      <div className="w-full max-w-sm p-3.5 rounded-[14px] bg-slate-950/40 border border-slate-900 text-left space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Escolha a vaga para simular:</label>
                        <select
                          value={selectedAppId}
                          onChange={e => setSelectedAppId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl p-2 outline-none focus:border-brand-accent font-semibold"
                        >
                          {activeApps.map(app => (
                            <option key={app.id} value={app.id} className="truncate">{app.jobTitle} em {app.companyName}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleStartSim}
                        disabled={loadingSim}
                        className="px-8 py-3 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md w-full max-w-sm transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {loadingSim ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        Iniciar Simulação
                      </button>
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
                  <UserCheck size={18} className="text-brand-accent" />
                  Mentor IA Vocentro (Conselheiro)
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-sans">
                  Converse com o Mentor IA para extrair direcionamentos de carreira com base no seu histórico exclusivo.
                </p>
              </div>

              {/* Chat Recruiter log */}
              <div className="flex-1 flex flex-col gap-4 font-sans">
                <div className="flex-grow max-h-[300px] overflow-y-auto space-y-3 p-3 rounded-[14px] bg-slate-900/30 border border-slate-900/60 text-xs flex flex-col">
                  {recruiterChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-[14px] max-w-[85%] leading-relaxed ${
                        msg.role === 'recruiter'
                          ? 'bg-slate-900 border border-slate-850 text-slate-300 self-start mr-auto'
                          : 'bg-brand-500/10 border border-brand-500/20 text-brand-400 self-end ml-auto'
                      }`}
                    >
                      <strong className="block mb-0.5 text-[9px] uppercase font-bold text-slate-500 font-mono">
                        {msg.role === 'recruiter' ? 'Mentor IA Vocentro' : 'Você'}
                      </strong>
                      <span className="whitespace-pre-line">{msg.text}</span>
                    </div>
                  ))}
                </div>

                {/* Suggestions Quick keys */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <button 
                    onClick={() => handleSendRecruiterMessage(undefined, `Quero vaga de ${profileRole} remoto pagando +15k`)}
                    type="button"
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl cursor-pointer font-sans"
                  >
                    🔍 Vagas de {profileRole} remoto &gt; 15k?
                  </button>
                  <button 
                    onClick={() => {
                      setRecruiterInput(`Diagnóstico de mercado e tendências para ${profileRole}`);
                    }}
                    type="button"
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl cursor-pointer font-sans"
                  >
                    📊 Diagnóstico de {profileRole}
                  </button>
                </div>

                <form onSubmit={handleSendRecruiterMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua dúvida de carreira (Ex: CS remoto, gaps técnicos...)"
                    value={recruiterInput}
                    onChange={e => setRecruiterInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-[14px] bg-slate-900/50 border border-slate-800 focus:border-brand-accent outline-none text-xs text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={!recruiterInput.trim()}
                    className="px-4.5 rounded-[14px] bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center cursor-pointer"
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
          {activeSubTab === 'simulator' && activeApps.length > 0 && (
            <CardGlass className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-slate-200 pb-2 border-b border-slate-900 flex items-center gap-1.5">
                <Star size={16} className="text-brand-500 fill-brand-500" />
                Histórico de Simulações
              </h3>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 select-none">
                {activeApps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      app.id === selectedAppId
                        ? 'bg-brand-500/10 border-brand-500/30 text-slate-200 font-semibold font-sans'
                        : 'bg-slate-900/20 border-slate-900 hover:border-slate-800 text-slate-450'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold block truncate">{app.jobTitle}</span>
                      <span className="text-[9px] text-slate-500 truncate block mt-0.5">{app.companyName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardGlass>
          )}

          <CardGlass className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-200 pb-2 border-b border-slate-900 flex items-center gap-1.5">
              <Award size={18} className="text-emerald-500" />
              Diagnóstico Consolidado
            </h3>
            {!careerProfileNew ? (
              <p className="text-xs text-slate-400 italic">
                Nenhum currículo ativo cadastrado. Faça o upload na aba "Perfil & Currículo" para gerar o diagnóstico de IA.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Forças</span>
                  <p className="text-slate-300">
                    {careerProfileNew?.ats_keywords?.existing_keywords && careerProfileNew.ats_keywords.existing_keywords.length > 0
                      ? careerProfileNew.ats_keywords.existing_keywords.slice(0, 5).join(', ')
                      : careerProfileNew?.skills && careerProfileNew.skills.length > 0
                        ? careerProfileNew.skills.slice(0, 5).map(s => s.name).join(', ')
                        : 'Nenhuma força mapeada no currículo.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Gaps Recomendados</span>
                  <p className="text-slate-300">
                    {careerProfileNew?.ats_keywords?.missing_keywords && careerProfileNew.ats_keywords.missing_keywords.length > 0
                      ? `Recomenda-se focar em: ${careerProfileNew.ats_keywords.missing_keywords.slice(0, 4).join(', ')}.`
                      : 'Nenhum gap crítico identificado no momento. Continue atualizando seu perfil.'}
                  </p>
                </div>
              </div>
            )}
          </CardGlass>

          <CardGlass className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-200 pb-2 border-b border-slate-900 flex items-center gap-1.5">
              <BarChart3 size={18} className="text-brand-500" />
              Monitor de Demanda Real
            </h3>
            <p className="text-[10px] text-slate-500">Habilidades mais exigidas nas vagas monitoradas.</p>
            {marketTrends.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhuma vaga monitorada no momento. Busque e salve vagas na aba "Vagas & Match" para gerar estatísticas de demanda real.
              </p>
            ) : (
              <div className="space-y-3">
                {marketTrends.slice(0, 4).map((trend, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">{trend.keyword}</span>
                      <span className="text-slate-500 text-[10px]">{trend.percentage}% das vagas</span>
                    </div>
                    <div className="w-full h-1.5 rounded bg-slate-950 overflow-hidden">
                      <div className="h-full bg-brand-accent" style={{ width: `${trend.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardGlass>
        </div>
      </div>
    </div>
  );
}
