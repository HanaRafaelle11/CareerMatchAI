import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldAlert, UserCheck, RefreshCw, 
  Search, Filter, Activity, ArrowRight, User, 
  Mail, Clock, CheckCircle2, Zap
} from 'lucide-react';
import { ChurnIntelligenceService, type UserChurnProfile } from '../../application/services/ChurnIntelligenceService';
import { ContactActionModal, type ContactTargetUser } from './ContactActionModal';

export function ChurnIntelligenceDashboard() {
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contactUser, setContactUser] = useState<ContactTargetUser | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { data: churnData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['churn-intelligence-metrics'],
    queryFn: () => ChurnIntelligenceService.getChurnIntelligence(),
    refetchInterval: 30000
  });

  const profiles = churnData?.churnProfiles || [];

  const filteredProfiles = profiles.filter(p => {
    let matchesRisk = true;
    if (riskFilter === 'alto') matchesRisk = p.riskLevel === 'Alto';
    else if (riskFilter === 'médio') matchesRisk = p.riskLevel === 'Médio';
    else if (riskFilter === 'baixo') matchesRisk = p.riskLevel === 'Baixo';
    else if (riskFilter === 'onboarding') matchesRisk = p.riskLevel === 'Onboarding em Andamento';

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.autoSuggestion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header Banner do Módulo 2.4 */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-950 border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
              Módulo 2.4 — Command Center
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Inteligência de Retenção & Prevenção de Churn
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <ShieldAlert className="text-red-400" size={24} />
            <span>Churn Intelligence — Modelo Preditivo de Risk Score</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Pontuação de risco por usuário (0 a 100) baseada nos 8 fatores causais, com carência de 7 dias para novos cadastros e desduplicação entre ausência de candidaturas vs. paralisação de pipeline.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-center shrink-0"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin text-red-400' : ''} />
          <span>Recalcular Riscos</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-500 space-y-3">
          <Activity className="animate-spin text-red-500 mx-auto" size={32} />
          <p className="text-xs font-semibold text-slate-300">Processando algoritmo de pontuação de Churn nos perfis...</p>
        </div>
      ) : (
        <>
          {/* Distribuição de Riscos */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Monitorada</span>
              <strong className="text-3xl font-black text-slate-100">{profiles.length}</strong>
              <span className="text-[10px] text-slate-500 block">candidatos reais</span>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Risco Alto (&gt;= 70 pts)</span>
              <strong className="text-3xl font-black text-red-400">{churnData?.highRiskCount}</strong>
              <span className="text-[10px] text-red-300/70 block">ação imediata</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Risco Médio (40-69 pts)</span>
              <strong className="text-3xl font-black text-amber-400">{churnData?.mediumRiskCount}</strong>
              <span className="text-[10px] text-amber-300/70 block">engajamento</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Risco Baixo (&lt; 40 pts)</span>
              <strong className="text-3xl font-black text-emerald-400">{churnData?.lowRiskCount}</strong>
              <span className="text-[10px] text-emerald-300/70 block">perfil saudável</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Carência (&lt; 7d)</span>
              <strong className="text-3xl font-black text-blue-300">{churnData?.onboardingCount}</strong>
              <span className="text-[10px] text-blue-300/70 block">onboarding inicial</span>
            </div>
          </div>

          {/* Filtros de Busca & Nível de Risco */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1 shrink-0 mr-1">
                <Filter size={12} /> Risco:
              </span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'alto', label: '🔴 Risco Alto' },
                { id: 'médio', label: '🟡 Risco Médio' },
                { id: 'baixo', label: '🟢 Risco Baixo' },
                { id: 'onboarding', label: '🔵 Onboarding (< 7d)' }
              ].map(rf => (
                <button
                  key={rf.id}
                  onClick={() => setRiskFilter(rf.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    riskFilter === rf.id
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por candidato, e-mail..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Cards Preditivos de Churn por Candidato */}
          <div className="space-y-4">
            {filteredProfiles.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <UserCheck size={32} className="mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">Nenhum candidato encontrado nesta categoria de risco.</p>
              </div>
            ) : (
              filteredProfiles.map((user: UserChurnProfile) => (
                <div 
                  key={user.userId}
                  className={`p-5 rounded-2xl bg-slate-900/60 border transition space-y-4 ${
                    user.riskLevel === 'Onboarding em Andamento'
                      ? 'border-blue-500/30 bg-blue-950/10'
                      : user.riskLevel === 'Alto'
                      ? 'border-red-500/30 bg-red-950/10'
                      : user.riskLevel === 'Médio'
                      ? 'border-amber-500/30 bg-amber-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Linha Superior: Nome, Badges, Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-red-400 shrink-0" />
                        <strong className="text-sm font-bold text-slate-100">{user.name}</strong>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.riskLevel === 'Onboarding em Andamento'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : user.riskLevel === 'Alto'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : user.riskLevel === 'Médio'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {user.riskLevel === 'Onboarding em Andamento' ? '🔵 Onboarding (< 7d)' : `Risco ${user.riskLevel}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-500" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={12} className="text-slate-500" />
                          Último acesso: {user.lastSessionDate} ({user.accountAgeDays}d de conta)
                        </span>
                      </div>
                    </div>

                    {/* Badge de Probabilidade de Churn */}
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Probabilidade de Churn</span>
                        <strong className={`text-xl font-black ${
                          user.riskLevel === 'Onboarding em Andamento'
                            ? 'text-blue-300'
                            : user.riskLevel === 'Alto'
                            ? 'text-red-400'
                            : user.riskLevel === 'Médio'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {user.churnProbabilityRate}%
                        </strong>
                      </div>

                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-extrabold text-sm text-slate-200">
                        {user.riskScore} pts
                      </div>
                    </div>
                  </div>

                  {/* Motivos Identificados (Tags) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Motivos & Fatores Identificados:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.reasons.map((reason, rIdx) => (
                        <span 
                          key={rIdx}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 ${
                            reason.code === 'grace_period'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              : reason.severity === 'alta'
                              ? 'bg-red-500/10 text-red-300 border-red-500/20'
                              : reason.severity === 'media'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <span>{reason.label}</span>
                          {reason.points > 0 && <span className="font-bold font-mono opacity-80">(+{reason.points} pts)</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Diagnóstico Automático & Próxima Melhor Ação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <Zap size={12} className="text-amber-400" /> Diagnóstico Preditivo Automático
                      </span>
                      <p className="text-xs text-slate-300 leading-snug">
                        {user.autoSuggestion}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/30 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-brand-400" /> Próxima Melhor Ação (Next Best Action)
                        </span>
                        <p className="text-xs text-brand-100 font-medium leading-snug mt-0.5">
                          {user.nextBestAction}
                        </p>
                      </div>

                      <button
                        onClick={() => setContactUser({ userId: user.userId, name: user.name, email: user.email, contextMessage: `Olá, ${user.name}!\n\n${user.nextBestAction}` })}
                        className="self-end px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-brand-600/20"
                      >
                        <span>Executar Ação</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modal de Contato / Registro de Ação */}
      {contactUser && (
        <ContactActionModal
          user={contactUser}
          onClose={() => setContactUser(null)}
          onSuccess={(msg) => setActionSuccessMsg(msg)}
        />
      )}

      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-white text-xs font-bold shadow-2xl z-[1001] flex items-center gap-2 animate-bounce">
          <span>✅ {actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white text-xs font-mono ml-2">✕</button>
        </div>
      )}
    </div>
  );
}
