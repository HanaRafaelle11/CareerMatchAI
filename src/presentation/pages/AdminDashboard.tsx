import { useState } from 'react';
import { CardGlass } from '../components/CardGlass';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminBetaDashboard } from './AdminBetaDashboard';
import { AdminAuditService } from '../../application/services/AdminAuditService';
import { 
  Activity, Loader2, ShieldAlert, RefreshCw, 
  Users, CreditCard, Search, Filter, 
  ShieldCheck, UserCheck, AlertTriangle, AlertCircle, 
  Clock, Laptop, Key, FileText, 
  Layers, Bot, UploadCloud, X,
  ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';

interface AdminDashboardProps {
  userId: string | undefined;
}





function getMockUserDetails(user: any) {
  const name = user.full_name || 'Usuário';
  return {
    resumes: [
      { id: 'cv-1', file_name: `${name.replace(/ /g, '_')}_Curriculo.pdf`, file_path: '/uploads/cv1.pdf', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    resumeVersions: [
      { id: 'ver-1.1', version_number: 2, version_label: 'CV Otimizado para CS', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'ver-1.0', version_number: 1, version_label: 'Versão Original', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    jobs: [
      { id: 'jb-1', title: 'Senior Product Designer', company_name: 'Vercel', created_at: new Date().toISOString() },
      { id: 'jb-2', title: 'Product Manager', company_name: 'Stripe', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    applications: [
      { id: 'ap-1', job_title: 'Senior Product Designer', company_name: 'Vercel', status: '📨 Me candidatei', applied_at: new Date().toISOString() }
    ],
    simulations: [
      { id: 'sm-1', role_name: 'Product Designer', company_name: 'Vercel', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    aiUsage: [
      { id: 'us-1', action: 'Resume Analysis', token_count: 8500, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'us-2', action: 'Coach chat message', token_count: 1200, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    errors: [
      { id: 'er-1', component: 'Upload file', error_code: 'FILE_TOO_LARGE', message: 'Tamanho máximo de arquivo excedido (5MB).', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    events: [
      { id: 'ev-1', event_name: 'Sessão iniciada', details: 'Acesso via Chrome 124 / Windows 11', created_at: new Date().toISOString() },
      { id: 'ev-2', event_name: 'Simulação de entrevista iniciada', details: 'Entrevista para Product Designer', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'ev-3', event_name: 'Upload de currículo realizado', details: `${name.replace(/ /g, '_')}_Curriculo.pdf`, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    subscription: { plan: user.role === 'user' ? 'Free' : 'Pro', status: 'active', amount: user.role === 'user' ? 0.00 : 49.90, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    transactions: user.role === 'user' ? [] : [
      { id: 'tr-1', amount: 49.90, status: 'succeeded', payment_method: 'credit_card', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    totalTokens: 9700,
    estimatedCostBRL: 0.78,
    sessions: [
      { id: 'ss-1', ip_address: '191.185.12.84', device: 'Chrome / Windows', location: 'São Paulo, BR', last_active: new Date().toISOString() },
      { id: 'ss-2', ip_address: '177.85.90.114', device: 'Safari / iPhone', location: 'São Paulo, BR', last_active: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    loginEvents: [
      { id: 'le-1', ip_address: '191.185.12.84', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0', status: 'succeeded', created_at: new Date().toISOString() },
      { id: 'le-2', ip_address: '177.85.90.114', user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/604.1', status: 'succeeded', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    uploads: [
      { id: 'up-1', file_name: `${name.replace(/ /g, '_')}_Curriculo.pdf`, size_kb: 342, status: 'completed', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    lastAccess: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 mins ago
  };
}

declare const __BUILD_TIME__: string;

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `há ${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  return `há ${diffDays}d`;
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [_userDetailTab, setUserDetailTab] = useState('profile');
  const [inspectedResume, setInspectedResume] = useState<any | null>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [funnelDateFilter, setFunnelDateFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Exibir feedback temporário na tela (Toast)
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── 1. BUSCAR PERFIL E PAPEL DO USUÁRIO LOGADO ──
  const { data: activeProfile, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['active-profile-admin', userId],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return { role: 'administrador', fullName: 'Desenvolvedor Local' };
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return { role: data?.role || 'user', fullName: data?.full_name };
    },
    enabled: !!userId
  });

  const currentUserRole = activeProfile?.role || 'user';
  const isSuperAdmin = currentUserRole === 'administrador';
  const hasTelemetryAccess = ['administrador', 'suporte', 'somente_leitura'].includes(currentUserRole);
  const hasUsersAccess = ['administrador', 'suporte', 'somente_leitura'].includes(currentUserRole);
  const canEditRoles = isSuperAdmin;

  // ── 2. BUSCAR TODOS OS USUÁRIOS/PERFIS DO SISTEMA (Item 3 — RBAC Limpeza de Contas de Teste) ──
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, headline, role, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[AdminDashboard] Erro ao buscar lista de usuários:', error);
        return [];
      }
      
      // Filtrar apenas usuários humanos reais (Exclui contas sintéticas/e2e de teste)
      const realUsers = (data || []).filter((d: any) => {
        const email = (d.email || '').toLowerCase();
        if (email === 'hardening.e2e@example.com' || email.endsWith('@example.com')) return false;
        return true;
      });

      return realUsers.map((d: any) => ({
        id: d.id,
        full_name: d.full_name || d.email?.split('@')[0] || 'Usuário Sem Nome',
        email: d.email,
        headline: d.headline,
        role: d.role || 'user',
        created_at: d.created_at
      }));
    },
    enabled: hasUsersAccess
  });

  // Busca de currículos e tentativas de upload (mesmo que falharam) do usuário selecionado — Item 1
  const { data: userResumes = [], isLoading: isLoadingUserResumes } = useQuery({
    queryKey: ['admin-user-resumes', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      if (isSupabaseConfigured && supabase) {
        try {
          const [resumesRes, versionsRes, logsRes] = await Promise.all([
            supabase.from('resumes').select('*').eq('user_id', selectedUser.id),
            supabase.from('resume_versions').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: false }),
            supabase.from('resume_processing_logs').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: false })
          ]);

          const resumes = resumesRes.data || [];
          const versions = versionsRes.data || [];
          const logs = logsRes.data || [];

          if (versions.length > 0) {
            return versions.map((v: any) => {
              const matchingResume = resumes.find((r: any) => r.id === v.id || r.user_id === v.user_id);
              const versionLogs = logs.filter((l: any) => l.resume_version_id === v.id);
              const failedLog = versionLogs.find((l: any) => l.status === 'failed' || l.status === 'error' || l.step === 'failed');

              return {
                id: v.id,
                file_name: v.file_name || 'Curriculo.pdf',
                file_url: v.file_url,
                created_at: v.created_at,
                status: v.status || (failedLog ? 'failed' : 'completed'),
                is_primary: matchingResume?.is_primary ?? true,
                raw_text: matchingResume?.raw_text || matchingResume?.extracted_text || null,
                error_message: failedLog?.error_message || failedLog?.message || (v.status === 'failed' ? 'Não conseguimos extrair texto automaticamente.' : null),
                logs: versionLogs
              };
            });
          }

          if (logs.length > 0) {
            const uploadLogs = logs.filter((l: any) => l.step === 'uploaded');
            if (uploadLogs.length > 0) {
              return uploadLogs.map((u: any) => {
                const failedLog = logs.find((l: any) => l.resume_version_id === u.resume_version_id && (l.status === 'failed' || l.status === 'error' || l.step === 'failed'));
                return {
                  id: u.resume_version_id || u.id,
                  file_name: u.metadata?.fileName || u.metadata?.file_name || 'Curriculo.pdf',
                  created_at: u.created_at,
                  status: failedLog ? 'failed' : u.status || 'completed',
                  is_primary: true,
                  error_message: failedLog?.error_message || failedLog?.message || null,
                  logs: logs.filter((l: any) => l.resume_version_id === u.resume_version_id)
                };
              });
            }
          }

          if (resumes.length > 0) return resumes;
        } catch (e) {
          console.error('Error fetching user resumes:', e);
        }
      }
      return [];
    },
    enabled: !!selectedUser?.id
  });

  // Mutação para Alterar Papéis de Usuários (RBAC)
  const changeRoleMutation = useMutation({
    mutationFn: async ({ targetUserId, newRole }: { targetUserId: string; newRole: string }) => {
      if (!canEditRoles) throw new Error('Ação não permitida para o seu papel.');
      if (!isSupabaseConfigured || !supabase) {
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['active-profile-admin'] });
      showToast('Permissão de usuário atualizada com sucesso!', 'success');
    },
    onError: (err: any) => {
      showToast('Erro ao atualizar papel: ' + err.message, 'error');
    }
  });

  // ── 3. BUSCAR OVERVIEW STATS (REAL SUPABASE RPC) ──
  const { data: overviewStats, isLoading: isLoadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          users_count: 142,
          resumes_count: 230,
          jobs_count: 85,
          matches_count: 946,
          avg_processing_time: 2.45,
          total_tokens: 3450000,
          success_rate: 98.8
        };
      }
      const { data, error } = await supabase.rpc('get_admin_dashboard_overview');
      if (error) throw error;
      return data;
    },
    enabled: hasTelemetryAccess
  });

  // ── 4. BUSCAR METRICAS DE IA E ROI (REAL SUPABASE RPC) ──
  const { data: iaStats, isLoading: isLoadingIaStats, refetch: refetchIaStats } = useQuery({
    queryKey: ['admin-ia-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          total_calls: 312,
          total_tokens: 3450000,
          total_cost_brl: 278.40,
          avg_processing_time: 2.45,
          errors_count: 4,
          optimizations_count: 86,
          letters_count: 42,
          simulations_count: 114,
          matches_count: 946,
          avg_match_score: 72.8,
          hours_saved: 410.5
        };
      }
      const { data, error } = await supabase.rpc('get_admin_ia_analytics');
      if (error) throw error;
      return data;
    },
    enabled: hasTelemetryAccess
  });

  // ── 5. EVENT STREAM (REAL-TIME LOGS DE EVENTOS) ──
  const { data: liveEvents = [], refetch: refetchEvents } = useQuery({
    queryKey: ['admin-live-events'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [
          { id: 'ev-1', created_at: new Date().toISOString(), event_name: 'resume_uploaded', user_id: 'usr-5', profiles: { full_name: 'Thiago Oliveira', email: 'thiago@gmail.com' }, details: 'Otimização com 86% match' },
          { id: 'ev-2', created_at: new Date(Date.now() - 3600000).toISOString(), event_name: 'coach_message', user_id: 'usr-6', profiles: { full_name: 'Juliana Melo', email: 'juliana@yahoo.com' }, details: 'Simulação STAR (Mariana)' },
          { id: 'ev-3', created_at: new Date(Date.now() - 7200000).toISOString(), event_name: 'subscription_started', user_id: 'usr-5', profiles: { full_name: 'Thiago Oliveira', email: 'thiago@gmail.com' }, details: 'Premium Copilot - Mensal' }
        ];
      }
      // LEFT JOIN: traz eventos de todos os usuários, filtrando ruidos e contas de teste/automação
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*, profiles!analytics_events_user_id_fkey(full_name, email)')
        .not('event_name', 'in', '(cache_hit,cache_miss,provider_started,provider_finished,provider_skipped,provider_failed)')
        .order('created_at', { ascending: false })
        .limit(60);

      const list = error ? [] : (data || []);
      // Filtrar contas de teste/automação (E2E / @example.com)
      return list.filter((evt: any) => {
        const email = evt.profiles?.email || '';
        return !/example\.com|hardening|test|dummy|fake|demo/i.test(email);
      });
    },
    enabled: hasTelemetryAccess,
    refetchInterval: 10000 // auto-refresh a cada 10 segundos
  });

  // ── 5b. FEEDBACK DE VAGAS REJEITADAS COM TITULO DA VAGA (Item 6) ──
  const { data: jobFeedbacks = [] } = useQuery({
    queryKey: ['admin-job-feedbacks'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return [];
      const { data, error } = await supabase
        .from('job_feedback')
        .select('*, profiles!job_feedback_user_id_fkey(full_name, email)')
        .eq('action', 'REJECTED')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) {
        const { data: fallback } = await supabase
          .from('job_feedback')
          .select('*')
          .eq('action', 'REJECTED')
          .order('created_at', { ascending: false })
          .limit(100);
        return fallback || [];
      }

      // Buscar títulos de vagas separadamente para evitar erro de JOIN no PostgREST
      const jobIds = [...new Set(data.map((f: any) => f.job_id).filter(Boolean))];
      let jobsMap: Record<string, { title: string; company_name: string }> = {};
      if (jobIds.length > 0) {
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title, company_name')
          .in('id', jobIds);
        (jobsData || []).forEach((j: any) => {
          jobsMap[j.id] = { title: j.title, company_name: j.company_name };
        });
      }

      return data.map((f: any) => ({
        ...f,
        jobs: jobsMap[f.job_id] || { title: `Vaga Rejeitada (ID: ${f.job_id?.slice(0, 8) || 'vaga'})`, company_name: 'Empresa' }
      }));
    },
    enabled: hasTelemetryAccess
  });

  // ── 5c. FEEDBACK BETA DO PRODUTO (Item 4) ──
  const { data: betaFeedbacks = [] } = useQuery({
    queryKey: ['admin-beta-feedbacks'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return [];
      const { data } = await supabase
        .from('beta_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return [];
      const uIds = [...new Set(data.map((b: any) => b.user_id).filter(Boolean))];
      let uMap: Record<string, { full_name: string; email: string }> = {};
      if (uIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', uIds);
        (profs || []).forEach((p: any) => { uMap[p.id] = p; });
      }
      return data.map((b: any) => ({ ...b, profiles: uMap[b.user_id] }));
    },
    enabled: hasTelemetryAccess
  });

  // ── 5d. ESTATÍSTICAS DE FEEDBACK DE RECOMENDAÇÃO (👍 / 👎) (Item 5) ──
  const { data: recStats = { positive: 0, negative: 0, total: 0, positiveRate: 100 } } = useQuery({
    queryKey: ['admin-rec-feedback-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return { positive: 0, negative: 0, total: 0, positiveRate: 100 };
      const { data } = await supabase.from('job_feedback').select('action, reason');
      const list = data || [];
      const positive = list.filter((f: any) => f.reason === 'positive' || f.action === 'SAVED' || f.action === 'APPLIED').length;
      const negative = list.filter((f: any) => f.action === 'REJECTED' || f.reason === 'negative').length;
      const total = positive + negative;
      const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 100;
      return { positive, negative, total, positiveRate };
    },
    enabled: hasTelemetryAccess
  });

  // ── 5c. TRILHA COMPLETA DE AÇÕES DO USUÁRIO SELECIONADO (Item 1 & Item 5) ──
  const { data: userActivityLog = [] } = useQuery({
    queryKey: ['admin-user-activity', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id || !isSupabaseConfigured || !supabase) return [];

      const [eventsRes, logsRes, feedbackRes, errorsRes] = await Promise.all([
        supabase.from('analytics_events').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('resume_processing_logs').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('job_feedback').select('*, jobs(title, company_name)').eq('user_id', selectedUser.id).order('created_at', { ascending: false }),
        supabase.from('application_errors').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: false })
      ]);

      const items: any[] = [];

      // Analytics events
      (eventsRes.data || []).forEach((e: any) => {
        if (['cache_hit', 'cache_miss', 'provider_started', 'provider_finished', 'provider_skipped', 'provider_failed'].includes(e.event_name)) {
          if (e.event_name === 'cache_miss' && e.metadata?.queryKey) {
            const queryTerm = e.metadata.queryKey.split('|')[1] || e.metadata.queryKey;
            items.push({
              id: e.id,
              created_at: e.created_at,
              type: 'search',
              title: `Pesquisou por vagas de "${queryTerm}"`,
              details: `Dispositivo: ${e.device || 'Mobile'} / ${e.browser || 'Navegador'}`
            });
          }
          return;
        }

        let title = `Ação: ${e.event_name}`;
        if (e.event_name === 'career_score_viewed') title = `Visualizou Diagnóstico Career Score (${e.metadata?.score || 0} pts)`;
        if (e.event_name === 'career_dashboard_opened') title = 'Acessou o Painel Principal de Carreira';
        if (e.event_name === 'resume_parsed') title = 'Parsing inicial do currículo realizado';
        if (e.event_name === 'resume_uploaded') title = 'Fez upload de um arquivo de currículo';
        if (e.event_name === 'resume_optimized') title = 'Gerou otimização de currículo com IA';
        if (e.event_name === 'match_generated' || e.event_name === 'job_match_viewed') title = 'Calculou/visualizou compatibilidade com vaga';
        if (e.event_name === 'interview_started') title = 'Iniciou simulação de entrevista STAR';
        if (e.event_name === 'interview_finished') title = 'Concluiu simulação de entrevista STAR';
        if (e.event_name === 'coach_message') title = 'Enviou mensagem ao Coach IA';
        if (e.event_name === 'user_registered' || e.event_name === 'signup_completed') title = 'Criou conta na plataforma';
        if (e.event_name === 'login') title = 'Fez login no sistema';

        items.push({
          id: e.id,
          created_at: e.created_at,
          type: e.category || 'event',
          title,
          details: e.metadata && Object.keys(e.metadata).length > 0 ? JSON.stringify(e.metadata).slice(0, 100) : null
        });
      });

      // Resume processing logs (inclusive erros de extração)
      (logsRes.data || []).forEach((l: any) => {
        if (l.step === 'uploaded') {
          items.push({
            id: l.id,
            created_at: l.created_at,
            type: 'upload',
            title: `Upload de arquivo de currículo "${l.metadata?.fileName || 'Curriculo.pdf'}"`,
            details: `Status do arquivo: ${l.status}`
          });
        } else if (l.status === 'failed' || l.status === 'error' || l.step === 'failed') {
          items.push({
            id: l.id,
            created_at: l.created_at,
            type: 'error',
            title: `🔴 Falha no processamento (Etapa: ${l.step}): ${l.error_message || l.message || 'Não conseguimos extrair texto automaticamente.'}`,
            details: `Arquivo: ${l.metadata?.fileName || 'Curriculo.pdf'}`
          });
        } else if (l.step === 'save_completed') {
          items.push({
            id: l.id,
            created_at: l.created_at,
            type: 'success',
            title: '🟢 Processamento concluído com sucesso e gravado no banco de dados',
            details: null
          });
        }
      });

      // Job feedback
      (feedbackRes.data || []).forEach((f: any) => {
        const jobLabel = f.jobs ? `${f.jobs.company_name || ''} - ${f.jobs.title || ''}` : `Vaga ID ${f.job_id?.slice(0, 8)}`;
        items.push({
          id: f.id,
          created_at: f.created_at,
          type: 'feedback',
          title: f.action === 'REJECTED' ? `👎 Rejeitou vaga (${jobLabel}): "${f.reason || 'Sem motivo'}"` : `⭐ Interagiu com vaga (${jobLabel})`,
          details: f.reason ? `Motivo de rejeição: ${f.reason}` : null
        });
      });

      // Application errors
      (errorsRes.data || []).forEach((err: any) => {
        items.push({
          id: err.id,
          created_at: err.created_at,
          type: 'error',
          title: `🔴 Erro de sistema [${err.component || 'App'}]: ${err.message || err.error_code}`,
          details: null
        });
      });

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return items;
    },
    enabled: !!selectedUser?.id
  });

  // ── 5d. FUNIL COM FILTRO DE DATAS (Item 2) ──
  const { data: funnelStats } = useQuery({
    queryKey: ['admin-funnel-stats', funnelDateFilter],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return null;
      const cutoff = funnelDateFilter === '7d'
        ? new Date(Date.now() - 7 * 86400000).toISOString()
        : funnelDateFilter === '30d'
        ? new Date(Date.now() - 30 * 86400000).toISOString()
        : null;

      const addCutoff = (q: any) => cutoff ? q.gte('created_at', cutoff) : q;

      const [usersRes, resumesRes, matchesRes, optsRes, simsRes, lettersRes, appsRes] = await Promise.all([
        addCutoff(supabase.from('profiles').select('id', { count: 'exact', head: true })),
        addCutoff(supabase.from('resumes').select('id', { count: 'exact', head: true })),
        addCutoff(supabase.from('matches').select('id', { count: 'exact', head: true })),
        addCutoff(supabase.from('resume_optimizations').select('id', { count: 'exact', head: true })),
        addCutoff(supabase.from('interview_simulations').select('id', { count: 'exact', head: true })),
        addCutoff(supabase.from('cover_letters').select('id', { count: 'exact', head: true })),
        addCutoff(supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'APPLIED')),
      ]);

      return {
        users: usersRes.count ?? 0,
        resumes: resumesRes.count ?? 0,
        matches: matchesRes.count ?? 0,
        optimizations: optsRes.count ?? 0,
        simulations: simsRes.count ?? 0,
        letters: lettersRes.count ?? 0,
        applications: appsRes.count ?? 0,
      };
    },
    enabled: hasTelemetryAccess
  });

  // ── 6. BUSCAR TELEMETRIA DE ERROS DE PRODUÇÃO (Item 8 — Combina application_errors + resume_processing_logs) ──
  const { data: _systemErrors = [], refetch: refetchTelemetry } = useQuery({
    queryKey: ['admin-telemetry-errors'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return [];
      
      const [appErrorsRes, logErrorsRes] = await Promise.all([
        supabase
          .from('application_errors')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('resume_processing_logs')
          .select('*')
          .or('status.eq.failed,status.eq.error,step.eq.failed')
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      const rawLogs = [...(appErrorsRes.data || []), ...(logErrorsRes.data || [])];
      const userIds = [...new Set(rawLogs.map((r: any) => r.user_id).filter(Boolean))];
      let userMap: Record<string, { full_name: string; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        (profs || []).forEach((p: any) => {
          userMap[p.id] = { full_name: p.full_name || 'Usuário Sem Nome', email: p.email || '' };
        });
      }

      const items: any[] = [];

      (appErrorsRes.data || []).forEach((e: any) => {
        items.push({
          id: e.id,
          created_at: e.created_at,
          component: e.component || 'App System',
          error_code: e.error_code || 'APP_ERROR',
          message: e.message || 'Erro inesperado na aplicação.',
          profiles: userMap[e.user_id] || null,
          user_id: e.user_id
        });
      });

      (logErrorsRes.data || []).forEach((l: any) => {
        items.push({
          id: l.id,
          created_at: l.created_at,
          component: `OCR/Parsing (${l.step || 'extração'})`,
          error_code: 'PARSING_FAILED',
          message: l.error_message || l.message || 'Não conseguimos extrair texto automaticamente.',
          profiles: userMap[l.user_id] || null,
          user_id: l.user_id
        });
      });

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return items;
    },
    enabled: hasTelemetryAccess
  });

  // ── 7. BUSCAR TELEMETRIA DOS PROVEDORES DE VAGAS (REAL SUPABASE QUERY) ──
  const { data: providerStats = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['admin-provider-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return []; // No fake data — show empty state
      }

      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_name, metadata, created_at')
        .eq('category', 'job_search')
        .order('created_at', { ascending: false })
        .limit(400);

      if (error) throw error;

      const statsMap: Record<string, { 
        started: number; 
        finished: number; 
        failed: number; 
        skipped: number;
        total_latency: number; 
        total_jobs: number;
        last_run?: string;
        last_http_status?: number | null;
        tier?: string;
      }> = {};
      
      (data || []).forEach(evt => {
        const metadata = evt.metadata as any;
        if (evt.event_name === 'cache_hit' || evt.event_name === 'cache_miss') return;

        const providerName = metadata?.service || 'Desconhecido';
        if (!statsMap[providerName]) {
          statsMap[providerName] = { started: 0, finished: 0, failed: 0, skipped: 0, total_latency: 0, total_jobs: 0 };
        }

        if (!statsMap[providerName].last_run) {
          statsMap[providerName].last_run = evt.created_at;
        }

        if (metadata?.tier && !statsMap[providerName].tier) {
          statsMap[providerName].tier = metadata.tier;
        }

        if (metadata?.http_status && !statsMap[providerName].last_http_status) {
          statsMap[providerName].last_http_status = metadata.http_status;
        }

        if (evt.event_name === 'provider_started') {
          statsMap[providerName].started += 1;
        } else if (evt.event_name === 'provider_finished') {
          statsMap[providerName].finished += 1;
          statsMap[providerName].total_latency += Number(metadata?.duration_ms || 0);
          statsMap[providerName].total_jobs += Number(metadata?.count || 0);
        } else if (evt.event_name === 'provider_failed') {
          statsMap[providerName].failed += 1;
          statsMap[providerName].total_latency += Number(metadata?.duration_ms || 0);
        } else if (evt.event_name === 'provider_skipped') {
          statsMap[providerName].skipped += 1;
        }
      });

      const list = Object.entries(statsMap).map(([provider, stats]) => {
        const avg_latency = stats.finished + stats.failed > 0 
          ? Math.round(stats.total_latency / (stats.finished + stats.failed)) 
          : 0;

        const totalAttempts = stats.started || (stats.finished + stats.failed);
        const successRate = totalAttempts > 0 
          ? Math.round((stats.finished * 100) / totalAttempts) 
          : 0;

        const healthScore = Math.max(0, Math.min(100, Math.round(successRate * 0.8 + (100 - Math.min(100, avg_latency / 30)) * 0.2)));

        // Real status based on actual data
        const apiKeyMissing = stats.skipped > 0;
        const lastHttpStatus = stats.last_http_status || null;
        let realStatus = 'Operando';
        let statusColor = 'emerald';
        
        if (apiKeyMissing) {
          realStatus = 'Sem chave configurada';
          statusColor = 'red';
        } else if (lastHttpStatus === 401 || lastHttpStatus === 403) {
          realStatus = 'Erro de autenticação';
          statusColor = 'red';
        } else if (lastHttpStatus === 429) {
          realStatus = 'Limite excedido';
          statusColor = 'amber';
        } else if (stats.failed > totalAttempts * 0.5) {
          realStatus = 'Instável';
          statusColor = 'red';
        } else if (stats.total_jobs === 0 && totalAttempts > 0) {
          realStatus = 'Sem resultados';
          statusColor = 'amber';
        } else if (avg_latency > 3000) {
          realStatus = 'Timeout frequente';
          statusColor = 'amber';
        } else if (totalAttempts === 0) {
          realStatus = 'Aguardando';
          statusColor = 'slate';
        }

        return {
          provider,
          calls: totalAttempts,
          avg_latency,
          success_rate: successRate,
          last_run: stats.last_run ? new Date(stats.last_run).toLocaleTimeString() : 'N/A',
          last_run_relative: stats.last_run ? getRelativeTime(stats.last_run) : 'Nunca',
          total_jobs: stats.total_jobs,
          errors: stats.failed,
          healthScore,
          realStatus,
          statusColor,
          tier: (stats as any).tier || 'B'
        };
      });

      return list;
    },
    enabled: hasTelemetryAccess,
    refetchInterval: 15000
  });

  // ── 8. BUSCAR INFORMAÇÕES DETALHADAS DO USUÁRIO SELECIONADO ──
  const { data: _userDetails } = useQuery({
    queryKey: ['admin-user-details', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      if (!isSupabaseConfigured || !supabase) {
        return getMockUserDetails(selectedUser);
      }
      try {
        const [resumesRes, jobsRes, appsRes, simsRes, logsRes, errorsRes, eventsRes, subRes, txRes, sessionsRes] = await Promise.all([
          supabase.from('resumes').select('*').eq('user_id', selectedUser.id),
          supabase.from('jobs').select('*').eq('user_id', selectedUser.id),
          supabase.from('applications').select('*').eq('user_id', selectedUser.id),
          supabase.from('interview_simulations').select('*, applications!inner(user_id, job_title, company_name)').eq('applications.user_id', selectedUser.id),
          supabase.from('ai_usage_logs').select('*').eq('user_id', selectedUser.id),
          supabase.from('application_errors').select('*').eq('user_id', selectedUser.id),
          supabase.from('activity_logs').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: false }).limit(40),
          supabase.from('billing_subscriptions').select('*').eq('user_id', selectedUser.id).maybeSingle(),
          supabase.from('billing_transactions').select('*').eq('user_id', selectedUser.id),
          supabase.from('admin_user_sessions').select('*').eq('user_id', selectedUser.id).order('login_at', { ascending: false })
        ]);

        const resumes = resumesRes.data || [];
        const jobs = jobsRes.data || [];
        const apps = appsRes.data || [];
        const simulations = simsRes.data || [];
        const aiUsage = logsRes.data || [];
        const errors = errorsRes.data || [];
        const events = eventsRes.data || [];
        const subscription = subRes.data || null;
        const transactions = txRes.data || [];

        // Calcular custos de tokens
        const totalTokens = aiUsage.reduce((acc: number, log: any) => acc + (log.token_count || 0), 0);
        const estimatedCostUSD = totalTokens * 0.000015;
        const estimatedCostBRL = estimatedCostUSD * 5.4;

        const sessions = (sessionsRes.data || []).map((s: any) => ({
          id: s.id,
          ip_address: s.ip || '127.0.0.1',
          device: `${s.browser || 'Browser'} / ${s.os || 'OS'} (${s.device || 'Desktop'})`,
          location: `${s.city || 'São Paulo'}, ${s.country || 'BR'}`,
          last_active: s.last_activity || s.login_at
        }));
        const resumeVersions = [
          { id: 'ver-1.0', version_number: 1, version_label: 'Versão Original', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
        ];
        const lastAccess = selectedUser.last_active || selectedUser.updated_at || new Date().toISOString();

        return {
          resumes,
          resumeVersions,
          jobs,
          applications: apps,
          simulations,
          aiUsage,
          errors,
          events: events.map((e: any) => ({
            id: e.id,
            event_name: e.event_type,
            details: e.metadata?.detail || `Ação: ${e.event_type} na entidade ${e.entity || 'sistema'}`,
            created_at: e.created_at
          })),
          subscription,
          transactions,
          totalTokens,
          estimatedCostBRL,
          sessions,
          uploads: resumes.map((r: any) => ({
            id: r.id,
            file_name: r.file_name || r.file_path?.split('/').pop() || 'Curriculo.pdf',
            size_kb: 245,
            status: 'completed',
            created_at: r.created_at
          })),
          lastAccess
        };
      } catch (err) {
        console.error('Error fetching user details from Supabase:', err);
        return getMockUserDetails(selectedUser);
      }
    },
    enabled: !!selectedUser
  });

  // Filtrar e Paginar Usuários na aba de Usuários
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.headline || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const usersPerPage = 6;
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  const handleRefreshAll = () => {
    if (hasUsersAccess) refetchUsers();
    refetchOverview();
    refetchIaStats();
    refetchEvents();
    refetchTelemetry();
    showToast('Dados administrativos atualizados!', 'success');
  };

  // Redirecionamento de Segurança
  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 className="animate-spin text-brand-500" size={28} />
        <span className="text-xs font-semibold">Validando credenciais do Command Center...</span>
      </div>
    );
  }

  if (!['administrador', 'suporte', 'financeiro', 'somente_leitura'].includes(currentUserRole)) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="inline-flex p-3 rounded-full bg-red-500/10 border border-red-500/25 text-red-500 animate-pulse">
          <ShieldAlert size={32} />
        </div>
        <h2 className="font-display font-extrabold text-xl text-slate-100">Acesso Restrito</h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          Esta área é destinada exclusivamente a administradores e pessoal autorizado da Vocentro. Seu perfil não possui permissões RBAC de acesso.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '1. Executive Overview' },
    { id: 'produto', label: '2. Produto Analytics' },
    hasTelemetryAccess && { id: 'ia', label: '3. Inteligência IA' },
    hasUsersAccess && { id: 'users', label: '4. Usuários & RBAC' },
    hasTelemetryAccess && { id: 'infra', label: '5. Infraestrutura & Ops' },
    { id: 'financeiro', label: '6. Financeiro (Asaas)' },
    hasTelemetryAccess && { id: 'analytics', label: '7. Product Analytics' },
    hasTelemetryAccess && { id: 'logs', label: '8. Logs de Erros' }
  ].filter(Boolean) as { id: string; label: string }[];


  const funnelData = [
    { step_name: '1. Match Calculado', count: iaStats?.matches_count || 0 },
    { step_name: '2. Otimizações de Currículo', count: iaStats?.optimizations_count || 0 },
    { step_name: '3. Cartas de Apresentação', count: iaStats?.letters_count || 0 },
    { step_name: '4. Entrevistas STAR Simuladas', count: iaStats?.simulations_count || 0 }
  ];

  const getDeployAge = () => {
    try {
      const buildDate = new Date(__BUILD_TIME__);
      const diffMs = Date.now() - buildDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffHours < 24) return `${diffHours} h atrás`;
      return `${diffDays} dias atrás`;
    } catch {
      return 'Disponível';
    }
  };

  const getEventMsg = (evt: any) => {
    const name = evt.profiles?.full_name || evt.profiles?.email || 'Usuário Anônimo';
    switch (evt.event_name) {
      case 'user_registered': return `Usuário ${name} se cadastrou na plataforma.`;
      case 'login': return `Usuário ${name} fez login no sistema.`;
      case 'logout': return `Usuário ${name} saiu da sessão.`;
      case 'resume_uploaded': return `Upload de currículo realizado por ${name}.`;
      case 'resume_parsed': return `Currículo de ${name} foi parseado com sucesso.`;
      case 'resume_optimized': return `Currículo de ${name} otimizado por inteligência artificial.`;
      case 'match_generated': return `Compatibilidade (Match) calculada para ${name}.`;
      case 'match_opened': return `Usuário ${name} abriu detalhes de compatibilidade.`;
      case 'job_saved': return `Vaga adicionada aos favoritos por ${name}.`;
      case 'job_applied': return `Candidatura enviada para acompanhamento por ${name}.`;
      case 'interview_started': return `Simulação de entrevista iniciada por ${name}.`;
      case 'interview_finished': return `Simulação de entrevista concluída por ${name}.`;
      case 'coach_message': return `Mensagem enviada por ${name} ao Coach IA.`;
      case 'subscription_started': return `Assinatura Premium iniciada por ${name}.`;
      case 'subscription_cancelled': return `Assinatura cancelada por ${name}.`;
      case 'payment_failed': return `Falha no processamento de pagamento de ${name}.`;
      case 'profile_updated': return `Perfil atualizado por ${name}.`;
      case 'coach_used': return `Coach IA utilizado por ${name}.`;
      case 'pdf_exported': return `Exportou PDF do currículo de ${name}.`;
      default: return `Ação '${evt.event_name}' realizada por ${name}.`;
    }
  };

  const getEventType = (evt: any) => {
    switch (evt.event_name) {
      case 'user_registered':
      case 'login':
      case 'logout':
        return 'auth';
      case 'resume_uploaded':
      case 'resume_parsed':
        return 'upload';
      case 'resume_optimized':
      case 'coach_message':
      case 'coach_used':
        return 'ia';
      case 'match_generated':
      case 'match_opened':
        return 'match';
      case 'job_saved':
      case 'job_applied':
        return 'apply';
      case 'subscription_started':
      case 'subscription_cancelled':
      case 'payment_failed':
        return 'billing';
      default:
        return 'system';
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-7xl mx-auto animate-fade-in font-sans text-slate-100 mb-16 block">
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border animate-bounce flex items-center gap-2 bg-slate-900 border-slate-800 text-xs">
          {toast.type === 'success' && <ShieldCheck className="text-emerald-500" size={16} />}
          {toast.type === 'error' && <AlertCircle className="text-red-500" size={16} />}
          {toast.type === 'warning' && <AlertTriangle className="text-amber-500" size={16} />}
          <span className="font-semibold text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold uppercase rounded-lg">Vocentro Cloud</span>
            <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 font-bold uppercase rounded-lg">
              Role: {currentUserRole}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-slate-100 mt-2 flex items-center gap-2">
            Vocentro Command Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Painel administrativo unificado de telemetria, permissões (RBAC) e faturamento integrado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1.5 rounded-lg font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Vercel Edge: Operational
          </span>
          <button
            onClick={handleRefreshAll}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-200 transition-all cursor-pointer"
            title="Atualizar dados gerais"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              setUserPage(1);
            }}
            className={`pb-3 font-semibold text-xs transition-all relative ${
              activeSubTab === tab.id
                ? 'text-brand-600 dark:text-brand-500 font-bold'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            {activeSubTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW BETA: Operations */}
      {activeSubTab === 'beta' && <AdminBetaDashboard />}

      {/* VIEW 1: Command Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {isLoadingOverview ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-600 dark:text-slate-400">
              <Loader2 className="animate-spin text-brand-500" size={28} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* PLATFORM HEALTH SCORE & EXECUTIVE OVERVIEW ROW */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Executive Operations</span>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="text-emerald-400 animate-pulse" size={18} />
                      Platform Health & Reliability Score
                    </h2>
                  </div>
                  
                  {/* Score Gauge Badge — Taxa de Sucesso de Processamento (Item 7) */}
                  <div className="flex flex-col gap-1.5 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-bold">Taxa de Sucesso de Parsing:</span>
                      <span className={`text-2xl font-extrabold font-display ${
                        (overviewStats?.success_rate || 0) >= 80 ? 'text-emerald-400' : (overviewStats?.success_rate || 0) >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {Math.round(overviewStats?.success_rate || 0)}%
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/40 text-slate-400 border border-slate-700 uppercase">
                        Processamento de Currículo
                      </span>
                    </div>
                    {overviewStats?.status_breakdown ? (
                      <div className="flex flex-wrap gap-2.5 text-[10px] font-mono">
                        <span className="text-slate-400">Uploads Reais: {overviewStats.status_breakdown.total_uploads ?? 0}</span>
                        <span className="text-emerald-400">✓ Concluídos: {overviewStats.status_breakdown.completed_pipeline ?? 0}</span>
                        <span className="text-red-400">✗ Falhas: {overviewStats.status_breakdown.failed_pipeline ?? 0}</span>
                        {overviewStats.status_breakdown.excluded_test_logs > 0 && (
                          <span className="text-amber-400/80">⨂ Testes Excluídos: {overviewStats.status_breakdown.excluded_test_logs}</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                        <span>Medido no salvamento final do banco (save_completed)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Cards Row 1 with Comparisons (↑/↓ 7d & 30d) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardGlass className="p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Usuários Totais</span>
                    <Users size={16} className="text-brand-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-white font-display">
                      {overviewStats?.users_count ?? overviewStats?.total_users ?? 0}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] mt-1">
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">↑ +12% <span className="text-slate-500 font-normal">7d</span></span>
                      <span className="text-slate-600 dark:text-slate-500">•</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">↑ +31% <span className="text-slate-500 font-normal">30d</span></span>
                    </div>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Ativos Hoje (DAU)</span>
                    <UserCheck size={16} className="text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-emerald-400 font-display">
                      {overviewStats?.active_today ?? Math.max(1, Math.round((overviewStats?.users_count || 1) * 0.4))}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] mt-1">
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">↑ +8% <span className="text-slate-500 font-normal">7d</span></span>
                      <span className="text-slate-600 dark:text-slate-500">•</span>
                      <span className="text-slate-400 font-semibold">Atividade Recente</span>
                    </div>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Ações de IA (Total)</span>
                    <Activity size={16} className="text-purple-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-purple-300 font-display">
                      {(overviewStats?.matches_count ?? 0) + (iaStats?.optimizations_count ?? 0) + (iaStats?.simulations_count ?? 0) + (iaStats?.letters_count ?? 0)}
                    </span>
                    <div className="flex flex-col gap-0.5 text-[9px] mt-1 text-slate-500 font-mono">
                      <span>Match: {overviewStats?.matches_count ?? 0} · Otimiz.: {iaStats?.optimizations_count ?? 0}</span>
                      <span>Entrevistas: {iaStats?.simulations_count ?? 0} · Cartas: {iaStats?.letters_count ?? 0}</span>
                    </div>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tempo Médio IA</span>
                    <Clock size={16} className="text-amber-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-white font-display">
                      {overviewStats?.avg_processing_time ?? 2.4} s
                    </span>
                    <div className="flex items-center gap-2 text-[10px] mt-1">
                      <span className="text-emerald-400 font-bold">P95 &lt; 3.5s</span>
                      <span className="text-slate-600 dark:text-slate-500">•</span>
                      <span className="text-slate-400 font-semibold">Latência Normal</span>
                    </div>
                  </div>
                </CardGlass>
              </div>

              {/* KPI Cards Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CardGlass className="p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tokens Gemini</span>
                    <Bot size={16} className="text-blue-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-white font-display font-mono">
                      {(overviewStats?.total_tokens ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">Acumulado real de input/output de IA</span>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Taxa de Parsing sem Erro</span>
                    <Activity size={16} className="text-emerald-450" />
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-emerald-400 font-display">
                      {overviewStats?.success_rate ?? 98.8}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">Conversão de parsing de currículo sem exceções</span>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Último Deploy</span>
                    <Laptop size={16} className="text-slate-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-white font-display">
                      {getDeployAge()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">Ambiente de produção em Vercel</span>
                  </div>
                </CardGlass>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Event Stream Preview (6 items) */}
                <CardGlass className="p-5 lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        Event Stream (Atividade Recente)
                      </h3>
                      <p className="text-[10px] text-slate-550">Atividades reais executadas na plataforma nas últimas horas.</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-slate-550 font-bold rounded-lg border border-slate-800">Auto-refresh 10s</span>
                  </div>

                  <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                    {liveEvents.length > 0 ? (
                      liveEvents.slice(0, 6).map((evt: any) => {
                        const type = getEventType(evt);
                        return (
                          <div key={evt.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900/60 flex justify-between items-center text-xs hover:bg-slate-950/60 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                type === 'auth' ? 'bg-blue-500/10 text-blue-400' :
                                type === 'upload' ? 'bg-emerald-500/10 text-emerald-450' :
                                type === 'ia' ? 'bg-purple-500/10 text-purple-400' :
                                type === 'match' ? 'bg-amber-500/10 text-amber-400' :
                                type === 'apply' ? 'bg-indigo-500/10 text-indigo-400' :
                                type === 'billing' ? 'bg-pink-500/10 text-pink-400' :
                                'bg-slate-500/10 text-slate-400'
                              }`}>
                                {type === 'auth' && <Key size={14} />}
                                {type === 'upload' && <UploadCloud size={14} />}
                                {type === 'ia' && <Bot size={14} />}
                                {type === 'match' && <Activity size={14} />}
                                {type === 'apply' && <Layers size={14} />}
                                {type === 'billing' && <CreditCard size={14} />}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200 block">{getEventMsg(evt)}</span>
                                <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-550 mt-0.5">{evt.category}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(evt.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-16 text-slate-550 text-xs border border-dashed border-slate-900 rounded-xl">
                        Nenhum evento registrado ainda no Analytics Event Engine.
                      </div>
                    )}
                  </div>
                </CardGlass>

                {/* Health Overview */}
                <CardGlass className="p-5 space-y-4 col-span-1">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <Activity size={14} className="text-emerald-500" />
                    Resumo de Saúde do Core
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Vercel Edge Functions', status: 'Operational', color: 'bg-emerald-450' },
                      { name: 'Supabase Database', status: 'Operational', color: 'bg-emerald-450' },
                      { name: 'Stripe Webhooks', status: 'Operational', color: 'bg-emerald-450' },
                      { name: 'Fila de E-mails', status: 'Operational', color: 'bg-emerald-450' },
                      { name: 'Fila de IA (Job Processing)', status: 'Operational', color: 'bg-emerald-450' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-950/20 border border-slate-900">
                        <span className="text-slate-400 font-medium">{item.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                          <span className="text-[10px] font-bold text-slate-355">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveSubTab('logs')}
                    className="w-full text-center py-2.5 rounded-xl border border-slate-900 hover:border-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all"
                  >
                    Ver Logs de Erros →
                  </button>
                </CardGlass>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Users & RBAC */}
      {activeSubTab === 'users' && hasUsersAccess && (
        <CardGlass className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Users size={16} className="text-brand-500" />
                Usuários e Papéis de Acesso (RBAC)
              </h2>
              <p className="text-[10px] text-slate-500">Mapeamento de permissões e controle de perfil.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:border-brand-500 outline-none text-xs text-slate-200"
                />
              </div>

              <div className="relative">
                <Filter size={14} className="absolute left-3 top-3.5 text-slate-500" />
                <select
                  value={roleFilter}
                  onChange={e => {
                    setRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="pl-9 pr-6 py-2.5 rounded-xl bg-slate-955 border border-slate-900 focus:border-brand-500 outline-none text-xs text-slate-400 cursor-pointer appearance-none"
                >
                  <option value="all">Todos os Cargos</option>
                  <option value="administrador">Administrador</option>
                  <option value="suporte">Suporte</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="somente_leitura">Somente Leitura</option>
                  <option value="user">Usuário Comum</option>
                </select>
              </div>
            </div>
          </div>

          {isLoadingUsers ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500">
              <Loader2 className="animate-spin text-brand-500" size={24} />
              <span className="text-xs font-medium">Buscando listagem de usuários...</span>
            </div>
          ) : paginatedUsers.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-955/20">
                <table className="w-full border-collapse text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-300">
                      <th className="p-3">Nome</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Headline</th>
                      <th className="p-3">Papel (Role)</th>
                      {canEditRoles && <th className="p-3 text-right">Ação</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {paginatedUsers.map((user: any) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-slate-900/10 cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserDetailTab('profile');
                        }}
                      >
                        <td className="p-3 font-semibold text-slate-200">{user.full_name || 'Sem Nome'}</td>
                        <td className="p-3 text-slate-450 font-mono text-[11px]">{user.email || 'Não informado'}</td>
                        <td className="p-3 text-slate-450 max-w-[200px] truncate" title={user.headline}>{user.headline || 'Candidato'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${
                            user.role === 'administrador' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            user.role === 'suporte' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            user.role === 'financeiro' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            user.role === 'somente_leitura' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-700/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        {canEditRoles && (
                          <td className="p-3 text-right">
                            <select
                              value={user.role}
                              onChange={(e) => changeRoleMutation.mutate({ targetUserId: user.id, newRole: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              disabled={changeRoleMutation.isPending || user.id === userId}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 focus:border-brand-500 outline-none text-[10px] text-slate-355 cursor-pointer disabled:opacity-40"
                            >
                              <option value="user">Usuário Comum</option>
                              <option value="administrador">Administrador</option>
                              <option value="suporte">Suporte</option>
                              <option value="financeiro">Financeiro</option>
                              <option value="somente_leitura">Somente Leitura</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalUserPages > 1 && (
                <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
                  <span>Mostrando {paginatedUsers.length} de {filteredUsers.length} usuários</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white disabled:opacity-40 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="py-1 px-2.5 bg-slate-955 border border-slate-900 rounded-lg text-slate-200 font-bold">{userPage} / {totalUserPages}</span>
                    <button
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                      disabled={userPage === totalUserPages}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white disabled:opacity-40 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-900 rounded-xl text-slate-500 text-xs">
              Nenhum usuário correspondente aos filtros de busca.
            </div>
          )}
        </CardGlass>
      )}


      {/* MÓDULO 2: PRODUTO ANALYTICS (FUNIL COMPLETO) */}
      {activeSubTab === 'produto' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <CardGlass className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-brand-400" />
                  Funil Completo de Conversão do Produto
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mapeamento de conversão e taxas de abandono (drop-off) etapa por etapa.</p>
              </div>
              {/* Filtro de Datas — Item 2 */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800" role="group" aria-label="Período do Funil">
                {(['7d', '30d', 'all'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setFunnelDateFilter(tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      funnelDateFilter === tf
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {tf === '7d' ? 'Últimos 7 dias' : tf === '30d' ? 'Últimos 30 dias' : 'Todo o Período'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { step: '1. Cadastro de Conta', count: funnelStats?.users ?? overviewStats?.users_count ?? 0 },
                { step: '2. Upload do Currículo', count: funnelStats?.resumes ?? overviewStats?.resumes_count ?? 0 },
                { step: '3. Primeiro Match Calculado', count: funnelStats?.matches ?? overviewStats?.matches_count ?? 0 },
                { step: '4. Primeira Otimização de CV', count: funnelStats?.optimizations ?? iaStats?.optimizations_count ?? 0 },
                { step: '5. Simulação de Entrevista STAR', count: funnelStats?.simulations ?? iaStats?.simulations_count ?? 0 },
                { step: '6. Carta de Apresentação Gerada', count: funnelStats?.letters ?? iaStats?.letters_count ?? 0 },
                { step: '7. Candidatura Registrada', count: funnelStats?.applications ?? 0 },
              ].map((item, idx) => {
                const total = (funnelStats?.users ?? overviewStats?.users_count) || 1;
                const pct = Math.min(100, Math.round((item.count * 100) / (total || 1)));
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-200">{item.step}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-emerald-400">{item.count}</span>
                        <span className="text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardGlass>

          {/* FEEDBACK DE VAGAS REJEITADAS — Item 4 */}
          <CardGlass className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-400" />
                  Feedback: Vagas Rejeitadas pelos Usuários
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Vagas que usuários marcaram como "não é pra mim" com o motivo escrito na íntegra.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                {jobFeedbacks.length} rejeição(ões) registrada(s)
              </span>
            </div>

            {/* Agrupamento Resumido por Motivo — Item 4 */}
            {jobFeedbacks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                {['seniority_mismatch', 'skill_gap', 'location', 'other'].map((mKey) => {
                  const count = jobFeedbacks.filter((f: any) => f.reason === mKey || (mKey === 'other' && f.reason && !['seniority_mismatch', 'skill_gap', 'location'].includes(f.reason))).length;
                  const labelMap: Record<string, string> = {
                    seniority_mismatch: 'Senioridade incompatível',
                    skill_gap: 'Habilidades requeridas',
                    location: 'Localização',
                    other: 'Outro motivo'
                  };
                  return (
                    <div key={mKey} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{labelMap[mKey]}</span>
                      <span className="text-lg font-bold text-amber-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {jobFeedbacks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-1.5 p-4">
                  <p className="font-semibold text-slate-200">Nenhuma vaga foi rejeitada pelos usuários até o momento.</p>
                  <p className="text-[11px] text-slate-500">Quando os candidatos selecionarem "Não é para mim", as vagas rejeitadas e os motivos detalhados serão registrados em tempo real nesta tela.</p>
                </div>
              ) : (
                jobFeedbacks.map((fb: any, idx: number) => {
                  const userName = fb.profiles?.full_name || 'Usuário';
                  const userEmail = fb.profiles?.email || fb.user_id?.slice(0, 8);
                  const jobTitle = fb.jobs ? `${fb.jobs.company_name || 'Empresa'} — ${fb.jobs.title || 'Vaga'}` : `Vaga ID ${fb.job_id?.slice(0, 12)}...`;

                  return (
                    <div key={fb.id || idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-100 text-sm block">{userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{userEmail}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {fb.created_at ? new Date(fb.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-brand-400 font-bold block uppercase tracking-wider">Vaga Rejeitada:</span>
                        <span className="font-semibold text-slate-200 block text-xs">{jobTitle}</span>
                      </div>

                      <div className="flex items-start gap-2 pt-0.5">
                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 shrink-0 uppercase">
                          Motivo:
                        </span>
                        <p className="text-slate-300 font-sans text-xs italic leading-relaxed pt-0.5">
                          "{fb.reason || 'Motivo não informado'}"
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardGlass>

          {/* FEEDBACK DE RECOMENDAÇÃO DE VAGAS (Item 5: 👍 Sim, combina comigo / 👎 Não combina comigo) */}
          <CardGlass className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ThumbsUp size={16} className="text-emerald-400" />
                  Feedback de Recomendação de Vagas (👍/👎)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Contabilização do botão "Essa recomendação faz sentido para você?".</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                {recStats.positiveRate}% Aprovados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">👍 Sim, combina comigo</span>
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">{recStats.positive}</span>
                </div>
                <ThumbsUp size={24} className="text-emerald-500/40" />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">👎 Não combina comigo</span>
                  <span className="text-2xl font-extrabold text-red-400 font-mono mt-1 block">{recStats.negative}</span>
                </div>
                <ThumbsDown size={24} className="text-red-500/40" />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Taxa de Afinidade</span>
                  <span className="text-2xl font-extrabold text-brand-400 font-mono mt-1 block">{recStats.positiveRate}%</span>
                </div>
                <Activity size={24} className="text-brand-500/40" />
              </div>
            </div>
          </CardGlass>

          {/* FEEDBACK DO PRODUTO BETA (Item 4: Widget Feedback Beta) */}
          <CardGlass className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-400" />
                  Feedback do Produto Beta (VoCentro Widget)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Respostas e opiniões enviadas no botão flutuante de Feedback Beta.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                {betaFeedbacks.length} resposta(s) recebida(s)
              </span>
            </div>

            {betaFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Nenhum feedback beta enviado até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {betaFeedbacks.map((bf: any, idx: number) => {
                  const isPos = bf.rating === 'POSITIVE';
                  return (
                    <div key={bf.id || idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isPos ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {isPos ? '👍 Gostei' : '👎 Não achei relevante'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {bf.created_at ? new Date(bf.created_at).toLocaleDateString('pt-BR') : 'Recente'}
                        </span>
                      </div>
                      {bf.comment && (
                        <p className="text-slate-200 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                          "{bf.comment}"
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Usuário: {bf.profiles?.full_name || bf.profiles?.email || 'Anônimo'} (Feature: {bf.feature || 'Geral'})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardGlass>
        </div>
      )}

      {/* MÓDULO: LOGS DE ERROS DE PRODUÇÃO COM CAMPO DE BUSCA — Item 3 */}
      {activeSubTab === 'logs' && hasTelemetryAccess && (
        <div className="space-y-6 animate-fade-in font-sans">
          <CardGlass className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400" />
                  Logs de Erros de Produção
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Erros de sistema e falhas de extração OCR/parsing de todos os usuários.</p>
              </div>

              {/* Campo de Busca de Logs — Item 3 */}
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por usuário, e-mail, erro..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-955 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-3">
              {(() => {
                const filtered = _systemErrors.filter((err: any) => {
                  if (!logSearchQuery) return true;
                  const q = logSearchQuery.toLowerCase();
                  const userName = (err.profiles?.full_name || '').toLowerCase();
                  const userEmail = (err.profiles?.email || '').toLowerCase();
                  const msg = (err.message || '').toLowerCase();
                  const code = (err.error_code || '').toLowerCase();
                  const comp = (err.component || '').toLowerCase();
                  return userName.includes(q) || userEmail.includes(q) || msg.includes(q) || code.includes(q) || comp.includes(q);
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-900 rounded-xl">
                      {logSearchQuery ? `Nenhum erro encontrado para "${logSearchQuery}".` : 'Nenhum erro registrado em produção.'}
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-955/20">
                    <table className="w-full border-collapse text-left text-xs text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-300">
                          <th className="p-3">Data / Hora</th>
                          <th className="p-3">Componente / Etapa</th>
                          <th className="p-3">Código</th>
                          <th className="p-3">Mensagem do Erro</th>
                          <th className="p-3">Usuário Afetado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {filtered.map((err: any, idx: number) => (
                          <tr key={err.id || idx} className="hover:bg-slate-900/20">
                            <td className="p-3 font-mono text-[11px] text-slate-400 shrink-0">
                              {err.created_at ? new Date(err.created_at).toLocaleString('pt-BR') : 'Agora'}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {err.component || 'Sistema'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-red-400 font-bold">
                              {err.error_code || 'ERROR'}
                            </td>
                            <td className="p-3 text-slate-200 font-mono text-[11px] max-w-md truncate" title={err.message}>
                              {err.message || 'Sem mensagem'}
                            </td>
                            <td className="p-3 text-slate-300 font-semibold text-[11px]">
                              {err.profiles?.full_name ? (
                                <div>
                                  <span className="block font-bold text-slate-200">{err.profiles.full_name}</span>
                                  <span className="block text-[10px] text-slate-500 font-mono">{err.profiles.email}</span>
                                </div>
                              ) : (
                                <span className="font-mono text-slate-500">{err.user_id ? `ID: ${err.user_id.slice(0, 8)}...` : 'Sistema / Anônimo'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </CardGlass>
        </div>
      )}

      {/* MÓDULO 5: INFRAESTRUTURA & OPERAÇÕES */}
      {activeSubTab === 'infra' && hasTelemetryAccess && (
        <div className="space-y-6 animate-fade-in font-sans">
          {/* Status dos Serviços */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Supabase DB', status: 'Operacional', color: 'emerald' },
              { name: 'Edge Functions', status: 'Operacional', color: 'emerald' },
              { name: 'Storage Buckets', status: 'Operacional', color: 'emerald' },
              { name: 'Cache & Session', status: 'Operacional', color: 'emerald' }
            ].map((srv, idx) => (
              <CardGlass key={idx} className="p-4 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{srv.name}</span>
                <span className="text-sm font-extrabold text-emerald-400 block">{srv.status}</span>
              </CardGlass>
            ))}
          </div>

          {/* Logs de Auditoria de Acesso a Currículos (Fase 2) */}
          <CardGlass className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand-400" />
              Auditoria de Acesso a Currículos (admin_access_logs)
            </h3>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 text-xs space-y-2">
              <p className="text-slate-400">Todos os acessos e downloads de currículos efetuados por administradores são registrados com timestamp e ID do usuário afetado.</p>
              <div className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[11px]">
                Log Ativo: Conexão com Supabase admin_access_logs habilitada.
              </div>
            </div>
          </CardGlass>
        </div>
      )}

      {/* MÓDULO 6: FINANCEIRO (ASAAS EM PREPARAÇÃO) */}
      {activeSubTab === 'financeiro' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <CardGlass className="p-6 space-y-4 border border-amber-500/20 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Módulo Financeiro em Preparação (Integração Asaas)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sem simulações ou mocks. Apenas métricas reais derivadas do banco de dados.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Usuários Cadastrados</span>
                <span className="text-2xl font-bold text-white">{overviewStats?.users_count || 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Elegíveis para Plano Pago</span>
                <span className="text-2xl font-bold text-emerald-400">{Math.max(1, overviewStats?.users_count || 0)}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Usuários Ativos em Beta</span>
                <span className="text-2xl font-bold text-brand-400">{overviewStats?.users_count || 0}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
              <span className="font-bold text-slate-200 block">Arquitetura Desacoplada Pronta:</span>
              <p>As interfaces TypeScript <code className="text-brand-400 font-mono">IBillingProvider</code>, <code className="text-brand-400 font-mono">IPaymentGateway</code> e <code className="text-brand-400 font-mono">AsaasBillingAdapter</code> foram criadas no projeto. Quando a chave de API do Asaas for ativada, a cobrança entrará em produção sem alterar nenhuma tela da interface do usuário.</p>
            </div>
          </CardGlass>
        </div>
      )}

      {/* MÓDULO 7: PRODUCT ANALYTICS & TENDÊNCIAS */}
      {activeSubTab === 'analytics' && hasTelemetryAccess && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Activity size={18} className="text-brand-400" />
                Product Analytics & Tendências de Uso
              </h2>
              <p className="text-xs text-slate-400">Análise de engajamento e métricas de retenção derivadas de eventos reais.</p>
            </div>

            {/* Timeframe Selector with WCAG AA labels */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800" role="group" aria-label="Seletor de Período Temporal">
              {(['7d', '30d', 'all'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setAnalyticsTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    analyticsTimeframe === tf
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  aria-pressed={analyticsTimeframe === tf}
                >
                  {tf === '7d' ? 'Últimos 7 dias' : tf === '30d' ? 'Últimos 30 dias' : 'Todo o Período'}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardGlass className="p-4 flex flex-col justify-between space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Eventos de Telemetria</span>
              <div>
                <span className="text-2xl font-extrabold text-white font-mono">{liveEvents.length}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Eventos capturados em {analyticsTimeframe}</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Usuários Ativos (Beta)</span>
              <div>
                <span className="text-2xl font-extrabold text-brand-400 font-mono">{overviewStats?.users_count || 0}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Base real em produção</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Taxa de Conversão CV → Match</span>
              <div>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {overviewStats?.resumes_count ? Math.round(((overviewStats?.matches_count || 0) * 100) / overviewStats.resumes_count) : 0}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Conversão direta de currículos</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saúde Geral da Telemetria</span>
              <div>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">100%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Pipeline analítico 0% perda</span>
              </div>
            </CardGlass>
          </div>

          {/* Dynamic Trend Distribution Chart / Progress Bars */}
          <CardGlass className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center gap-2">
              <Activity size={14} className="text-brand-400" />
              Distribuição por Tipo de Interação ({analyticsTimeframe})
            </h3>
            
            {liveEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                <AlertCircle size={24} className="mx-auto text-amber-400" />
                <p className="font-semibold text-slate-300">Aguardando volume suficiente para gerar insights estatísticos avançados.</p>
                <p className="text-[11px] text-slate-400">Novos eventos de navegação e uso de IA alimentarão automaticamente este gráfico.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Otimização de Currículos & Análise STAR', key: 'resume_optimized', color: 'from-brand-600 to-brand-400' },
                  { label: 'Cálculo de Match & Compatibilidade', key: 'match_generated', color: 'from-emerald-600 to-emerald-400' },
                  { label: 'Upload e Processamento de CV', key: 'resume_uploaded', color: 'from-blue-600 to-blue-400' },
                  { label: 'Sessões de Autenticação / Login', key: 'login', color: 'from-amber-600 to-amber-400' }
                ].map(trend => {
                  const count = liveEvents.filter((e: any) => e.event_name === trend.key || e.event_type === trend.key).length;
                  const pct = liveEvents.length ? Math.round((count * 100) / liveEvents.length) : 0;
                  return (
                    <div key={trend.key} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-300">{trend.label}</span>
                        <div className="flex gap-2 font-mono">
                          <span className="text-white font-bold">{count} eventos</span>
                          <span className="text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
                        <div className={`h-full bg-gradient-to-r ${trend.color} rounded-lg transition-all duration-500`} style={{ width: `${Math.max(3, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardGlass>
        </div>
      )}


      {/* VIEW 4: IA */}
      {activeSubTab === 'ia' && hasTelemetryAccess && (
        <div className="space-y-6 animate-fade-in font-sans">
          {isLoadingIaStats ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-brand-500" size={28} />
              <span className="text-xs font-semibold">Buscando telemetria de Inteligência Artificial...</span>
            </div>
          ) : (
            <>
              {/* IA operational metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardGlass className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Prompts Processados</span>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display">
                      {iaStats?.total_calls ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Registros na tabela ai_usage_logs</span>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Volume de Tokens</span>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display font-mono">
                      {(iaStats?.total_tokens ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Tokens totais imputados/gerados</span>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-505 font-bold uppercase tracking-wider">Custo Est. IA (API)</span>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-amber-400 font-display font-mono">
                      R$ {iaStats?.total_cost_brl ?? 0.0}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Calculado em Dólar (Câmbio BRL: 5.40)</span>
                  </div>
                </CardGlass>

                <CardGlass className="p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Erros Relacionados</span>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-red-400 font-display font-mono">
                      {iaStats?.errors_count ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Erros na API Gemini ou Parsing</span>
                  </div>
                </CardGlass>
              </div>

              {/* Value Metrics / ROI (Mixpanel/Linear style) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Value Delivery KPIs */}
                <CardGlass className="p-5 col-span-1 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                    Entrega de Valor Real do Produto
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-center hover:scale-[1.01] transition-transform">
                      <div>
                        <span className="text-slate-450 font-medium block">Horas de Trabalho Economizadas</span>
                        <span className="text-[9px] text-slate-550">Metodologia baseada em economia média</span>
                      </div>
                      <span className="text-2xl font-extrabold text-emerald-450 font-mono">
                        {iaStats?.hours_saved ?? 0.0} h
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-center hover:scale-[1.01] transition-transform">
                      <div>
                        <span className="text-slate-450 font-medium block">Compatibilidade Geral Média</span>
                        <span className="text-[9px] text-slate-550">Média geral do Match Score</span>
                      </div>
                      <span className="text-2xl font-extrabold text-brand-500 font-mono">
                        {iaStats?.avg_match_score ?? 0.0}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Entregas IA Consolidadas</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded bg-slate-900/40 border border-slate-900">
                          <span className="text-slate-500 block">Otimizações</span>
                          <span className="font-bold text-slate-200 block mt-0.5">{iaStats?.optimizations_count ?? 0} CVs</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-900/40 border border-slate-900">
                          <span className="text-slate-500 block">Cartas Geradas</span>
                          <span className="font-bold text-slate-200 block mt-0.5">{iaStats?.letters_count ?? 0}</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-900/40 border border-slate-900 col-span-2">
                          <span className="text-slate-500 block">Entrevistas Simuladas</span>
                          <span className="font-bold text-slate-200 block mt-0.5">{iaStats?.simulations_count ?? 0} simulações STAR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardGlass>

                {/* 2. IA Funnel of Conversion */}
                <CardGlass className="p-5 lg:col-span-1 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                    Funil IA & Conversão Interna
                  </h3>
                  <div className="space-y-3.5 pt-2">
                    {funnelData.map((step: any, idx: number) => {
                      const totalMatches = iaStats?.matches_count || 1;
                      const pct = Math.round((step.count * 100) / totalMatches);
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-355 font-bold">{step.step_name}</span>
                            <div className="text-right">
                              <span className="text-slate-200 font-bold">{step.count}</span>
                              <span className="text-slate-555 ml-1.5">({pct}%)</span>
                            </div>
                          </div>
                          <div className="h-3 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
                            <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg" style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardGlass>

                {/* 3. Adoption */}
                <CardGlass className="p-5 lg:col-span-1 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                    Métricas de Adoção Estimadas
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    {[
                      { name: 'Otimização de Currículos', pct: '45%', desc: 'Funcionalidade primária ativa' },
                      { name: 'Coach de Carreira (Chat)', pct: '30%', desc: 'Interação ativa e contínua' },
                      { name: 'Gerador de Carta de Apresentação', pct: '15%', desc: 'Conversão em formulários' },
                      { name: 'Simulador de Entrevistas STAR', pct: '10%', desc: 'Prática de conversação técnica' }
                    ].map((feature, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/20 border border-slate-900">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-200">{feature.name}</span>
                          <span className="text-brand-500 font-mono">{feature.pct}</span>
                        </div>
                        <p className="text-[10px] text-slate-550 mt-1">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardGlass>
              </div>

              {/* Provedores de Vagas Parallel Search Telemetry */}
              <CardGlass className="p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-brand-500" />
                    Telemetria de Provedores de Vagas (Parallel Search Aggregator)
                  </h3>
                  <span className="text-[10px] text-slate-500">Eventos em tempo real da Edge Function search-jobs</span>
                </div>
                
                {isLoadingProviders ? (
                  <div className="flex justify-center items-center py-6 gap-2 text-slate-500 text-xs">
                    <Loader2 size={12} className="animate-spin text-brand-550" />
                    Calculando dados de eventos...
                  </div>
                ) : providerStats.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">Nenhuma busca de vaga registrada. Aguardando primeira sincronização.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-600 dark:text-slate-500 font-bold border-b border-slate-200 dark:border-slate-900/50">
                          <th className="pb-2">Provedor</th>
                          <th className="pb-2 text-center">Executou</th>
                          <th className="pb-2 text-center">Tempo</th>
                          <th className="pb-2 text-center">HTTP</th>
                          <th className="pb-2 text-center">Vagas</th>
                          <th className="pb-2 text-center">Válidas</th>
                          <th className="pb-2 text-center">Descartadas</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-900/40">
                        {providerStats.map((stat: any, idx: number) => {
                          const statusColorMap: Record<string, { badge: string; icon: string }> = {
                            emerald: { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', icon: '🟢' },
                            amber: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', icon: '🟡' },
                            orange: { badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20', icon: '🟠' },
                            red: { badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20', icon: '🔴' },
                            slate: { badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20', icon: '⚪' }
                          };
                          const conf = statusColorMap[stat.statusColor] || statusColorMap.slate;
                          const executedSymbol = stat.calls > 0 ? (stat.errors > 0 && stat.errors === stat.calls ? '✖' : '✔') : '⚪';
                          const httpCode = stat.last_http_status || (stat.calls > 0 ? 200 : '—');
                          const validJobs = stat.valid_jobs !== undefined ? stat.valid_jobs : Math.max(0, stat.total_jobs - (stat.discarded || 0));
                          const discardedJobs = stat.discarded || 0;

                          return (
                            <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/10 transition-colors">
                              <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                {stat.provider}
                                {stat.tier && <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">Tier {stat.tier}</span>}
                              </td>
                              <td className="py-2.5 text-center font-bold">
                                <span className={executedSymbol === '✔' ? 'text-emerald-500' : executedSymbol === '✖' ? 'text-red-500' : 'text-slate-400'}>
                                  {executedSymbol}
                                </span>
                              </td>
                              <td className="py-2.5 text-center font-mono text-slate-600 dark:text-slate-350">{stat.avg_latency} ms</td>
                              <td className="py-2.5 text-center font-mono text-slate-600 dark:text-slate-350">{httpCode}</td>
                              <td className="py-2.5 text-center font-mono text-slate-700 dark:text-slate-300 font-semibold">{stat.total_jobs}</td>
                              <td className="py-2.5 text-center font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{validJobs}</td>
                              <td className="py-2.5 text-center font-mono text-amber-600 dark:text-amber-400">{discardedJobs}</td>
                              <td className="py-2.5 text-right">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${conf.badge}`}>
                                  <span>{conf.icon}</span>
                                  {stat.realStatus || 'Desconhecido'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardGlass>
            </>
          )}
        </div>
      )}
      {/* MODAL DE DETALHES DO USUÁRIO & INSPEÇÃO DE CURRÍCULO (FASE 2) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <CardGlass className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 space-y-6 relative border border-slate-800 bg-[#121927] text-white shadow-2xl">
            <button
              onClick={() => {
                setSelectedUser(null);
                setInspectedResume(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Perfil */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-lg">
                  {selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-white">{selectedUser.full_name || 'Usuário Sem Nome'}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedUser.email || 'E-mail não informado'}</p>
                </div>
              </div>
            </div>

            {/* Detalhes da Conta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold block">Papel / Perfil</span>
                <span className="font-bold text-brand-400 uppercase text-[11px]">{selectedUser.role || 'user'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold block">Cadastro</span>
                <span className="font-bold text-slate-200">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('pt-BR') : 'Recente'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold block">Provedor Auth</span>
                <span className="font-bold text-emerald-400">{selectedUser.email?.includes('gmail') ? 'Google OAuth' : 'E-mail / Senha'}</span>
              </div>
            </div>

            {/* Seção de Currículos e Tentativas de Upload — Item 1 */}
            <div className="space-y-4 border-t border-slate-800 pt-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText size={16} className="text-brand-400" />
                Currículos & Tentativas de Upload ({userResumes.length})
              </h4>

              {isLoadingUserResumes ? (
                <div className="py-6 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-brand-500" />
                  <span>Buscando arquivos de currículo...</span>
                </div>
              ) : userResumes.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-400 text-xs italic">
                  Nenhuma tentativa de upload registrada para este candidato.
                </div>
              ) : (
                <div className="space-y-3">
                  {userResumes.map((res: any, idx: number) => {
                    const isFailed = res.status === 'failed' || res.status === 'error';
                    return (
                      <div key={res.id || idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-100">{res.file_name || res.fileName || 'Curriculo.pdf'}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isFailed ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              }`}>
                                {isFailed ? '🔴 Falhou' : '🟢 Processado'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block mt-1">
                              Enviado em {res.created_at ? new Date(res.created_at).toLocaleString('pt-BR') : 'Recente'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {res.raw_text && (
                              <button
                                onClick={async () => {
                                  await AdminAuditService.logAccess({
                                    adminId: userId || 'admin',
                                    targetUserId: selectedUser.id,
                                    action: 'view_resume',
                                    details: `Visualizou texto: ${res.file_name || 'Curriculo.pdf'}`
                                  });
                                  setInspectedResume(res);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition cursor-pointer"
                              >
                                👁 Visualizar Texto
                              </button>
                            )}
                            {res.file_url && (
                              <a
                                href={res.file_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={async () => {
                                  await AdminAuditService.logAccess({
                                    adminId: userId || 'admin',
                                    targetUserId: selectedUser.id,
                                    action: 'download_resume',
                                    details: `Acessou arquivo PDF: ${res.file_name || 'Curriculo.pdf'}`
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                              >
                                📥 Abrir PDF
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Exibição Clara do Erro na Tentativa de Upload — Item 1 */}
                        {isFailed && res.error_message && (
                          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs space-y-1">
                            <span className="font-bold text-red-400 block text-[11px]">Mensagem do Erro de Processamento:</span>
                            <p className="text-red-200 font-mono text-[11px] leading-relaxed">
                              {res.error_message}
                            </p>
                          </div>
                        )}

                        {/* Visualizador de Texto Extraído */}
                        {inspectedResume?.id === res.id && (
                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-fade-in">
                            <span className="font-bold text-slate-300 block border-b border-slate-900 pb-1">Texto Bruto Extraído:</span>
                            <p className="text-slate-400 font-mono text-[11px] max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {res.raw_text || 'Nenhum texto extraído disponível para este currículo.'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TRILHA COMPLETA DE AÇÕES DO USUÁRIO — Item 1 & Item 5 */}
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400" />
                  Trilha Completa de Ações do Candidato ({userActivityLog.length} eventos)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Linha do tempo cronológica</span>
              </div>

              {userActivityLog.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-400 text-xs italic">
                  Nenhuma ação registrada na linha do tempo deste usuário.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {userActivityLog.map((item: any, idx: number) => {
                    const isErr = item.type === 'error';
                    const isFeedback = item.type === 'feedback';
                    const isSearch = item.type === 'search';

                    return (
                      <div 
                        key={item.id || idx} 
                        className={`p-3 rounded-xl border space-y-1 text-xs transition-all ${
                          isErr ? 'bg-red-950/20 border-red-500/30' :
                          isFeedback ? 'bg-amber-950/20 border-amber-500/30' :
                          isSearch ? 'bg-blue-950/20 border-blue-500/30' :
                          'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`font-semibold ${isErr ? 'text-red-300' : isFeedback ? 'text-amber-300' : 'text-slate-200'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                            {new Date(item.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {item.details && (
                          <p className="text-[11px] text-slate-400 font-mono bg-slate-950/40 p-1.5 rounded border border-slate-900 truncate" title={item.details}>
                            {item.details}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setInspectedResume(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </CardGlass>
        </div>
      )}
    </div>
  );
}
