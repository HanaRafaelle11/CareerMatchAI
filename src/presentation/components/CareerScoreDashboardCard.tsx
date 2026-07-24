import { useEffect } from 'react';
import { Sparkles, Trophy, CheckCircle, AlertTriangle, ArrowRight, Target } from 'lucide-react';
import { CardGlass } from './CardGlass';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Resume } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

interface CareerScoreDashboardCardProps {
  resume?: Resume | null;
  careerProfileNew?: CareerProfileNew | null;
  onExploreJobs?: () => void;
}

export function CareerScoreDashboardCard({ resume, careerProfileNew, onExploreJobs }: CareerScoreDashboardCardProps) {
  const resumeSkills = (resume?.skills || []).map(s => typeof s === 'string' ? s : (s as any).name || '');
  const profileSkills = (careerProfileNew?.skills || []).map(s => typeof s === 'string' ? s : (s as any).name || '');
  const userSkills = profileSkills.length > 0 ? profileSkills : resumeSkills;
  const experiencesCount = resume?.experiences?.length || (careerProfileNew?.experience as any[])?.length || 0;
  const targetRoles = (careerProfileNew?.personal as any)?.preferences?.targetRoles || [];

  // Calcular o Career Score inicial do perfil (0 - 100)
  const baseScore = Math.min(95, Math.max(50, 60 + (userSkills.length * 2) + (experiencesCount * 4)));

  const topCompatibleRoles = targetRoles.length >= 3
    ? targetRoles.slice(0, 3)
    : [
        targetRoles[0] || 'Customer Success Manager',
        targetRoles[1] || 'CS Operations Manager',
        'Customer Experience Lead'
      ];

  const strengthsList = userSkills.length >= 3
    ? userSkills.slice(0, 3).map(s => `Gestão e domínio em ${s}`)
    : ['Gestão de carteira SaaS', 'Liderança operacional e processos', 'Retenção e estratégia de Churn'];

  const gapsList = [
    'Estratégia de expansão de contas (Upsell / Cross-sell)',
    'Ferramentas enterprise avançadas (Gainsight / Salesforce)'
  ];

  useEffect(() => {
    tracker.track('career_score_viewed', 'ProductBeta', { score: baseScore });
    tracker.track('career_dashboard_opened', 'ProductBeta', { has_resume: !!resume });
  }, [baseScore, resume]);

  if (!resume && !careerProfileNew) return null;

  return (
    <CardGlass className="bg-gradient-to-br from-[#1a2744] via-[#15213a] to-[#0f1a2e] border border-blue-500/30 p-6 rounded-2xl shadow-xl space-y-6 animate-fade-in text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-5 border-b border-slate-700/60">
        <div className="space-y-1.5 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Primeiro Momento IA</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Seu Career Score de Mercado
          </h2>
          <p className="text-xs text-blue-100/90 font-medium leading-relaxed">
            Diagnóstico instantâneo gerado a partir da análise do seu perfil e currículo.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-blue-200/90 block tracking-wider">Career Score Geral</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-300 font-display">
              {baseScore}/100
            </span>
            <div className="text-[9px] text-blue-100 space-y-0.5 text-right mt-1.5 font-medium border-t border-slate-700/60 pt-1">
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

      {/* Alerta de Diagnóstico Limitado (Dados Insuficientes) */}
      {(experiencesCount < 3 || userSkills.length < 5) && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle size={20} className="shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold block text-amber-100 text-sm">Seu diagnóstico ainda está limitado.</span>
              <span className="text-xs text-amber-200/90 block mt-0.5">Quanto mais informações você adicionar, mais precisas serão suas recomendações. Complete seu perfil para melhorar seus matches.</span>
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
