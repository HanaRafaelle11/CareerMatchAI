import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from './application/hooks/useAuth';
import { useResumes, useJobs, useMatches } from './application/hooks/useCareerMatch';
import { useCareerProfile } from './application/hooks/useCareerProfile';
import { useMyProfileAi } from './application/hooks/useMyProfileAi';
import { useApplications } from './application/hooks/useApplications';
import { useCoach } from './application/hooks/useCoach';
import { useRoadmapServices } from './application/hooks/useRoadmapServices';
import { Navbar } from './presentation/components/Navbar';
import { Login } from './presentation/pages/Login';
import { Menu, FileText, Loader2 } from 'lucide-react';

// ── Code Splitting: Lazy-load das páginas pesadas ──
const Dashboard = lazy(() => import('./presentation/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./presentation/pages/Profile').then(m => ({ default: m.Profile })));
const JobMatchHub = lazy(() => import('./presentation/pages/JobMatchHub').then(m => ({ default: m.JobMatchHub })));
const CareerProfilePage = lazy(() => import('./presentation/pages/CareerProfilePage').then(m => ({ default: m.CareerProfilePage })));
const MyProfileAi = lazy(() => import('./presentation/pages/MyProfileAi').then(m => ({ default: m.MyProfileAi })));
const StrategyPage = lazy(() => import('./presentation/pages/StrategyPage').then(m => ({ default: m.StrategyPage })));
const CoachDashboard = lazy(() => import('./presentation/pages/CoachDashboard').then(m => ({ default: m.CoachDashboard })));

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

function App() {
  const { user, profile, loading, loginWithEmail, signUpWithEmail, loginWithOAuth, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { resumes, uploadResume, deleteResume, isUploading, pipelineSteps } = useResumes(profile?.id);
  
  // Sincronizar o currículo/versão selecionado
  const [selectedResumeVersionId, setSelectedResumeVersionId] = useState<string | null>(null);

  const prevIsUploading = useRef(false);
  useEffect(() => {
    if (resumes && resumes.length > 0) {
      const exists = resumes.some(r => r.resumeVersionId === selectedResumeVersionId);
      const primary = resumes.find(r => r.isPrimary) || resumes[0];
      
      const justFinishedUpload = prevIsUploading.current && !isUploading;
      
      if (!exists || justFinishedUpload) {
        if (primary && primary.resumeVersionId) {
          setSelectedResumeVersionId(primary.resumeVersionId);
        }
      }
    } else {
      setSelectedResumeVersionId(null);
    }
    prevIsUploading.current = isUploading;
  }, [resumes, selectedResumeVersionId, isUploading]);

  const selectedResume = resumes.find(r => r.resumeVersionId === selectedResumeVersionId) || resumes[0];
  const selectedResumeId = selectedResume?.id || null;

  const { jobs, createJob, isCreating } = useJobs(profile?.id);
  const { matches, calculateMatch, isCalculating, getMatchDetails } = useMatches(profile?.id, selectedResumeId);
  const { careerProfile, updateCareerProfile, isUpdating: isSavingProfile } = useCareerProfile(profile?.id, selectedResumeVersionId);

  // ── Fonte única de verdade: career_profiles + career_insights ──
  const { data: myProfileData } = useMyProfileAi(profile?.id, selectedResumeVersionId);
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
  } = useApplications(profile?.id);

  const { 
    startSimulation, 
    sendMessage, 
    getSimulationQuery, 
    triggerDailyChecks,
    notifications,
    markNotificationAsRead,
    getPostLogQuery,
    savePostLog
  } = useCoach(profile?.id);

  const {
    companyProfiles,
    saveCompanyProfile,
    deleteCompanyProfile,
    getWeeklyPlannerQuery,
    saveWeeklyPlanner,
    getWeeklyGoalQuery,
    saveWeeklyGoal,
    careerGoals
  } = useRoadmapServices(profile?.id);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
        <div className="max-w-md w-full p-8 mx-4 rounded-3xl bg-slate-900/30 border border-slate-850 backdrop-blur-md flex flex-col items-center text-center space-y-6 relative">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-xl animate-pulse" />
            <div className="p-4 rounded-full bg-slate-950 border border-slate-800 text-brand-500 animate-bounce">
              <Loader2 className="animate-spin text-brand-500" size={32} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-slate-200">Iniciando CareerMatch AI</h3>
            <p className="text-xs text-slate-500">Conectando ao banco de dados e autenticando sessão de usuário...</p>
          </div>
          <div className="w-full max-w-[200px] h-1 bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full animate-progress-loading" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={loginWithEmail}
        onSignUp={signUpWithEmail}
        onOAuth={loginWithOAuth}
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
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-display font-bold text-white text-xs shadow-md shadow-brand-500/10">
              CM
            </div>
            <span className="font-display font-bold text-sm bg-gradient-to-r from-white to-slate-400 dark:from-white dark:to-slate-400 light:from-slate-900 light:to-slate-600 bg-clip-text text-transparent">
              CareerMatch AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-8 w-8 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-display font-semibold text-xs border border-indigo-500/30">
              {profile?.fullName?.charAt(0).toUpperCase() || 'C'}
            </div>
          )}
        </div>
      </header>

      {/* Navbar Lateral Fixa */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onLogout={logout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Container Principal */}
      <main className="flex-1 px-4 md:pl-72 md:pr-8 py-8 pt-20 md:pt-8 min-h-screen overflow-x-hidden relative z-10">

        {/* Seletor de Currículo Ativo Global */}
        {resumes && resumes.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Currículo Selecionado</span>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-brand-500" />
                <span className="font-semibold text-sm text-slate-200">
                  {selectedResume?.fileName || "Nenhum currículo selecionado"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Trocar currículo:</span>
              <select
                value={selectedResumeVersionId || ''}
                onChange={(e) => setSelectedResumeVersionId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
              >
                {resumes.map((r) => (
                  <option key={r.resumeVersionId} value={r.resumeVersionId}>
                    {r.fileName} {r.isPrimary ? '(Padrão)' : ''}
                  </option>
                ))}
              </select>
            </div>
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
              setActiveTab={setActiveTab}
              applications={applications}
              careerGoals={careerGoals}
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
              onSelectResumeVersion={setSelectedResumeVersionId}
            />
          </Suspense>
        )}

        {activeTab === 'my-profile-ai' && (
          <Suspense fallback={<LazyFallback />}>
            <MyProfileAi
              userId={profile?.id}
              resumeVersionId={selectedResumeVersionId}
              setActiveTab={setActiveTab}
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
              setActiveTab={setActiveTab}
            />
          </Suspense>
        )}

        {activeTab === 'strategy' && (
          <Suspense fallback={<LazyFallback />}>
            <StrategyPage
              userId={profile?.id}
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              resumes={resumes}
              jobs={jobs}
              applications={applications}
              onCreateApplication={createApplication}
              onUpdateApplication={updateApplication}
              onDeleteApplication={deleteApplication}
              getStagesQuery={getStagesQuery}
              addStage={addStage}
              deleteStage={deleteStage}
              setActiveTab={setActiveTab}
              companyProfiles={companyProfiles}
              saveCompanyProfile={saveCompanyProfile}
              deleteCompanyProfile={deleteCompanyProfile}
              getWeeklyPlannerQuery={getWeeklyPlannerQuery}
              saveWeeklyPlanner={saveWeeklyPlanner}
              getWeeklyGoalQuery={getWeeklyGoalQuery}
              saveWeeklyGoal={saveWeeklyGoal}
              getPostLogQuery={getPostLogQuery}
              savePostLog={savePostLog}
            />
          </Suspense>
        )}

        {activeTab === 'match' && (
          <Suspense fallback={<LazyFallback />}>
            <JobMatchHub
              userId={profile?.id}
              resumes={resumes}
              jobs={jobs}
              matches={matches}
              careerProfile={careerProfile}
              careerProfileNew={careerProfileNew}
              onCreateJob={createJob}
              onCalculateMatch={calculateMatch}
              getMatchDetails={getMatchDetails}
              isCreating={isCreating}
              isCalculating={isCalculating}
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
              startSimulation={startSimulation}
              sendMessage={sendMessage}
              getSimulationQuery={getSimulationQuery}
              triggerDailyChecks={triggerDailyChecks}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default App;
