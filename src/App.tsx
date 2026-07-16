import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './application/hooks/useAuth';
import { useResumes, useJobs, useMatches } from './application/hooks/useCareerMatch';
import { useCareerProfile } from './application/hooks/useCareerProfile';
import { useMyProfileAi } from './application/hooks/useMyProfileAi';
import { useApplications } from './application/hooks/useApplications';
import { useCoach } from './application/hooks/useCoach';
import { useRoadmapServices } from './application/hooks/useRoadmapServices';
import { useUserPreferences } from './application/hooks/useUserPreferences';
import { Navbar } from './presentation/components/Navbar';
import { CompactHeader } from './presentation/components/ds/CompactHeader';
import { Login } from './presentation/pages/Login';
import { LandingPage } from './presentation/pages/LandingPage';
import { Menu, Loader2 } from 'lucide-react';
import { VocentroLogo } from './presentation/components/ds/MyCareerIcons';
import { isSupabaseConfigured, supabase } from './infrastructure/api/supabaseClient';
import type { Job } from './domain/models/types';

// ── Code Splitting: Lazy-load das páginas pesadas ──
const Dashboard = lazy(() => import('./presentation/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./presentation/pages/Profile').then(m => ({ default: m.Profile })));
const JobMatchHub = lazy(() => import('./presentation/pages/JobMatchHub').then(m => ({ default: m.JobMatchHub })));
const CareerProfilePage = lazy(() => import('./presentation/pages/CareerProfilePage').then(m => ({ default: m.CareerProfilePage })));
const StrategyPage = lazy(() => import('./presentation/pages/StrategyPage').then(m => ({ default: m.StrategyPage })));
const CoachDashboard = lazy(() => import('./presentation/pages/CoachDashboard').then(m => ({ default: m.CoachDashboard })));
const AdminDashboard = lazy(() => import('./presentation/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SettingsPage = lazy(() => import('./presentation/pages/Settings').then(m => ({ default: m.Settings })));
const NotificationsPage = lazy(() => import('./presentation/pages/Notifications').then(m => ({ default: m.Notifications })));

function LazyFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
      <div className="p-3 rounded-full bg-slate-950 border border-slate-800 text-brand-500">
        <Loader2 className="animate-spin text-brand-500" size={24} />
      </div>
      <div className="text-center space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-355">Carregando Módulo</span>
        <p className="text-[10px] text-slate-550">Preparando interface e componentes inteligentes...</p>
      </div>
    </div>
  );
}

import { useQueryClient } from '@tanstack/react-query';

function App() {
  const { user, profile, loading, loginWithEmail, signUpWithEmail, loginWithOAuth, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'ai-profile' | 'transparency'>('profile');
  const [settingsInitialSubTab, setSettingsInitialSubTab] = useState<'account' | 'resumes' | 'preferences' | 'notifications' | 'appearance' | 'privacy' | 'billing'>('account');
  const [strategyInitialSubTab, setStrategyInitialSubTab] = useState<'strategy' | 'planner' | 'pipeline' | 'journal'>('strategy');

  const { preferences, updatePreferences } = useUserPreferences(user?.id);

  // Synchronize visual theme on mount and on 'theme-change' / preferences update
  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = preferences.theme || localStorage.getItem('theme') || 'dark';
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
      } else if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light');
        document.body.classList.remove('light');
      } else {
        const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (systemPrefersLight) {
          document.documentElement.classList.add('light');
          document.body.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.body.classList.remove('light');
        }
      }
    };
    applyTheme();
    window.addEventListener('theme-change', applyTheme);
    return () => window.removeEventListener('theme-change', applyTheme);
  }, [preferences.theme]);

  const handleSetActiveTab = (tab: string) => {
    if (tab === 'admin') {
      window.history.pushState(null, '', '/admin');
      setActiveTab('admin');
      return;
    } else {
      window.history.pushState(null, '', '/');
    }

    if (tab === 'settings') {
      setSettingsInitialSubTab('account');
      setActiveTab('settings');
    } else if (tab === 'career-profile') {
      setSettingsInitialSubTab('preferences');
      setActiveTab('settings');
    } else if (tab === 'strategy') {
      setStrategyInitialSubTab('strategy');
      setActiveTab('strategy');
    } else if (tab === 'pipeline') {
      setStrategyInitialSubTab('pipeline');
      setActiveTab('strategy');
    } else if (tab === 'planner') {
      setStrategyInitialSubTab('planner');
      setActiveTab('strategy');
    } else if (tab === 'journal') {
      setStrategyInitialSubTab('journal');
      setActiveTab('strategy');
    } else {
      setActiveTab(tab);
    }
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeSimulationAppId, setActiveSimulationAppId] = useState<string | null>(null);

  const handleStartSimulation = async (target: Job | string, reset?: boolean) => {
    if (!profile?.id) return;
    try {
      let appId: string;
      if (typeof target === 'string') {
        appId = target;
      } else {
        const job = target;
        let app = applications.find(a => String(a.jobId) === String(job.id));
        if (!app) {
          app = await createApplication({
            jobId: job.id,
            companyName: job.companyName || 'Empresa Confidencial',
            jobTitle: job.title,
            status: '📝 Vou me candidatar',
            resumeVersionId: selectedResumeVersionId || undefined
          });
        }
        appId = app.id;
      }

      await startSimulation({ applicationId: appId, reset });
      setActiveSimulationAppId(appId);
      setActiveTab('coach');
    } catch (err) {
      console.error('Erro ao iniciar simulação de entrevista:', err);
      alert('Não foi possível iniciar a simulação no momento.');
    }
  };
  // Observa mudanças de histórico (Voltar / Avançar do navegador)
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Avalia perfil administrativo de forma reativa a partir do RBAC
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAdmin(true); // fallback local
      return;
    }
    if (profile) {
      const hasAdminRole = ['administrador', 'suporte', 'financeiro', 'somente_leitura'].includes(profile.role || '');
      setIsAdmin(hasAdminRole);
    } else {
      setIsAdmin(false);
    }
  }, [profile]);

  // Redireciona usuários não autorizados tentando acessar /admin
  useEffect(() => {
    if (!loading) {
      const isPathAdmin = window.location.pathname === '/admin';
      if (isPathAdmin) {
        if (profile && ['administrador', 'suporte', 'financeiro', 'somente_leitura'].includes(profile.role || '')) {
          setActiveTab('admin');
        } else if (profile) {
          window.history.replaceState(null, '', '/');
          setActiveTab('dashboard');
        }
      }
    }
  }, [loading, profile]);

  const { resumes, uploadResume, deleteResume, isUploading, pipelineSteps, selectActiveResume } = useResumes(user?.id);
  
  // Sincronizar o currículo/versão selecionado
  const [selectedResumeVersionId, setSelectedResumeVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (resumes && resumes.length > 0) {
      const hasValidSelection = resumes.some(r => r.resumeVersionId === selectedResumeVersionId);
      if (!selectedResumeVersionId || !hasValidSelection) {
        const primary = resumes.find(r => r.isPrimary) || resumes[0];
        if (primary && primary.resumeVersionId) {
          setSelectedResumeVersionId(primary.resumeVersionId);
        }
      }
    } else {
      setSelectedResumeVersionId(null);
    }
  }, [resumes, selectedResumeVersionId]);

  const handleSelectResumeVersion = async (versionId: string | null) => {
    if (!versionId) return;
    const selected = resumes.find(r => r.resumeVersionId === versionId);
    if (selected) {
      setSelectedResumeVersionId(versionId);
      try {
        await selectActiveResume(selected.id);
        queryClient.invalidateQueries({ queryKey: ['my-profile-ai', user?.id, versionId] });
        queryClient.invalidateQueries({ queryKey: ['matches', user?.id, selected.id] });
      } catch (err) {
        console.error('Erro ao alternar currículo ativo:', err);
      }
    }
  };

  const selectedResume = resumes.find(r => r.resumeVersionId === selectedResumeVersionId) || resumes[0];
  const selectedResumeId = selectedResume?.id || null;

  const { jobs, createJob, isCreating, deleteJob } = useJobs(user?.id);
  const { matches, calculateMatch, isCalculating, getMatchDetails } = useMatches(user?.id, selectedResumeId);
  const { careerProfile, updateCareerProfile, isUpdating: isSavingProfile } = useCareerProfile(user?.id, selectedResumeVersionId);

  // ── Fonte única de verdade: career_profiles + career_insights ──
  const { data: myProfileData } = useMyProfileAi(user?.id, selectedResumeVersionId);
  const careerProfileNew = myProfileData?.profile ?? null;
  const careerInsights = myProfileData?.insights ?? null;

  const { 
    applications, 
    createApplication, 
    updateApplication, 
    deleteApplication,
    getStagesQuery,
    addStage,
    deleteStage
  } = useApplications(user?.id, selectedResumeVersionId);

  const { 
    startSimulation, 
    sendMessage, 
    getSimulationQuery, 
    triggerDailyChecks,
    notifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    getPostLogQuery,
    savePostLog
  } = useCoach(user?.id);

  const {
    companyProfiles,
    saveCompanyProfile,
    deleteCompanyProfile,
    getWeeklyPlannerQuery,
    saveWeeklyPlanner,
    getWeeklyGoalQuery,
    saveWeeklyGoal,
    careerGoals
  } = useRoadmapServices(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
        <div className="max-w-md w-full p-8 mx-4 rounded-3xl bg-slate-900/30 border border-slate-850 backdrop-blur-md flex flex-col items-center text-center space-y-6 relative">
          <div className="relative flex flex-col items-center">
            <div className="absolute inset-0 rounded-full bg-brand-accent/15 blur-2xl animate-pulse" />
            <div className="p-5 rounded-full bg-slate-950 border border-slate-800 text-brand-accent shadow-2xl relative z-10 flex items-center justify-center">
              <VocentroLogo className="h-12 w-12 animate-pulse" showText={false} variant="symbol" />
            </div>
          </div>
          <div className="space-y-2 font-sans">
            <h3 className="font-display font-bold text-lg text-slate-200">Iniciando Vocentro</h3>
            <p className="text-xs text-slate-500">Conectando ao banco de dados e autenticando sessão de usuário...</p>
          </div>
          <div className="w-full max-w-[200px] h-1 bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent rounded-full animate-progress-loading" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return (
        <Login
          onLogin={loginWithEmail}
          onSignUp={signUpWithEmail}
          onOAuth={loginWithOAuth}
          onBack={() => setShowAuth(false)}
        />
      );
    }
    return (
      <LandingPage 
        onNavigateToAuth={() => setShowAuth(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors duration-300 font-sans flex">
      {/* Luzes decorativas */}
      <div className="fixed top-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-brand-500/5 dark:bg-brand-500/5 light:bg-brand-500/2 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[20%] w-[50vw] h-[50vh] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 light:bg-indigo-500/2 blur-[120px] pointer-events-none z-0" />

      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50/90 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between px-4 z-20 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-900/50 dark:hover:bg-slate-900/50 light:hover:bg-slate-200/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>
          <VocentroLogo className="h-7" showText={false} />
        </div>
        <div className="flex items-center gap-2">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-8 w-8 rounded-full object-cover border border-slate-700 cursor-pointer hover:opacity-85"
              onClick={() => handleSetActiveTab('settings')}
            />
          ) : (
            <div 
              onClick={() => handleSetActiveTab('settings')}
              className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-display font-semibold text-xs border border-indigo-500/30 cursor-pointer hover:opacity-85"
            >
              {profile?.fullName?.charAt(0).toUpperCase() || 'C'}
            </div>
          )}
        </div>
      </header>

      {/* Navbar Lateral Fixa */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        profile={profile}
        onLogout={logout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isAdmin={isAdmin}
        hasResume={resumes.length > 0}
        hasProfile={!!careerProfileNew}
        matchCount={matches.length}
        applicationCount={applications.length}
        interviewCount={applications.filter(a => ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)).length}
      />

      {/* Container Principal */}
      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 md:pl-[276px] md:pr-8 py-6 pt-20 md:pt-6 pb-24 md:pb-6 min-h-screen overflow-x-hidden relative z-10">

        {/* Compact Header — Currículo ativo */}
        {resumes && resumes.length > 0 && (
          <CompactHeader
            userName={profile?.fullName?.split(' ')[0] || 'Candidato'}
            activeResume={selectedResume || null}
            aiScore={matches.length > 0 ? Math.round(matches.reduce((a, m) => a + m.scoreOverall, 0) / matches.length) : undefined}
            resumes={resumes}
            onSelectResume={selectActiveResume}
            onSwitchResume={() => {
              setSettingsInitialSubTab('resumes');
              handleSetActiveTab('settings');
            }}
            onReanalyze={() => handleSetActiveTab('profile')}
            className="mb-4 border-b border-outline-variant/10 pb-3"
          />
        )}

        {activeTab === 'dashboard' && (
          <Suspense fallback={<LazyFallback />}>
            <Dashboard
              profile={profile}
              resumes={resumes}
              matches={matches}
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead}
              setActiveTab={handleSetActiveTab}
              applications={applications}
              careerGoals={careerGoals}
              jobs={jobs}
              setSelectedJobId={setSelectedJobId}
            />
          </Suspense>
        )}

        {/* Meu Currículo — única tela de currículo (upload + visualização) */}
        {activeTab === 'profile' && (
          <Suspense fallback={<LazyFallback />}>
            <Profile
              profile={profile}
              resumes={resumes}
              careerProfileNew={careerProfileNew}
              careerInsights={careerInsights}
              onUploadResume={(file, rawText) => uploadResume({ file, rawText })}
              onDeleteResume={deleteResume}
              isUploading={isUploading}
              applications={applications}
              pipelineSteps={pipelineSteps}
              activeResumeVersionId={selectedResumeVersionId}
              onSelectResumeVersion={handleSelectResumeVersion}
              activeProfileTab={activeProfileTab}
              setActiveProfileTab={setActiveProfileTab}
              setActiveTab={handleSetActiveTab}
            />
          </Suspense>
        )}



        {activeTab === 'career-profile' && (
          <Suspense fallback={<LazyFallback />}>
            <CareerProfilePage
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              onSaveProfile={updateCareerProfile}
              isSaving={isSavingProfile}
              setActiveTab={handleSetActiveTab}
            />
          </Suspense>
        )}

        {activeTab === 'strategy' && (
          <Suspense fallback={<LazyFallback />}>
            <StrategyPage
              userId={user?.id}
              preferences={preferences}
              updatePreferences={updatePreferences}
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              resumes={resumes}
              jobs={jobs}
              onDeleteJob={deleteJob}
              applications={applications}
              onCreateApplication={createApplication}
              onUpdateApplication={updateApplication}
              onDeleteApplication={deleteApplication}
              getStagesQuery={getStagesQuery}
              addStage={addStage}
              deleteStage={deleteStage}
              setActiveTab={handleSetActiveTab}
              companyProfiles={companyProfiles}
              saveCompanyProfile={saveCompanyProfile}
              deleteCompanyProfile={deleteCompanyProfile}
              getWeeklyPlannerQuery={getWeeklyPlannerQuery}
              saveWeeklyPlanner={saveWeeklyPlanner}
              getWeeklyGoalQuery={getWeeklyGoalQuery}
              saveWeeklyGoal={saveWeeklyGoal}
              getPostLogQuery={getPostLogQuery}
              savePostLog={savePostLog}
              onStartSimulation={handleStartSimulation}
              setSelectedJobId={setSelectedJobId}
              initialSubTab={strategyInitialSubTab}
            />
          </Suspense>
        )}

        {activeTab === 'match' && (
          <Suspense fallback={<LazyFallback />}>
            <JobMatchHub
              userId={user?.id}
              resumes={resumes}
              jobs={jobs}
              onDeleteJob={deleteJob}
              matches={matches}
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              onCreateJob={createJob}
              onCalculateMatch={calculateMatch}
              getMatchDetails={getMatchDetails}
              isCreating={isCreating}
              isCalculating={isCalculating}
              activeResumeVersionId={selectedResumeVersionId}
              applications={applications}
              onCreateApplication={createApplication}
              setActiveTab={handleSetActiveTab}
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onStartSimulation={handleStartSimulation}
            />
          </Suspense>
        )}

        {activeTab === 'coach' && (
          <Suspense fallback={<LazyFallback />}>
            <CoachDashboard
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              applications={applications}
              jobs={jobs}
              matches={matches}
              startSimulation={(appId, reset) => startSimulation({ applicationId: appId, reset })}
              sendMessage={sendMessage}
              getSimulationQuery={getSimulationQuery}
              triggerDailyChecks={triggerDailyChecks}
              initialSelectedAppId={activeSimulationAppId}
              onClearInitialSelectedAppId={() => setActiveSimulationAppId(null)}
            />
          </Suspense>
        )}

        {activeTab === 'notifications' && (
          <Suspense fallback={<LazyFallback />}>
            <NotificationsPage
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead}
              deleteNotification={deleteNotification}
              markAllNotificationsAsRead={markAllNotificationsAsRead}
              setActiveTab={handleSetActiveTab}
              jobs={jobs}
              setSelectedJobId={setSelectedJobId}
            />
          </Suspense>
        )}

        {activeTab === 'admin' && isAdmin && (
          <Suspense fallback={<LazyFallback />}>
            <AdminDashboard userId={user?.id} />
          </Suspense>
        )}

        {activeTab === 'settings' && (
          <Suspense fallback={<LazyFallback />}>
            <SettingsPage
              profile={profile}
              resumes={resumes}
              careerProfileNew={careerProfileNew}
              onSaveProfile={updateCareerProfile}
              onDeleteResume={deleteResume}
              onLogout={logout}
              onUpdateProfileState={updateProfile}
              initialTab={settingsInitialSubTab}
              preferences={preferences}
              updatePreferences={updatePreferences}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default App;
