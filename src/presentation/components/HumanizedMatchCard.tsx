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
  match,
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

  const isTransition = careerGoal?.intentType === 'career_transition';
  const directMatchScore = Math.max(20, Math.round(score * 0.8));
  const transitionPotentialScore = Math.min(95, Math.max(55, Math.round(score * 0.9 + 12)));

  // ── 1. CLASSIFICAÇÃO SEMÂNTICA DA FAIXA DE FIT ──
  const getSemanticFit = (s: number) => {
    if (s >= 80) {
      return {
        label: 'Excelente oportunidade',
        badgeClass: 'dark:bg-emerald-500/10 bg-emerald-100/80 dark:text-emerald-400 text-emerald-800 dark:border-emerald-500/25 border-emerald-300',
        icon: <Flame size={13} className="dark:fill-emerald-400 fill-emerald-600 text-emerald-600 shrink-0" />,
        headline: `Excelente oportunidade para você: seu perfil atende com folga aos requisitos centrais de ${job.title}.`,
        colorText: 'dark:text-emerald-400 text-emerald-700',
        scoreColor: 'dark:text-emerald-400 text-emerald-600'
      };
    }
    if (s >= 65) {
      return {
        label: 'Boa oportunidade',
        badgeClass: 'dark:bg-indigo-500/10 bg-indigo-100/80 dark:text-indigo-300 text-indigo-800 dark:border-indigo-500/25 border-indigo-300',
        icon: <Zap size={13} className="dark:text-indigo-400 text-indigo-600 shrink-0" />,
        headline: `Boa oportunidade para você: atende aos pilares principais da vaga de ${job.title}.`,
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

  // ── 3. ESTIMATIVA DOS 4 FATORES DE FIT ──
  const skillsFactor = Math.min(95, Math.max(30, Math.round(score * 0.95 + (matchedItems.length * 4) - (realGaps.length * 5))));
  const experienceFactor = Math.min(95, Math.max(35, Math.round(score * 0.9 + (userExperiences.length * 3))));
  const seniorityFactor = Math.min(95, Math.max(40, Math.round(score * 0.85 + 10)));
  const locationFactor = Math.min(100, Math.max(50, job.workMode === 'remote' || (job.location || '').toLowerCase().includes('remot') ? 98 : 85));

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
      
      {/* ── CAMADA 1: CARGO, EMPRESA E MATCH (%) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b dark:border-slate-800/60 border-slate-200/80">
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
        </div>

        {/* Score Principal com Suporte a Transição de Carreira */}
        {isTransition ? (
          <div className="flex items-center gap-3 shrink-0 dark:bg-purple-950/40 bg-purple-50/80 p-3.5 rounded-2xl border dark:border-purple-800/60 border-purple-200">
            <div className="text-right">
              <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold uppercase tracking-wider block">Potencial de Transição</span>
              <span className="text-3xl sm:text-4xl font-extrabold font-display leading-none text-purple-600 dark:text-purple-400">
                {transitionPotentialScore}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                Compatibilidade Direta: {directMatchScore}%
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl dark:bg-purple-500/20 bg-purple-100 border dark:border-purple-500/30 border-purple-200 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Compass size={20} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0 dark:bg-slate-900/60 bg-slate-100/90 p-3.5 rounded-2xl border dark:border-slate-800/70 border-slate-200">
            <div className="text-right">
              <span className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider block">Compatibilidade</span>
              <span className={`text-3xl sm:text-4xl font-extrabold font-display leading-none ${semanticFit.scoreColor}`}>
                {score}%
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl dark:bg-brand-500/10 bg-brand-100 border dark:border-brand-500/20 border-brand-200 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
          </div>
        )}
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

      {/* ── CAMADA 3: RESUMO HUMANIZADO + BOTÃO "POR QUE X%?" ── */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed font-sans flex-1">
            {semanticFit.headline}
          </p>
          <button
            type="button"
            onClick={() => {
              const next = !showBreakdown;
              setShowBreakdown(next);
              tracker.track('match_why_score_toggled', 'HumanizedMatchCard', { score, expanded: next });
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold transition cursor-pointer shrink-0 self-start sm:self-center"
          >
            <span>Por que {score}%?</span>
            {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* ── PAINEL EXPANSÍVEL: FATORES DE FIT EXPLICADOS ── */}
        {showBreakdown && (
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Detalhamento dos Fatores de Compatibilidade:
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Competências Requeridas</span>
                  <span className="text-brand-600 dark:text-brand-400">{skillsFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${skillsFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  {matchedItems.length} requisitos atendidos no currículo
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Experiência e Trajetória</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{experienceFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${experienceFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  Histórico profissional compatível com o escopo
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Senioridade e Nível</span>
                  <span className="text-purple-600 dark:text-purple-400">{seniorityFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${seniorityFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  Nível de autonomia aderente à vaga
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Localização e Modalidade</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{locationFactor}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${locationFactor}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  Modelo de atuação compatível
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BLOCOS ESTRUTURADOS: POR QUE COMBINA / PONTOS A DESENVOLVER ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloco 1: Por que combina */}
        <div className="p-4 rounded-2xl dark:bg-emerald-950/20 bg-emerald-50/80 border dark:border-emerald-500/20 border-emerald-200/80 space-y-2.5">
          <div className="flex items-center gap-2 dark:text-emerald-400 text-emerald-700">
            <CheckCircle size={15} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Por que combina com você</h4>
          </div>
          <ul className="space-y-1.5">
            {finalStrengths.slice(0, 3).map((item: string, idx: number) => (
              <li key={idx} className="text-xs dark:text-slate-200 text-slate-800 flex items-start gap-2 leading-relaxed">
                <span className="dark:text-emerald-400 text-emerald-600 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bloco 2: Pontos a desenvolver (Competências para desenvolver) */}
        <div className="p-4 rounded-2xl dark:bg-amber-950/20 bg-amber-50/80 border dark:border-amber-500/20 border-amber-200/80 space-y-2.5">
          <div className="flex items-center gap-2 dark:text-amber-300 text-amber-800">
            <Target size={15} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Competências para desenvolver</h4>
          </div>
          {finalGaps.length > 0 ? (
            <ul className="space-y-1.5">
              {finalGaps.slice(0, 3).map((gap: string, idx: number) => (
                <li key={idx} className="text-xs dark:text-slate-200 text-slate-800 flex items-start gap-2 leading-relaxed">
                  <span className="dark:text-amber-400 text-amber-600 mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed">
              Nenhuma lacuna crítica identificada! Seu perfil cobre os requisitos principais da posição.
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
