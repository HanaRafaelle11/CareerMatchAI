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
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());
  const [contactsMap, setContactsMap] = useState<Record<string, any>>({});
  const [emailCampaigns, setEmailCampaigns] = useState<any[]>([]);
  const [surveyEvents, setSurveyEvents] = useState<any[]>([]);
  const [segmentDrawer, setSegmentDrawer] = useState<{ title: string; users: any[] } | null>(null);

  // Campaign & Giveaway Config
  const [campaignStatus] = useState<string>('OPEN');
  const [drawDate] = useState<string>('14/08/2026 às 20:00 (Horário de Brasília)');
  const [sendAdminCopy, setSendAdminCopy] = useState<boolean>(false);
  const [wavePreview, setWavePreview] = useState<{ wave: string; eligible: number; invited: number; delivered?: number; responded?: number; failed?: number; pending: number } | null>(null);


  // Additional Drawer & Filter state
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [cohortFilter, setCohortFilter] = useState<string>('ALL');
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

      // 4. Fetch survey events
      const { data: events } = await supabase.from('survey_events').select('*').order('created_at', { ascending: false });
      setSurveyEvents(events || []);

      // 5. Fetch research contacts (LGPD decoupled)
      const { data: contacts } = await supabase.from('research_contacts').select('*');
      const cMap: Record<string, any> = {};
      (contacts || []).forEach(c => {
        cMap[c.user_id] = c;
      });
      setContactsMap(cMap);

      // 6. Fetch profiles for real vs test identification
      const { data: profiles } = await supabase.from('profiles').select('*');
      const pMap: Record<string, any> = {};
      (profiles || []).forEach(p => {
        pMap[p.id] = p;
      });
      setProfilesMap(pMap);

      // 7. Fetch activity markers for activation segmentation
      const { data: activeResumes } = await supabase.from('resume_versions').select('user_id');
      const { data: activeMatches } = await supabase.from('job_feedback').select('user_id');
      const { data: activeApps } = await supabase.from('applications').select('user_id');

      const actSet = new Set<string>([
        ...(activeResumes || []).map((r: any) => r.user_id),
        ...(activeMatches || []).map((m: any) => m.user_id),
        ...(activeApps || []).map((a: any) => a.user_id)
      ]);
      setActiveUserIds(actSet);

    } catch (err) {
      console.error('[UserResearch] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dispatch survey emails via wave with safety preview
  const handlePreviewWave = (wave: string) => {
    const testPatterns = ['e2e', 'hardening', 'test', 'admin', 'vocentro.com.br', 'example.com', 'demo', 'qa'];
    const realProfiles = Object.values(profilesMap).filter((p: any) => {
      const email = (p.email || '').toLowerCase();
      const name = (p.full_name || '').toLowerCase();
      return !testPatterns.some(pat => email.includes(pat) || name.includes(pat));
    });

    const targetProfiles = realProfiles.filter((p: any) => {
      const isActivated = Boolean(p.primary_resume_id) || activeUserIds.has(p.id);
      if (wave === 'activated') return isActivated;
      if (wave === 'not_activated') return !isActivated;
      return true; // beta_general or ALL
    });

    const totalEligible = targetProfiles.length;
    const targetUserIds = new Set(targetProfiles.map((p: any) => p.id));

    const isCohortMatch = (cCohort: string, targetWave: string) => {
      if (targetWave === 'beta_general' || targetWave === 'ALL') {
        return cCohort === 'beta_general' || cCohort === 'ALL';
      }
      return cCohort === targetWave;
    };

    const invitedUserIds = new Set(
      emailCampaigns
        .filter(c => targetUserIds.has(c.user_id) && isCohortMatch(c.cohort, wave))
        .map(c => c.user_id)
    );

    const deliveredUserIds = new Set(
      emailCampaigns
        .filter(c => targetUserIds.has(c.user_id) && isCohortMatch(c.cohort, wave) && ['delivered', 'opened', 'clicked', 'responded', 'survey_completed'].includes(c.status))
        .map(c => c.user_id)
    );

    const respondedUserIds = new Set(
      surveyResponses
        .filter(r => targetUserIds.has(r.user_id) && isCohortMatch(r.research_cohort, wave))
        .map(r => r.user_id)
    );

    const failedUserIds = new Set(
      emailCampaigns
        .filter(c => targetUserIds.has(c.user_id) && isCohortMatch(c.cohort, wave) && ['bounced', 'failed'].includes(c.status))
        .map(c => c.user_id)
    );

    const invitedCount = invitedUserIds.size;
    const deliveredCount = deliveredUserIds.size;
    const respondedCount = respondedUserIds.size;
    const failedCount = failedUserIds.size;
    const pendingCount = Math.max(0, totalEligible - invitedCount);

    setWavePreview({
      wave,
      eligible: totalEligible,
      invited: invitedCount,
      delivered: deliveredCount,
      responded: respondedCount,
      failed: failedCount,
      pending: pendingCount
    });
  };

  const handleConfirmDispatchWave = async () => {
    if (!wavePreview) return;
    if (!supabase) {
      setDispatchStatus('⚠️ Erro: Conexão com Supabase não configurada.');
      return;
    }

    // ── VERIFICAÇÃO DE SESSÃO E TOKEN NO FRONTEND ──
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (sessionError || !session || !session.access_token) {
      setDispatchStatus('⚠️ Erro: Sessão de administrador não encontrada ou expirada. Por favor, autentique-se novamente.');
      console.warn('[UserResearchDashboard] Disparo cancelado: token de acesso ausente ou sessão inválida.');
      return;
    }

    setDispatchStatus(`Disparando onda [${wavePreview.wave}] para ${wavePreview.pending} destinatários pendentes...`);
    try {
      const res = await fetch('https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/send-survey-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          cohortTarget: wavePreview.wave, 
          emailType: 'initial_invite',
          sendAdminCopy
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error || `Erro HTTP ${res.status}: ${res.statusText}`;
        console.error(`[UserResearchDashboard] Erro no disparo (${res.status}):`, errorMsg);
        setDispatchStatus(`⚠️ Falha no disparo (${res.status}): ${errorMsg}`);
        return;
      }

      setDispatchStatus(`✓ Sucesso! E-mails registrados na onda [${wavePreview.wave}] (${data.count || wavePreview.pending} candidatos). ${sendAdminCopy ? '+1 Cópia administrativa enviada.' : ''}`);
      setWavePreview(null);
      fetchResearchData();
    } catch (err: any) {
      console.error('[UserResearchDashboard] Exceção na requisição:', err?.message || err);
      setDispatchStatus(`⚠️ Erro ao disparar onda: ${err.message || 'Falha na conexão'}`);
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

        {/* CONFIGURAÇÃO E STATUS DA CAMPANHA DE SORTEIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* META DA PESQUISA BETA */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5" title="30 é a meta de respostas desta rodada, não o total de usuários da plataforma.">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Meta da Pesquisa Beta (Amostragem):
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {totalResponses} / {targetGoal} respostas válidas ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              * 30 é a meta de respostas desta rodada para validarmos PMF por coorte, não o universo total da plataforma.
            </p>
          </div>

          {/* STATUS DO PRÓXIMO SORTEIO */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-400" />
                Status do Sorteio 7 Dias PRO:
              </span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                campaignStatus === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {campaignStatus}
              </span>
            </div>
            <div className="text-slate-300">
              📅 Próximo Sorteio: <span className="font-bold text-amber-400">{drawDate}</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Participantes elegíveis cadastrados: <strong className="text-white">{giveawayParticipants.filter(g => g.status === 'eligible').length}</strong>
            </div>
          </div>
        </div>

        {/* CONTROLES DE DISPARO DE E-MAIL POR ONDA COM SEGURANÇA */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-300 font-bold">Disparo em Ondas (Resend):</span>
              <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendAdminCopy}
                  onChange={(e) => setSendAdminCopy(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
                <span>☑ Enviar uma cópia para mim (Admin)</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePreviewWave('activated')}
                className="py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium transition"
              >
                Enviar Onda [Ativados]
              </button>
              <button
                onClick={() => handlePreviewWave('not_activated')}
                className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-medium transition"
              >
                Enviar Onda [Não Ativados]
              </button>
              <button
                onClick={() => handlePreviewWave('beta_general')}
                className="py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium transition"
              >
                Enviar Onda [Beta Geral]
              </button>
            </div>
          </div>

          {/* CARD DE PRÉ-VISUALIZAÇÃO DA ONDA */}
          {wavePreview && (
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs space-y-3 shadow-xl">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  PRÉVIA DA CAMPANHA — Onda: [{wavePreview.wave === 'ALL' ? 'Beta Geral' : wavePreview.wave}]
                </span>
                <button onClick={() => setWavePreview(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Elegíveis</span>
                  <span className="font-bold text-white text-sm">{wavePreview.eligible}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Já Convidados</span>
                  <span className="font-bold text-amber-400 text-sm">{wavePreview.invited}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Já Entregues</span>
                  <span className="font-bold text-cyan-400 text-sm">{wavePreview.delivered || 0}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Já Responderam</span>
                  <span className="font-bold text-emerald-400 text-sm">{wavePreview.responded || 0}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Bounce/Falha</span>
                  <span className="font-bold text-rose-400 text-sm">{wavePreview.failed || 0}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Pendentes</span>
                  <span className="font-bold text-teal-400 text-sm">{wavePreview.pending}</span>
                </div>
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40">
                  <span className="text-emerald-300 block text-[9px] uppercase font-bold">Serão Enviados</span>
                  <span className="font-black text-emerald-400 text-sm">{wavePreview.pending}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Resumo: <strong className="text-white">{wavePreview.eligible} elegíveis</strong> → <strong className="text-amber-400">{wavePreview.invited} já convidados</strong> → <strong className="text-emerald-400">{wavePreview.pending} pendentes serão enviados agora</strong>.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setWavePreview(null)}
                    className="py-1.5 px-4 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDispatchWave}
                    className="py-1.5 px-5 rounded-lg bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition"
                  >
                    Confirmar Envio para {wavePreview.pending} Usuários
                  </button>
                </div>
              </div>
            </div>
          )}

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

        {/* Métricas derivadas de survey_events — fonte de verdade confiável */}
        {(() => {
          // survey_events é escrito diretamente pela edge function e pelo resend-webhook
          // Usa user_id único para evitar duplicatas (cada usuário conta 1 vez por evento)
          const sentUserIds = new Set(
            surveyEvents.filter(e => e.event_name === 'email_sent').map(e => e.user_id).filter(Boolean)
          );
          const openedUserIds = new Set(
            surveyEvents.filter(e => e.event_name === 'email_opened' || e.event_name === 'email_clicked').map(e => e.user_id).filter(Boolean)
          );
          // Fallback: se survey_events não tiver email_sent, usar emailCampaigns como backup
          const invitesSent = sentUserIds.size > 0 ? sentUserIds.size : emailCampaigns.length;
          const openedCount = openedUserIds.size;
          const surveyStarted = Math.max(totalResponses, openedCount);
          const completionRate = invitesSent === 0
            ? (totalResponses > 0 ? '100.0%' : '0.0%')
            : `${Math.min(100, (totalResponses / invitesSent) * 100).toFixed(1)}%`;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Convites Enviados</span>
                <div className="text-xl font-mono font-bold text-white">{invitesSent}</div>
                <span className="text-[9px] text-slate-500 block">survey_events · email_sent</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Abertura detectada</span>
                <div className="text-xl font-mono font-bold text-cyan-400">{openedCount}</div>
                <span className="text-[9px] text-slate-500 block">* Rastreio por imagem/pixel</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Pesquisas Iniciadas</span>
                <div className="text-xl font-mono font-bold text-amber-400">{surveyStarted}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Pesquisas Concluídas</span>
                <div className="text-xl font-mono font-bold text-emerald-400">{totalResponses}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Taxa de Conclusão</span>
                <div className="text-sm font-mono font-bold text-teal-400">{completionRate}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 cursor-pointer hover:border-indigo-500/50 transition" onClick={() => setSegmentDrawer({ title: 'Consentimentos LGPD Concedidos', users: Object.values(contactsMap).filter(c => c.permission_status === 'granted') })}>
                <span className="text-[11px] text-slate-400">Consentimentos LGPD</span>
                <div className="text-xl font-mono font-bold text-indigo-400">
                  {Object.values(contactsMap).filter(c => c.permission_status === 'granted').length}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* RASTREABILIDADE CANDIDATO POR CANDIDATO — QUEM FEZ O QUÊ? */}
      <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Matriz de Rastreabilidade Candidato por Candidato ("Quem fez o quê?")
          </h3>
          <span className="text-xs font-semibold text-slate-400">Jornada Individual Auditável</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/50">
                <th className="p-3 font-semibold">Candidato</th>
                <th className="p-3 font-semibold text-center">Enviado</th>
                <th className="p-3 font-semibold text-center">Entregue</th>
                <th className="p-3 font-semibold text-center">Abertura Detectada</th>
                <th className="p-3 font-semibold text-center">Clicou</th>
                <th className="p-3 font-semibold text-center">Pesq. Aberta</th>
                <th className="p-3 font-semibold text-center">Iniciou</th>
                <th className="p-3 font-semibold text-center">Abandono</th>
                <th className="p-3 font-semibold text-center">Concluiu</th>
                <th className="p-3 font-semibold text-center">LGPD</th>
                <th className="p-3 font-semibold text-center">Sorteio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {emailCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-4 text-center text-slate-500 italic">Nenhum envio registrado ainda.</td>
                </tr>
              ) : (
                emailCampaigns.map((c, idx) => {
                  const hasResponse = surveyResponses.some(r => r.user_id === c.user_id);
                  const hasContact = contactsMap[c.user_id]?.permission_status === 'granted';
                  const isGiveaway = giveawayParticipants.some(g => g.user_id === c.user_id);
                  const userEvents = surveyEvents.filter(e => e.user_id === c.user_id);
                  
                  const isDelivered = c.status === 'delivered' || c.status === 'opened' || c.status === 'clicked' || c.status === 'responded' || c.status === 'sent';
                  const isOpened = c.status === 'opened' || c.status === 'clicked' || c.status === 'responded' || userEvents.some(e => e.event_name === 'email_opened');
                  const isClicked = c.status === 'clicked' || c.status === 'responded' || userEvents.some(e => e.event_name === 'email_clicked');
                  const isSurveyOpened = userEvents.some(e => e.event_name === 'survey_opened') || isClicked || hasResponse;
                  const isStarted = userEvents.some(e => e.event_name === 'survey_started') || hasResponse;

                  // Find drop-off question if abandoned
                  const lastQuestionEvent = userEvents.filter(e => e.event_name === 'survey_question_viewed').pop();
                  const abandonedQuestion = (!hasResponse && isStarted) ? `Q${lastQuestionEvent?.question_number || 1}` : '—';

                  return (
                    <tr key={c.id || idx} className="hover:bg-slate-900/40 transition">
                      <td className="p-3 font-medium text-white flex items-center gap-2">
                        <span>Usuário #{String(idx + 1).padStart(3, '0')}</span>
                        {c.email?.includes('test') && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">QA</span>}
                      </td>
                      <td className="p-3 text-center text-emerald-400">✅</td>
                      <td className="p-3 text-center">{isDelivered ? <span className="text-emerald-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                      <td className="p-3 text-center">{isOpened ? <span className="text-cyan-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                      <td className="p-3 text-center">{isClicked ? <span className="text-indigo-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                      <td className="p-3 text-center">{isSurveyOpened ? <span className="text-indigo-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                      <td className="p-3 text-center">{isStarted ? <span className="text-amber-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                      <td className="p-3 text-center font-mono">{abandonedQuestion !== '—' ? <span className="text-rose-400 font-bold">{abandonedQuestion}</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="p-3 text-center">{hasResponse ? <span className="text-emerald-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                      <td className="p-3 text-center">{hasContact ? <span className="text-emerald-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                      <td className="p-3 text-center">{isGiveaway ? <span className="text-amber-400">✅</span> : <span className="text-slate-600">❌</span>}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAINEL DE TRILHA DE AUDITORIA DO SORTEIO */}
      <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            Trilha de Auditoria do Sorteio (7 Dias PRO Ilimitado)
          </h3>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
            Status: {campaignStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400">Data Programada</span>
            <div className="font-mono font-bold text-white text-sm">{drawDate}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400">Participantes Elegíveis</span>
            <div className="font-mono font-bold text-amber-400 text-sm">{giveawayParticipants.length} candidatos</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400">Método de Sorteio</span>
            <div className="font-mono font-bold text-cyan-400 text-xs">Crypto.getRandomValues()</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400">Lifecycle do Prêmio</span>
            <div className="font-mono font-bold text-emerald-400 text-xs">GRANTED (Automático)</div>
          </div>
        </div>
      </div>

      {/* BLOCO DE ABANDONO POR PERGUNTA (HEATMAP / DROP-OFF) */}
      <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-rose-400" />
          Análise de Abandono por Pergunta (Fricção Q1 → Q16)
        </h3>
        <p className="text-xs text-slate-400">
          Mapeamento dos pontos exatos de abandono durante o preenchimento da pesquisa para otimização da UX.
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-1.5 pt-2">
          {Array.from({ length: 16 }, (_, i) => i + 1).map((qNum) => {
            const viewedEvents = surveyEvents.filter(e => e.event_name === 'survey_question_viewed' && e.question_number === qNum);
            const dropoffCount = Math.max(0, viewedEvents.length - surveyResponses.length);
            return (
              <div 
                key={qNum} 
                className={`p-2 rounded-lg border text-center space-y-1 ${
                  dropoffCount > 0 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-bold block">Q{qNum}</span>
                <span className="text-xs font-mono font-black text-white">{dropoffCount}</span>
                <span className="text-[9px] block text-slate-500">saídas</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE DRILL-DOWN POR SEGMENTO */}
      {segmentDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">{segmentDrawer.title} ({segmentDrawer.users.length})</h3>
              <button onClick={() => setSegmentDrawer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {segmentDrawer.users.length === 0 ? (
                <p className="text-slate-500 italic">Nenhum registro encontrado neste segmento.</p>
              ) : (
                segmentDrawer.users.map((u, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Usuário #{String(idx + 1).padStart(3, '0')}</span>
                      <span className="text-[10px] text-slate-400">ID: {u.user_id || u.id}</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-mono text-[10px]">
                      {u.permission_status || u.status || 'Registrado'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setSegmentDrawer(null)} className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold">
              Fechar Visualização
            </button>
          </div>
        </div>
      )}




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
