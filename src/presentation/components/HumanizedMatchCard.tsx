import { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, HelpCircle, ArrowUpRight, 
  Sparkles, FileText, Play, Plus, Trash2, Loader2, 
  ShieldCheck, Flame, Zap, Target, ChevronDown, ChevronUp,
  MapPin, Briefcase, Award, Compass
} from 'lucide-react';
import { CardGlass } from './CardGlass';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Job, Resume, Match, JobMatchExplanation, CareerGoal } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { CareerMatchEngineV3 } from '../../domain/services/CareerMatchEngineV3';

export interface HumanizedMatchCardProps {
  score: number;
  job: Job;
  resume?: Resume | null;
  careerProfileNew?: CareerProfileNew | null;
  explanation?: JobMatchExplanation | null;
  match?: Match | null;
  careerGoal?: CareerGoal | null;
  isAnalyzing?: boolean;
  onAnalyzeMatch?: () => void;
  onApply?: () => void;
  onOptimizeResume?: () => void;
  onGoToProfile?: () => void;
  onGoToSkills?: () => void;
  onGoToExperiences?: () => void;
  onStartSimulation?: () => void;
  onAddToStrategy?: () => void;
  isAddedToStrategy?: boolean;
  isAddingToStrategy?: boolean;
  onDeleteAnalysis?: () => void;
  onDeleteJob?: () => void;
  className?: string;
}

export function HumanizedMatchCard({
  score,
  job,
  resume,
  careerProfileNew,
  explanation,
  match: _match,
  careerGoal,
  onApply,
  onOptimizeResume,
  onGoToProfile,
  onGoToSkills,
  onStartSimulation,
  onAddToStrategy,
  isAddedToStrategy = false,
  isAddingToStrategy = false,
  onDeleteAnalysis,
  className = ''
}: HumanizedMatchCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // ── CÁLCULO DETERMINÍSTICO V3 ──
  const v3Result = CareerMatchEngineV3.calculate(job, resume, careerProfileNew, careerGoal);

  const isTransition = careerGoal?.intentType === 'career_transition';
  const fitScore = v3Result.careerFitScore;
  const goalScore = v3Result.careerGoalScore;
  const hasGoal = goalScore !== null;
  const transitionInfo = v3Result.transition;

  // ── 1. CLASSIFICAÇÃO SEMÂNTICA DA FAIXA DE FIT ──
  const getSemanticFit = (s: number) => {
    if (s >= 80) {
      return {
        label: 'Excelente compatibilidade',
        badgeClass: 'dark:bg-emerald-500/10 bg-emerald-100/80 dark:text-emerald-400 text-emerald-800 dark:border-emerald-500/25 border-emerald-300',
        icon: <Flame size={13} className="dark:fill-emerald-400 fill-emerald-600 text-emerald-600 shrink-0" />,
        headline: v3Result.explanation.fitHeadline,
        colorText: 'dark:text-emerald-400 text-emerald-700',
        scoreColor: 'dark:text-emerald-400 text-emerald-600'
      };
    }
    if (s >= 65) {
      return {
        label: 'Boa oportunidade',
        badgeClass: 'dark:bg-indigo-500/10 bg-indigo-100/80 dark:text-indigo-300 text-indigo-800 dark:border-indigo-500/25 border-indigo-300',
        icon: <Zap size={13} className="dark:text-indigo-400 text-indigo-600 shrink-0" />,
        headline: v3Result.explanation.fitHeadline,
        colorText: 'dark:text-indigo-300 text-indigo-700',
        scoreColor: 'dark:text-indigo-400 text-indigo-600'
      };
    }
    if (s >= 45) {
      return {
        label: 'Aderência moderada',
        badgeClass: 'dark:bg-amber-500/10 bg-amber-100/80 dark:text-amber-300 text-amber-800 dark:border-amber-500/25 border-amber-300',
        icon: <Target size={13} className="dark:text-amber-400 text-amber-600 shrink-0" />,
        headline: v3Result.explanation.fitHeadline,
        colorText: 'dark:text-amber-300 text-amber-700',
        scoreColor: 'dark:text-amber-400 text-amber-600'
      };
    }
    return {
      label: 'Em desenvolvimento',
      badgeClass: 'dark:bg-slate-500/10 bg-slate-100 dark:text-slate-300 text-slate-700 dark:border-slate-700/40 border-slate-300',
      icon: <AlertTriangle size={13} className="dark:text-slate-400 text-slate-500 shrink-0" />,
      headline: v3Result.explanation.fitHeadline,
      colorText: 'dark:text-slate-300 text-slate-700',
      scoreColor: 'dark:text-slate-300 text-slate-600'
    };
  };

  const semanticFit = getSemanticFit(fitScore);

  // ── 2. SEGREGAR PONTOS FORTES, GAPS REAIS E DADOS NÃO INFORMADOS ──
  const userCertifications = (careerProfileNew?.personal as any)?.certifications || (careerProfileNew as any)?.certifications || [];
  const userLanguages = (careerProfileNew?.personal as any)?.languages || (careerProfileNew as any)?.languages || [];
  const hasLanguagesDeclared = Array.isArray(userLanguages) && userLanguages.length > 0;
  const hasCertificationsDeclared = Array.isArray(userCertifications) && userCertifications.length > 0;

  const matchedItems = v3Result.skillsAssessment.matched;
  const transferableItems = v3Result.skillsAssessment.transferable;
  const realGaps = v3Result.skillsAssessment.missing;
  const unassessedItems: { req: string; reason: string }[] = [];

  const rawReqs = (job.requirements || []).map(r => r.trim()).filter(Boolean);
  const isLanguageReq = (req: string) => /\b(ingl[êe]s|english|espanhol|spanish|franc[êe]s|idioma|fluente|avan[çc]ado|intermedi[áa]rio)\b/i.test(req);
  const isCertificationReq = (req: string) => /\b(certifica[çc][ãa]o|certified|pmp|cpa|scrum master|psm|aws certified|itil|cfa)\b/i.test(req);
  const isLicenseReq = (req: string) => /\b(cnh|habilita[çc][ãa]o|crea|oab|crf|registro profissional)\b/i.test(req);

  rawReqs.forEach(req => {
    if (isLanguageReq(req) && !hasLanguagesDeclared) {
      unassessedItems.push({ req, reason: 'Seu nível de idioma não está cadastrado no perfil.' });
    } else if (isCertificationReq(req) && !hasCertificationsDeclared) {
      unassessedItems.push({ req, reason: 'Você ainda não cadastrou sua seção de certificações.' });
    } else if (isLicenseReq(req)) {
      unassessedItems.push({ req, reason: 'Informação de registro/licença não preenchida.' });
    }
  });

  const finalStrengths: string[] = matchedItems.length > 0 ? matchedItems : [`Aderência à área de ${job.title}`];
  const finalGaps: string[] = realGaps.length > 0 ? realGaps : [];

  // ── 3. FATORES DAS 5 DIMENSÕES ──
  const skillsFactor = v3Result.dimensions.skills;
  const experienceFactor = v3Result.dimensions.experience;
  const seniorityFactor = v3Result.dimensions.seniority;
  const contextFactor = v3Result.dimensions.context;
  const goalFactor = v3Result.dimensions.careerGoal;

  // ── 4. CTA PRINCIPAL CONTEXTUAL DOMINANTE ──
  const renderDominantCta = () => {
    if (score >= 80 && job.sourceUrl) {
      return (
        <button
          type="button"
          onClick={() => {
            tracker.track('match_apply_clicked', 'JobMatch', { job_id: job.id, score });
            onApply?.();
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
        >
          <span>Candidatar-se Agora</span>
          <ArrowUpRight size={15} />
        </button>
      );
    }

    if (score >= 60) {
      return (
        <button
          type="button"
          onClick={() => {
            tracker.track('match_gap_action_clicked', 'JobMatch', { action: 'optimize_resume', job_id: job.id, score });
            onOptimizeResume?.();
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 cursor-pointer"
        >
          <FileText size={15} />
          <span>Ajustar Currículo para Esta Vaga</span>
        </button>
      );
    }

    if (unassessedItems.length > 0) {
      return (
        <button
          type="button"
          onClick={() => {
            tracker.track('match_gap_action_clicked', 'JobMatch', { action: 'complete_profile', job_id: job.id, score });
            onGoToProfile?.();
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Sparkles size={15} />
          <span>Completar Dados no Perfil</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          tracker.track('match_gap_action_clicked', 'JobMatch', { action: 'improve_skills', job_id: job.id, score });
          onGoToSkills?.();
        }}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 cursor-pointer"
      >
        <Plus size={15} />
        <span>Adicionar Competências</span>
      </button>
    );
  };

  return (
    <CardGlass className={`space-y-5 p-6 sm:p-7 dark:border-slate-800/80 border-slate-200/80 shadow-2xl relative overflow-hidden ${className}`}>
      
      {/* ── CAMADA 1: CARGO, EMPRESA E DUPLO SCORE (FIT ATUAL + POTENCIAL DE CARREIRA) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b dark:border-slate-800/60 border-slate-200/80">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
              Diagnóstico de Compatibilidade V3
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${semanticFit.badgeClass}`}>
              {semanticFit.icon}
              {semanticFit.label}
            </span>
            {isTransition && (
              <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                transitionInfo.type === 'near'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : transitionInfo.type === 'moderate'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  : transitionInfo.type === 'challenging'
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
              }`}>
                <span>{
                  transitionInfo.type === 'near' ? '🟢' :
                  transitionInfo.type === 'moderate' ? '🟡' :
                  transitionInfo.type === 'challenging' ? '🟠' : '🔴'
                }</span>
                <span>{transitionInfo.label}</span>
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-extrabold dark:text-slate-100 text-slate-900 leading-snug">
            {job.title} <span className="dark:text-slate-400 text-slate-500 font-normal">• {job.companyName || 'Empresa Confidencial'}</span>
          </h3>
        </div>

        {/* Bloco de Duplo Score */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          {/* Score 1: Compatibilidade Atual */}
          <div className="flex-1 sm:flex-initial flex items-center gap-3 dark:bg-slate-900/60 bg-slate-100/90 p-3 rounded-2xl border dark:border-slate-800/70 border-slate-200 min-w-[160px]" title="Quanto essa vaga combina com sua experiência hoje?">
            <div className="text-right flex-1">
              <span className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider block">Compatibilidade Atual</span>
              <span className={`text-2xl sm:text-3xl font-extrabold font-display leading-none ${semanticFit.scoreColor}`}>
                {fitScore}%
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Experiência hoje</span>
            </div>
            <div className="w-8 h-8 rounded-xl dark:bg-brand-500/10 bg-brand-100 border dark:border-brand-500/20 border-brand-200 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <ShieldCheck size={16} />
            </div>
          </div>

          {/* Score 2: Potencial para seu Objetivo */}
          {hasGoal ? (
            <div className="flex-1 sm:flex-initial flex items-center gap-3 dark:bg-purple-950/30 bg-purple-50/80 p-3 rounded-2xl border dark:border-purple-800/50 border-purple-200 min-w-[170px]" title="Quanto essa vaga ajuda você a chegar onde quer?">
              <div className="text-right flex-1">
                <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold uppercase tracking-wider block">
                  {isTransition ? 'Potencial de Transição' : 'Potencial para Objetivo'}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-display leading-none text-purple-600 dark:text-purple-400">
                  {goalScore}%
                </span>
                <span className="text-[9px] text-purple-400/80 block mt-0.5">Alcançar seu alvo</span>
              </div>
              <div className="w-8 h-8 rounded-xl dark:bg-purple-500/20 bg-purple-100 border dark:border-purple-500/30 border-purple-200 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Compass size={16} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center px-3.5 py-2.5 rounded-2xl border border-dashed dark:border-slate-800 border-slate-300 text-[10px] text-slate-500 max-w-[210px]">
              <span className="font-semibold text-slate-300">Você ainda não definiu seu objetivo profissional.</span>
              <span className="leading-tight text-slate-400 mt-0.5">Defina seu objetivo para descobrir quais vagas podem aproximar você da carreira que deseja.</span>
              <button type="button" onClick={onGoToProfile} className="text-brand-400 font-bold hover:underline mt-1.5 inline-flex items-center gap-0.5 cursor-pointer self-start">
                <span>Definir objetivo</span>
                <ArrowUpRight size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CAMADA 2: LOCALIZAÇÃO · MODELO DE TRABALHO · SENIORIDADE · SALÁRIO ── */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-400">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} className="text-slate-400" />
            {job.location}
          </span>
        )}
        {job.workMode && (
          <span className="inline-flex items-center gap-1">
            <Briefcase size={13} className="text-slate-400" />
            {job.workMode === 'remote' ? 'Remoto' : job.workMode === 'hybrid' ? 'Híbrido' : 'Presencial'}
          </span>
        )}
        {job.seniority && (
          <span className="inline-flex items-center gap-1">
            <Award size={13} className="text-slate-400" />
            {job.seniority}
          </span>
        )}
        {job.salary && (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {job.salary}
          </span>
        )}
      </div>

      {/* ── CAMADA 3: RESUMO HUMANIZADO + BOTÃO "POR QUE ESTES SCORES?" ── */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed font-sans">
              {semanticFit.headline}
            </p>
            {hasGoal && (
              <p className="text-[11px] text-purple-600 dark:text-purple-300 font-medium">
                {v3Result.explanation.goalHeadline}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !showBreakdown;
              setShowBreakdown(next);
              tracker.track('match_why_score_toggled', 'HumanizedMatchCard', { score: fitScore, expanded: next });
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold transition cursor-pointer shrink-0 self-start sm:self-center"
          >
            <span>Por que esse match?</span>
            {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* ── PAINEL EXPANSÍVEL: AS 5 DIMENSÕES EXPLICADAS ── */}
        {showBreakdown && (
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Por que esse match? (Diagnóstico das 5 Dimensões)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">1. Competências</span>
                  <span className="text-brand-600 dark:text-brand-400">{skillsFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${skillsFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  {matchedItems.length} requisitos atendidos no histórico
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">2. Experiência</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{experienceFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${experienceFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  Histórico e relevância das funções exercidas
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">3. Senioridade</span>
                  <span className="text-purple-600 dark:text-purple-400">{seniorityFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${seniorityFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  Compatibilidade de nível e autonomia
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">4. Contexto / Domínio</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{contextFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${contextFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  Setor, modelo de negócio e modalidade
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 sm:col-span-2 lg:col-span-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">5. Objetivo de Carreira</span>
                  <span className="text-purple-600 dark:text-purple-400">{hasGoal ? `${goalFactor}%` : 'Pendente'}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${goalFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  {hasGoal ? `Alinhamento com ${careerGoal?.targetArea || 'área desejada'}` : 'Cadastre seu objetivo para calibrar esta dimensão'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BLOCOS ESTRUTURADOS: 3 ESTADOS DE COMPETÊNCIAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Bloco 1: Você já possui */}
        <div className="p-4 rounded-2xl dark:bg-emerald-950/20 bg-emerald-50/80 border dark:border-emerald-500/20 border-emerald-200/80 space-y-2.5">
          <div className="flex items-center gap-2 dark:text-emerald-400 text-emerald-700">
            <CheckCircle size={15} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Você já possui</h4>
          </div>
          <ul className="space-y-1.5">
            {finalStrengths.slice(0, 4).map((item: string, idx: number) => (
              <li key={idx} className="text-xs dark:text-slate-200 text-slate-800 flex items-start gap-2 leading-relaxed">
                <span className="dark:text-emerald-400 text-emerald-600 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bloco 2: Competências transferíveis */}
        <div className="p-4 rounded-2xl dark:bg-purple-950/20 bg-purple-50/80 border dark:border-purple-500/20 border-purple-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Compass size={15} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Transferíveis</h4>
          </div>
          {transferableItems.length > 0 ? (
            <ul className="space-y-1.5">
              {transferableItems.slice(0, 4).map((trans: string, idx: number) => (
                <li key={idx} className="text-xs dark:text-slate-200 text-slate-800 flex items-start gap-2 leading-relaxed">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{trans}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">
              {isTransition ? 'Buscando pontes entre sua experiência e a nova área.' : 'Competências diretas cobrem a maior parte do escopo.'}
            </p>
          )}
        </div>

        {/* Bloco 3: Para desenvolver */}
        <div className="p-4 rounded-2xl dark:bg-amber-950/20 bg-amber-50/80 border dark:border-amber-500/20 border-amber-200/80 space-y-2.5">
          <div className="flex items-center gap-2 dark:text-amber-300 text-amber-800">
            <Target size={15} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Para desenvolver</h4>
          </div>
          {finalGaps.length > 0 ? (
            <ul className="space-y-1.5">
              {finalGaps.slice(0, 4).map((gap: string, idx: number) => (
                <li key={idx} className="text-xs dark:text-slate-200 text-slate-800 flex items-start gap-2 leading-relaxed">
                  <span className="dark:text-amber-400 text-amber-600 mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed">
              Nenhuma lacuna crítica não coberta!
            </p>
          )}
        </div>
      </div>

      {/* ── BLOCO 3: NÃO INFORMADO NO PERFIL ── */}
      {unassessedItems.length > 0 && (
        <div className="p-4 rounded-2xl dark:bg-slate-900/80 bg-slate-50 border dark:border-slate-800 border-slate-200 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 dark:text-slate-300 text-slate-800">
              <HelpCircle size={15} className="dark:text-indigo-400 text-indigo-600 shrink-0" />
              <h4 className="text-xs font-bold">Informações não informadas no seu cadastro</h4>
            </div>
            <button
              type="button"
              onClick={onGoToProfile}
              className="text-[11px] dark:text-indigo-400 text-indigo-600 hover:underline font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>+ Informar no perfil</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {unassessedItems.map((u, i) => (
              <span 
                key={i} 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg dark:bg-slate-950 bg-white border dark:border-slate-800 border-slate-200 text-[10px] dark:text-slate-300 text-slate-700 shadow-xs"
                title={u.reason}
              >
                <span className="w-1.5 h-1.5 rounded-full dark:bg-indigo-400 bg-indigo-600" />
                <strong>{u.req}</strong> — {u.reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── NOSSA RECOMENDAÇÃO PARA VOCÊ ── */}
      {explanation?.recommendation && (
        <div className="p-3.5 rounded-xl dark:bg-brand-500/5 bg-brand-50/60 border dark:border-brand-500/15 border-brand-200 flex items-start gap-2.5 text-xs dark:text-slate-300 text-slate-700">
          <Sparkles size={16} className="dark:text-brand-400 text-brand-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="dark:text-slate-100 text-slate-900 font-semibold">Nossa recomendação para você: </strong>
            {explanation.recommendation}
          </div>
        </div>
      )}

      {/* ── AÇÕES COM MÁXIMO DE 1 PRIMÁRIA + 2 SECUNDÁRIAS ── */}
      <div className="pt-2 border-t dark:border-slate-800/80 border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1 CTA DOMINANTE */}
          {renderDominantCta()}

          {/* SECUNDÁRIO 1: Salvar no Pipeline */}
          {onAddToStrategy && (
            <button
              type="button"
              onClick={onAddToStrategy}
              disabled={isAddingToStrategy || isAddedToStrategy}
              className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isAddedToStrategy
                  ? 'dark:bg-emerald-500/10 bg-emerald-50 dark:border-emerald-500/30 border-emerald-300 dark:text-emerald-400 text-emerald-700 cursor-default'
                  : 'dark:bg-slate-900 bg-slate-100 hover:dark:bg-slate-800 hover:bg-slate-200 dark:border-slate-800 border-slate-300 dark:text-slate-300 text-slate-700 hover:dark:text-white'
              }`}
            >
              {isAddingToStrategy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isAddedToStrategy ? (
                <CheckCircle size={13} />
              ) : (
                <Plus size={13} />
              )}
              <span>{isAddedToStrategy ? 'No pipeline' : 'Salvar no pipeline'}</span>
            </button>
          )}

          {/* SECUNDÁRIO 2: Simular Entrevista */}
          {onStartSimulation && (
            <button
              type="button"
              onClick={onStartSimulation}
              className="px-4 py-3 rounded-xl dark:bg-slate-900 bg-slate-100 hover:dark:bg-slate-800 hover:bg-slate-200 border dark:border-slate-800 border-slate-300 dark:text-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play size={13} className="dark:text-brand-400 text-brand-600" />
              <span>Simular Entrevista</span>
            </button>
          )}
        </div>

        {/* Ação de descarte secundária e discreta */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {onDeleteAnalysis && (
            <button
              type="button"
              onClick={onDeleteAnalysis}
              className="p-2.5 rounded-xl hover:dark:bg-red-950/30 hover:bg-red-50 border border-transparent hover:dark:border-red-900/40 hover:border-red-200 text-slate-400 hover:text-red-500 text-xs transition cursor-pointer"
              title="Excluir apenas esta análise de Match"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </CardGlass>
  );
}
