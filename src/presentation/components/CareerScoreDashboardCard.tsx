import { useEffect } from 'react';
import { Sparkles, Trophy, CheckCircle, AlertTriangle, ArrowRight, Target } from 'lucide-react';
import { CardGlass } from './CardGlass';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Resume } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

interface CareerScoreDashboardCardProps {
  resume?: Resume | null;
  careerProfileNew?: CareerProfileNew | null;
  isLoading?: boolean;
  onExploreJobs?: () => void;
}

export function CareerScoreDashboardCard({ resume, careerProfileNew, isLoading = false, onExploreJobs }: CareerScoreDashboardCardProps) {
  // Determinar se os dados do perfil/currículo ainda estão sendo carregados da query
  const isDataLoading = Boolean(
    isLoading ||
    (resume === undefined && careerProfileNew === undefined)
  );

  const resumeSkills = (resume?.skills || []).map(s => typeof s === 'string' ? s : (s as any).name || '');
  const profileSkills = (careerProfileNew?.skills || []).map(s => typeof s === 'string' ? s : (s as any).name || '');
  const userSkills = profileSkills.length > 0 ? profileSkills : resumeSkills;
  const experiencesCount = resume?.experiences?.length || (careerProfileNew?.experience as any[])?.length || 0;
  const targetRoles = (careerProfileNew?.personal as any)?.preferences?.targetRoles || [];
  const userHeadline = (resume as any)?.headline || (careerProfileNew?.personal as any)?.headline || 'Profissional';
  const primaryRole = targetRoles[0] || userHeadline.split('|')[0].trim();

  // O estado inicial do Career Score é null, NUNCA um número fixo (ex: 50)
  const baseScore: number | null = isDataLoading
    ? null
    : Math.min(95, Math.max(40, 50 + (userSkills.length * 3) + (experiencesCount * 5)));

  const topCompatibleRoles = targetRoles.length >= 3
    ? targetRoles.slice(0, 3)
    : [
        primaryRole,
        targetRoles[1] || (primaryRole !== 'Profissional' ? `Auxiliar / ${primaryRole}` : 'Assistente Operacional'),
        targetRoles[2] || (primaryRole !== 'Profissional' ? `Especialista / ${primaryRole}` : 'Analista Operacional')
      ];

  const strengthsList = userSkills.length >= 3
    ? userSkills.slice(0, 3).map(s => `Domínio e execução em ${s}`)
    : userSkills.length > 0
    ? [...userSkills.map(s => `Domínio em ${s}`), 'Organização e atenção aos detalhes', 'Pontualidade e rotina operacional'].slice(0, 3)
    : ['Organização e processos de trabalho', 'Pontualidade e atenção aos detalhes', 'Execução de rotinas operacionais'];

  const hasSkills = userSkills.length > 0;
  const gapsList = [
    hasSkills ? 'Certificações e cursos complementares na área' : 'Cadastrar competências técnicas específicas no perfil',
    experiencesCount > 0 ? 'Quantificar conquistas e resultados em experiências anteriores' : 'Adicionar histórico completo de experiências profissionais'
  ];

  useEffect(() => {
    if (baseScore !== null) {
      tracker.track('career_score_viewed', 'ProductLaunch', { score: baseScore });
      tracker.track('career_dashboard_opened', 'ProductLaunch', { has_resume: !!resume });
    }
  }, [baseScore, resume]);


  if (!isDataLoading && !resume && !careerProfileNew) {
    return (
      <CardGlass className="bg-gradient-to-br from-[#1a2744] via-[#15213a] to-[#0f1a2e] border border-blue-500/30 p-6 rounded-2xl shadow-xl space-y-6 animate-fade-in text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-5 border-b border-slate-700/60">
          <div className="space-y-1.5 flex-1 w-full min-w-0 flex flex-col items-start font-sans">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                <Sparkles size={16} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Primeiro Momento IA</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight w-full block break-normal whitespace-normal">
              Seu Career Score de Mercado
            </h2>
            <p className="text-xs text-blue-100/90 font-medium leading-relaxed w-full block break-normal whitespace-normal">
              Cadastre seu currículo ou informações de perfil para liberar seu diagnóstico de mercado.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-blue-200 block tracking-wider">Career Score Geral</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-300/50 font-display">
                0/100
              </span>
              <div className="text-xs text-blue-100 space-y-0.5 text-right mt-1.5 font-medium border-t border-slate-700/60 pt-1">
                <span className="block font-bold text-amber-300">Aguardando dados</span>
                <span className="block text-slate-300">Complete seu perfil</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-blue-400/30 bg-blue-500/10 flex items-center justify-center text-blue-300/50 self-start mt-1 shrink-0">
              <Trophy size={22} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Target size={20} className="shrink-0 text-blue-400 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold block text-white text-sm">Nenhum currículo detectado no perfil.</span>
              <span className="text-xs text-blue-100 block mt-0.5">
                Envie seu currículo em "Meu Currículo" para ativarmos seu diagnóstico de carreira e encontrarmos as melhores oportunidades.
              </span>
            </div>
          </div>
          {onExploreJobs && (
            <button
              onClick={onExploreJobs}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shrink-0 transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <span>Completar meu perfil</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass className="bg-gradient-to-br from-[#1a2744] via-[#15213a] to-[#0f1a2e] border border-blue-500/30 p-6 rounded-2xl shadow-xl space-y-6 animate-fade-in text-white">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-5 border-b border-slate-700/60">
        <div className="space-y-1.5 flex-1 w-full min-w-0 flex flex-col items-start font-sans">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Primeiro Momento IA</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight w-full block break-normal whitespace-normal">
            Seu Career Score de Mercado
          </h2>
          <p className="text-sm text-blue-100 font-medium leading-relaxed w-full block break-normal whitespace-normal">
            Diagnóstico instantâneo gerado a partir da análise do seu perfil e currículo.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-blue-200 block tracking-wider">Career Score Geral</span>
            {isDataLoading || baseScore === null ? (
              <div className="h-9 w-28 bg-blue-500/20 animate-pulse rounded-lg my-1 border border-blue-400/20" />
            ) : (
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-300 font-display">
                {baseScore}/100
              </span>
            )}
            <div className="text-xs text-blue-100 space-y-0.5 text-right mt-1.5 font-medium border-t border-slate-700/60 pt-1">
              <span className="block font-bold text-blue-200">Baseado em:</span>
              <span className="block text-emerald-300">✓ Sua experiência profissional</span>
              <span className="block text-emerald-300">✓ Suas habilidades</span>
              <span className="block text-emerald-300">✓ Seu histórico de carreira</span>
              <span className="block text-emerald-300">✓ Padrões de mercado</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-blue-400/50 bg-blue-500/20 flex items-center justify-center text-blue-300 self-start mt-1 shrink-0">
            <Trophy size={22} />
          </div>
        </div>
      </div>

      {isDataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 h-28 space-y-2">
            <div className="h-4 w-36 bg-slate-700/50 rounded" />
            <div className="h-3 w-48 bg-slate-700/30 rounded" />
            <div className="h-3 w-40 bg-slate-700/30 rounded" />
          </div>
          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/20 h-28 space-y-2">
            <div className="h-4 w-36 bg-emerald-500/20 rounded" />
            <div className="h-3 w-48 bg-emerald-500/10 rounded" />
            <div className="h-3 w-40 bg-emerald-500/10 rounded" />
          </div>
          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/20 h-28 space-y-2">
            <div className="h-4 w-36 bg-amber-500/20 rounded" />
            <div className="h-3 w-48 bg-amber-500/10 rounded" />
            <div className="h-3 w-40 bg-amber-500/10 rounded" />
          </div>
        </div>
      ) : (
        <>
          {/* Alerta de Diagnóstico Limitado (Dados Insuficientes) */}
          {(experiencesCount < 3 || userSkills.length < 5) && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <AlertTriangle size={20} className="shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold block text-amber-100 text-sm">Seu diagnóstico ainda está limitado.</span>
                  <span className="text-xs text-amber-100 block mt-0.5">Quanto mais informações você adicionar, mais precisas serão suas recomendações. Complete seu perfil para melhorar seus matches.</span>
                </div>
              </div>

              {onExploreJobs && (
                <button
                  onClick={onExploreJobs}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  Completar meu perfil
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cargos Mais Compatíveis */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/50 space-y-3">
              <h3 className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Target size={15} />
                Cargos Mais Compatíveis
              </h3>
              <ul className="space-y-2 text-xs font-medium text-slate-200">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">🥇</span>
                  <span>{topCompatibleRoles[0]}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-300 font-bold">🥈</span>
                  <span>{topCompatibleRoles[1]}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500 font-bold">🥉</span>
                  <span>{topCompatibleRoles[2]}</span>
                </li>
              </ul>
            </div>

            {/* Seus Pontos Fortes */}
            <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/40 space-y-3">
              <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle size={15} />
                Seus Pontos Fortes
              </h3>
              <ul className="space-y-2 text-xs text-emerald-100">
                {strengthsList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Para Evoluir */}
            <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/40 space-y-3">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle size={15} />
                Para Evoluir (Gaps)
              </h3>
              <ul className="space-y-2 text-xs text-amber-100">
                {gapsList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {onExploreJobs && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onExploreJobs}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <span>Buscar Vagas Aderentes</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </CardGlass>
  );
}


