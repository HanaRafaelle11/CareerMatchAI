import { useState, useEffect } from 'react';
import { CardGlass } from '../components/CardGlass';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, Loader2, ShieldAlert, RefreshCw, 
  Users, CreditCard, Search, Filter, ArrowUpRight, 
  ShieldCheck, UserCheck, AlertTriangle, AlertCircle, 
  ArrowLeft, Calendar, Clock, Laptop, Key, FileText, 
  Layers, Bot, Video, History, Terminal, UploadCloud
} from 'lucide-react';

interface AdminDashboardProps {
  userId: string | undefined;
}

// Mock inicial para quando a conexão com Supabase estiver em fallback/offline
const defaultMockUsers = [
  { id: 'usr-1', full_name: 'Hana Rafaelle', email: 'hana@talenta.ai', role: 'administrador', headline: 'CEO | Founder', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-2', full_name: 'Carlos Estevão', email: 'carlos@talenta.ai', role: 'suporte', headline: 'Customer Experience Lead', created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-3', full_name: 'Mariana Costa', email: 'mariana@talenta.ai', role: 'financeiro', headline: 'Financial Controller', created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-4', full_name: 'Davi Silva', email: 'davi@talenta.ai', role: 'somente_leitura', headline: 'Product Manager', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-5', full_name: 'Thiago Oliveira', email: 'thiago@gmail.com', role: 'user', headline: 'React Frontend Developer', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'usr-6', full_name: 'Juliana Melo', email: 'juliana@yahoo.com', role: 'user', headline: 'Customer Success Analyst', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
];

const defaultMockTransactions = [
  { id: 'tx-1', user_name: 'Thiago Oliveira', plan: 'Pro', amount: 49.90, status: 'succeeded', payment_method: 'credit_card', created_at: new Date().toISOString() },
  { id: 'tx-2', user_name: 'Juliana Melo', plan: 'Pro', amount: 49.90, status: 'succeeded', payment_method: 'pix', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx-3', user_name: 'Renata Souza', plan: 'Enterprise', amount: 249.90, status: 'succeeded', payment_method: 'credit_card', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx-4', user_name: 'Marcos Pires', plan: 'Pro', amount: 49.90, status: 'failed', payment_method: 'credit_card', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx-5', user_name: 'Luciana Reis', plan: 'Enterprise', amount: 249.90, status: 'succeeded', payment_method: 'pix', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
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

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetailTab, setUserDetailTab] = useState('profile');
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  useEffect(() => {
    // Eventos iniciais mockados
    const initialEvents = [
      { id: 'le-1', time: '20:15', msg: 'Usuário João entrou.', type: 'auth' },
      { id: 'le-2', time: '20:15', msg: 'Upload de currículo realizado.', type: 'upload' },
      { id: 'le-3', time: '20:16', msg: 'Interação com o Coach IA.', type: 'ia' },
      { id: 'le-4', time: '20:17', msg: 'Match calculado: 92% de compatibilidade.', type: 'match' },
      { id: 'le-5', time: '20:18', msg: 'Candidatura enviada para Stripe.', type: 'apply' },
      { id: 'le-6', time: '20:19', msg: 'Upgrade Premium realizado via Cartão.', type: 'billing' }
    ];
    setLiveEvents(initialEvents);

    const msgs = [
      'Usuário Maria Silva fez upload de currículo.',
      'Coach IA respondeu pergunta sobre currículo.',
      'Match calculado: 74% para vaga no LinkedIn.',
      'Usuário Carlos Estevão fez login via Google.',
      'Candidatura criada para Gupy (Desenvolvedor React).',
      'Assinatura Pro renovada automaticamente.',
      'Nova simulação de entrevista iniciada.',
      'Exportou PDF do currículo otimizado.',
      'Gerou carta de apresentação por IA.',
      'Tentativa de login malsucedida (IP 192.168.1.10).'
    ];
    
    const types = ['upload', 'ia', 'match', 'auth', 'apply', 'billing', 'ia', 'pdf', 'ia', 'security'];

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const newEvent = {
        id: `le-${Date.now()}`,
        time: timeStr,
        msg: randomMsg,
        type: randomType
      };
      setLiveEvents(prev => [newEvent, ...prev.slice(0, 8)]); // manter os 8 últimos eventos na stream
    }, 10000); // atualiza a cada 10 segundos

    return () => clearInterval(interval);
  }, []);

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
        // Fallback local do desenvolvedor
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

  // Controle Fino de Permissões por Papel (RBAC)
  const isSuperAdmin = currentUserRole === 'administrador';
  const hasTelemetryAccess = ['administrador', 'suporte', 'somente_leitura'].includes(currentUserRole);
  const hasUsersAccess = ['administrador', 'suporte', 'somente_leitura'].includes(currentUserRole);
  const hasFinancesAccess = ['administrador', 'financeiro', 'somente_leitura'].includes(currentUserRole);

  const canEditRoles = isSuperAdmin;

  // ── 2. BUSCAR TODOS OS USUÁRIOS/PERFIS DO SISTEMA ──
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        const stored = localStorage.getItem('mock_admin_users');
        if (stored) return JSON.parse(stored);
        localStorage.setItem('mock_admin_users', JSON.stringify(defaultMockUsers));
        return defaultMockUsers;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, role, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id,
        full_name: d.full_name,
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
        const currentMock = [...users];
        const idx = currentMock.findIndex(u => u.id === targetUserId);
        if (idx >= 0) {
          currentMock[idx].role = newRole;
          localStorage.setItem('mock_admin_users', JSON.stringify(currentMock));
        }
        return currentMock;
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

  // ── 3. BUSCAR TELEMETRIA DE ERROS & TELEMETRIA ──
  const { data: systemErrors = [], refetch: refetchTelemetry } = useQuery({
    queryKey: ['admin-telemetry-errors'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [
          { id: 'err-1', created_at: new Date().toISOString(), component: 'Gemini API', error_code: 'AI_TIMEOUT', message: 'Gemini demorou mais do que 15000ms para responder.', resolved: false },
          { id: 'err-2', created_at: new Date(Date.now() - 3600000).toISOString(), component: 'Database query', error_code: '42P01', message: 'Table public.career_profiles does not exist.', resolved: true }
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

  // ── 4. BUSCAR INFORMAÇÕES FINANCEIRAS (STRIPE/TRANSAÇÕES) ──
  const { data: billingData, isLoading: isLoadingFinances, refetch: refetchFinances } = useQuery({
    queryKey: ['admin-billing-finances'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          transactions: defaultMockTransactions,
          subscriptionsCount: { active: 3, trial: 2, canceled: 1 }
        };
      }
      const { data: transactions, error: txError } = await supabase
        .from('billing_transactions')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      const { data: subscriptions, error: subError } = await supabase
        .from('billing_subscriptions')
        .select('*');

      if (txError || subError) throw txError || subError;

      const activeCount = subscriptions?.filter((s: any) => s.status === 'active').length || 0;
      const trialCount = subscriptions?.filter((s: any) => s.status === 'trialing').length || 0;
      const canceledCount = subscriptions?.filter((s: any) => s.status === 'canceled').length || 0;

      return {
        transactions: (transactions || []).map((t: any) => ({
          id: t.id,
          user_name: t.profiles?.full_name || 'Usuário',
          amount: Number(t.amount),
          status: t.status,
          payment_method: t.payment_method,
          created_at: t.created_at
        })),
        subscriptionsCount: { active: activeCount, trial: trialCount, canceled: canceledCount }
      };
    },
    enabled: hasFinancesAccess
  });

  // ── 5. BUSCAR MÉTRICAS DE USO DE RECURSOS E IA ──
  const { data: usageCounts = { resumes: 12, jobs: 48, simulations: 8, chats: 45 }, refetch: refetchUsage } = useQuery({
    queryKey: ['admin-usage-counts'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return { resumes: 12, jobs: 48, simulations: 8, chats: 45 };
      }
      try {
        const [resumesRes, jobsRes, simsRes, logsRes] = await Promise.all([
          supabase.from('resumes').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('interview_simulations').select('*', { count: 'exact', head: true }),
          supabase.from('ai_usage_logs').select('*', { count: 'exact', head: true })
        ]);
        return {
          resumes: resumesRes.count || 0,
          jobs: jobsRes.count || 0,
          simulations: simsRes.count || 0,
          chats: logsRes.count || 0
        };
      } catch (err) {
        console.error('Error fetching database usage counts:', err);
        return { resumes: 0, jobs: 0, simulations: 0, chats: 0 };
      }
    }
  });

  // ── 6. BUSCAR INFORMAÇÕES DETALHADAS DO USUÁRIO SELECIONADO ──
  const { data: userDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['admin-user-details', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      if (!isSupabaseConfigured || !supabase) {
        return getMockUserDetails(selectedUser);
      }
      try {
        const [resumesRes, jobsRes, appsRes, simsRes, logsRes, errorsRes, eventsRes, subRes, txRes] = await Promise.all([
          supabase.from('resumes').select('*').eq('user_id', selectedUser.id),
          supabase.from('jobs').select('*').eq('user_id', selectedUser.id),
          supabase.from('applications').select('*').eq('user_id', selectedUser.id),
          supabase.from('interview_simulations').select('*').eq('user_id', selectedUser.id),
          supabase.from('ai_usage_logs').select('*').eq('user_id', selectedUser.id),
          supabase.from('application_errors').select('*').eq('user_id', selectedUser.id),
          supabase.from('application_events').select('*').eq('user_id', selectedUser.id),
          supabase.from('billing_subscriptions').select('*').eq('user_id', selectedUser.id).maybeSingle(),
          supabase.from('billing_transactions').select('*').eq('user_id', selectedUser.id)
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

        // Se o Supabase estiver configurado mas o banco não registrar sessões específicas, mockamos login/uploads a partir dos eventos
        const sessions = [
          { id: 'ss-1', ip_address: '191.185.12.84', device: 'Chrome / Windows', location: 'São Paulo, BR', last_active: new Date().toISOString() }
        ];
        const resumeVersions = [
          { id: 'ver-1.1', version_number: 2, version_label: 'CV Otimizado por IA', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
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
          events,
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

  // ── 9. BUSCAR RPCs DE ANALYTICS REAL-TIME ──
  const { data: funnelData = [], refetch: refetchFunnel } = useQuery({
    queryKey: ['admin-funnel-analytics'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return localDB.getMockAnalyticsData('get_funnel_analytics');
      }
      const { data, error } = await supabase.rpc('get_funnel_analytics');
      if (error) {
        console.error('Error fetching funnel RPC:', error);
        return localDB.getMockAnalyticsData('get_funnel_analytics');
      }
      return data;
    }
  });

  const { data: featureAdoption = [], refetch: refetchAdoption } = useQuery({
    queryKey: ['admin-feature-adoption'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return localDB.getMockAnalyticsData('get_feature_adoption');
      }
      const { data, error } = await supabase.rpc('get_feature_adoption');
      if (error) {
        console.error('Error fetching feature adoption RPC:', error);
        return localDB.getMockAnalyticsData('get_feature_adoption');
      }
      return data;
    }
  });

  const { data: iaCostCenter = [], refetch: refetchCosts } = useQuery({
    queryKey: ['admin-ia-cost-center'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return localDB.getMockAnalyticsData('get_ia_cost_center');
      }
      const { data, error } = await supabase.rpc('get_ia_cost_center');
      if (error) {
        console.error('Error fetching ia cost center RPC:', error);
        return localDB.getMockAnalyticsData('get_ia_cost_center');
      }
      return data;
    }
  });

  const { data: skillsIntelligence = [], refetch: refetchSkills } = useQuery({
    queryKey: ['admin-skills-intelligence'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return localDB.getMockAnalyticsData('get_skills_intelligence');
      }
      const { data, error } = await supabase.rpc('get_skills_intelligence');
      if (error) {
        console.error('Error fetching skills gap RPC:', error);
        return localDB.getMockAnalyticsData('get_skills_intelligence');
      }
      return data;
    }
  });

  const { data: heatmapJobs = [], refetch: refetchHeatmap } = useQuery({
    queryKey: ['admin-heatmap-jobs'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return localDB.getMockAnalyticsData('get_heatmap_jobs');
      }
      const { data, error } = await supabase.rpc('get_heatmap_jobs');
      if (error) {
        console.error('Error fetching heatmap RPC:', error);
        return localDB.getMockAnalyticsData('get_heatmap_jobs');
      }
      return data;
    }
  });

  const { data: aiInsights = [], refetch: refetchInsights } = useQuery({
    queryKey: ['admin-ai-insights'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return localDB.getMockAnalyticsData('get_ai_insights');
      }
      const { data, error } = await supabase.rpc('get_ai_insights');
      if (error) {
        console.error('Error fetching AI insights RPC:', error);
        return localDB.getMockAnalyticsData('get_ai_insights');
      }
      return data;
    }
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
    if (hasTelemetryAccess) refetchTelemetry();
    if (hasFinancesAccess) refetchFinances();
    refetchUsage();
    refetchFunnel();
    refetchAdoption();
    refetchCosts();
    refetchSkills();
    refetchHeatmap();
    refetchInsights();
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
          Esta área é destinada exclusivamente a administradores e pessoal autorizado da Talenta. Seu perfil não possui permissões RBAC de acesso.
        </p>
      </div>
    );
  }

  // Estatísticas de Faturamento e Telemetria para o Overview
  const succeededTx = billingData?.transactions?.filter(t => t.status === 'succeeded') || [];
  const mrr = succeededTx.reduce((acc, t) => acc + (t.amount || 0), 0);
  const unresolvedErrors = systemErrors.filter((e: any) => !e.resolved).length;

  const tabs = [
    { id: 'overview', label: 'Command Overview' },
    hasUsersAccess && { id: 'users', label: 'Controle de Usuários' },
    hasUsersAccess && { id: 'intelligence', label: 'Career Intelligence' },
    hasFinancesAccess && { id: 'finances', label: 'Financeiro' },
    hasTelemetryAccess && { id: 'ia_analytics', label: 'Inteligência Artificial' },
    hasUsersAccess && { id: 'jobs_observability', label: 'Observabilidade de Vagas' },
    hasUsersAccess && { id: 'growth_os', label: 'Growth OS & Suporte' },
    hasTelemetryAccess && { id: 'system_health', label: 'Saúde do Sistema' }
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
                      <span className="text-slate-200 font-semibold">{selectedUser.headline || 'Candidato | Talenta'}</span>
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
                      {userDetails.sessions.map((ss: any) => (
                        <div key={ss.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-200">{ss.device}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{ss.ip_address} ({ss.location})</span>
                        </div>
                      ))}
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

      {/* Header Banner - Vercel / Supabase Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold uppercase rounded-lg">Talenta Cloud</span>
            <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 font-bold uppercase rounded-lg">
              Role: {currentUserRole}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-slate-100 mt-2 flex items-center gap-2">
            Talenta Command Center
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
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardGlass className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Usuários Ativos (DAU)</span>
                <Users size={16} className="text-brand-500" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">{Math.ceil(users.length * 0.15 || 8)}</span>
                <span className="text-[9px] text-emerald-450 font-semibold flex items-center gap-0.5 mt-1">
                  <ArrowUpRight size={12} />
                  +14% hoje
                </span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Receita Recorrente (MRR)</span>
                <CreditCard size={16} className="text-emerald-450" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">
                  {hasFinancesAccess ? `R$ ${mrr.toFixed(2)}` : 'Restrito'}
                </span>
                <span className="text-[9px] text-emerald-455 font-semibold flex items-center gap-0.5 mt-1">
                  <ArrowUpRight size={12} />
                  +8.4% este mês
                </span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status IA</span>
                <Activity size={16} className="text-purple-400" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">99.4%</span>
                <span className="text-[9px] text-slate-550 block mt-1">Sem instabilidades no pipeline</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Alertas do Sistema</span>
                <AlertTriangle size={16} className="text-red-500 animate-pulse" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">
                  {hasTelemetryAccess ? unresolvedErrors + 1 : 'Restrito'}
                </span>
                <span className="text-[9px] text-red-400 font-semibold block mt-1">1 Alerta crítico pendente</span>
              </div>
            </CardGlass>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Event Stream */}
            <CardGlass className="p-5 lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    Event Stream (Tempo Real)
                  </h3>
                  <p className="text-[10px] text-slate-500">Fluxo instantâneo de atividades de segurança e interações.</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-slate-500 font-semibold rounded-lg">Auto-refresh ativo</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {liveEvents.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900/60 flex justify-between items-center text-xs transition-all hover:bg-slate-950/60">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        evt.type === 'auth' ? 'bg-blue-500/10 text-blue-400' :
                        evt.type === 'upload' ? 'bg-emerald-500/10 text-emerald-450' :
                        evt.type === 'ia' ? 'bg-purple-500/10 text-purple-400' :
                        evt.type === 'match' ? 'bg-amber-500/10 text-amber-400' :
                        evt.type === 'apply' ? 'bg-indigo-500/10 text-indigo-400' :
                        evt.type === 'billing' ? 'bg-pink-500/10 text-pink-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {evt.type === 'auth' && <Key size={14} />}
                        {evt.type === 'upload' && <UploadCloud size={14} />}
                        {evt.type === 'ia' && <Bot size={14} />}
                        {evt.type === 'match' && <Activity size={14} />}
                        {evt.type === 'apply' && <Layers size={14} />}
                        {evt.type === 'billing' && <CreditCard size={14} />}
                        {evt.type === 'pdf' && <FileText size={14} />}
                        {evt.type === 'security' && <ShieldAlert size={14} />}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">{evt.msg}</span>
                        <span className="text-[9px] text-slate-550 block mt-0.5 uppercase tracking-wider font-bold">{evt.type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{evt.time}</span>
                  </div>
                ))}
              </div>
            </CardGlass>

            {/* Health & Queue Widget */}
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
                      <span className="text-[10px] font-bold text-slate-350">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveSubTab('system_health')}
                className="w-full text-center py-2.5 rounded-xl border border-slate-900 hover:border-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all"
              >
                Ver Telemetria Completa
              </button>
            </CardGlass>
          </div>
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
                  className="pl-9 pr-6 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:border-brand-500 outline-none text-xs text-slate-400 cursor-pointer appearance-none"
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

      {/* VIEW 3: Career Intelligence & Funnel */}
      {activeSubTab === 'intelligence' && hasUsersAccess && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Funil de Conversão */}
            <CardGlass className="p-5 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Funil de Conversão & Onboarding (Mixpanel Style)</h3>
                <p className="text-[10px] text-slate-550">Acompanhamento reativo de conversões e gargalos de produto calculados em tempo real.</p>
              </div>

              <div className="space-y-3 pt-2">
                {funnelData.map((step: any, idx: number) => {
                  const prevStep = idx > 0 ? funnelData[idx - 1] : null;
                  const drop = prevStep ? Math.max(0, Number(prevStep.percentage) - Number(step.percentage)) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200">{step.step_name}</span>
                        <div className="text-right">
                          <span className="font-mono text-slate-400 font-bold">{Math.ceil(step.unique_users)}</span>
                          <span className="text-slate-550 ml-1.5">({step.percentage}%)</span>
                        </div>
                      </div>
                      {/* Visual Bar */}
                      <div className="h-4 w-full bg-slate-950/60 rounded-lg overflow-hidden border border-slate-900 relative">
                        <div
                          className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg"
                          style={{ width: `${step.percentage}%` }}
                        />
                        {drop > 0 && (
                          <span className="absolute right-3 top-0.5 text-[8px] font-extrabold text-red-400/80">
                            Abandono: {drop.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardGlass>

            {/* QA Career Insights */}
            <CardGlass className="p-5 lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                AI Correlation Insights
              </h3>
              <div className="space-y-4 text-xs">
                {aiInsights.map((insight: any, idx: number) => (
                  <div key={idx} className="space-y-1 p-3 bg-slate-950/20 border border-slate-900 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-brand-500/10 rounded-bl text-[8px] font-extrabold text-brand-400">
                      Impacto: {insight.impact_multiplier}x
                    </div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      💡 {insight.insight_title}
                    </h4>
                    <p className="font-semibold text-slate-300 mt-1">{insight.insight_description}</p>
                  </div>
                ))}
              </div>
            </CardGlass>
          </div>

          {/* Comparativo de Habilidades */}
          <CardGlass className="p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Skills Intelligence (Gap Currículo vs. Mercado)</h3>
              <p className="text-[10px] text-slate-500">Mapeamento em tempo real do gap de habilidades entre currículos de candidatos e vagas indexadas.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Skills in resumes */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-900 pb-1">
                  Mais Frequentes nos Currículos
                </span>
                {skillsIntelligence.slice(0, 6).map((skill: any, idx: number) => {
                  const maxCount = Math.max(...skillsIntelligence.map((s: any) => Number(s.user_count))) || 1;
                  const pct = Math.round((Number(skill.user_count) * 100) / maxCount);
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-300">{skill.skill_name}</span>
                        <span className="text-slate-500">{skill.user_count} perfis</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skills in jobs */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-900 pb-1">
                  Mais Demandadas nas Vagas (Mercado)
                </span>
                {skillsIntelligence.slice(0, 6).map((skill: any, idx: number) => {
                  const maxCount = Math.max(...skillsIntelligence.map((s: any) => Number(s.market_count))) || 1;
                  const pct = Math.round((Number(skill.market_count) * 100) / maxCount);
                  const isGap = skill.user_count === 0 || (Number(skill.market_count) - Number(skill.user_count)) > 5;
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          {skill.skill_name}
                          {isGap && <span className="text-[8px] font-bold px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-500/20 rounded">Gap Detectado</span>}
                        </span>
                        <span className="text-slate-505">{skill.market_count} vagas</span>
                      </div>
                      <div className="h-2 w-full bg-slate-955 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardGlass>

          {/* Feature Adoption & Heatmap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardGlass className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Adoção de Funcionalidades (Feature Adoption)</h3>
                <p className="text-[10px] text-slate-550">Utilização ativa das ferramentas do ecossistema Talenta.</p>
              </div>
              <div className="space-y-3 pt-2">
                {featureAdoption.map((feat: any, idx: number) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">{feat.feature_name}</span>
                      <span className="text-slate-500">{feat.use_count} interações ({feat.percentage}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-450 rounded-lg" style={{ width: `${feat.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardGlass>

            <CardGlass className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Heatmap de Vagas & Atuação</h3>
                <p className="text-[10px] text-slate-550">Distribuição volumétrica das vagas processadas e analisadas.</p>
              </div>
              <div className="space-y-3 pt-2">
                {heatmapJobs.map((cat: any, idx: number) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">{cat.category_name}</span>
                      <span className="text-slate-500">{cat.job_count} vagas ({cat.percentage}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-405 rounded-lg" style={{ width: `${cat.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardGlass>
          </div>

          {/* Métricas Operacionais de Currículos & Entrevistas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardGlass className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-brand-500" />
                Métricas de Currículos
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Enviados</span>
                  <span className="text-lg font-extrabold text-slate-200 block mt-1">{usageCounts?.resumes || 12} currículos</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Analisados</span>
                  <span className="text-lg font-extrabold text-slate-200 block mt-1">{usageCounts?.resumes || 12} currículos</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Otimizados</span>
                  <span className="text-lg font-extrabold text-slate-200 block mt-1">{Math.ceil((usageCounts?.resumes || 12) * 0.65)} otimizados</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Erros de Parsing</span>
                  <span className="text-lg font-extrabold text-emerald-450 block mt-1">0%</span>
                </div>
              </div>
            </CardGlass>

            <CardGlass className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-1.5">
                <Video size={14} className="text-purple-400" />
                Métricas de Entrevistas Simuladas
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                  <span className="text-[9px] text-slate-550 font-bold uppercase block">Simulações</span>
                  <span className="text-base font-extrabold text-slate-200 block mt-1">{usageCounts?.simulations || 8}</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                  <span className="text-[9px] text-slate-550 font-bold uppercase block">Tempo Médio</span>
                  <span className="text-base font-extrabold text-slate-200 block mt-1">12m 45s</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                  <span className="text-[9px] text-slate-550 font-bold uppercase block">Nota Média</span>
                  <span className="text-base font-extrabold text-slate-200 block mt-1">7.8 / 10</span>
                </div>
              </div>
              <div className="p-2.5 bg-slate-950/30 border border-slate-900 rounded-xl text-[11px] leading-relaxed">
                <span className="text-[9px] text-slate-550 font-bold uppercase block pb-1 border-b border-slate-900/40 font-semibold">Pergunta mais utilizada:</span>
                <span className="text-slate-300 block mt-1 font-medium font-sans">"Fale sobre um momento em que lidou com um cliente difícil ou insatisfeito e como reverteu a situação."</span>
              </div>
            </CardGlass>
          </div>
        </div>
      )}

      {/* VIEW 4: Financeiro (Billing) */}
      {activeSubTab === 'finances' && hasFinancesAccess && (
        <div className="space-y-6 animate-fade-in">
          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'MRR (Recorrente Mensal)', val: `R$ ${mrr.toFixed(2)}`, desc: 'Base de assinantes Pro' },
              { label: 'ARR (Anual Projetado)', val: `R$ ${(mrr * 12).toFixed(2)}`, desc: 'Multiplicador MRR x 12' },
              { label: 'Receita Diária', val: `R$ ${(mrr / 30).toFixed(2)}`, desc: 'Média ponderada 30d' },
              { label: 'Faturamento Mensal', val: `R$ ${mrr.toFixed(2)}`, desc: 'Valor total faturado' },
              { label: 'Projeção Anual', val: `R$ ${(mrr * 12).toFixed(2)}`, desc: 'Crescimento estimado' }
            ].map((card, idx) => (
              <CardGlass key={idx} className="p-4 flex flex-col justify-between">
                <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">{card.label}</span>
                <span className="text-lg font-extrabold text-slate-200 mt-2 font-display">{card.val}</span>
                <span className="text-[9px] text-slate-550 mt-1">{card.desc}</span>
              </CardGlass>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Payment Methods and Renewals stats */}
            <CardGlass className="p-5 col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                Divisão de Métodos e Conversão
              </h3>
              <div className="space-y-4 text-xs">
                {/* Method ratio */}
                <div className="space-y-2">
                  <span className="text-slate-500 font-semibold block">Métodos de Pagamento</span>
                  <div className="flex gap-1.5 h-6 rounded-lg overflow-hidden border border-slate-900 text-[10px] font-bold text-center">
                    <div className="bg-emerald-500 text-emerald-950 flex items-center justify-center" style={{ width: '42%' }}>PIX (42%)</div>
                    <div className="bg-brand-500 text-brand-950 flex items-center justify-center" style={{ width: '58%' }}>Cartão (58%)</div>
                  </div>
                </div>

                {/* Billing Event metrics counters */}
                <div className="space-y-3">
                  {[
                    { label: 'Renovações Automáticas', val: '42 concluídas', color: 'text-emerald-450' },
                    { label: 'Falhas de Cobrança (Stripe)', val: '2 pendências', color: 'text-red-400' },
                    { label: 'Reembolsos Concedidos', val: '1 processado', color: 'text-slate-400' },
                    { label: 'Upgrades de Plano (Free → Pro)', val: '+5 hoje', color: 'text-brand-400' },
                    { label: 'Downgrades de Plano', val: '0 hoje', color: 'text-slate-400' },
                    { label: 'Cancelamentos Efetuados', val: '0 esta semana', color: 'text-slate-400' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-950/20 border border-slate-900">
                      <span className="text-slate-450 font-medium">{item.label}</span>
                      <span className={`font-bold ${item.color}`}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardGlass>

            {/* Transactions detailed logs */}
            <CardGlass className="p-5 lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Histórico de Cobrança & Logs</h3>
                  <p className="text-[10px] text-slate-500">Transações recebidas via Stripe Webhooks.</p>
                </div>
                <button
                  onClick={() => refetchFinances()}
                  disabled={isLoadingFinances}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[9px] font-bold text-slate-200 flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  {isLoadingFinances ? <Loader2 className="animate-spin" size={10} /> : <RefreshCw size={10} />}
                  Sincronizar
                </button>
              </div>

              {isLoadingFinances ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500">
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                  <span className="text-xs font-medium">Buscando transações Stripe...</span>
                </div>
              ) : billingData?.transactions && billingData.transactions.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
                  <table className="w-full border-collapse text-left text-xs text-slate-450 font-sans">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-350">
                        <th className="p-3">ID Transação</th>
                        <th className="p-3">Usuário</th>
                        <th className="p-3">Método</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {billingData.transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-slate-900/10">
                          <td className="p-3 font-mono text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">{tx.id}</td>
                          <td className="p-3 font-semibold text-slate-300">{tx.user_name}</td>
                          <td className="p-3 text-slate-500 font-semibold uppercase">{tx.payment_method}</td>
                          <td className="p-3 font-bold text-slate-300">R$ {tx.amount.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              tx.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' :
                              tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/15' :
                              'bg-slate-500/10 text-slate-400 border border-slate-700/15'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-500">
                            {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl border border-dashed border-slate-900 text-slate-500 text-xs">
                  Nenhuma transação Stripe recente localizada no banco de dados.
                </div>
              )}
            </CardGlass>
          </div>
        </div>
      )}

      {/* VIEW 5: Inteligência Artificial (IA Analytics) */}
      {activeSubTab === 'ia_analytics' && hasTelemetryAccess && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Token/Cost Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Prompts Processados</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">4,210</span>
                <span className="text-[9px] text-emerald-450 font-semibold block mt-1">Hoje: 184 prompts enviados</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Volume de Tokens</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">15.2M</span>
                <span className="text-[9px] text-slate-550 block mt-1">Destaque: Coach IA (45% dos tokens)</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Custo de IA (Diário vs Total)</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-emerald-400 font-display">R$ 1.231,20</span>
                <span className="text-[9px] text-emerald-450 font-semibold block mt-1">Diário: R$ 41,04 (Gemini R$ 28,44 | OpenAI R$ 12,60)</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tempo Médio & Erros</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">1.22s</span>
                <span className="text-[9px] text-emerald-450 font-semibold block mt-1">Tempo de Resposta | Taxa de Erro: 0.05%</span>
              </div>
            </CardGlass>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tool popularity */}
            <CardGlass className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                Uso por Ferramenta de IA
              </h3>
              <div className="space-y-4 pt-2">
                {[
                  { name: 'Coach de Carreira (Chat)', usage: '45%', count: '1,894 chamadas', color: 'bg-purple-500' },
                  { name: 'Otimizador de Currículo', usage: '30%', count: '1,263 chamadas', color: 'bg-brand-500' },
                  { name: 'Gerador de Carta de Apresentação', usage: '15%', count: '631 chamadas', color: 'bg-pink-500' },
                  { name: 'Simulador de Entrevistas', usage: '10%', count: '422 chamadas', color: 'bg-blue-500' }
                ].map((tool, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-350">{tool.name}</span>
                      <div className="text-right">
                        <span className="text-slate-200">{tool.usage}</span>
                        <span className="text-slate-550 ml-1.5">({tool.count})</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${tool.color} rounded-full`} style={{ width: tool.usage }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardGlass>

            {/* Popular prompts logs */}
            <CardGlass className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                Prompts e Instruções Mais Frequentes
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { count: 182, prompt: '"Revisar pontos fracos do currículo para vaga de Customer Success"', category: 'Currículo' },
                  { count: 154, prompt: '"Simular uma entrevista técnica de Engenheiro de Software na Vercel"', category: 'Entrevista' },
                  { count: 114, prompt: '"Como explicar uma demissão recente sem prejudicar meu perfil?"', category: 'Coach IA' },
                  { count: 98, prompt: '"Escrever e-mail de agradecimento após entrevista final"', category: 'Carta' }
                ].map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/20 border border-slate-900 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{p.category}</span>
                      <p className="font-semibold text-slate-200 mt-1 font-mono text-[11px]">{p.prompt}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-lg shrink-0 ml-3">
                      {p.count} reqs
                    </span>
                  </div>
                ))}
              </div>
            </CardGlass>
          </div>

          {/* IA Cost Center & ROI Table */}
          <CardGlass className="p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">IA Cost Center & ROI por Usuário</h3>
              <p className="text-[10px] text-slate-550">Mapeamento detalhado de consumo de tokens, custos acumulados de APIs e retorno financeiro.</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
              <table className="w-full border-collapse text-left text-xs text-slate-400">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-300">
                    <th className="p-3">Usuário</th>
                    <th className="p-3">Tokens Totais</th>
                    <th className="p-3">Custo Est. (BRL)</th>
                    <th className="p-3">Coach (Tkns)</th>
                    <th className="p-3">CV (Tkns)</th>
                    <th className="p-3">Carta (Tkns)</th>
                    <th className="p-3">Entrevista (Tkns)</th>
                    <th className="p-3">Plano</th>
                    <th className="p-3 text-right">ROI (Est.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-[11px]">
                  {iaCostCenter.map((row: any, idx: number) => {
                    const isNegative = Number(row.roi) < 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/10">
                        <td className="p-3 font-semibold text-slate-200">{row.user_name}</td>
                        <td className="p-3 font-mono">{Number(row.total_tokens).toLocaleString()}</td>
                        <td className="p-3 font-mono text-amber-400">R$ {Number(row.estimated_cost_brl).toFixed(2)}</td>
                        <td className="p-3 font-mono text-slate-500">{Number(row.coach_tokens).toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-500">{Number(row.cv_tokens).toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-500">{Number(row.carta_tokens).toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-500">{Number(row.interview_tokens).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.premium_status === 'active' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {row.premium_status === 'active' ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                          R$ {Number(row.roi).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardGlass>
        </div>
      )}

      {/* VIEW 6: Observabilidade de Vagas */}
      {activeSubTab === 'jobs_observability' && hasUsersAccess && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vagas Importadas</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">12,402</span>
                <span className="text-[9px] text-slate-550 block mt-1">LinkedIn, Adzuna, Gupy, Indeed, Catho</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vagas Analisadas</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">{usageCounts?.jobs || 48}</span>
                <span className="text-[9px] text-slate-550 block mt-1">Mapeadas e avaliadas pelo motor de IA</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Matches & Performance</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">184</span>
                <span className="text-[9px] text-slate-450 font-semibold block mt-1">Score Médio: 74.5% | Match &gt; 80%: 42 usuários</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Velocidade do Processamento</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-emerald-450 font-display">4.2s</span>
                <span className="text-[9px] text-emerald-450 font-semibold block mt-1">Média por análise de compatibilidade</span>
              </div>
            </CardGlass>
          </div>

          {/* Vacancy Sources Breakdown */}
          <CardGlass className="p-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fontes de Indexação de Vagas</h3>
              <p className="text-[10px] text-slate-500">Mapeamento de feeds e portais de recrutadores ativos.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
              {[
                { source: 'Adzuna API', count: 4102, share: '33%', color: 'text-blue-400' },
                { source: 'LinkedIn Feed', count: 3405, share: '27.4%', color: 'text-indigo-400' },
                { source: 'Gupy Parser', count: 2801, share: '22.5%', color: 'text-purple-400' },
                { source: 'Indeed Web', count: 1504, share: '12.1%', color: 'text-cyan-400' },
                { source: 'Catho RSS', count: 590, share: '5%', color: 'text-pink-400' }
              ].map((src, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 flex flex-col justify-between">
                  <span className={`text-xs font-bold ${src.color}`}>{src.source}</span>
                  <span className="text-2xl font-extrabold text-slate-200 mt-2 font-display">{src.count.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-550 mt-1 font-semibold">Participação: {src.share}</span>
                </div>
              ))}
            </div>
          </CardGlass>
        </div>
      )}

      {/* VIEW 7: Growth OS & Suporte */}
      {activeSubTab === 'growth_os' && hasUsersAccess && (
        <div className="space-y-6 animate-fade-in">
          {/* User Risk Segmentation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CardGlass className="p-5 lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                Segmentação de Usuários & Funil de Risco
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Cadastrados Hoje', val: '+3 cadastros', desc: 'Novos ingressantes nas últimas 24h', color: 'text-brand-400' },
                  { label: 'Fizeram Upload de Currículo', val: '12 usuários', desc: 'Ativação inicial do perfil concluída', color: 'text-indigo-400' },
                  { label: 'Abandonou o Onboarding', val: '4 cadastros', desc: 'Parou antes de concluir onboarding', color: 'text-amber-400' },
                  { label: 'Nunca gerou Match', val: '3 cadastros', desc: 'Enviou CV mas não calculou matches', color: 'text-slate-400' },
                  { label: 'Nunca usou o Coach IA', val: '6 cadastros', desc: 'Nenhum prompt enviado ao assistente', color: 'text-slate-400' },
                  { label: 'Perto de Virar Premium', val: '9 cadastros', desc: 'Fez mais de 5 simulações/otimizações', color: 'text-emerald-400' },
                  { label: 'Usuários em Risco de Churn', val: '8 cadastros', desc: 'Inativos há mais de 14 dias', color: 'text-red-400' },
                  { label: 'Usuários Inativos Gerais', val: '12 cadastros', desc: 'Sem nova sessão há 30 dias', color: 'text-slate-450' }
                ].map((seg, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/20 border border-slate-900 flex justify-between items-center hover:scale-[1.01] transition-transform">
                    <div>
                      <span className={`font-semibold ${seg.color} block`}>{seg.label}</span>
                      <span className="text-[10px] text-slate-550 block mt-0.5">{seg.desc}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-200 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                      {seg.val}
                    </span>
                  </div>
                ))}
              </div>
            </CardGlass>

            {/* Support Center & NPS */}
            <CardGlass className="p-5 lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
                Centro de Suporte & NPS Geral
              </h3>
              <div className="space-y-4 text-xs">
                {/* Net Promoter Score */}
                <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-900 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">NPS Geral</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-display block mt-1">+74.2</span>
                  </div>
                  <span className="text-[9px] px-2 py-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 font-bold rounded-lg uppercase">Excelente</span>
                </div>

                {/* Star ratings */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-450">
                    <span>Avaliação Média na App Store/Web</span>
                    <span className="font-bold text-slate-200">4.8 / 5.0</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-450">
                    <span>Bugs reportados pendentes</span>
                    <span className="font-bold text-red-400">1 ticket</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-450">
                    <span>Solicitações de Sugestões</span>
                    <span className="font-bold text-slate-200">15 pendentes</span>
                  </div>
                </div>
              </div>
            </CardGlass>
          </div>

          {/* Automatic Marketing Campaign suggestions */}
          <CardGlass className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
              Sugestões Automáticas de Marketing (Growth Campaigns)
            </h3>
            <div className="space-y-3">
              {[
                { title: 'Enviar campanha para usuários que fizeram upload de currículo mas nunca geraram Match.', target: '15 usuários elegíveis', status: 'ready' },
                { title: 'Oferecer 3 dias grátis de Premium para quem simulou entrevista mas está inativo no Coach.', target: '6 usuários elegíveis', status: 'ready' },
                { title: 'Enviar lembrete de onboarding pendente para novos cadastros sem currículo nas últimas 48h.', target: '4 usuários elegíveis', status: 'ready' }
              ].map((cam, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/20 border border-slate-900 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{cam.title}</h4>
                    <span className="text-[10px] text-slate-550 mt-0.5 block">Segmento: {cam.target}</span>
                  </div>
                  <button
                    onClick={() => showToast('Disparando e-mails da campanha com sucesso!', 'success')}
                    className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-[10px] font-bold text-brand-950 transition-all cursor-pointer shrink-0 self-start sm:self-center"
                  >
                    Disparar Campanha
                  </button>
                </div>
              ))}
            </div>
          </CardGlass>
        </div>
      )}

      {/* VIEW 8: Saúde do Sistema */}
      {activeSubTab === 'system_health' && hasTelemetryAccess && (
        <div className="space-y-6 animate-fade-in">
          {/* Status Indicators Datadog Style */}
          <CardGlass className="p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Status das Operações do Sistema</h3>
              <p className="text-[10px] text-slate-500">Monitoramento ativo das portas de API, Banco e Filas de Mensageria.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              {[
                { service: 'Vercel Edge Functions', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Supabase Database', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Auth Service (Go)', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Supabase Storage', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Realtime WebSocket', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Cron Jobs (Scheduler)', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Background Workers', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Fila IA (Gemini API)', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Fila de E-mails', status: 'Operational', color: 'bg-emerald-450' },
                { service: 'Fila de Notificações', status: 'Operational', color: 'bg-emerald-450' }
              ].map((serv, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900/60 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">{serv.service}</span>
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${serv.color}`} />
                    <span className="text-[10px] font-extrabold text-slate-200">{serv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardGlass>

          {/* Performance Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Latência Média Global</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">142ms</span>
                <span className="text-[9px] text-emerald-450 font-semibold block mt-1">99% de requisições &lt; 250ms</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uso de CPU</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">22%</span>
                <span className="text-[9px] text-slate-550 block mt-1">Limite alocado: 8 CPU vcores</span>
              </div>
            </CardGlass>

            <CardGlass className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uso de Memória RAM</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-100 font-display">45%</span>
                <span className="text-[9px] text-slate-550 block mt-1">1.8GB consumido de 4.0GB alocados</span>
              </div>
            </CardGlass>
          </div>

          {/* Alert Logs */}
          <CardGlass className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">
              Histórico de Alertas de Produção (Event Log)
            </h3>
            <div className="space-y-3">
              {[
                { time: '14:23', msg: 'Erro de Autenticação - 3 tentativas inválidas consecutivas de login de rafox@talenta.ai', status: 'Ativo', color: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
                { time: 'Ontem', msg: 'Webhook Stripe falhou - Retransmissão da API de assinaturas falhou na primeira tentativa', status: 'Resolvido', color: 'text-slate-400', badge: 'bg-slate-900 text-slate-500 border-slate-800' },
                { time: 'Ontem', msg: 'Edge Function timeout - match-job demorou mais de 10s para responder para usuário 1845', status: 'Resolvido', color: 'text-slate-400', badge: 'bg-slate-900 text-slate-500 border-slate-800' }
              ].map((alert, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/20 border border-slate-900 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">{alert.time}</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{alert.msg}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider shrink-0 ml-3 ${alert.badge}`}>
                    {alert.status}
                  </span>
                </div>
              ))}
            </div>
          </CardGlass>
        </div>
      )}
    </div>
  );
}
