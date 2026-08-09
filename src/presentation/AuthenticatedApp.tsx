import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useResumes, useJobs, useMatches } from '../application/hooks/useCareerMatch';
import { useCareerProfile } from '../application/hooks/useCareerProfile';
import { useMyProfileAi } from '../application/hooks/useMyProfileAi';
import { useApplications } from '../application/hooks/useApplications';
import { useCoach } from '../application/hooks/useCoach';
import { useRoadmapServices } from '../application/hooks/useRoadmapServices';
import { Navbar } from './components/Navbar';
import { CompactHeader } from './components/ds/CompactHeader';
import { ThemeToggle } from './components/ThemeToggle';
import { Menu, Loader2 } from 'lucide-react';
import { VocentroLogo } from './components/ds/MyCareerIcons';
import { supabase } from '../infrastructure/api/supabaseClient';
import { OnboardingModal } from './components/OnboardingModal';
import { GlobalCopilotDrawer } from './components/GlobalCopilotDrawer';
import { SatisfactionSurveyModal } from './components/SatisfactionSurveyModal';
import { Toast, type ToastMessage } from './components/ds';
import { CheckoutModal, useEntitlements } from '../modules/billing';
import type { Job } from '../domain/models/types';
import { useQueryClient } from '@tanstack/react-query';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const JobMatchHub = lazy(() => import('./pages/JobMatchHub').then(m => ({ default: m.JobMatchHub })));
const CareerProfilePage = lazy(() => import('./pages/CareerProfilePage').then(m => ({ default: m.CareerProfilePage })));
const StrategyPage = lazy(() => import('./pages/StrategyPage').then(m => ({ default: m.StrategyPage })));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard').then(m => ({ default: m.CoachDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const NotificationsPage = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));

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

export function AuthenticatedApp({
  user,
  profile,
  logout,
  updateProfile,
  preferences,
  updatePreferences
}: {
  user: any;
  profile: any;
  logout: () => void;
  updateProfile: (updated: any) => void;
  preferences: any;
  updatePreferences: (data: any) => void;
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'ai-profile' | 'transparency'>('profile');
  const [settingsInitialSubTab, setSettingsInitialSubTab] = useState<'account' | 'resumes' | 'preferences' | 'notifications' | 'appearance' | 'privacy' | 'billing'>('account');
  const [strategyInitialSubTab, setStrategyInitialSubTab] = useState<'strategy' | 'planner' | 'pipeline' | 'journal'>('strategy');
  const [matchHubInitialSubTab, setMatchHubInitialSubTab] = useState<'my-jobs' | 'discover'>('discover');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeSimulationAppId, setActiveSimulationAppId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const handleCompleteOnboarding = () => {
    localStorage.setItem('vocentro_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (user) {
      const hasCompleted = localStorage.getItem('vocentro_onboarding_completed') === 'true';
      if (!hasCompleted) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  // Deep linking: ativa a aba correta com base na URL (?tab=settings, ?tab=match, /settings, /vagas, /admin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const subtabParam = params.get('subtab');
    const pathname = window.location.pathname;

    const userEmail = (user?.email || '').trim().toLowerCase();

    if (pathname === '/admin' || tabParam === 'admin') {
      if (userEmail === 'hanarafaelle11@gmail.com') {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
        window.history.replaceState(null, '', '/');
      }
    } else if (pathname === '/settings' || pathname === '/configuracoes' || tabParam === 'settings') {
      setActiveTab('settings');
      if (subtabParam === 'notifications' || subtabParam === 'notificacoes') {
        setSettingsInitialSubTab('notifications');
      }
    } else if (pathname === '/match' || pathname === '/vagas' || tabParam === 'match' || tabParam === 'vagas' || tabParam === 'jobs') {
      setActiveTab('match');
      setMatchHubInitialSubTab('discover');
    }
  }, [user]);

  // Captura e persistência de parâmetros UTM
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
      const utmObj: Record<string, string> = {};
      let hasUtm = false;

      utmKeys.forEach(key => {
        const val = params.get(key);
        if (val) {
          utmObj[key] = val;
          hasUtm = true;
        }
      });

      if (hasUtm) {
        sessionStorage.setItem('vocentro_utm_params', JSON.stringify(utmObj));
        localStorage.setItem('vocentro_latest_utm_params', JSON.stringify(utmObj));
      }

      const storedUtmStr = sessionStorage.getItem('vocentro_utm_params') || localStorage.getItem('vocentro_latest_utm_params');
      if (user && supabase && storedUtmStr) {
        const utmData = JSON.parse(storedUtmStr);
        const alreadyLoggedKey = `vocentro_utm_logged_${user.id}_${utmData.utm_source || 'direct'}_${utmData.utm_campaign || 'default'}`;
        if (!sessionStorage.getItem(alreadyLoggedKey)) {
          sessionStorage.setItem(alreadyLoggedKey, 'true');
          supabase.from('activity_logs').insert({
            user_id: user.id,
            event_type: 'utm_captured',
            entity: 'marketing_attribution',
            metadata: {
              ...utmData,
              captured_at: new Date().toISOString(),
              page_url: window.location.href
            }
          }).then(({ error }) => {
            if (error) console.warn('[UTM] Erro ao registrar atribuição UTM:', error.message);
          });
        }
      }
    } catch (err) {
      console.error('[UTM] Erro no processamento de UTM:', err);
    }
  }, [user]);

  useEffect(() => {
    const handleOpenOnboarding = () => setShowOnboarding(true);
    window.addEventListener('vocentro_open_onboarding', handleOpenOnboarding);
    return () => window.removeEventListener('vocentro_open_onboarding', handleOpenOnboarding);
  }, []);

  // Avalia perfil administrativo
  useEffect(() => {
    if (!user || !user.email) {
      setIsAdmin(false);
      return;
    }
    const userEmail = (user.email || '').trim().toLowerCase();
    const isMainAdmin = userEmail === 'hanarafaelle11@gmail.com';
    
    setIsAdmin(isMainAdmin);
  }, [profile, user]);

  const handleSetActiveTab = (tab: string) => {
    if (tab === 'admin') {
      const userEmail = (user?.email || '').trim().toLowerCase();
      if (userEmail !== 'hanarafaelle11@gmail.com') {
        window.history.pushState(null, '', '/');
        setActiveTab('dashboard');
        return;
      }
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
    } else if (tab === 'match' || tab === 'jobs' || tab === 'vagas' || tab === 'discover' || tab === 'explorar') {
      setMatchHubInitialSubTab('discover');
      setActiveTab('match');
    } else {
      setActiveTab(tab);
    }
  };

  const { resumes, uploadResume, deleteResume, isUploading, pipelineSteps, selectActiveResume, isLoading: isLoadingResumes } = useResumes(user?.id);
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

  const [globalToast, setGlobalToast] = useState<ToastMessage | null>(null);
  const [userVisitCount, setUserVisitCount] = useState<number>(0);
  const [showSatisfactionSurvey, setShowSatisfactionSurvey] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const { isPro } = useEntitlements(user?.id);

  useEffect(() => {
    const handleOpenCheckout = () => {
      if (isPro) return;
      setShowCheckoutModal(true);
    };
    window.addEventListener('open_checkout_modal', handleOpenCheckout);
    return () => window.removeEventListener('open_checkout_modal', handleOpenCheckout);
  }, [isPro]);

  useEffect(() => {
    if (!user) {
      setShowSatisfactionSurvey(false);
      return;
    }

    const visitStorageKey = `vocentro_user_visit_count_${user.id}`;
    const sessionKey = `vocentro_session_active_${user.id}`;
    const surveyCompletedKey = `vocentro_survey_completed_${user.id}`;
    const surveyDismissedKey = `vocentro_survey_dismissed_${user.id}`;

    let visits = parseInt(localStorage.getItem(visitStorageKey) || '0', 10);
    const isCurrentSessionActive = sessionStorage.getItem(sessionKey) === 'true';

    if (!isCurrentSessionActive) {
      visits += 1;
      localStorage.setItem(visitStorageKey, String(visits));
      sessionStorage.setItem(sessionKey, 'true');
    }

    setUserVisitCount(visits);

    const isCompleted = localStorage.getItem(surveyCompletedKey) === 'true';
    const isDismissedInSession = sessionStorage.getItem(surveyDismissedKey) === 'true';

    if ((visits === 2 || visits === 3) && !isCompleted && !isDismissedInSession) {
      const timer = setTimeout(() => {
        setShowSatisfactionSurvey(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowSatisfactionSurvey(false);
    }
  }, [user?.id]);

  const selectedResume = resumes.find(r => r.resumeVersionId === selectedResumeVersionId) || resumes[0];
  const selectedResumeId = selectedResume?.id || null;

  const { jobs, createJob, isCreating, deleteJob } = useJobs(user?.id);
  const { matches, calculateMatch, isCalculating, getMatchDetails } = useMatches(user?.id, selectedResumeId);
  const { careerProfile, updateCareerProfile, isUpdating: isSavingProfile } = useCareerProfile(user?.id, selectedResumeVersionId);

  const { data: myProfileData, isLoading: isLoadingProfile } = useMyProfileAi(user?.id, selectedResumeVersionId);
  const careerProfileNew = myProfileData?.profile ?? null;
  const careerInsights = myProfileData?.insights ?? null;

  const { 
    applications, 
    createApplication, 
    updateApplication, 
    deleteApplication,
    useStagesQuery,
    addStage,
    deleteStage
  } = useApplications(user?.id, selectedResumeVersionId);

  const { 
    startSimulation, 
    sendMessage, 
    finalizeSimulation,
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
    useWeeklyPlannerQuery,
    saveWeeklyPlanner,
    useWeeklyGoalQuery,
    saveWeeklyGoal,
    careerGoals
  } = useRoadmapServices(user?.id);

  const handleStartSimulation = async (target: Job | string, reset?: boolean) => {
    if (!user?.id && !profile?.id) return;
    try {
      let appId: string | undefined;

      if (typeof target === 'string') {
        const existingApp = applications.find(a => String(a.id) === String(target));
        if (existingApp) {
          appId = existingApp.id;
        } else {
          const appByJob = applications.find(a => String(a.jobId) === String(target));
          if (appByJob) {
            appId = appByJob.id;
          } else {
            const targetJob = jobs.find(j => String(j.id) === String(target));
            if (targetJob && createApplication) {
              const newApp = await createApplication({
                jobId: targetJob.id,
                companyName: targetJob.companyName || 'Empresa Confidencial',
                jobTitle: targetJob.title,
                status: 'applied',
                resumeVersionId: selectedResumeVersionId || undefined
              });
              appId = newApp?.id;
            }
          }
        }
      } else if (target && typeof target === 'object') {
        const job = target;
        let app = applications.find(a => String(a.jobId) === String(job.id));
        if (!app && createApplication) {
          app = await createApplication({
            jobId: job.id,
            companyName: job.companyName || 'Empresa Confidencial',
            jobTitle: job.title,
            status: 'applied',
            resumeVersionId: selectedResumeVersionId || undefined
          });
        }
        appId = app?.id;
      }

      if (!appId) {
        setGlobalToast({ message: 'Esta vaga ou candidatura não está mais disponível no seu perfil.', type: 'warning' });
        return;
      }

      await startSimulation({ applicationId: appId, reset });
      setActiveSimulationAppId(appId);
      setActiveTab('coach');
    } catch (err: any) {
      console.error('Erro ao iniciar simulação de entrevista:', err);
      setGlobalToast({ message: 'Não foi possível iniciar o treino STAR no momento: ' + (err.message || 'vaga não encontrada'), type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors duration-300 font-sans flex">
      <OnboardingModal
        isOpen={showOnboarding && !!user}
        onClose={handleCompleteOnboarding}
        onStartUpload={() => handleSetActiveTab('profile')}
        onNavigateTab={handleSetActiveTab}
      />

      <div className="fixed top-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-brand-500/5 dark:bg-brand-500/5 light:bg-brand-500/2 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[20%] w-[50vw] h-[50vh] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 light:bg-indigo-500/2 blur-[120px] pointer-events-none z-0" />

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
          <ThemeToggle />
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

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        profile={profile}
        onLogout={logout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isAdmin={isAdmin}
        isPro={isPro}
        hasResume={resumes.length > 0}
        hasProfile={!!careerProfileNew}
        matchCount={matches.length}
        applicationCount={applications.length}
        interviewCount={applications.filter(a => ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)).length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev: boolean) => !prev)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        userId={user?.id}
        userEmail={user?.email}
      />

      <main className={`flex-1 w-full min-w-0 px-4 sm:px-6 transition-all duration-300 ${
        isSidebarCollapsed ? 'md:pl-[88px]' : 'md:pl-[256px]'
      } md:pr-8 py-6 pt-20 md:pt-6 pb-24 md:pb-6 min-h-screen overflow-x-hidden relative z-10`}>

        {resumes && resumes.length > 0 && (
          <div className="w-full mb-6 p-3.5 rounded-2xl bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-slate-800/90 shadow-xs transition-colors">
            <CompactHeader
              userName={profile?.fullName?.split(' ')[0] || 'Candidato'}
              activeResume={selectedResume || null}
              aiScore={matches.length > 0 ? Math.round(matches.reduce((a, m) => a + m.scoreOverall, 0) / matches.length) : undefined}
              resumes={resumes}
              onSelectResume={handleSelectResumeVersion}
              onSwitchResume={() => {
                setSettingsInitialSubTab('resumes');
                handleSetActiveTab('settings');
              }}
              onReanalyze={(activeTab === 'discover' || activeTab === 'match') ? undefined : async () => {
                try {
                  if (selectedResumeVersionId && user?.id) {
                    await queryClient.invalidateQueries({ queryKey: ['my-profile-ai', user.id, selectedResumeVersionId] });
                    await queryClient.invalidateQueries({ queryKey: ['matches', user.id] });
                    await queryClient.invalidateQueries({ queryKey: ['resumes', user.id] });
                  }
                  handleSetActiveTab('discover');
                } catch (err) {
                  console.error(err);
                }
              }}
              className=""
            />
          </div>
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
              isLoading={isLoadingResumes || isLoadingProfile}
            />
          </Suspense>
        )}

        {activeTab === 'profile' && (
          <Suspense fallback={<LazyFallback />}>
            <Profile
              profile={profile}
              resumes={resumes}
              careerProfileNew={careerProfileNew}
              careerInsights={careerInsights}
              onUploadResume={async (file, rawText) => {
                try {
                  const result = await uploadResume({ file, rawText });
                  if (result && (result as any).resumeVersionId) {
                    handleSelectResumeVersion((result as any).resumeVersionId);

                    setGlobalToast({
                      message: '✨ Currículo analisado com sucesso! Clique em "Buscar vagas e ver seu Match" para continuar.',
                      type: 'success'
                    });
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
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

        {(activeTab === 'strategy' || activeTab === 'jornada') && (
          <Suspense fallback={<LazyFallback />}>
            <StrategyPage
              userId={user?.id}
              preferences={preferences}
              updatePreferences={async (data) => updatePreferences(data)}
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              resumes={resumes}
              jobs={jobs}
              onDeleteJob={deleteJob}
              applications={applications}
              onCreateApplication={createApplication}
              onUpdateApplication={updateApplication}
              onDeleteApplication={deleteApplication}
              useStagesQuery={useStagesQuery}
              addStage={addStage}
              deleteStage={deleteStage}
              setActiveTab={handleSetActiveTab}
              companyProfiles={companyProfiles}
              saveCompanyProfile={saveCompanyProfile}
              deleteCompanyProfile={deleteCompanyProfile}
              useWeeklyPlannerQuery={useWeeklyPlannerQuery}
              saveWeeklyPlanner={saveWeeklyPlanner}
              useWeeklyGoalQuery={useWeeklyGoalQuery}
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
              onUpdateApplication={updateApplication}
              onDeleteApplication={deleteApplication}
              setActiveTab={handleSetActiveTab}
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onStartSimulation={handleStartSimulation}
              initialSubTab={matchHubInitialSubTab}
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
              finalizeSimulation={finalizeSimulation}
              getSimulationQuery={getSimulationQuery}
              triggerDailyChecks={triggerDailyChecks}
              initialSelectedAppId={activeSimulationAppId}
              onClearInitialSelectedAppId={() => setActiveSimulationAppId(null)}
              setActiveTab={handleSetActiveTab}
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
              updatePreferences={async (data) => updatePreferences(data)}
              onDeleteJob={deleteJob}
            />
          </Suspense>
        )}
      </main>

      <GlobalCopilotDrawer
        applications={applications}
        jobs={jobs}
        matches={matches}
        careerProfileNew={careerProfileNew}
        setActiveTab={handleSetActiveTab}
        onStartSimulation={handleStartSimulation}
        isOpen={isCopilotOpen}
        onToggleOpen={() => setIsCopilotOpen(prev => !prev)}
        onClose={() => setIsCopilotOpen(false)}
        hideFloatingButton={true}
      />



      {showSatisfactionSurvey && user && (
        <SatisfactionSurveyModal
          userId={user.id}
          userName={profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'Candidato')}
          visitCount={userVisitCount}
          onClose={() => setShowSatisfactionSurvey(false)}
        />
      )}

      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        userId={user?.id}
        userEmail={user?.email}
        userName={profile?.full_name}
      />

      <Toast toast={globalToast} onClose={() => setGlobalToast(null)} />
    </div>
  );
}
