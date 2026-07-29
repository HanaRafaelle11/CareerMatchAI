import { useState, useEffect, type FormEvent } from 'react';
import { CardGlass } from '../components/CardGlass';
import { MarketIntelligenceService } from '../../application/services/MarketIntelligenceService';
import type { Application, CareerProfile, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { 
  Award, Play, MessageSquare, Send, 
  RefreshCcw, Star, Loader2, BarChart3, ChevronDown, Search, Sparkles,
  ArrowRight, Bot
} from 'lucide-react';
import { ProgressRing, Badge, Toast, type ToastMessage } from '../components/ds';
import { useCopilotEngine } from '../../application/hooks/useCopilotEngine';
import { printElementHtml } from '../../application/utils/pdfExport';

/** Converts **bold** markdown markers in text to <strong> tags */
function formatBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-on-surface">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

interface CoachDashboardProps {
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  applications: Application[];
  jobs: Job[];
  matches?: any[];
  startSimulation: (appId: string, reset?: boolean) => Promise<any>;
  sendMessage: (args: { sim: any; role: 'interviewer' | 'candidate'; text: string }) => Promise<any>;
  finalizeSimulation: (args: { sim: any }) => Promise<any>;
  getSimulationQuery: (appId: string) => any;
  triggerDailyChecks: () => Promise<any>;
  initialSelectedAppId?: string | null;
  onClearInitialSelectedAppId?: () => void;
  setActiveTab?: (tab: string) => void;
}

export function CoachDashboard({
  careerProfile: _careerProfile,
  careerProfileNew,
  applications,
  jobs,
  matches,
  startSimulation,
  sendMessage,
  finalizeSimulation,
  getSimulationQuery,
  triggerDailyChecks,
  initialSelectedAppId,
  onClearInitialSelectedAppId,
  setActiveTab
}: CoachDashboardProps) {
  const [isCheckingVagas, setIsCheckingVagas] = useState(false);
  
  // Dados do perfil consolidado para personalizar PDF
  const profileName = careerProfileNew?.personal?.fullName?.split(' ')[0] || 'Profissional';

  const handleExportSimulationPDF = () => {
    if (!simulation || !simulation.evaluations) {
      setToast({ message: "Não há diagnóstico de simulação disponível para exportar.", type: 'warning' });
      return;
    }

    const evaluations = simulation.evaluations as any;
    const isNewSchema = evaluations.scoreOverall !== undefined;
    const targetJob = jobs.find(j => j.id === simulation.applicationId) || jobs[0];

    let htmlContent = '';

    if (isNewSchema) {
      const strengthsList = (evaluations.strengths || []).map((s: string) => `<li>${s}</li>`).join('');
      const weaknessesList = (evaluations.weaknesses || []).map((s: string) => `<li>${s}</li>`).join('');

      htmlContent = `
        <h1 style="border-bottom: none; margin-bottom: 4px;">Relatório de Diagnóstico de Entrevista</h1>
        <div style="font-size: 11pt; color: #64748b; margin-bottom: 25px; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
          Candidato: <strong>${profileName}</strong> | Vaga: <strong>${targetJob?.title || 'Simulação'}</strong> | Empresa: <strong>${targetJob?.companyName || 'Vocentro'}</strong>
        </div>

        <div class="score-grid">
          <div class="score-card">
            <div class="score-val">${evaluations.scoreOverall || 0}%</div>
            <div class="score-label">Nota Geral</div>
          </div>
          <div class="score-card">
            <div class="score-val">${evaluations.jobAdherence || 0}%</div>
            <div class="score-label">Aderência à Vaga</div>
          </div>
          <div class="score-card">
            <div class="score-val">${evaluations.approvalProbability || 0}%</div>
            <div class="score-label">Probabilidade de Aprovação</div>
          </div>
        </div>

        <h2>Diagnóstico de Resposta (Método STAR)</h2>
        <p style="font-size: 10.5pt; color: #334155; line-height: 1.6;">${evaluations.starAnalysis || ''}</p>

        <h2>Adequação Técnica</h2>
        <p style="font-size: 10.5pt; color: #334155; line-height: 1.6;">${evaluations.technicalAnalysis || ''}</p>

        <div class="grid-2">
          <div class="grid-col">
            <h2>Comunicação & Expressão</h2>
            <p style="font-size: 10pt; color: #334155; line-height: 1.6;">${evaluations.communicationAnalysis || ''}</p>
            <p style="font-size: 9pt; color: #64748b; font-style: italic; margin-top: 5px;">${evaluations.postureAnalysis || ''}</p>
          </div>
          <div class="grid-col">
            <h2>Clareza & Segurança</h2>
            <p style="font-size: 10pt; color: #334155; line-height: 1.6;">${evaluations.clarityAnalysis || ''}</p>
          </div>
        </div>

        <div class="grid-2">
          <div class="grid-col">
            <h2 style="color: #10b981;">✓ Pontos Fortes</h2>
            <ul>${strengthsList}</ul>
          </div>
          <div class="grid-col">
            <h2 style="color: #f59e0b;">⚠️ Oportunidades de Melhoria</h2>
            <ul>${weaknessesList}</ul>
          </div>
        </div>

        <h2>Plano de Ação e Preparação</h2>
        <ol style="padding-left: 20px; font-size: 10.5pt; color: #334155; line-height: 1.6;">
          ${(evaluations.improvementPlan || []).map((item: string) => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
        </ol>
      `;
    } else {
      const strengthsList = (evaluations.strengths || []).map((s: string) => `<li>${s}</li>`).join('');
      const improvementsList = (evaluations.improvements || []).map((s: string) => `<li>${s}</li>`).join('');

      htmlContent = `
        <h1 style="border-bottom: none; margin-bottom: 4px;">Relatório de Diagnóstico de Entrevista</h1>
        <div style="font-size: 11pt; color: #64748b; margin-bottom: 25px; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
          Candidato: <strong>${profileName}</strong> | Vaga: <strong>${targetJob?.title || 'Simulação'}</strong> | Empresa: <strong>${targetJob?.companyName || 'Vocentro'}</strong>
        </div>

        <div class="score-grid">
          <div class="score-card" style="width: 100%;">
            <div class="score-val">${Math.round(((evaluations.clarity || 0) + (evaluations.objectivity || 0) + (evaluations.adherence || 0)) / 3)}%</div>
            <div class="score-label">Aderência Geral</div>
          </div>
        </div>

        <h2>Avaliação de Competências</h2>
        <p style="font-size: 10.5pt; color: #334155; line-height: 1.6;">${evaluations.feedback || ''}</p>

        <div class="grid-2">
          <div class="grid-col">
            <h2 style="color: #10b981;">✓ Pontos Fortes</h2>
            <ul>${strengthsList}</ul>
          </div>
          <div class="grid-col">
            <h2 style="color: #f59e0b;">⚠️ Oportunidades de Melhoria</h2>
            <ul>${improvementsList}</ul>
          </div>
        </div>

        <h2>Plano de Estudo Recomendado</h2>
        <p style="font-size: 10.5pt; color: #334155; line-height: 1.6; white-space: pre-line;">${evaluations.studyPlan || ''}</p>
      `;
    }

    printElementHtml(`Diagnostico_Entrevista_${profileName}_Vocentro`, htmlContent);
  };
  
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
  // Estatísticas de Mercado
  const matchedJobIds = new Set((matches || []).map((m: any) => m.jobId || m.job_id));
  const activeJobs = jobs.filter(j => matchedJobIds.has(j.id));
  const marketTrends = MarketIntelligenceService.getMarketTrends(activeJobs, careerProfileNew);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const { recommendations, greetingHeadline } = useCopilotEngine({
    applications,
    jobs,
    matches,
    careerProfileNew
  });

  const handleStartSim = async () => {
    if (!selectedAppId) return;
    try {
      await startSimulation(selectedAppId);
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Não foi possível iniciar a simulação. Tente novamente.', type: 'error' });
    }
  };

  const handleRestartSim = async () => {
    if (!selectedAppId) return;
    const confirm = window.confirm("Deseja realmente reiniciar o simulador de entrevista? Todo o progresso e avaliação desta rodada serão apagados.");
    if (!confirm) return;
    try {
      await startSimulation(selectedAppId, true);
      setToast({ message: 'Simulação reiniciada com sucesso.', type: 'info' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Não foi possível reiniciar a simulação.', type: 'error' });
    }
  };

  const handleSendResponse = async (e: FormEvent) => {
    e.preventDefault();
    const textToSend = candidateResponse.trim();
    if (!simulation || !textToSend || isSending) return;

    setCandidateResponse('');
    setIsSending(true);
    try {
      await sendMessage({
        sim: simulation,
        role: 'candidate',
        text: textToSend
      });
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Erro ao enviar resposta. Tente novamente.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerificarVagas = async () => {
    try {
      setIsCheckingVagas(true);
      await triggerDailyChecks();
      setToast({ message: 'Vagas verificadas com sucesso! Redirecionando para descoberta de vagas.', type: 'success' });
      setActiveTab?.('match');
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Erro ao verificar novas vagas.', type: 'error' });
    } finally {
      setIsCheckingVagas(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans p-0 relative">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Sparkles size={28} className="text-brand-400 animate-pulse" />
            <span>Copiloto IA & Central de Inteligência</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seu assistente único inteligente para recomendações do dia, simulação STAR e aceleração de candidaturas.
          </p>
        </div>
        <button
          onClick={handleVerificarVagas}
          disabled={isCheckingVagas}
          className="btn-secondary text-xs"
        >
          <Search size={14} />
          <span>Buscar Novas Vagas</span>
        </button>
      </div>

      {/* Agenda de Inteligência do Dia: Hoje eu faria estas 3 ações... */}
      <div className="bg-gradient-to-br from-brand-950/60 via-slate-900 to-indigo-950/40 border border-brand-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">{greetingHeadline}</h2>
            <p className="text-[11px] text-slate-400">Recomendações proativas baseadas na sua atividade recente.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommendations.map(rec => (
            <div
              key={rec.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/50 transition-all space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-bold text-xs text-slate-100">{rec.title}</h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold ${
                    rec.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{rec.description}</p>
              </div>

              <button
                onClick={() => {
                  if (rec.targetAppId) {
                    setSelectedAppId(rec.targetAppId);
                    handleStartSim();
                  } else if (rec.targetTab && setActiveTab) {
                    setActiveTab(rec.targetTab);
                  }
                }}
                className="mt-2 text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1.5 self-start cursor-pointer"
              >
                <span>{rec.actionLabel}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full min-w-0">
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          <CardGlass className="p-6 space-y-6 flex flex-col min-h-[480px] w-full min-w-0 animate-slide-in">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <MessageSquare size={18} className="text-brand-accent" />
                Simulação de Entrevista Interativa
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-2 font-sans font-medium">
                Selecione uma candidatura em andamento para iniciar a simulação focada no método STAR.
              </p>
            </div>

              {activeApps.length === 0 ? (
                <div className="flex-1 py-16 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-[14px] text-xs text-slate-700 dark:text-slate-400 text-center space-y-2 font-sans font-semibold">
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
                                  {isInterviewer ? '🎤 Recrutadora Mariana — Vocentro' : 'Você'}
                                </strong>
                                <span className="whitespace-pre-line">{formatBoldText(msg.text)}</span>
                              </div>
                              
                              {/* Collapsible turn evaluation — Hidden by default for immersive experience */}
                              {!isInterviewer && msg.evaluation && (
                                <details className="self-end ml-auto mr-2 max-w-[80%] rounded-2xl bg-slate-950/65 border border-slate-900 text-[10px] text-slate-300 animate-fade-in shadow-lg group">
                                  <summary className="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-slate-900/30 rounded-2xl transition-colors select-none">
                                    <div className="flex items-center gap-2">
                                      <span className="text-emerald-400 font-bold">⭐ {msg.evaluation.score}/100</span>
                                      <span className="text-slate-500 text-[8px] uppercase tracking-wider">Dificuldade: {msg.evaluation.difficulty}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500 text-[9px] font-semibold">
                                      <span>Ver análise da IA</span>
                                      <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                                    </div>
                                  </summary>
                                  <div className="p-3.5 pt-0 space-y-2">
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
                                </details>
                              )}
                            </div>
                          );
                        })}

                        {isSending && (
                          <div className="p-3 rounded-2xl max-w-[85%] bg-slate-900 border border-slate-850 text-slate-350 self-start mr-auto animate-pulse flex items-center gap-2 font-sans">
                            <Loader2 size={12} className="animate-spin text-brand-accent" />
                            <span className="text-[10px] text-slate-400">A Recrutadora Mariana está avaliando sua resposta e formulando o feedback...</span>
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

                              {/* Extended Diagnostic Metrics */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {evaluations.gapAnalysis && evaluations.gapAnalysis.length > 0 && (
                                  <div className="p-4.5 bg-red-950/10 border border-red-500/10 rounded-2xl space-y-2">
                                    <strong className="text-red-450 font-bold text-[10px] uppercase tracking-wider block">⚠️ Gap Analysis (Lacunas)</strong>
                                    <ul className="list-disc pl-4 space-y-1 text-slate-350 font-sans text-xs">
                                      {evaluations.gapAnalysis.map((g: string, idx: number) => <li key={idx}>{g}</li>)}
                                    </ul>
                                  </div>
                                )}
                                
                                {evaluations.recommendedQuestions && evaluations.recommendedQuestions.length > 0 && (
                                  <div className="p-4.5 bg-indigo-950/10 border border-indigo-500/10 rounded-2xl space-y-2">
                                    <strong className="text-indigo-400 font-bold text-[10px] uppercase tracking-wider block">💡 Perguntas Recomendadas</strong>
                                    <ul className="list-disc pl-4 space-y-1 text-slate-350 font-sans text-xs">
                                      {evaluations.recommendedQuestions.map((q: string, idx: number) => <li key={idx}>{q}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4.5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between">
                                  <span className="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Senioridade Percebida</span>
                                  <strong className="text-slate-200 text-xs mt-1 uppercase font-mono">{evaluations.seniorityPerceived || 'pleno'}</strong>
                                </div>
                                <div className="p-4.5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between">
                                  <span className="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Mapeamento de Riscos</span>
                                  <p className="text-slate-300 text-[10px] mt-1 font-sans leading-relaxed">{evaluations.riskAnalysis || 'Sem riscos detectados.'}</p>
                                </div>
                                <div className="p-4.5 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col justify-between">
                                  <span className="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Comparação Vaga vs Perfil</span>
                                  <p className="text-slate-300 text-[10px] mt-1 font-sans leading-relaxed">{evaluations.jobFitComparison || 'Aderência compatível.'}</p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={handleRestartSim}
                                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-350 font-bold text-xs transition-all cursor-pointer"
                                >
                                  Treinar Novamente
                                </button>
                                <button
                                  onClick={handleExportSimulationPDF}
                                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-bold text-xs transition-all cursor-pointer"
                                >
                                  Exportar PDF
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

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                              <button
                                type="button"
                                onClick={handleRestartSim}
                                className="flex-1 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-350 font-bold text-xs transition-all cursor-pointer"
                              >
                                Treinar Novamente
                              </button>
                              <button
                                type="button"
                                onClick={handleExportSimulationPDF}
                                className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-bold text-xs transition-all cursor-pointer"
                              >
                                Exportar PDF
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Reply Input Form */}
                      {!simulation.evaluations && (
                        <div className="space-y-2">
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
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={isSending}
                              onClick={async () => {
                                const userMsgs = simulation.chatHistory ? simulation.chatHistory.filter((m: any) => m.role === 'candidate' || m.role === 'user') : [];
                                if (!userMsgs || userMsgs.length === 0) {
                                  setToast({ message: 'Nenhuma resposta foi registrada. Envie ao menos uma resposta no chat antes de encerrar.', type: 'warning' });
                                  return;
                                }
                                const confirm = window.confirm("Deseja realmente encerrar a simulação e gerar seu relatório de avaliação com base nas respostas fornecidas até agora?");
                                if (!confirm) return;
                                setIsSending(true);
                                try {
                                  await finalizeSimulation({ sim: simulation });
                                } catch (err: any) {
                                  setToast({ message: "Erro ao encerrar a simulação: " + (err.message || String(err)), type: 'error' });
                                } finally {
                                  setIsSending(false);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/40 text-[10px] font-bold tracking-wide transition cursor-pointer flex items-center gap-1"
                            >
                              Encerrar Treinamento & Gerar Relatório
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full flex-grow flex flex-col justify-center items-center text-center py-4 px-2 space-y-4 font-sans">
                      <div className="w-12 h-12 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                        <MessageSquare size={24} />
                      </div>
                      <div className="max-w-md space-y-1.5">
                        <h4 className="font-display font-bold text-base text-slate-200">
                          Treine suas Entrevistas com a Recrutadora IA
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
        </div>

        {/* Coluna 3: Gaps and demand */}
        <div className="space-y-6">
          {activeApps.length > 0 && (
            <CardGlass className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
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
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-slate-200 font-semibold font-sans'
                        : 'bg-slate-100 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold block truncate text-slate-900 dark:text-slate-100">{app.jobTitle}</span>
                      <span className="text-[9px] text-slate-600 dark:text-slate-400 truncate block mt-0.5">{app.companyName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardGlass>
          )}

          <CardGlass className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <Award size={18} className="text-emerald-500" />
              Diagnóstico Consolidado
            </h3>
            {!careerProfileNew ? (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                Nenhum currículo ativo cadastrado. Faça o upload na aba "Perfil & Currículo" para gerar o diagnóstico de IA.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-extrabold block">FORÇAS</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {careerProfileNew?.ats_keywords?.existing_keywords && careerProfileNew.ats_keywords.existing_keywords.length > 0
                      ? careerProfileNew.ats_keywords.existing_keywords.slice(0, 5).join(', ')
                      : careerProfileNew?.skills && careerProfileNew.skills.length > 0
                        ? careerProfileNew.skills.slice(0, 5).map(s => s.name).join(', ')
                        : 'Nenhuma força mapeada no currículo.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-extrabold block">GAPS RECOMENDADOS</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {careerProfileNew?.ats_keywords?.missing_keywords && careerProfileNew.ats_keywords.missing_keywords.length > 0
                      ? `Recomenda-se focar em: ${careerProfileNew.ats_keywords.missing_keywords.slice(0, 4).join(', ')}.`
                      : 'Nenhum gap crítico identificado no momento. Continue atualizando seu perfil.'}
                  </p>
                </div>
              </div>
            )}
          </CardGlass>

          <CardGlass className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <BarChart3 size={18} className="text-brand-500" />
              Monitor de Demanda Real
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Habilidades mais exigidas nas vagas monitoradas.</p>
            {marketTrends.length === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                Nenhuma vaga monitorada no momento. Busque e salve vagas na aba "Vagas & Match" para gerar estatísticas de demanda real.
              </p>
            ) : (
              <div className="space-y-3">
                {marketTrends.slice(0, 4).map((trend, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{trend.keyword}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-[10px] font-semibold">{trend.percentage}% das vagas</span>
                    </div>
                    <div className="w-full h-1.5 rounded bg-slate-200 dark:bg-slate-950 overflow-hidden">
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
