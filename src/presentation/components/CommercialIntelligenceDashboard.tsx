import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CardGlass } from './CardGlass';
import { CommercialIntelligenceService } from '../../application/services/CommercialIntelligenceService';
import { 
  TrendingUp, Tag, Gift, Award, Star, Activity, 
  RefreshCw, Search, Loader2, Info, HelpCircle
} from 'lucide-react';

import { ContactActionModal, type ContactTargetUser } from './ContactActionModal';

export function CommercialIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState<'all' | 'upgrade' | 'desconto' | 'oferta' | 'embaixador' | 'engajados' | 'nps'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactUser, setContactUser] = useState<ContactTargetUser | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { data: summary, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['commercial-intelligence-summary'],
    queryFn: () => CommercialIntelligenceService.getCommercialIntelligence()
  });

  const candidates = summary?.candidates || [];

  // Filtragem da lista
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'upgrade':
        return c.upgradeLabel === 'Alta Propensão';
      case 'desconto':
        return c.discountEligible;
      case 'oferta':
        return c.offerEligible;
      case 'embaixador':
        return c.isAmbassadorCandidate;
      case 'engajados':
        return c.engagementScore >= 30;
      case 'nps':
        return c.npsCategory === 'Promotor (9-10)';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in text-slate-100">
      
      {/* Header Banner do Módulo 2.7 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase rounded-lg">
              Módulo 2.7 — Command Center
            </span>
            <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 font-bold uppercase rounded-lg">
              Regra 1 Tela = 1 Pergunta
            </span>
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-white mt-2 flex items-center gap-2">
            <TrendingUp size={22} className="text-emerald-400" />
            Inteligência Comercial
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            <span className="font-semibold text-slate-200">Pergunta Respondida:</span> "Quais usuários têm maior potencial de upgrade, desconto, oferta, embaixador e NPS?"
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Atualizar dados comerciais"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin text-emerald-400' : ''} />
            {isRefetching ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>
      </div>

      {/* Warning Disclaimer on Usage-based Heuristics */}
      <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-start gap-2.5">
        <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-300 block">Metodologia Transparente de Scoring Comercial:</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            As propensões e notas deste módulo são calculadas sobre <strong>dados reais de uso do produto</strong> (matches calculados, otimizações de CV, simulações STAR, candidaturas no pipeline e feedback em <code className="text-emerald-400 font-mono">job_match_feedback</code>), aplicando obrigatoriamente a exclusão de contas de teste (<code className="text-emerald-400 font-mono">is_test_account !== true</code>). <em className="text-slate-400">Trata-se de uma heurística acionável baseada em engajamento real, não uma previsão estatística validada por modelo de machine learning.</em>
          </p>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Upgrade Candidates */}
        <CardGlass className="p-4 flex flex-col justify-between space-y-3 border-emerald-500/20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Chance de Upgrade</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400 font-display font-mono">
                {isLoading ? '...' : summary?.highUpgradeProbabilityCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">usuários</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1">Alta propensão (Score &ge; 70%)</span>
          </div>
        </CardGlass>

        {/* Card 2: Discount Eligible */}
        <CardGlass className="p-4 flex flex-col justify-between space-y-3 border-blue-500/20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Elegíveis a Desconto</span>
            <Tag size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-400 font-display font-mono">
                {isLoading ? '...' : summary?.discountEligibleCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">usuários</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1">Uso intenso &gt;14d sem conversão</span>
          </div>
        </CardGlass>

        {/* Card 3: Offer Eligible */}
        <CardGlass className="p-4 flex flex-col justify-between space-y-3 border-purple-500/20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Gatilhos de Oferta</span>
            <Gift size={16} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-purple-300 font-display font-mono">
                {isLoading ? '...' : summary?.offerEligibleCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">gatilhos</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1">Marcos recentes de progresso</span>
          </div>
        </CardGlass>

        {/* Card 4: Ambassador Candidates */}
        <CardGlass className="p-4 flex flex-col justify-between space-y-3 border-amber-500/20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Embaixadores Potenciais</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-400 font-display font-mono">
                {isLoading ? '...' : summary?.ambassadorCandidatesCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">promotores</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1">Feedback positivo + alto uso</span>
          </div>
        </CardGlass>

        {/* Card 5: Estimated NPS */}
        <CardGlass className="p-4 flex flex-col justify-between space-y-3 border-pink-500/20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">NPS Potencial Média</span>
            <Star size={16} className="text-pink-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-display font-mono">
                {isLoading ? '...' : summary?.avgEstimatedNps ?? 8.5}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">/ 10</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-1">Estimado via feedback tático</span>
          </div>
        </CardGlass>
      </div>

      {/* Tabs & Search Filter Header */}
      <CardGlass className="p-5 space-y-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-900 pb-4">
          
          {/* Segment Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800" role="tablist">
            {[
              { id: 'all', label: 'Todos', count: candidates.length },
              { id: 'upgrade', label: '1. Propensão Upgrade', count: summary?.highUpgradeProbabilityCount ?? 0 },
              { id: 'desconto', label: '2. Receber Desconto', count: summary?.discountEligibleCount ?? 0 },
              { id: 'oferta', label: '3. Enviar Oferta', count: summary?.offerEligibleCount ?? 0 },
              { id: 'embaixador', label: '4. Embaixadores', count: summary?.ambassadorCandidatesCount ?? 0 },
              { id: 'engajados', label: '5. Power Users', count: summary?.powerUsersCount ?? 0 },
              { id: 'nps', label: '6. Alto NPS (9-10)', count: candidates.filter(c => c.npsCategory === 'Promotor (9-10)').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar candidato por nome/e-mail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
            />
          </div>
        </div>

        {/* Candidate List Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-brand-500" size={28} />
            <span className="text-xs font-semibold">Calculando inteligência comercial dos usuários reais...</span>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-900 rounded-xl text-slate-400 text-xs space-y-1.5">
            <p className="font-semibold text-slate-300">Nenhum candidato correspondente a este segmento comercial.</p>
            <p className="text-[11px] text-slate-500">Tente ajustar a busca por nome ou alternar a aba de filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-955/20">
            <table className="w-full border-collapse text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-300">
                  <th className="p-3">Candidato</th>
                  <th className="p-3">Plano Atual</th>
                  <th className="p-3 text-center">Propensão ao Upgrade</th>
                  <th className="p-3 text-center">Volume de Uso (Matches/IA/Apps)</th>
                  <th className="p-3 text-center">NPS Estimado</th>
                  <th className="p-3 text-right">Ação Comercial Recomendada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredCandidates.map((c) => {
                  return (
                    <tr key={c.userId} className="hover:bg-slate-900/30 transition-colors">
                      {/* User Info */}
                      <td className="p-3 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{c.name}</span>
                          {c.isAmbassadorCandidate && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold" title="Candidato a Embaixador">
                              ★ Embaixador
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">{c.email}</span>
                        <span className="text-[9px] text-slate-500 block">Cadastrado há {c.accountAgeDays}d • Ativo: {c.lastActiveDate}</span>
                      </td>

                      {/* Role */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          c.role === 'user' ? 'bg-slate-500/10 text-slate-300 border-slate-700/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {c.role === 'user' ? 'Gratuito (Free)' : c.role}
                        </span>
                      </td>

                      {/* Upgrade Score */}
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            c.upgradeLabel === 'Já em Plano Pago' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            c.upgradeLabel === 'Alta Propensão' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' :
                            c.upgradeLabel === 'Média Propensão' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {c.upgradeLabel} ({c.upgradeScore}%)
                          </span>
                          <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                c.upgradeScore >= 70 ? 'bg-brand-500' : c.upgradeScore >= 40 ? 'bg-amber-500' : 'bg-slate-700'
                              }`} 
                              style={{ width: `${c.upgradeScore}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      {/* Usage Metrics */}
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-2 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800" title="Matches Calculados">
                            🎯 {c.matchesCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800" title="Chamadas de IA (CV/STAR/Carta)">
                            🤖 {c.aiUsageCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800" title="Candidaturas no Pipeline">
                            📨 {c.applicationsCount}
                          </span>
                        </div>
                      </td>

                      {/* NPS Estimado */}
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-xs font-bold font-mono ${
                            c.estimatedNps >= 9 ? 'text-emerald-400' : c.estimatedNps >= 7 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {c.estimatedNps} / 10
                          </span>
                          <span className="text-[9px] text-slate-500">{c.npsCategory}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3 text-right">
                        {c.isAmbassadorCandidate ? (
                          <button
                            onClick={() => setContactUser({ userId: c.userId, name: c.name, email: c.email, contextMessage: `Olá, ${c.name}!\n\nVimos que você é um dos usuários mais engajados no VoCentro. Gostaria de te convidar para o nosso programa de Embaixadores!` })}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer"
                          >
                            <Award size={11} /> Convidar p/ Embaixador
                          </button>
                        ) : c.discountEligible ? (
                          <button
                            onClick={() => setContactUser({ userId: c.userId, name: c.name, email: c.email, contextMessage: `Olá, ${c.name}!\n\nVocê ganhou um cupom exclusivo de 20% OFF para liberar o acesso ilimitado ao VoCentro Pro com cupom VOCENTRO20.` })}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer"
                          >
                            <Tag size={11} /> Oferecer Cupom 20%
                          </button>
                        ) : c.offerEligible ? (
                          <button
                            onClick={() => setContactUser({ userId: c.userId, name: c.name, email: c.email, contextMessage: `Olá, ${c.name}!\n\nParabéns pelo seu progresso no pipeline. Liberamos 7 dias de degustação gratuita do plano Pro para sua conta.` })}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg hover:bg-purple-500/20 transition-all cursor-pointer"
                          >
                            <Gift size={11} /> Oferecer Trial 7d
                          </button>
                        ) : (
                          <button
                            onClick={() => setContactUser({ userId: c.userId, name: c.name, email: c.email })}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                          >
                            <Activity size={11} /> Contatar Usuário
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardGlass>

      {/* Modal de Ação / Contato */}
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

      {/* Uninstrumented Data Signals / Future Integration Map */}
      <CardGlass className="p-5 space-y-3 border-dashed border-slate-800 bg-slate-950/40">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle size={15} className="text-brand-400" />
          Mapeamento de Instrumentações Comerciais em Espera
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-slate-200 block text-[11px]">1. Abandono de Checkout</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold">Aguardando Webhook Gateway Real</span>
            <p className="text-[10px] text-slate-400 pt-0.5">O evento de abandono no momento de digitar o cartão será alimentado automaticamente quando a chave do gateway de pagamento real estiver ativa.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-slate-200 block text-[11px]">2. Pesquisa de NPS Direta (0 a 10)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-bold">Em Espera de Popup In-App</span>
            <p className="text-[10px] text-slate-400 pt-0.5">Atualmente a nota NPS é estimada via feedback tático e 0 falhas no OCR. A nota oficial substituíra a estimativa quando o popup survey for exibido.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-slate-200 block text-[11px]">3. Links de Indicação (Referral)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-bold">Programa de Afiliados</span>
            <p className="text-[10px] text-slate-400 pt-0.5">Candidatos a embaixadores poderão gerar códigos de convite únicos. O rastreamento de cadastros por indicação entrará nesta tela.</p>
          </div>
        </div>
      </CardGlass>

    </div>
  );
}
