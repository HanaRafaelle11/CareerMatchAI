import { useState, useEffect } from 'react';
import { Sparkles, Trophy, CheckCircle, AlertTriangle, ArrowRight, Target, HelpCircle, ChevronDown, ChevronUp, Layers, Award, Briefcase, PlusCircle } from 'lucide-react';
import { CardGlass } from './CardGlass';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Resume } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

interface CareerScoreDashboardCardProps {
  resume?: Resume | null;
  careerProfileNew?: CareerProfileNew | null;
  isLoading?: boolean;
  onExploreJobs?: () => void;
  onGoToProfile?: () => void;
  onGoToSkills?: () => void;
  onGoToExperiences?: () => void;
  onGoToPreferences?: () => void;
}

export function CareerScoreDashboardCard({
  resume,
  careerProfileNew,
  isLoading = false,
  onExploreJobs,
  onGoToProfile,
  onGoToSkills,
  onGoToExperiences,
  onGoToPreferences
}: CareerScoreDashboardCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Determinar se os dados do perfil/currículo ainda estão sendo carregados da query
  const isDataLoading = Boolean(
    isLoading ||
    (resume === undefined && careerProfileNew === undefined)
  );

  const resumeSkills = (resume?.skills || []).map(s => typeof s === 'string' ? s : (s as any).name || '').filter(Boolean);
  const profileSkills = (careerProfileNew?.skills || []).map(s => typeof s === 'string' ? s : (s as any).name || '').filter(Boolean);
  const userSkills = profileSkills.length > 0 ? profileSkills : resumeSkills;
  const experiencesCount = resume?.experiences?.length || (careerProfileNew?.experience as any[])?.length || 0;
  const targetRoles = (careerProfileNew?.personal as any)?.preferences?.targetRoles || [];
  const userHeadline = (resume as any)?.headline || (careerProfileNew?.personal as any)?.headline || '';
  const primaryRole = targetRoles[0] || (userHeadline ? userHeadline.split('|')[0].trim() : '');

  // ── INVARIANTE MATEMÁTICA OBRIGATÓRIA (100% INALTERADA) ──
  const baseScore: number | null = isDataLoading
    ? null
    : (!resume && !careerProfileNew)
    ? 0
    : Math.min(95, Math.max(40, 50 + (userSkills.length * 3) + (experiencesCount * 5)));

  // Componentes explicativos da fórmula matemática real
  const skillsPoints = userSkills.length * 3;
  const experiencePoints = experiencesCount * 5;

  useEffect(() => {
    if (baseScore !== null && baseScore > 0) {
      tracker.track('career_score_viewed', 'ProductLaunch', { score: baseScore });
      tracker.track('career_dashboard_opened', 'ProductLaunch', { has_resume: !!resume });
    }
  }, [baseScore, resume]);

  const handleToggleExplanation = () => {
    const nextState = !showExplanation;
    setShowExplanation(nextState);
    tracker.track('career_score_info_toggled', 'Dashboard', { expanded: nextState });
  };

  const handleGapClick = (actionType: 'skills' | 'experiences' | 'preferences' | 'profile') => {
    tracker.track('career_score_gap_clicked', 'Dashboard', { action: actionType });
    if (actionType === 'skills') {
      (onGoToSkills || onGoToProfile)?.();
    } else if (actionType === 'experiences') {
      (onGoToExperiences || onGoToProfile)?.();
    } else if (actionType === 'preferences') {
      (onGoToPreferences || onGoToProfile)?.();
    } else {
      onGoToProfile?.();
    }
  };

  // ── ESTADO 1: SEM DADOS / SEM CURRÍCULO (0/100) ──
  if (!isDataLoading && !resume && !careerProfileNew) {
    return (
      <CardGlass className="bg-gradient-to-br from-slate-900 via-[#15213a] to-slate-950 border border-blue-500/30 p-6 rounded-2xl shadow-xl space-y-6 animate-fade-in text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-5 border-b border-slate-700/60">
          <div className="space-y-1.5 flex-1 w-full min-w-0 flex flex-col items-start font-sans">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                <Sparkles size={16} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Diagnóstico Profissional</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight w-full block break-normal whitespace-normal">
              Seu Career Score de Mercado
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed w-full block break-normal whitespace-normal">
              O Career Score mede a densidade técnica e competitividade do seu currículo perante as exigências do mercado.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Career Score</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-500 font-display">
                0/100
              </span>
              <div className="text-xs text-slate-300 space-y-0.5 text-right mt-1.5 font-medium border-t border-slate-700/60 pt-1">
                <span className="block font-bold text-amber-400">Aguardando dados</span>
                <span className="block text-slate-400">Envie seu currículo</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-800/50 flex items-center justify-center text-slate-500 self-start mt-1 shrink-0">
              <Trophy size={22} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <Target size={20} />
            </div>
            <div>
              <span className="font-bold block text-white text-sm">Nenhum currículo detectado para diagnóstico.</span>
              <span className="text-xs text-slate-300 block mt-0.5">
                Faça o upload do seu currículo em PDF para calcular sua pontuação de mercado, mapear competências e receber vagas compatíveis.
              </span>
            </div>
          </div>
          {(onGoToProfile || onExploreJobs) && (
            <button
              onClick={onGoToProfile || onExploreJobs}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <span>Enviar meu currículo</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass className="bg-gradient-to-br from-slate-900 via-[#15213a] to-slate-950 border border-blue-500/30 p-6 rounded-2xl shadow-xl space-y-6 animate-fade-in text-slate-100">
      
      {/* ── CABEÇALHO DO CAREER SCORE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-5 border-b border-slate-700/60">
        <div className="space-y-1.5 flex-1 w-full min-w-0 flex flex-col items-start font-sans">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Diagnóstico de Mercado</span>
            <button
              onClick={handleToggleExplanation}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors ml-1 cursor-pointer"
              title="Entenda como seu score é calculado"
              aria-label="Como funciona o Career Score"
            >
              <HelpCircle size={14} />
              <span>Como funciona?</span>
              {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight w-full block break-normal whitespace-normal">
            Seu Career Score de Mercado
          </h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed w-full block break-normal whitespace-normal">
            Avaliação da densidade e competitividade do seu currículo frente às exigências do mercado.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-blue-200 block tracking-wider">Career Score</span>
            {isDataLoading || baseScore === null ? (
              <div className="h-9 w-28 bg-blue-500/20 animate-pulse rounded-lg my-1 border border-blue-400/20" />
            ) : (
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-300 font-display">
                {baseScore}/100
              </span>
            )}
            <div className="text-[11px] text-slate-300 space-y-0.5 text-right mt-1.5 font-medium border-t border-slate-700/60 pt-1">
              <span className="block font-bold text-blue-300">Composição real:</span>
              <span className="block text-slate-300">✓ Base inicial: 50 pts</span>
              <span className="block text-emerald-400">✓ {userSkills.length} habilidades (+{skillsPoints} pts)</span>
              <span className="block text-emerald-400">✓ {experiencesCount} experiências (+{experiencePoints} pts)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-blue-400/50 bg-blue-500/20 flex items-center justify-center text-blue-300 self-start mt-1 shrink-0">
            <Trophy size={22} />
          </div>
        </div>
      </div>

      {/* ── PAINEL DIDÁTICO EXPANSÍVEL: O QUE É E COMO FUNCIONA O SCORE ── */}
      {showExplanation && (
        <div className="p-4 rounded-xl bg-slate-800/80 border border-blue-500/40 space-y-3 animate-fade-in text-xs text-slate-200">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
            <Layers size={16} />
            <span>Entendendo as Métricas da Vocentro</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700 space-y-1">
              <span className="font-bold text-blue-300 block">📊 Career Score (40 a 95 pts)</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Mede a <strong>competitividade técnica</strong> do seu currículo no mercado com base no número de habilidades cadastradas (+3 pts cada) e experiências detalhadas (+5 pts cada).
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700 space-y-1">
              <span className="font-bold text-emerald-300 block">📋 Preenchimento do Perfil (0 a 100%)</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Mede a <strong>completude cadastral</strong> da sua conta (LinkedIn, localização, dados de contato, resumo). Ter 100% de preenchimento não altera a nota técnica do Career Score.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic pt-1">
            * O Career Score é uma métrica diagnóstica para orientar seu desenvolvimento profissional e não constitui promessa de contratação.
          </p>
        </div>
      )}

      {/* ── 3 COLUNAS ESTRUTURADAS: CARGOS COMPATÍVEIS | PONTOS FORTES | PARA EVOLUIR ── */}
      {isDataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 h-32 space-y-2">
            <div className="h-4 w-36 bg-slate-700/50 rounded" />
            <div className="h-3 w-48 bg-slate-700/30 rounded" />
            <div className="h-3 w-40 bg-slate-700/30 rounded" />
          </div>
          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/20 h-32 space-y-2">
            <div className="h-4 w-36 bg-emerald-500/20 rounded" />
            <div className="h-3 w-48 bg-emerald-500/10 rounded" />
            <div className="h-3 w-40 bg-emerald-500/10 rounded" />
          </div>
          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/20 h-32 space-y-2">
            <div className="h-4 w-36 bg-amber-500/20 rounded" />
            <div className="h-3 w-48 bg-amber-500/10 rounded" />
            <div className="h-3 w-40 bg-amber-500/10 rounded" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUNA 1: CARGOS-ALVO & COMPATIBILIDADE */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/50 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Target size={15} />
                Cargos de Interesse
              </h3>
              {targetRoles.length > 0 ? (
                <ul className="space-y-2 text-xs font-medium text-slate-200">
                  {targetRoles.slice(0, 3).map((role: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      <span className="truncate">{role}</span>
                    </li>
                  ))}
                </ul>
              ) : primaryRole ? (
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">🎯</span>
                    <span className="font-semibold text-white">{primaryRole}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Defina cargos secundários para ampliar o alcance das suas recomendações.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Nenhum cargo-alvo configurado.</p>
                  <p className="text-[11px] text-slate-500">Defina suas áreas de interesse para refinar seus matches de vagas.</p>
                </div>
              )}
            </div>
            
            {(onGoToPreferences || onGoToProfile) && (
              <button
                onClick={() => handleGapClick('preferences')}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors pt-2 border-t border-slate-700/50 cursor-pointer self-start"
              >
                <PlusCircle size={13} />
                <span>{targetRoles.length > 0 ? 'Editar cargos de interesse' : 'Definir cargos de interesse'}</span>
              </button>
            )}
          </div>

          {/* COLUNA 2: SEUS PONTOS FORTES */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle size={15} />
                Seus Diferenciais
              </h3>
              {userSkills.length > 0 ? (
                <ul className="space-y-2 text-xs text-emerald-100">
                  {userSkills.slice(0, 3).map((skill, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span className="truncate">{skill}</span>
                    </li>
                  ))}
                  {experiencesCount > 0 && userSkills.length < 3 && (
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{experiencesCount} {experiencesCount === 1 ? 'experiência estruturada' : 'experiências estruturadas'}</span>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">
                  Cadastre suas principais competências técnicas para identificar seus pontos fortes.
                </p>
              )}
            </div>

            {(onGoToSkills || onGoToProfile) && (
              <button
                onClick={() => handleGapClick('skills')}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors pt-2 border-t border-emerald-800/40 cursor-pointer self-start"
              >
                <Award size={13} />
                <span>Gerenciar competências</span>
              </button>
            )}
          </div>

          {/* COLUNA 3: AÇÕES DE EVOLUÇÃO (GAPS ACIONÁVEIS) */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle size={15} />
                Como Aumentar seu Score
              </h3>
              <div className="space-y-2 text-xs text-amber-100">
                {userSkills.length < 5 ? (
                  <div className="p-2 rounded-lg bg-amber-900/20 border border-amber-600/30 space-y-1">
                    <span className="font-bold text-amber-200 block text-[11px]">Adicionar competências técnicas</span>
                    <span className="text-[10px] text-amber-300/80 block leading-tight">
                      Cada habilidade cadastrada adiciona +3 pontos à densidade do seu score.
                    </span>
                    <button
                      onClick={() => handleGapClick('skills')}
                      className="text-[11px] font-bold text-amber-300 hover:text-white underline inline-block mt-1 cursor-pointer"
                    >
                      Adicionar habilidades →
                    </button>
                  </div>
                ) : null}

                {experiencesCount < 2 ? (
                  <div className="p-2 rounded-lg bg-amber-900/20 border border-amber-600/30 space-y-1">
                    <span className="font-bold text-amber-200 block text-[11px]">Detalhar histórico de experiências</span>
                    <span className="text-[10px] text-amber-300/80 block leading-tight">
                      Cada experiência profissional cadastrada adiciona +5 pontos de bagagem.
                    </span>
                    <button
                      onClick={() => handleGapClick('experiences')}
                      className="text-[11px] font-bold text-amber-300 hover:text-white underline inline-block mt-1 cursor-pointer"
                    >
                      Aprimorar experiências →
                    </button>
                  </div>
                ) : null}

                {userSkills.length >= 5 && experiencesCount >= 2 ? (
                  <div className="p-2 rounded-lg bg-emerald-900/20 border border-emerald-600/30 space-y-1 text-emerald-200">
                    <span className="font-bold text-emerald-300 block text-[11px]">Perfil com excelente densidade!</span>
                    <span className="text-[10px] text-emerald-200/80 block leading-tight">
                      Mantenha suas competências atualizadas para manter seu score de mercado competitivo.
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {onExploreJobs && (
              <button
                onClick={onExploreJobs}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors pt-2 border-t border-amber-800/40 cursor-pointer self-start"
              >
                <Briefcase size={13} />
                <span>Explorar vagas com este score</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* ── BOTÃO DE AÇÃO PRINCIPAL INFERIOR ── */}
      {onExploreJobs && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
          <span className="text-xs text-slate-400">
            Dica: Um score acima de 70 pontos amplia significativamente a precisão do algoritmo de Match IA.
          </span>
          <button
            onClick={onExploreJobs}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer self-end sm:self-auto shrink-0"
          >
            <span>Buscar Vagas Aderentes</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </CardGlass>
  );
}
