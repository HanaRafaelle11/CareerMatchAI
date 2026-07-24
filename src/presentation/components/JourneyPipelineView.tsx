import { useEffect } from 'react';
import { Briefcase, Heart, CheckCircle, Award, Sparkles, Layers, Search, ArrowRight } from 'lucide-react';
import { CardGlass } from './CardGlass';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Application, Job } from '../../domain/models/types';

interface JourneyPipelineViewProps {
  applications?: Application[];
  jobs?: Job[];
  onNavigateToDiscover?: () => void;
  setActiveTab?: (tab: string) => void;
}

export function JourneyPipelineView({ 
  applications = [], 
  jobs = [], 
  onNavigateToDiscover,
  setActiveTab 
}: JourneyPipelineViewProps) {
  useEffect(() => {
    tracker.track('application_pipeline_opened', 'ProductBeta', {
      applications_count: applications.length,
      jobs_count: jobs.length
    });
  }, [applications.length, jobs.length]);

  const handleExploreJobs = () => {
    if (onNavigateToDiscover) {
      onNavigateToDiscover();
    } else if (setActiveTab) {
      setActiveTab('discover');
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'discover' }));
    }
  };

  // Contagem estritamente real sem qualquer valor fictício ou fallback fixo
  const countEncontradas = jobs.length;
  const countInteressantes = applications.filter(a => a.status === '⭐ Tenho interesse' || a.status === '📝 Vou me candidatar').length;
  const countCandidatadas = applications.filter(a => a.status === '📨 Me candidatei' || a.status === '⏳ Aguardando retorno').length;
  const countEntrevistas = applications.filter(a => [
    '👥 Entrevista com recrutador',
    '🎯 Entrevista com gestor',
    '🧩 Case técnico',
    '🤝 Fit cultural'
  ].includes(a.status)).length;
  const countOfertas = applications.filter(a => a.status === '🏆 Oferta recebida' || a.status === '✅ Aceita').length;

  const hasApplications = applications.length > 0;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="text-blue-500" size={24} />
            Minha Jornada de Candidaturas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acompanhamento em tempo real do seu pipeline de conversão e entrevistas.
          </p>
        </div>
      </div>

      {/* Metric Cards Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Vagas Encontradas</span>
            <Briefcase size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{countEncontradas}</p>
        </div>

        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Interessantes</span>
            <Heart size={16} className="text-pink-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{countInteressantes}</p>
        </div>

        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Candidatadas</span>
            <CheckCircle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{countCandidatadas}</p>
        </div>

        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Entrevistas</span>
            <Sparkles size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{countEntrevistas}</p>
        </div>
      </div>

      {/* Visual Pipeline Funnel ou Empty State Elegante */}
      {!hasApplications ? (
        <CardGlass className="p-8 sm:p-12 text-center space-y-5 w-full min-w-0 font-sans block">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/5 mx-auto">
            <Layers size={32} />
          </div>
          
          <div className="space-y-2 w-full max-w-md mx-auto block text-center font-sans">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display w-full block break-normal whitespace-normal text-center">
              Seu pipeline ainda está vazio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium w-full block break-normal whitespace-normal text-center">
              Salve vagas de interesse ou acompanhe suas candidaturas para visualizar sua evolução.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleExploreJobs}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition cursor-pointer hover:scale-[1.01]"
            >
              <Search size={15} />
              <span>Encontrar vagas</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </CardGlass>
      ) : (
        <CardGlass className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span>Funil Visual do Pipeline</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Estágios Ativos ({applications.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-950/20 dark:bg-blue-950/20 light:bg-blue-50/50 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-500 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  🟦 Salvas
                </span>
                <span className="text-base font-extrabold text-blue-500 dark:text-blue-400 font-display">{countInteressantes}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Vagas marcadas com alto interesse para envio.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 dark:bg-amber-950/20 light:bg-amber-50/50 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-500 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  🟨 Aplicadas
                </span>
                <span className="text-base font-extrabold text-amber-500 dark:text-amber-400 font-display">{countCandidatadas}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Candidaturas submetidas aguardando retorno.</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 dark:bg-emerald-950/20 light:bg-emerald-50/50 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-500 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  🟩 Entrevistas
                </span>
                <span className="text-base font-extrabold text-emerald-500 dark:text-emerald-400 font-display">{countEntrevistas}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Entrevistas agendadas com RH/Gestor.</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/20 dark:bg-purple-950/20 light:bg-purple-50/50 border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-500 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Award size={14} className="text-purple-500 dark:text-purple-400" />
                  🏆 Ofertas
                </span>
                <span className="text-base font-extrabold text-purple-500 dark:text-purple-400 font-display">{countOfertas}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Propostas de contratação recebidas.</p>
            </div>
          </div>
        </CardGlass>
      )}
    </div>
  );
}
