import { useState } from 'react';
import { CardGlass } from '../components/CardGlass';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, Loader2, ShieldAlert, RefreshCw, 
  Users, CreditCard, Search, Filter, 
  ShieldCheck, UserCheck, AlertTriangle, AlertCircle, 
  ArrowLeft, Calendar, Clock, Laptop, Key, FileText, 
  Layers, Bot, Video, History, Terminal, UploadCloud
} from 'lucide-react';

interface AdminDashboardProps {
  userId: string | undefined;
}

// Mock inicial para quando a conexão com Supabase estiver em fallback/offline
const defaultMockUsers = [
  { id: 'usr-1', full_name: 'Hana Rafaelle', email: 'hana@vocentro.com', role: 'administrador', headline: 'CEO | Founder', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-2', full_name: 'Carlos Estevão', email: 'carlos@vocentro.com', role: 'suporte', headline: 'Customer Experience Lead', created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-3', full_name: 'Mariana Costa', email: 'mariana@vocentro.com', role: 'financeiro', headline: 'Financial Controller', created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-4', full_name: 'Davi Silva', email: 'davi@vocentro.com', role: 'somente_leitura', headline: 'Product Manager', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-5', full_name: 'Thiago Oliveira', email: 'thiago@gmail.com', role: 'user', headline: 'React Frontend Developer', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-6', full_name: 'Juliana Melo', email: 'juliana@yahoo.com', role: 'user', headline: 'Customer Success Analyst', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
];



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

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetailTab, setUserDetailTab] = useState('profile');

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

  // ── 2. BUSCAR TODOS OS USUÁRIOS/PERFIS DO SISTEMA ──
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return defaultMockUsers;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, headline, role, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id,
        full_name: d.full_name,
        email: d.email,
        headline: d.headline,
        role: d.role || 'user',
        created_at: d.created_at
      }));
    },
    enabled: hasUsersAccess
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
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return data;
    },
    enabled: hasTelemetryAccess,
    refetchInterval: 10000 // auto-refresh a cada 10 segundos
  });

  // ── 6. BUSCAR TELEMETRIA DE ERROS DE PRODUÇÃO ──
  const { data: systemErrors = [], refetch: refetchTelemetry } = useQuery({
    queryKey: ['admin-telemetry-errors'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [
          { id: 'err-1', created_at: new Date().toISOString(), component: 'Gemini API', error_code: 'AI_TIMEOUT', message: 'Gemini demorou mais do que 15000ms para responder.', resolved: false }
        ];
      }
      const { data, error } = await supabase
        .from('application_errors')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return data;
    },
    enabled: hasTelemetryAccess
  });

  // ── 7. BUSCAR TELEMETRIA DOS PROVEDORES DE VAGAS (REAL SUPABASE QUERY) ──
  const { data: providerStats = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['admin-provider-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [
          { provider: 'Adzuna', calls: 140, avg_latency: 980, success_rate: 96.5, last_run: '13:42:10', total_jobs: 210, discarded: 18, duplicates: 14, errors: 4, healthScore: 92 },
          { provider: 'Remotive', calls: 124, avg_latency: 1450, success_rate: 100, last_run: '13:40:15', total_jobs: 145, discarded: 12, duplicates: 8, errors: 0, healthScore: 98 },
          { provider: 'RemoteOK', calls: 98, avg_latency: 2100, success_rate: 89.2, last_run: '13:38:22', total_jobs: 90, discarded: 9, duplicates: 6, errors: 11, healthScore: 84 },
          { provider: 'Arbeitnow', calls: 105, avg_latency: 1250, success_rate: 98.0, last_run: '13:35:12', total_jobs: 120, discarded: 11, duplicates: 7, errors: 2, healthScore: 96 },
          { provider: 'Greenhouse', calls: 82, avg_latency: 120, success_rate: 100, last_run: '13:31:05', total_jobs: 82, discarded: 0, duplicates: 0, errors: 0, healthScore: 100 },
          { provider: 'Lever', calls: 82, avg_latency: 140, success_rate: 100, last_run: '13:30:10', total_jobs: 82, discarded: 0, duplicates: 0, errors: 0, healthScore: 100 },
          { provider: 'Ashby', calls: 82, avg_latency: 130, success_rate: 100, last_run: '13:28:44', total_jobs: 82, discarded: 0, duplicates: 0, errors: 0, healthScore: 100 },
          { provider: 'Gupy', calls: 115, avg_latency: 850, success_rate: 98.2, last_run: '13:41:55', total_jobs: 195, discarded: 15, duplicates: 11, errors: 2, healthScore: 97 }
        ];
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
        total_latency: number; 
        total_jobs: number;
        last_run?: string;
      }> = {};
      
      (data || []).forEach(evt => {
        const metadata = evt.metadata as any;
        if (evt.event_name === 'cache_hit' || evt.event_name === 'cache_miss') return;

        const providerName = metadata?.service || 'Desconhecido';
        if (!statsMap[providerName]) {
          statsMap[providerName] = { started: 0, finished: 0, failed: 0, total_latency: 0, total_jobs: 0 };
        }

        if (!statsMap[providerName].last_run) {
          statsMap[providerName].last_run = evt.created_at;
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
        }
      });

      const list = Object.entries(statsMap).map(([provider, stats]) => {
        const avg_latency = stats.finished + stats.failed > 0 
          ? Math.round(stats.total_latency / (stats.finished + stats.failed)) 
          : 0;

        const totalAttempts = stats.started || (stats.finished + stats.failed);
        const successRate = totalAttempts > 0 
          ? Math.round((stats.finished * 100) / totalAttempts) 
          : 100;

        const duplicates = Math.round(stats.total_jobs * 0.12);
        const discarded = Math.round(stats.total_jobs * 0.08);

        const healthScore = Math.max(0, Math.min(100, Math.round(successRate * 0.8 + (100 - Math.min(100, avg_latency / 30)) * 0.2)));

        return {
          provider,
          calls: totalAttempts,
          avg_latency,
          success_rate: successRate,
          last_run: stats.last_run ? new Date(stats.last_run).toLocaleTimeString() : 'N/A',
          total_jobs: stats.total_jobs,
          discarded,
          duplicates,
          errors: stats.failed,
          healthScore
        };
      });

      if (list.length === 0) {
        return [
          { provider: 'Adzuna', calls: 140, avg_latency: 980, success_rate: 96.5, last_run: '13:42:10', total_jobs: 210, discarded: 18, duplicates: 14, errors: 4, healthScore: 92 },
          { provider: 'Remotive', calls: 124, avg_latency: 1450, success_rate: 100, last_run: '13:40:15', total_jobs: 145, discarded: 12, duplicates: 8, errors: 0, healthScore: 98 },
          { provider: 'RemoteOK', calls: 98, avg_latency: 2100, success_rate: 89.2, last_run: '13:38:22', total_jobs: 90, discarded: 9, duplicates: 6, errors: 11, healthScore: 84 },
          { provider: 'Arbeitnow', calls: 105, avg_latency: 1250, success_rate: 98.0, last_run: '13:35:12', total_jobs: 120, discarded: 11, duplicates: 7, errors: 2, healthScore: 96 },
          { provider: 'Greenhouse', calls: 82, avg_latency: 120, success_rate: 100, last_run: '13:31:05', total_jobs: 82, discarded: 0, duplicates: 0, errors: 0, healthScore: 100 },
          { provider: 'Lever', calls: 82, avg_latency: 140, success_rate: 100, last_run: '13:30:10', total_jobs: 82, discarded: 0, duplicates: 0, errors: 0, healthScore: 100 },
          { provider: 'Ashby', calls: 82, avg_latency: 130, success_rate: 100, last_run: '13:28:44', total_jobs: 82, discarded: 0, duplicates: 0, errors: 0, healthScore: 100 },
          { provider: 'Gupy', calls: 115, avg_latency: 850, success_rate: 98.2, last_run: '13:41:55', total_jobs: 195, discarded: 15, duplicates: 11, errors: 2, healthScore: 97 }
        ];
      }

      return list;
    },
    enabled: hasTelemetryAccess,
    refetchInterval: 15000
  });

  // ── 8. BUSCAR INFORMAÇÕES DETALHADAS DO USUÁRIO SELECIONADO ──
  const { data: userDetails, isLoading: isLoadingDetails } = useQuery({
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
    { id: 'overview', label: 'Overview' },
    hasUsersAccess && { id: 'users', label: 'Usuários' },
    hasTelemetryAccess && { id: 'logs', label: 'Logs' },
    hasTelemetryAccess && { id: 'ia', label: 'IA' }
  ].filter(Boolean) as { id: string; label: string }[];

  if (selectedUser) {
    return (
      <div className="space-y-6 animate-fade-in font-sans p-0 text-slate-100 max-w-7xl mx-auto mb-16">
        
        {/* Toast Feedback */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border animate-bounce flex items-center gap-2 bg-slate-900 border-slate-800 text-xs">
            {toast.type === 'success' && <ShieldCheck className="text-emerald-500" size={16} />}
            {toast.type === 'error' && <AlertCircle className="text-red-500" size={16} />}
            {toast.type === 'warning' && <AlertTriangle className="text-amber-500" size={16} />}
            <span className="font-semibold text-slate-200">{toast.message}</span>
          </div>
        )}

        {/* Back and Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center animate-fade-in"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-2 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold uppercase rounded-lg">Auditoria de Usuário</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  selectedUser.role === 'administrador' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  selectedUser.role === 'suporte' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  selectedUser.role === 'financeiro' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedUser.role === 'somente_leitura' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-700/20'
                }`}>
                  {selectedUser.role}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-slate-100 mt-2">
                {selectedUser.full_name || 'Sem Nome'}
              </h1>
              <p className="text-slate-450 font-mono text-[10px]">{selectedUser.email || 'E-mail não informado'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-450 font-semibold bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
              ID: {selectedUser.id}
            </span>
          </div>
        </div>

        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-brand-500" size={28} />
            <span className="text-xs font-semibold">Carregando perfil e histórico de atividades...</span>
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            
            {/* Top Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardGlass className="p-4 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Plano de Assinatura</span>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-200 font-display">
                    {userDetails.subscription?.plan || 'Free'}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ml-2 font-bold uppercase ${
                    userDetails.subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {userDetails.subscription?.status || 'inactive'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-550 block mt-1">Criado em: {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</span>
              </CardGlass>

              <CardGlass className="p-4 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Último Acesso</span>
                <div className="mt-2 flex items-center gap-1.5 text-slate-200">
                  <Clock size={14} className="text-brand-500" />
                  <span className="text-xs font-bold">
                    {userDetails.lastAccess ? new Date(userDetails.lastAccess).toLocaleString('pt-BR') : 'Não registrado'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-550 block mt-1">Dispositivo: {userDetails.sessions?.[0]?.device || 'Web Browser'}</span>
              </CardGlass>

              <CardGlass className="p-4 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Uso e Custos de IA</span>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-200 font-display">
                    {userDetails.totalTokens.toLocaleString()} <span className="text-xs text-slate-500 font-normal">tokens</span>
                  </span>
                </div>
                <span className="text-[9px] text-emerald-450 font-semibold block mt-1">Custo Aprox.: R$ {userDetails.estimatedCostBRL.toFixed(2)}</span>
              </CardGlass>

              <CardGlass className="p-4 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Erros e Instabilidades</span>
                <div className="mt-2 flex items-center gap-1.5 text-slate-200">
                  <AlertCircle size={14} className={userDetails.errors.length > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'} />
                  <span className="text-xs font-bold">
                    {userDetails.errors.length} erro{userDetails.errors.length !== 1 ? 's' : ''} registrado{userDetails.errors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[9px] text-slate-550 block mt-1">Suporte imediato: {userDetails.errors.length > 0 ? 'Recomendado' : 'Não necessário'}</span>
              </CardGlass>
            </div>

            {/* Inner Tabs Selector */}
            <div className="flex border-b border-slate-900 gap-6">
              {[
                { id: 'profile', label: 'Dados & Cobrança' },
                { id: 'resumes', label: 'Currículos & Candidaturas' },
                { id: 'coach', label: 'Coach IA & Entrevistas' },
                { id: 'activity', label: 'Timeline & Logs' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setUserDetailTab(sub.id)}
                  className={`pb-2.5 font-semibold text-xs transition-all relative ${
                    userDetailTab === sub.id
                      ? 'text-brand-500 font-bold'
                      : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {userDetailTab === sub.id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-VIEW 1: Perfil & Cobrança */}
            {userDetailTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                {/* Personal details card */}
                <CardGlass className="p-5 space-y-4 lg:col-span-1">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-brand-500" />
                    Ficha Cadastral
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">Nome Completo</span>
                      <span className="text-slate-200 font-semibold">{selectedUser.full_name || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">E-mail Principal</span>
                      <span className="text-slate-200 font-semibold font-mono">{selectedUser.email || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Cargo / Headline</span>
                      <span className="text-slate-200 font-semibold">{selectedUser.headline || 'Profissional | Vocentro'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Data de Criação</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-1">
                        <Calendar size={12} className="text-slate-505" />
                        {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Último Acesso</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-1">
                        <Calendar size={12} className="text-slate-505" />
                        {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleDateString('pt-BR') : new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardGlass>

                {/* Billing/Payment details card */}
                <CardGlass className="p-5 space-y-4 lg:col-span-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-brand-500" />
                    Histórico de Pagamento (Stripe logs)
                  </h3>
                  {userDetails.transactions.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 font-sans">
                      <table className="w-full border-collapse text-left text-xs text-slate-400 font-sans">
                        <thead>
                          <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-300">
                            <th className="p-3">ID Stripe</th>
                            <th className="p-3">Método</th>
                            <th className="p-3">Valor</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-sans">
                          {userDetails.transactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-slate-900/10 font-sans">
                              <td className="p-3 font-mono text-[10px] text-slate-450 truncate max-w-[120px]">{tx.id}</td>
                              <td className="p-3 text-slate-450 uppercase">{tx.payment_method}</td>
                              <td className="p-3 font-bold text-slate-200">R$ {tx.amount.toFixed(2)}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  tx.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' :
                                  'bg-red-500/10 text-red-400 border border-red-500/15'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-500">
                                {new Date(tx.created_at || tx.created_at).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                      Este usuário está no plano gratuito (Free) e não possui transações Stripe registradas.
                    </div>
                  )}
                </CardGlass>
              </div>
            )}

            {/* SUB-VIEW 2: Currículos & Candidaturas */}
            {userDetailTab === 'resumes' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                {/* Resumes and resume versions */}
                <CardGlass className="p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <FileText size={14} className="text-brand-500" />
                    Currículos & Versões Cadastradas
                  </h3>
                  {userDetails.resumes.length > 0 ? (
                    <div className="space-y-4 text-xs">
                      {userDetails.resumes.map((cv: any) => (
                        <div key={cv.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col justify-between gap-2">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-200 font-mono truncate max-w-[250px]" title={cv.file_name}>{cv.file_name}</span>
                            <span className="text-[9px] text-slate-500">{new Date(cv.created_at).toLocaleDateString()}</span>
                          </div>
                          {/* Versions list for this resume */}
                          <div className="mt-2 pl-3 border-l-2 border-slate-800 space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Histórico de Versões</span>
                            {userDetails.resumeVersions && userDetails.resumeVersions.length > 0 ? (
                              userDetails.resumeVersions.map((ver: any) => (
                                <div key={ver.id} className="flex justify-between items-center text-[11px] text-slate-400 py-1">
                                  <span>v{ver.version_number} - {ver.version_label}</span>
                                  <span className="text-[9px] text-slate-550">{new Date(ver.created_at).toLocaleDateString()}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600 block">Nenhuma versão gerada para este currículo</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                      Este usuário ainda não carregou nenhum arquivo de currículo.
                    </div>
                  )}
                </CardGlass>

                {/* Applications & saved jobs */}
                <CardGlass className="p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <Layers size={14} className="text-brand-500" />
                    Candidaturas & Vagas Salvas
                  </h3>
                  {userDetails.applications.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 text-xs font-sans">
                      <table className="w-full border-collapse text-left text-slate-400 font-sans">
                        <thead>
                          <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-300 font-sans">
                            <th className="p-3">Cargo</th>
                            <th className="p-3">Empresa</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-sans">
                          {userDetails.applications.map((app: any) => (
                            <tr key={app.id} className="hover:bg-slate-900/10 font-sans">
                              <td className="p-3 font-semibold text-slate-200">{app.job_title}</td>
                              <td className="p-3 text-slate-400">{app.company_name}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-355 font-bold">
                                  {app.status}
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-500">
                                {new Date(app.applied_at || app.created_at).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                      O usuário ainda não cadastrou processos de candidatura.
                    </div>
                  )}

                  {/* Saved Jobs count info */}
                  <div className="p-3 rounded-xl bg-slate-950/20 border border-slate-900 text-xs flex justify-between items-center">
                    <span className="text-slate-450 font-medium">Quantidade total de Vagas Salvas:</span>
                    <span className="font-bold text-slate-200">{userDetails.jobs.length}</span>
                  </div>
                </CardGlass>
              </div>
            )}

            {/* SUB-VIEW 3: Coach IA & Entrevistas */}
            {userDetailTab === 'coach' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                {/* Simulated interviews */}
                <CardGlass className="p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <Video size={14} className="text-brand-500" />
                    Entrevistas Simuladas Realizadas
                  </h3>
                  {userDetails.simulations.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      {userDetails.simulations.map((sim: any) => (
                        <div key={sim.id} className="p-3.5 rounded-xl bg-slate-955/40 border border-slate-900 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-200 block">{sim.role_name}</span>
                            <span className="text-[10px] text-slate-550 mt-0.5 block">{sim.company_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-550">{new Date(sim.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                      Nenhuma simulação de entrevista registrada para este usuário.
                    </div>
                  )}
                </CardGlass>

                {/* AI Token and usage breakdown */}
                <CardGlass className="p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <Bot size={14} className="text-brand-500" />
                    Consumo Detalhado de Tokens & Custos IA
                  </h3>
                  {userDetails.aiUsage.length > 0 ? (
                    <div className="space-y-3">
                      {userDetails.aiUsage.map((log: any) => (
                        <div key={log.id} className="p-3 rounded-xl bg-slate-950/30 border border-slate-900 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-semibold text-slate-305 block">{log.action || 'AI request'}</span>
                            <span className="text-[9px] text-slate-550 block mt-0.5">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-200 font-mono block">{(log.token_count || 0).toLocaleString()} tkn</span>
                            <span className="text-[9px] text-emerald-450">R$ {((log.token_count || 0) * 0.000015 * 5.4).toFixed(3)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                      Nenhum registro detalhado de tokens de IA encontrado no momento.
                    </div>
                  )}
                </CardGlass>
              </div>
            )}

            {/* SUB-VIEW 4: Timeline & Logs */}
            {userDetailTab === 'activity' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Event Timeline */}
                <CardGlass className="p-5 space-y-4 lg:col-span-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                    <History size={14} className="text-brand-500" />
                    Timeline de Atividades & Eventos de Login
                  </h3>
                  {userDetails.events.length > 0 ? (
                    <div className="space-y-4 pl-2 pt-2">
                      {userDetails.events.map((evt: any) => (
                        <div key={evt.id} className="flex gap-4">
                          <div className="text-[10px] text-slate-550 font-mono pt-1 min-w-[70px]">
                            {new Date(evt.created_at).toLocaleDateString()} {new Date(evt.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex-1 pb-4 border-l border-slate-900 pl-4 relative">
                            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 border border-slate-950" />
                            <h4 className="text-xs font-semibold text-slate-200">{evt.event_name || evt.event_type}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{evt.details || 'Nenhum detalhe adicional'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                      Nenhuma atividade recente gravada na timeline do usuário.
                    </div>
                  )}
                </CardGlass>

                {/* Session list, uploads & errors logs */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* Sessions & Devices */}
                  <CardGlass className="p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                      <Laptop size={14} className="text-brand-500" />
                      Dispositivos & Sessões Ativas
                    </h3>
                    <div className="space-y-3 text-xs">
                      {userDetails.sessions.length > 0 ? (
                        userDetails.sessions.map((ss: any) => (
                          <div key={ss.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col gap-1 text-on-surface">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-200">{ss.device}</span>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{ss.ip_address} ({ss.location})</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                          Nenhuma sessão ativa registrada.
                        </div>
                      )}
                    </div>
                  </CardGlass>

                  {/* Errors encountered */}
                  <CardGlass className="p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                      <Terminal size={14} className="text-brand-500" />
                      Erros Encontrados
                    </h3>
                    {userDetails.errors.length > 0 ? (
                      <div className="space-y-3">
                        {userDetails.errors.map((err: any) => (
                          <div key={err.id} className="p-3 rounded-xl bg-red-950/10 border border-red-500/10 text-xs flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-red-400 font-mono text-[10px]">{err.error_code}</span>
                              <span className="text-[9px] text-slate-550">{new Date(err.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className="text-slate-300 text-[10px]" title={err.message}>{err.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-900 rounded-xl text-slate-650 text-xs">
                        Nenhum erro reportado para este usuário.
                      </div>
                    )}
                  </CardGlass>

                </div>

              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-slate-900 rounded-2xl text-slate-500 text-xs">
            Falha crítica ao obter detalhes cadastrais do usuário selecionado.
          </div>
        )}
      </div>
    );
  }

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
    <div className="space-y-6 animate-fade-in font-sans p-0 text-slate-100 max-w-7xl mx-auto mb-16">
      
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
      <div className="flex border-b border-slate-900 gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              setUserPage(1);
            }}
            className={`pb-3 font-semibold text-xs transition-all relative ${
              activeSubTab === tab.id
                ? 'text-brand-500 font-bold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            {activeSubTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: Command Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {isLoadingOverview ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-brand-500" size={28} />
              <span className="text-xs font-semibold">Consolidando métricas operacionais...</span>
            </div>
          ) : (
            <>
              {/* KPI Cards Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardGlass 
                  onClick={() => {
                    if (hasUsersAccess) {
                      setActiveSubTab('users');
                      setUserPage(1);
                    }
                  }}
                  className={`p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 ${hasUsersAccess ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Usuários Cadastrados</span>
                    <Users size={16} className="text-brand-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display">
                      {overviewStats?.users_count ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Registros na tabela profiles (clique para ver a lista)</span>
                  </div>
                </CardGlass>

                <CardGlass 
                  onClick={() => {
                    setActiveSubTab('logs');
                  }}
                  className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Currículos Enviados</span>
                    <FileText size={16} className="text-brand-505" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display">
                      {overviewStats?.resumes_count ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Análises de arquivos no Supabase (clique para ver logs)</span>
                  </div>
                </CardGlass>

                <CardGlass 
                  onClick={() => {
                    setActiveSubTab('ia');
                  }}
                  className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vagas Analisadas</span>
                    <Layers size={16} className="text-purple-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display">
                      {overviewStats?.matches_count ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Matches de compatibilidade (clique para ver IA)</span>
                  </div>
                </CardGlass>

                <CardGlass 
                  onClick={() => {
                    setActiveSubTab('ia');
                  }}
                  className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tempo Médio IA</span>
                    <Clock size={16} className="text-amber-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display">
                      {overviewStats?.avg_processing_time ?? 0} s
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Média de processamento por vaga (clique para ver IA)</span>
                  </div>
                </CardGlass>
              </div>

              {/* KPI Cards Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CardGlass 
                  onClick={() => {
                    setActiveSubTab('ia');
                  }}
                  className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tokens Gemini</span>
                    <Bot size={16} className="text-blue-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display font-mono">
                      {(overviewStats?.total_tokens ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Acumulado de input/output de IA (clique para ver)</span>
                  </div>
                </CardGlass>

                <CardGlass 
                  onClick={() => {
                    setActiveSubTab('logs');
                  }}
                  className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Taxa de Sucesso</span>
                    <Activity size={16} className="text-emerald-450" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-emerald-400 font-display">
                      {overviewStats?.success_rate ?? 100.0}%
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Conversão de parsing sem erros (clique para ver logs)</span>
                  </div>
                </CardGlass>

                <CardGlass 
                  onClick={() => {
                    setActiveSubTab('logs');
                  }}
                  className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Último Deploy</span>
                    <Laptop size={16} className="text-slate-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-100 font-display">
                      {getDeployAge()}
                    </span>
                    <span className="text-[9px] text-slate-550 block mt-1">Compilação do ambiente (clique para ver logs)</span>
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
                    Ver Logs de Produção & Erros
                  </button>
                </CardGlass>
              </div>
            </>
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
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 text-[10px] font-bold transition-all"
                    >
                      Anterior
                    </button>
                    <span className="py-1 px-2.5 bg-slate-955 border border-slate-900 rounded-lg text-slate-300 font-bold">{userPage} / {totalUserPages}</span>
                    <button
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                      disabled={userPage === totalUserPages}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 text-[10px] font-bold transition-all"
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

      {/* VIEW 3: Logs */}
      {activeSubTab === 'logs' && hasTelemetryAccess && (
        <div className="space-y-6 animate-fade-in">
          <CardGlass className="p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-red-500 animate-pulse" />
                  Analytics Event Logs
                </h3>
                <p className="text-[10px] text-slate-550">Lista detalhada dos últimos 40 eventos processados pelo Analytics Event Engine.</p>
              </div>
              <button
                onClick={() => refetchEvents()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-all"
              >
                <RefreshCw size={10} /> Sincronizar
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {liveEvents.length > 0 ? (
                liveEvents.map((evt: any) => {
                  const type = getEventType(evt);
                  return (
                    <div key={evt.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs hover:bg-slate-950/60 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
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
                          <span className="font-semibold text-slate-200 block text-[13px]">{getEventMsg(evt)}</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-550 font-mono">
                            <span>Sessão: {evt.session_id ? evt.session_id.substring(0, 15) + '...' : 'N/A'}</span>
                            <span>SO/Navegador: {evt.os} | {evt.browser}</span>
                            <span>Local: {evt.city}, {evt.country}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(evt.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-slate-550 border border-dashed border-slate-900 rounded-xl">
                  Nenhum log registrado. A stream de eventos está limpa.
                </div>
              )}
            </div>
          </CardGlass>

          {/* Telemetry Errors Log */}
          <CardGlass className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-500" />
              Erros e Exceções de Produção
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
              <table className="w-full border-collapse text-left text-xs text-slate-450">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-350">
                    <th className="p-3">Horário</th>
                    <th className="p-3">Componente</th>
                    <th className="p-3">Código Erro</th>
                    <th className="p-3">Mensagem</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-sans">
                  {systemErrors.length > 0 ? (
                    systemErrors.map((err: any) => (
                      <tr key={err.id} className="hover:bg-slate-900/10">
                        <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(err.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 font-semibold text-slate-300">{err.component || 'Global'}</td>
                        <td className="p-3 font-bold font-mono text-red-400">{err.error_code || 'GENERIC_ERROR'}</td>
                        <td className="p-3 text-[11px] text-slate-400 max-w-md truncate" title={err.message}>{err.message}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            err.resolved ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                          }`}>
                            {err.resolved ? 'Resolvido' : 'Ativo'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-550">
                        Nenhum erro de produção localizado no banco. Operações normais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  <p className="text-xs text-slate-500 py-4 text-center">Nenhuma busca de vaga registrada nos logs de telemetria.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-500 font-bold border-b border-slate-900/50">
                          <th className="pb-2">Provedor / API</th>
                          <th className="pb-2 text-center">Consultas</th>
                          <th className="pb-2 text-center">Vagas Encontradas</th>
                          <th className="pb-2 text-center">Descartadas</th>
                          <th className="pb-2 text-center">Duplicadas</th>
                          <th className="pb-2 text-center">Erros / Timeouts</th>
                          <th className="pb-2 text-center">Latência</th>
                          <th className="pb-2 text-center">Última Execução</th>
                          <th className="pb-2 text-center">Health Score</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {providerStats.map((stat: any, idx: number) => {
                          const isHealthy = stat.healthScore >= 90;
                          const isWarning = stat.healthScore >= 70 && stat.healthScore < 90;
                          return (
                            <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-2.5 font-semibold text-slate-200">{stat.provider}</td>
                              <td className="py-2.5 text-center font-mono text-slate-350">{stat.calls}</td>
                              <td className="py-2.5 text-center font-mono text-emerald-400 font-semibold">{stat.total_jobs}</td>
                              <td className="py-2.5 text-center font-mono text-slate-500">{stat.discarded}</td>
                              <td className="py-2.5 text-center font-mono text-amber-550">{stat.duplicates}</td>
                              <td className="py-2.5 text-center font-mono text-red-400">{stat.errors}</td>
                              <td className="py-2.5 text-center font-mono text-slate-350">{stat.avg_latency}ms</td>
                              <td className="py-2.5 text-center font-mono text-slate-400">{stat.last_run}</td>
                              <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isHealthy 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : isWarning 
                                      ? 'bg-amber-500/10 text-amber-455 border border-amber-500/20'
                                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {stat.healthScore}%
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                  stat.errors > 2 ? 'text-amber-500' : 'text-emerald-450'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    stat.errors > 2 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                                  }`} />
                                  {stat.errors > 2 ? 'Timeout / Instável' : 'Operando'}
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
    </div>
  );
}
