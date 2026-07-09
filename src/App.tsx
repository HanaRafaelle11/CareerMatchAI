import { useState, useEffect } from 'react';
import { useAuth } from './application/hooks/useAuth';
import { useResumes, useJobs, useMatches } from './application/hooks/useCareerMatch';
import { useCareerProfile } from './application/hooks/useCareerProfile';
import { useMyProfileAi } from './application/hooks/useMyProfileAi';
import { useApplications } from './application/hooks/useApplications';
import { useCoach } from './application/hooks/useCoach';
import { useRoadmapServices } from './application/hooks/useRoadmapServices';
import { Navbar } from './presentation/components/Navbar';
import { Login } from './presentation/pages/Login';
import { Dashboard } from './presentation/pages/Dashboard';
import { Profile } from './presentation/pages/Profile';
import { JobMatchHub } from './presentation/pages/JobMatchHub';
import { CareerProfilePage } from './presentation/pages/CareerProfilePage';
import { MyProfileAi } from './presentation/pages/MyProfileAi';
import { StrategyPage } from './presentation/pages/StrategyPage';
import { CoachDashboard } from './presentation/pages/CoachDashboard';
import { Menu, FileText } from 'lucide-react';

function App() {
  const { user, profile, loading, loginWithEmail, signUpWithEmail, loginWithOAuth, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { resumes, uploadResume, deleteResume, isUploading, pipelineSteps } = useResumes(profile?.id);
  
  // Sincronizar o currículo/versão selecionado
  const [selectedResumeVersionId, setSelectedResumeVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResumeVersionId) {
      const primary = resumes.find(r => r.isPrimary) || resumes[0];
      if (primary && primary.resumeVersionId) {
        setSelectedResumeVersionId(primary.resumeVersionId);
      }
    }
  }, [resumes, selectedResumeVersionId]);

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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-sans">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Carregando CareerMatch AI...</span>
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
        )}

        {/* Meu Currículo — única tela de currículo (upload + visualização) */}
        {activeTab === 'profile' && (
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
        )}

        {activeTab === 'my-profile-ai' && (
          <MyProfileAi
            userId={profile?.id}
            resumeVersionId={selectedResumeVersionId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'career-profile' && (
          <CareerProfilePage
            careerProfile={careerProfile}
            careerProfileNew={careerProfileNew}
            onSaveProfile={updateCareerProfile}
            isSaving={isSavingProfile}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'strategy' && (
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
        )}

        {activeTab === 'match' && (
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
        )}

        {activeTab === 'coach' && (
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
        )}
      </main>
    </div>
  );
}

export default App;
