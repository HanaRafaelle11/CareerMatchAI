import { 
  CheckCircle, AlertTriangle, HelpCircle, ArrowUpRight, 
  Sparkles, FileText, Play, Plus, Trash2, Loader2, 
  ShieldCheck, Flame, Zap, Target
} from 'lucide-react';
import { CardGlass } from './CardGlass';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Job, Resume, Match, JobMatchExplanation } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

export interface HumanizedMatchCardProps {
  score: number;
  job: Job;
  resume?: Resume | null;
  careerProfileNew?: CareerProfileNew | null;
  explanation?: JobMatchExplanation | null;
  match?: Match | null;
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
  match,
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
  // ── 1. CLASSIFICAÇÃO SEMÂNTICA DA FAIXA DE FIT ──
  const getSemanticFit = (s: number) => {
    if (s >= 80) {
      return {
        label: 'Alta aderência',
        badgeClass: 'dark:bg-emerald-500/10 bg-emerald-100/80 dark:text-emerald-400 text-emerald-800 dark:border-emerald-500/25 border-emerald-300',
        icon: <Flame size={13} className="dark:fill-emerald-400 fill-emerald-600 text-emerald-600 shrink-0" />,
        headline: `Esta oportunidade combina fortemente com seu perfil para ${job.title}.`,
        colorText: 'dark:text-emerald-400 text-emerald-700',
        scoreColor: 'dark:text-emerald-400 text-emerald-600'
      };
    }
    if (s >= 65) {
      return {
        label: 'Boa aderência',
        badgeClass: 'dark:bg-indigo-500/10 bg-indigo-100/80 dark:text-indigo-300 text-indigo-800 dark:border-indigo-500/25 border-indigo-300',
        icon: <Zap size={13} className="dark:text-indigo-400 text-indigo-600 shrink-0" />,
        headline: `Você atende aos pilares centrais da vaga de ${job.title}.`,
        colorText: 'dark:text-indigo-300 text-indigo-700',
        scoreColor: 'dark:text-indigo-400 text-indigo-600'
      };
    }
    if (s >= 45) {
      return {
        label: 'Aderência moderada',
        badgeClass: 'dark:bg-amber-500/10 bg-amber-100/80 dark:text-amber-300 text-amber-800 dark:border-amber-500/25 border-amber-300',
        icon: <Target size={13} className="dark:text-amber-400 text-amber-600 shrink-0" />,
        headline: `Seu perfil possui pontos em comum com ${job.title}, mas requer desenvolvimento em competências-chave.`,
        colorText: 'dark:text-amber-300 text-amber-700',
        scoreColor: 'dark:text-amber-400 text-amber-600'
      };
    }
    return {
      label: 'Em desenvolvimento',
      badgeClass: 'dark:bg-slate-500/10 bg-slate-100 dark:text-slate-300 text-slate-700 dark:border-slate-700/40 border-slate-300',
      icon: <AlertTriangle size={13} className="dark:text-slate-400 text-slate-500 shrink-0" />,
      headline: `Oportunidade em área ou escopo diferente do seu histórico atual de ${job.title}.`,
      colorText: 'dark:text-slate-300 text-slate-700',
      scoreColor: 'dark:text-slate-300 text-slate-600'
    };
  };

  const semanticFit = getSemanticFit(score);

  // ── 2. SEGREGAR PONTOS FORTES, GAPS REAIS E DADOS NÃO INFORMADOS ──
  const userCertifications = (careerProfileNew?.personal as any)?.certifications || (careerProfileNew as any)?.certifications || [];
  const userLanguages = (careerProfileNew?.personal as any)?.languages || (careerProfileNew as any)?.languages || [];
  const hasLanguagesDeclared = Array.isArray(userLanguages) && userLanguages.length > 0;

  // Corpus do usuário
  const userSkillNames = new Set([
    ...(careerProfileNew?.skills || []).map(s => (typeof s === 'string' ? s : (s as any).name || '').toLowerCase()).filter(Boolean),
    ...(resume?.skills || []).map(s => (typeof s === 'string' ? s : (s as any).name || '').toLowerCase()).filter(Boolean),
    ...(Array.isArray(userCertifications) ? userCertifications.map((c: any) => (typeof c === 'string' ? c : c?.name || '').toLowerCase()).filter(Boolean) : []),
    ...(Array.isArray(userLanguages) ? userLanguages.map((l: any) => (typeof l === 'string' ? l : l?.language || l?.name || '').toLowerCase()).filter(Boolean) : [])
  ]);

  const userExperiences = careerProfileNew?.experience || resume?.experiences || [];
  const rawReqs = (job.requirements || []).map(r => r.trim()).filter(Boolean);

  // Padrões de requisitos que são comumente NÃO INFORMADOS no cadastro em vez de comprovadamente ausentes
  const isLanguageReq = (req: string) => /\b(ingl[êe]s|english|espanhol|spanish|franc[êe]s|idioma|fluente|avan[çc]ado|intermedi[áa]rio)\b/i.test(req);
  const isCertificationReq = (req: string) => /\b(certifica[çc][ãa]o|certified|pmp|cpa|scrum master|psm|aws certified|itil|cfa)\b/i.test(req);
  const isLicenseReq = (req: string) => /\b(cnh|habilita[çc][ãa]o|crea|oab|crf|registro profissional)\b/i.test(req);

  const matchedItems: string[] = [];
  const realGaps: string[] = [];
  const unassessedItems: { req: string; reason: string }[] = [];

  rawReqs.forEach(req => {
    const reqLower = req.toLowerCase();

    // 1. Verifica se há evidência de posse
    const matchesSkill = Array.from(userSkillNames).some(sk => sk.includes(reqLower) || reqLower.includes(sk));
    const matchesExp = userExperiences.some((e: any) => {
      const text = `${e.role || ''} ${e.companyName || ''} ${e.description || ''}`.toLowerCase();
      return text.includes(reqLower);
    });

    if (matchesSkill || matchesExp) {
      matchedItems.push(req);
      return;
    }

    // 2. Se não bateu, verifica se é um dado não informado no perfil
    if (isLanguageReq(req) && !hasLanguagesDeclared) {
      unassessedItems.push({
        req,
        reason: 'Seu nível de idioma não está cadastrado no perfil.'
      });
      return;
    }

    if (isCertificationReq(req) && (!careerProfileNew?.personal || !(careerProfileNew.personal as any)?.certifications)) {
      unassessedItems.push({
        req,
        reason: 'Você ainda não cadastrou sua seção de certificações.'
      });
      return;
    }

    if (isLicenseReq(req)) {
      unassessedItems.push({
        req,
        reason: 'Informação de registro/licença não preenchida.'
      });
      return;
    }

    // 3. Caso contrário, classifica como gap de desenvolvimento de mercado
    realGaps.push(req);
  });

  // Fallbacks qualitativos da IA quando disponíveis
  const aiStrengths = (explanation?.strengths || (match?.explanation as any)?.strengths || []).map((s: any) => 
    typeof s === 'string' ? s : s?.skill ? `${s.skill}: ${s.reason || ''}` : String(s)
  );

  const aiGaps = (explanation?.gaps || (match?.explanation as any)?.weaknesses || []).map((g: any) => 
    typeof g === 'string' ? g : g?.requirement ? `${g.requirement}${g.suggestion ? ` (${g.suggestion})` : ''}` : String(g)
  );

  const finalStrengths: string[] = matchedItems.length > 0 ? matchedItems : (aiStrengths.length > 0 ? aiStrengths.slice(0, 3) : [`Aderência à área de ${job.title}`]);
  const finalGaps: string[] = realGaps.length > 0 ? realGaps : (aiGaps.length > 0 ? aiGaps.slice(0, 3) : []);

  // ── 3. CTA PRINCIPAL CONTEXTUAL DOMINANTE ──
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
    <CardGlass className={`space-y-6 p-6 sm:p-7 dark:border-slate-800/80 border-slate-200/80 shadow-2xl relative overflow-hidden ${className}`}>
      {/* ── CABEÇALHO DO DIAGNÓSTICO HUMANIZADO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b dark:border-slate-800/60 border-slate-200/80">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
              Diagnóstico de Compatibilidade
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${semanticFit.badgeClass}`}>
              {semanticFit.icon}
              {semanticFit.label}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold dark:text-slate-100 text-slate-900 leading-snug">
            {job.title} <span className="dark:text-slate-400 text-slate-500 font-normal">• {job.companyName || 'Empresa Confidencial'}</span>
          </h3>
          <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed font-sans max-w-2xl">
            {semanticFit.headline}
          </p>
        </div>

        {/* Score Principal com Visual Claro */}
        <div className="flex items-center gap-3 shrink-0 dark:bg-slate-900/60 bg-slate-100/90 p-3.5 rounded-2xl border dark:border-slate-800/70 border-slate-200">
          <div className="text-right">
            <span className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider block">Fit com a Vaga</span>
            <span className={`text-3xl sm:text-4xl font-extrabold font-display leading-none ${semanticFit.scoreColor}`}>
              {score}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl dark:bg-brand-500/10 bg-brand-100 border dark:border-brand-500/20 border-brand-200 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* ── BLOCOS ESTRUTURADOS: POR QUE COMBINA / O QUE ESTÁ FALTANDO / NÃO INFORMADO ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bloco 1: Por que combina */}
        <div className="p-4 rounded-2xl dark:bg-emerald-950/20 bg-emerald-50/80 border dark:border-emerald-500/20 border-emerald-200/80 space-y-3">
          <div className="flex items-center gap-2 dark:text-emerald-400 text-emerald-700">
            <CheckCircle size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Por que combina com você</h4>
          </div>
          <ul className="space-y-2">
            {finalStrengths.slice(0, 3).map((item: string, idx: number) => (
              <li key={idx} className="text-xs dark:text-slate-200 text-slate-800 flex items-start gap-2 leading-relaxed">
                <span className="dark:text-emerald-400 text-emerald-600 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bloco 2: O que está faltando (Gaps Reais de Mercado) */}
        <div className="p-4 rounded-2xl dark:bg-amber-950/20 bg-amber-50/80 border dark:border-amber-500/20 border-amber-200/80 space-y-3">
          <div className="flex items-center gap-2 dark:text-amber-300 text-amber-800">
            <Target size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Pontos a desenvolver para esta vaga</h4>
          </div>
          {finalGaps.length > 0 ? (
            <ul className="space-y-2">
              {finalGaps.slice(0, 3).map((gap: string, idx: number) => (
                <li key={idx} className="text-xs dark:text-slate-200 text-slate-800 flex items-start gap-2 leading-relaxed">
                  <span className="dark:text-amber-400 text-amber-600 mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed">
              Nenhum gap técnico crítico identificado! Seu perfil cobre os requisitos principais da posição.
            </p>
          )}
        </div>
      </div>

      {/* ── BLOCO 3: NÃO CONSEGUIMOS AVALIAR (DADOS NÃO INFORMADOS NO PERFIL) ── */}
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
          <p className="text-[11px] dark:text-slate-400 text-slate-500 leading-relaxed">
            A vaga solicita os itens abaixo, mas não encontramos essas informações no seu currículo ou cadastro. Eles <strong>não foram contabilizados como falta de competência</strong>:
          </p>
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

      {/* ── RECOMENDAÇÃO DE ENVIO E ESTRATÉGIA ── */}
      {explanation?.recommendation && (
        <div className="p-3.5 rounded-xl dark:bg-brand-500/5 bg-brand-50/60 border dark:border-brand-500/15 border-brand-200 flex items-start gap-2.5 text-xs dark:text-slate-300 text-slate-700">
          <Sparkles size={16} className="dark:text-brand-400 text-brand-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="dark:text-slate-100 text-slate-900 font-semibold">Recomendação do Copiloto: </strong>
            {explanation.recommendation}
          </div>
        </div>
      )}

      {/* ── AÇÕES CONTEXTUAIS COM HIERARQUIA VISUAL ── */}
      <div className="pt-2 border-t dark:border-slate-800/80 border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* CTA DOMINANTE */}
          {renderDominantCta()}

          {/* CTA SECUNDÁRIO: Simular Entrevista */}
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

          {/* CTA SECUNDÁRIO: Estratégia Kanban */}
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
              <span>{isAddedToStrategy ? 'Na Estratégia' : 'Acompanhar Vaga'}</span>
            </button>
          )}
        </div>

        {/* Ações de exclusão / gestão */}
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
