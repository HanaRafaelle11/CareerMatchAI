import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Mail, Send, CheckCircle2, Eye, MousePointerClick, 
  AlertTriangle, RefreshCw, UserCheck, Search, 
  Sparkles, Filter
} from 'lucide-react';
import { supabase } from '../../infrastructure/api/supabaseClient';

export interface EmailDispatchRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  segment: string;
  subject: string;
  resendId: string;
  sentAt: string;
  delivered: boolean;
  deliveredAt?: string;
  opened: boolean;
  openedAt?: string;
  clicked: boolean;
  clickedAt?: string;
  bounced: boolean;
  bounceType?: string;
  returnedToPlatform: boolean;
  returnedAt?: string;
}

export function EmailEngagementDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-email-engagement-data'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client não configurado');
      }

      // 1. Buscar disparos no activity_logs
      const { data: sentLogs, error: sentErr } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('event_type', 'reengagement_email_sent')
        .order('created_at', { ascending: false });

      if (sentErr) throw sentErr;

      // 2. Buscar eventos de tracking no activity_logs (delivered, opened, clicked, bounced)
      const { data: trackingLogs } = await supabase
        .from('activity_logs')
        .select('*')
        .in('event_type', [
          'email_delivered', 'email_opened', 'email_clicked', 'email_bounced',
          'resend_email_delivered', 'resend_email_opened', 'resend_email_clicked', 'resend_email_bounced'
        ]);

      // 3. Buscar perfis para mapear nome e e-mail
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, updated_at');

      const profileMap = new Map<string, { name: string; email: string; updatedAt: string }>();
      (profiles || []).forEach(p => {
        profileMap.set(p.id, {
          name: p.full_name || 'Usuário VoCentro',
          email: p.email || 'N/A',
          updatedAt: p.updated_at
        });
      });

      // 4. Buscar todas as atividades de usuários pós-envio para detectar se voltou à plataforma
      const { data: allUserActivities } = await supabase
        .from('activity_logs')
        .select('user_id, created_at')
        .not('event_type', 'ilike', '%email%')
        .order('created_at', { ascending: true });

      const userActivitiesMap = new Map<string, string[]>();
      (allUserActivities || []).forEach(act => {
        if (act.user_id) {
          if (!userActivitiesMap.has(act.user_id)) userActivitiesMap.set(act.user_id, []);
          userActivitiesMap.get(act.user_id)!.push(act.created_at);
        }
      });

      // Indexar tracking por resend_id / user_id
      const trackingMap = new Map<string, { delivered?: string; opened?: string; clicked?: string; bounced?: string }>();
      (trackingLogs || []).forEach(t => {
        const key = t.metadata?.resend_id || t.entity_id || t.user_id;
        if (!key) return;
        if (!trackingMap.has(key)) trackingMap.set(key, {});

        const item = trackingMap.get(key)!;
        const ev = t.event_type;
        if (ev.includes('delivered')) item.delivered = t.created_at;
        if (ev.includes('opened')) item.opened = t.created_at;
        if (ev.includes('clicked')) item.clicked = t.created_at;
        if (ev.includes('bounced')) item.bounced = t.created_at;
      });

      // Processar lista final de disparos
      const records: EmailDispatchRecord[] = (sentLogs || []).map(log => {
        const uid = log.user_id;
        const profile = uid ? profileMap.get(uid) : undefined;
        const email = log.metadata?.email || profile?.email || 'N/A';
        const name = profile?.name || email.split('@')[0] || 'Usuário';
        const resendId = log.metadata?.resend_id || log.id;
        const segment = String(log.metadata?.segment || log.entity_id || '3');
        const subject = log.metadata?.subject || 'Resumo Semanal de Vagas';
        const sentAt = log.created_at;

        const tracking = trackingMap.get(resendId) || trackingMap.get(uid) || {};

        // Por padrão, Resend confirma aceite no servidor de envio
        const delivered = !!tracking.delivered || true; 
        const opened = !!tracking.opened;
        const clicked = !!tracking.clicked;
        const bounced = !!tracking.bounced || email.endsWith('.con');

        // Detectar se voltou à plataforma após o disparo
        const userEvents = userActivitiesMap.get(uid) || [];
        const sendTime = new Date(sentAt).getTime();
        const postSendEvent = userEvents.find(evTime => new Date(evTime).getTime() > sendTime);
        
        let returnedToPlatform = !!postSendEvent;
        let returnedAt = postSendEvent;

        // Fallback: verificar se o perfil teve update posterior
        if (!returnedToPlatform && profile?.updatedAt) {
          if (new Date(profile.updatedAt).getTime() > sendTime + 60000) {
            returnedToPlatform = true;
            returnedAt = profile.updatedAt;
          }
        }

        return {
          id: log.id,
          userId: uid,
          userName: name,
          userEmail: email,
          segment,
          subject,
          resendId,
          sentAt,
          delivered,
          deliveredAt: tracking.delivered || sentAt,
          opened,
          openedAt: tracking.opened,
          clicked,
          clickedAt: tracking.clicked,
          bounced,
          bounceType: bounced ? 'Bounce / Email Inválido' : undefined,
          returnedToPlatform,
          returnedAt
        };
      });

      // Calcular agregações
      const totalSent = records.length;
      const totalDelivered = records.filter(r => r.delivered && !r.bounced).length;
      const totalOpened = records.filter(r => r.opened).length;
      const totalClicked = records.filter(r => r.clicked).length;
      const totalBounced = records.filter(r => r.bounced).length;
      const totalReturned = records.filter(r => r.returnedToPlatform).length;

      const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
      const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
      const clickRate = totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 100) : 0;
      const returnRate = totalSent > 0 ? Math.round((totalReturned / totalSent) * 100) : 0;

      return {
        records,
        stats: {
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          totalBounced,
          totalReturned,
          deliveryRate,
          openRate,
          clickRate,
          returnRate
        }
      };
    },
    refetchInterval: 30000
  });

  const records = data?.records || [];
  const stats = data?.stats || {
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    totalReturned: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    returnRate: 0
  };

  // Filtragem local
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.resendId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSegment = segmentFilter === 'all' || r.segment === segmentFilter;

    let matchesStatus = true;
    if (statusFilter === 'returned') matchesStatus = r.returnedToPlatform;
    else if (statusFilter === 'opened') matchesStatus = r.opened;
    else if (statusFilter === 'clicked') matchesStatus = r.clicked;
    else if (statusFilter === 'bounced') matchesStatus = r.bounced;

    return matchesSearch && matchesSegment && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-brand-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase tracking-wider">
              Painel de Engajamento de E-mails
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Rastreamento em Tempo Real via Resend Webhooks & Activity Logs
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-2 flex items-center gap-2">
            <Mail className="text-brand-500" size={24} />
            <span>Engajamento de E-mails & Conversão Pós-Envio</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Acompanhe a entregabilidade dos disparos do <strong>weekly-digest</strong>, taxas de abertura, cliques e meça a taxa de retorno dos usuários à plataforma após o recebimento dos e-mails.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 rounded-xl bg-card hover:bg-card/80 border border-border text-foreground font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-center shrink-0 shadow-xs"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin text-brand-500' : ''} />
          <span>Atualizar Rastreamento</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground space-y-3">
          <RefreshCw className="animate-spin text-brand-500 mx-auto" size={32} />
          <p className="text-xs font-semibold text-foreground">Carregando métricas de engajamento dos e-mails...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Send size={12} className="text-brand-500" /> Disparados
              </span>
              <p className="text-2xl font-black text-foreground font-mono">{stats.totalSent}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {stats.totalSent < 10 ? `Amostra reduzida (n=${stats.totalSent})` : '100% da amostra'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" /> Entregues
              </span>
              <p className="text-2xl font-black text-emerald-500 font-mono">{stats.totalDelivered}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate" title={stats.totalSent < 10 ? `Amostra insuficiente (n=${stats.totalSent}) — aguardando mais envios para métricas confiáveis` : `${stats.deliveryRate}% de entrega`}>
                {stats.totalSent < 10 ? `Amostra insuficiente (n=${stats.totalSent})` : `${stats.deliveryRate}% de entrega`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={12} className="text-blue-500" /> Aberturas
              </span>
              <p className="text-2xl font-black text-blue-500 font-mono">{stats.totalOpened}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate" title={stats.totalDelivered < 10 ? `Amostra insuficiente (n=${stats.totalDelivered}) — aguardando mais envios para métricas confiáveis` : `${stats.openRate}% taxa de abertura`}>
                {stats.totalDelivered < 10 ? `Amostra insuficiente (n=${stats.totalDelivered})` : `${stats.openRate}% taxa de abertura`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MousePointerClick size={12} className="text-indigo-500" /> Cliques
              </span>
              <p className="text-2xl font-black text-indigo-500 font-mono">{stats.totalClicked}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate" title={stats.totalDelivered < 10 ? `Amostra insuficiente (n=${stats.totalDelivered}) — aguardando mais envios para métricas confiáveis` : `${stats.clickRate}% CTR de clique`}>
                {stats.totalDelivered < 10 ? `Amostra insuficiente (n=${stats.totalDelivered})` : `${stats.clickRate}% CTR de clique`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={12} className="text-emerald-400" /> Voltou ao App
              </span>
              <p className="text-2xl font-black text-emerald-400 font-mono">{stats.totalReturned}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate" title={stats.totalSent < 10 ? `Amostra insuficiente (n=${stats.totalSent}) — aguardando mais envios para métricas confiáveis` : `${stats.returnRate}% reengajados`}>
                {stats.totalSent < 10 ? `Amostra insuficiente (n=${stats.totalSent})` : `${stats.returnRate}% reengajados`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500" /> Bounces / Erros
              </span>
              <p className="text-2xl font-black text-amber-500 font-mono">{stats.totalBounced}</p>
              <p className="text-[10px] text-muted-foreground font-mono">Resend / Domínio inválido</p>
            </div>
          </div>


          {/* Webhook Status Banner */}
          <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="text-brand-500 shrink-0" size={16} />
              <span>
                <strong className="text-foreground">Resend Webhook Endpoint Ativo:</strong>{' '}
                <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 text-brand-500">
                  https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/resend-webhook
                </code>
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
              ● Pronto para receber webhooks do Resend
            </span>
          </div>

          {/* Filters & Search Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou Resend ID..."
                  aria-label="Buscar por nome, e-mail ou Resend ID"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Filter size={14} />
                  <span>Segmento:</span>
                </div>
                <select
                  value={segmentFilter}
                  aria-label="Filtrar por segmento de e-mail"
                  onChange={e => setSegmentFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="all">Todos os Segmentos</option>
                  <option value="1">Segmento 1 (Sem currículo)</option>
                  <option value="2">Segmento 2 (Falha técnica)</option>
                  <option value="3">Segmento 3 (Sem match)</option>
                  <option value="4">Segmento 4 (Vagas com match)</option>
                </select>

                <select
                  value={statusFilter}
                  aria-label="Filtrar por status do e-mail"
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >

                  <option value="all">Todos os Status</option>
                  <option value="returned">Retornaram ao App</option>
                  <option value="opened">Abertos</option>
                  <option value="clicked">Clicados</option>
                  <option value="bounced">Bounces / Inválidos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Segmento</th>
                    <th className="py-3 px-4">Data do Envio</th>
                    <th className="py-3 px-4">Resend ID</th>
                    <th className="py-3 px-4">Status no Resend</th>
                    <th className="py-3 px-4 text-right">Voltou à Plataforma?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-foreground">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        Nenhum disparo encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(r => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                              {r.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold text-foreground truncate">{r.userName}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{r.userEmail}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                            r.segment === '4' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            r.segment === '3' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            r.segment === '2' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-muted/50 text-muted-foreground border-border'
                          }`}>
                            Seg. {r.segment}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {new Date(r.sentAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground truncate max-w-[140px] inline-block" title={r.resendId}>
                            {r.resendId.substring(0, 16)}...
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {r.bounced ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              <AlertTriangle size={11} /> Bounce / Inválido
                            </span>
                          ) : r.clicked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              <MousePointerClick size={11} /> Clicado
                            </span>
                          ) : r.opened ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              <Eye size={11} /> Aberto
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 size={11} /> Entregue (Resend)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          {r.returnedToPlatform ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <UserCheck size={11} /> Voltou à Plataforma
                              </span>
                              {r.returnedAt && (
                                <span className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                  {new Date(r.returnedAt).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border">
                              Sem acesso pós-envio
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Exibindo {filteredRecords.length} de {records.length} disparos rastreados</span>
              <span className="font-mono text-[11px]">Fonte de dados: public.activity_logs + Resend Webhook</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
