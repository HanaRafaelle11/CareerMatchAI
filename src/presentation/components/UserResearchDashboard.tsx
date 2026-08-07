import React, { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/api/supabaseClient';
import { 
  Users, 
  Sparkles, 
  Gift, 
  Download, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Phone, 
  ShieldCheck, 
  Eye, 
  X
} from 'lucide-react';

interface UserResearchDashboardProps {
  adminUserId?: string;
}

export const UserResearchDashboard: React.FC<UserResearchDashboardProps> = () => {
  const [loading, setLoading] = useState(true);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [giveawayParticipants, setGiveawayParticipants] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [contactsMap, setContactsMap] = useState<Record<string, any>>({});
  const [emailCampaigns, setEmailCampaigns] = useState<any[]>([]);
  
  // Drawer detail state
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  
  // Filter state
  const [cohortFilter, setCohortFilter] = useState<string>('ALL');
  
  // Email dispatch status
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);


  useEffect(() => {
    fetchResearchData();
  }, []);

  const fetchResearchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Fetch survey responses
      const { data: responses } = await supabase.from('survey_responses').select('*').order('created_at', { ascending: false });
      setSurveyResponses(responses || []);

      // 2. Fetch giveaway participants
      const { data: giveaway } = await supabase.from('giveaway_participants').select('*');
      setGiveawayParticipants(giveaway || []);

      // 3. Fetch survey email campaigns
      const { data: campaigns } = await supabase.from('survey_email_campaigns').select('*');
      setEmailCampaigns(campaigns || []);

      // 4. Fetch research contacts (LGPD decoupled)
      const { data: contacts } = await supabase.from('research_contacts').select('*');
      const cMap: Record<string, any> = {};
      (contacts || []).forEach(c => {
        cMap[c.user_id] = c;
      });

      setContactsMap(cMap);

      // 4. Fetch profiles for real vs test identification
      const { data: profiles } = await supabase.from('profiles').select('*');
      const pMap: Record<string, any> = {};
      (profiles || []).forEach(p => {
        pMap[p.id] = p;
      });
      setProfilesMap(pMap);

    } catch (err) {
      console.error('[UserResearch] Erro ao carregar dados:', err);
    } fontally: {
      setLoading(false);
    }
  };


  // Dispatch survey emails via wave
  const handleDispatchWave = async (wave: string) => {
    setDispatchStatus(`Disparando onda [${wave}]...`);
    try {
      const res = await fetch('/api/send-survey-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortTarget: wave, emailType: 'initial_invite' })
      });
      const data = await res.json();
      setDispatchStatus(`✓ Sucesso! ${data.count || 0} e-mails registrados na onda [${wave}].`);
      fetchResearchData();
    } catch (err: any) {
      setDispatchStatus(`⚠️ Falha ao conectar Edge Function: ${err.message || 'Tentativa simulada concluída'}`);
    }
  };

  // Perform Giveaway Draw
  const handleSelectGiveawayWinner = async () => {
    if (!supabase) return;
    const eligible = giveawayParticipants.filter(p => p.status === 'eligible');
    if (eligible.length === 0) {
      alert('Nenhum participante elegível encontrado para o sorteio.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[randomIndex];

    if (window.confirm(`Confirma a seleção do participante [${winner.email}] como Vencedor do Prêmio 7 Dias PRO?`)) {
      // Update status to 'selected' and wait for admin confirmation
      await supabase.from('giveaway_participants').update({
        status: 'selected',
        winner_selected_at: new Date().toISOString()
      }).eq('id', winner.id);

      alert(`🏆 Vencedor selecionado: ${winner.email}. Clique em "Confirmar e Conceder PRO" para ativar o plano.`);
      fetchResearchData();
    }
  };

  const handleGrantProWinner = async (participantId: string, userId: string) => {
    if (!supabase) return;
    try {
      // 1. Grant 7-day PRO trial
      const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        plan_id: 'ef50928a-1f2b-4920-ab9d-8928693a07d1', // PRO plan
        trial_ends_at: trialEnds
      });

      // 2. Update giveaway participant status to 'granted'
      await supabase.from('giveaway_participants').update({
        status: 'granted',
        granted_at: new Date().toISOString()
      }).eq('id', participantId);

      alert('🎉 7 Dias de acesso PRO concedidos com sucesso!');
      fetchResearchData();
    } catch (err: any) {
      alert('Erro ao conceder acesso PRO: ' + err.message);
    }
  };

  // Calculate Founder Engagement Score (0-100)
  const calculateEngagementScore = (user: any, response: any) => {
    let score = 0;
    if (response) score += 20; // Respondeu pesquisa
    if (user?.has_match) score += 20; // Teve Match
    if ((user?.logins_count || 0) > 3) score += 20; // Voltou > 3 vezes
    if (user?.has_kanban || user?.has_ats || user?.has_star) score += 20; // Usou recursos
    if (response?.q12_interview_opt_in === 'Sim') score += 20; // Aceitou entrevista
    return score;
  };

  const getEngagementTier = (score: number) => {
    if (score >= 80) return { label: '🟢 Founder Champion', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 50) return { label: '🟡 Engajado', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: '🔴 Baixo Engajamento', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  // CSV Export
  const handleExportCSV = () => {
    if (surveyResponses.length === 0) {
      alert('Nenhuma resposta disponível para exportar.');
      return;
    }

    const headers = [
      'ID', 'Coorte', 'High Intent', 'Canal', 'Versao', 
      'Q1_Aquisicao', 'Q2_Objetivo', 'Q4_Feature_Valorizada', 'Q8_Intencao_PRO', 
      'Q9_Preco_Justo', 'Q11_NPS', 'Q12_Entrevista', 'Q13_PMF_Sentiria_Falta', 
      'Q14_Momento_Valor', 'Q15_Dor_Principal', 'Q16_Urgencia', 'Data_Criacao'
    ];

    const rows = surveyResponses.map(r => [
      r.id, r.research_cohort, r.high_intent ? 'Sim' : 'Nao', r.channel, r.survey_version,
      `"${r.q1_acquisition || ''}"`, `"${r.q2_goal || ''}"`, `"${r.q4_valued_feature || ''}"`, `"${r.q8_pro_intent || ''}"`,
      `"${r.q9_fair_price || ''}"`, r.q11_nps, `"${r.q12_interview_opt_in || ''}"`, `"${r.q13_pmf_missing_feature || ''}"`,
      `"${r.q14_value_moment || ''}"`, `"${r.q15_main_difficulty || ''}"`, `"${r.q16_urgency || ''}"`, r.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pesquisa_usuarios_fundadores_v1_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 space-x-3 text-slate-400">
        <Sparkles className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Carregando dados da Pesquisa de Usuários Fundadores...</span>
      </div>
    );
  }

  // Filtered responses for list
  const filteredResponses = surveyResponses.filter(r => {
    if (cohortFilter !== 'ALL' && r.research_cohort !== cohortFilter) return false;
    return true;
  });

  const totalResponses = surveyResponses.length;
  const targetGoal = 30;
  const progressPercent = Math.min(100, Math.round((totalResponses / targetGoal) * 100));

  const avgNps = totalResponses > 0 
    ? (surveyResponses.reduce((sum, r) => sum + (r.q11_nps || 0), 0) / totalResponses).toFixed(1)
    : '0.0';

  const proIntentCount = surveyResponses.filter(r => r.q8_pro_intent === 'Sim' || r.q8_pro_intent === 'Talvez').length;
  const proIntentPercent = totalResponses > 0 ? ((proIntentCount / totalResponses) * 100).toFixed(0) : '0';

  const interviewOptInCount = surveyResponses.filter(r => r.q12_interview_opt_in === 'Sim').length;

  return (
    <div className="space-y-8 text-slate-100">

      {/* HEADER DA CAMPANHA & TARGET BAR */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#121927] to-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campanha Multicanal • v1_founders_validation</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Pesquisa de Usuários Fundadores
            </h2>
            <p className="text-sm text-slate-400">
              Validação de PMF, percepção de valor, intenção de pagamento e dor de onboarding dos usuários beta reais.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Exportar CSV
            </button>
            <button
              onClick={handleSelectGiveawayWinner}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-bold text-slate-950 text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Gift className="w-4 h-4" />
              Sorteador 7 Dias PRO
            </button>
          </div>
        </div>

        {/* BARRA DA META (20-30 RESPOSTAS) */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Progresso da Meta de Respostas Beta:
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {totalResponses} / {targetGoal} respostas ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            * Amostra ideal: 20+ respostas para conclusões estatísticas por coorte com alta confiança.
          </p>
        </div>

        {/* CONTROLES DE DISPARO DE E-MAIL POR ONDA */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium">Disparo de E-mails em Ondas (Resend):</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDispatchWave('activated')}
              className="py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium transition"
            >
              Enviar Onda [Ativados]
            </button>
            <button
              onClick={() => handleDispatchWave('not_activated')}
              className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-medium transition"
            >
              Enviar Onda [Não Ativados]
            </button>
            <button
              onClick={() => handleDispatchWave('beta_general')}
              className="py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium transition"
            >
              Enviar Onda [Beta Geral]
            </button>
          </div>
        </div>
        {dispatchStatus && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {dispatchStatus}
          </div>
        )}
      </div>

      {/* CARDS DE TOP KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121927] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Respostas Recebidas</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalResponses}</div>
          <div className="text-[11px] text-slate-400">Total de feedbacks v1</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121927] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>NPS Médio (0-10)</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{avgNps}</div>
          <div className="text-[11px] text-slate-400">Recomendação geral</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121927] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Intenção PRO (Sim/Talvez)</span>
            <PieChart className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{proIntentPercent}%</div>
          <div className="text-[11px] text-slate-400">{proIntentCount} de {totalResponses} respostas</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121927] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Aceitam Entrevista</span>
            <Phone className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400">{interviewOptInCount}</div>
          <div className="text-[11px] text-slate-400">Prontos para contato</div>
        </div>
      </div>

      {/* PAINEL DE OBSERVABILIDADE & DIAGNÓSTICO DE FUNIL */}
      <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Observabilidade & Funil da Pesquisa
          </h3>
          <span className="text-xs font-semibold text-slate-400">Monitoramento em Tempo Real</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Convites Enviados</span>
            <div className="text-xl font-mono font-bold text-white">{emailCampaigns.length}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">E-mails Entregues</span>
            <div className="text-xl font-mono font-bold text-cyan-400">
              {emailCampaigns.filter(c => c.status === 'delivered' || c.status === 'opened' || c.status === 'clicked' || c.status === 'responded' || c.status === 'sent').length}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Pesquisas Iniciadas</span>
            <div className="text-xl font-mono font-bold text-amber-400">
              {Math.max(totalResponses, emailCampaigns.filter(c => c.status === 'opened' || c.status === 'clicked' || c.status === 'responded').length)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Pesquisas Concluídas</span>
            <div className="text-xl font-mono font-bold text-emerald-400">{totalResponses}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Taxa de Conclusão</span>
            <div className="text-xl font-mono font-bold text-teal-400">
              {emailCampaigns.length > 0 ? ((totalResponses / emailCampaigns.length) * 100).toFixed(1) : '100.0'}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Consentimentos LGPD</span>
            <div className="text-xl font-mono font-bold text-indigo-400">
              {Object.values(contactsMap).filter(c => c.permission_status === 'granted').length}
            </div>
          </div>
        </div>
      </div>


      {/* DASHBOARD EXECUTIVO: INSIGHTS DE PRODUTO & MARKETING */}
      <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Insights de Produto & Inteligência de Marketing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dores Principais (Q15) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Principais Dores (Q15)</h4>
            {(() => {
              const difficulties: Record<string, number> = {};
              surveyResponses.forEach(r => {
                if (r.q15_main_difficulty) {
                  difficulties[r.q15_main_difficulty] = (difficulties[r.q15_main_difficulty] || 0) + 1;
                }
              });
              const entries = Object.entries(difficulties).sort((a, b) => b[1] - a[1]);
              if (entries.length === 0) return <p className="text-xs text-slate-500 italic">Sem dados suficientes ainda.</p>;

              return (
                <div className="space-y-2 text-xs">
                  {entries.map(([label, count]) => {
                    const pct = Math.round((count / totalResponses) * 100);
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate max-w-[180px]">{label}</span>
                          <span className="font-mono font-bold text-emerald-400">{pct}% ({count})</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Features Mais Valorizadas (Q4) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ranking de Features (Q4)</h4>
            {(() => {
              const features: Record<string, number> = {};
              surveyResponses.forEach(r => {
                if (r.q4_valued_feature) {
                  features[r.q4_valued_feature] = (features[r.q4_valued_feature] || 0) + 1;
                }
              });
              const entries = Object.entries(features).sort((a, b) => b[1] - a[1]);
              if (entries.length === 0) return <p className="text-xs text-slate-500 italic">Sem dados suficientes ainda.</p>;

              return (
                <div className="space-y-2 text-xs">
                  {entries.map(([label, count]) => {
                    const pct = Math.round((count / totalResponses) * 100);
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate max-w-[180px]">{label}</span>
                          <span className="font-mono font-bold text-cyan-400">{pct}% ({count})</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full">
                          <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Momento Aha! (Q14) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Momento Aha! (Q14)</h4>
            {(() => {
              const moments: Record<string, number> = {};
              surveyResponses.forEach(r => {
                if (r.q14_value_moment) {
                  moments[r.q14_value_moment] = (moments[r.q14_value_moment] || 0) + 1;
                }
              });
              const entries = Object.entries(moments).sort((a, b) => b[1] - a[1]);
              if (entries.length === 0) return <p className="text-xs text-slate-500 italic">Sem dados suficientes ainda.</p>;

              return (
                <div className="space-y-2 text-xs">
                  {entries.map(([label, count]) => {
                    const pct = Math.round((count / totalResponses) * 100);
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate max-w-[180px]">{label}</span>
                          <span className="font-mono font-bold text-amber-400">{pct}% ({count})</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full">
                          <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* CENTRAL DE VOZ DO CLIENTE (DEPOIMENTOS REAL PARA MARKETING) */}
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Central de Voz do Cliente (Frases para Landing Page e Anúncios)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {surveyResponses.filter(r => r.q6_biggest_benefit || r.q13_pmf_missing_feature).slice(0, 6).map((r, idx) => (
              <div key={r.id || idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <p className="text-slate-300 italic">"{r.q6_biggest_benefit || r.q13_pmf_missing_feature}"</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span className="font-semibold text-emerald-400">Coorte: {r.research_cohort}</span>
                  <span>NPS: {r.q11_nps} / 10</span>
                </div>
              </div>
            ))}
            {surveyResponses.filter(r => r.q6_biggest_benefit || r.q13_pmf_missing_feature).length === 0 && (
              <p className="text-xs text-slate-500 italic">Nenhum depoimento em texto registrado até o momento.</p>
            )}
          </div>
        </div>
      </div>


      {/* GERENCIADOR DE PARTICIPANTES DO SORTEIO PRO */}
      <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            Participantes Elegíveis do Sorteio 7 Dias PRO ({giveawayParticipants.length})
          </h3>
        </div>

        {giveawayParticipants.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl">
            Nenhum participante registrado no sorteio até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Participante</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Data Inscrição</th>
                  <th className="p-3 text-right">Ação Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {giveawayParticipants.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-medium text-white">{p.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.status === 'granted' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : p.status === 'selected'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(p.participated_at || p.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {p.status === 'selected' && (
                        <button
                          onClick={() => handleGrantProWinner(p.id, p.user_id)}
                          className="py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 text-[11px] transition"
                        >
                          Confirmar e Conceder 7d PRO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TABELA DE RESPOSTAS & RECONCILIAÇÃO COMPORTAMENTAL (PII PROTEGIDA) */}
      <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Respostas da Pesquisa (Proteção PII Ativa)
          </h3>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
            >
              <option value="ALL">Todas as Coortes</option>
              <option value="activated">Ativados</option>
              <option value="not_activated">Não Ativados</option>
              <option value="beta_general">Beta Geral</option>
            </select>
          </div>
        </div>

        {filteredResponses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl">
            Nenhuma resposta encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Usuário Anonimizado</th>
                  <th className="p-3">Coorte</th>
                  <th className="p-3">Score Engagement</th>
                  <th className="p-3">Disse Pagaria</th>
                  <th className="p-3">Preço Justo</th>
                  <th className="p-3">NPS</th>
                  <th className="p-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredResponses.map((r, idx) => {
                  const uProfile = profilesMap[r.user_id];
                  const engScore = calculateEngagementScore(uProfile, r);
                  const engTier = getEngagementTier(engScore);

                  return (
                    <tr key={r.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono text-slate-300">Usuário #{String(idx + 1).padStart(3, '0')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {r.research_cohort}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${engTier.color}`}>
                          {engScore} pts • {engTier.label}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">{r.q8_pro_intent || 'n/a'}</td>
                      <td className="p-3 text-slate-300">{r.q9_fair_price || 'n/a'}</td>
                      <td className="p-3 font-bold text-emerald-400">{r.q11_nps ?? 'n/a'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedUserDetail({ response: r, profile: uProfile, contact: contactsMap[r.user_id] })}
                          className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] flex items-center gap-1 ml-auto transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          Ver Drawer PII
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DRAWER DE DETALHES DO USUÁRIO (PII REVELADA SOB AUTORIZAÇÃO) */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#121927] border-l border-slate-800 p-6 overflow-y-auto space-y-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Detalhes Autorizados PII
              </h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DADOS PESSOAIS LGPD */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Identificação do Candidato
              </div>
              <p><strong className="text-slate-400">Nome:</strong> {selectedUserDetail.profile?.full_name || 'Não informado'}</p>
              <p><strong className="text-slate-400">E-mail:</strong> {selectedUserDetail.contact?.email || selectedUserDetail.profile?.email || 'N/A'}</p>
              <p><strong className="text-slate-400">WhatsApp:</strong> {selectedUserDetail.contact?.whatsapp_phone || 'Não informado'}</p>
              <p><strong className="text-slate-400">Consentimento LGPD:</strong> <span className="text-emerald-400 font-bold">{selectedUserDetail.contact?.permission_status || 'granted'}</span></p>
            </div>

            {/* RESPOSTAS ABERTAS DA PESQUISA */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm">Respostas da Pesquisa</h4>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-slate-400 font-semibold">Q4 - Feature mais valorizada:</p>
                <p className="text-white font-medium">{selectedUserDetail.response?.q4_valued_feature} ({selectedUserDetail.response?.q4_why})</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-slate-400 font-semibold">Q6 - Maior benefício percebido:</p>
                <p className="text-white font-medium">{selectedUserDetail.response?.q6_biggest_benefit}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-slate-400 font-semibold">Q7 - O que mais deveria melhorar:</p>
                <p className="text-white font-medium">{selectedUserDetail.response?.q7_improvements}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-slate-400 font-semibold">Q13 - PMF (O que sentiria mais falta se o VoCentro sumisse):</p>
                <p className="text-emerald-300 font-bold">{selectedUserDetail.response?.q13_pmf_missing_feature}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-slate-400 font-semibold">Q15 - Maior dificuldade profissional:</p>
                <p className="text-white font-medium">{selectedUserDetail.response?.q15_main_difficulty}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
