import { useState } from 'react';
import { useAuth } from './application/hooks/useAuth';
import { useResumes, useJobs, useMatches } from './application/hooks/useCareerMatch';
import { useCareerProfile } from './application/hooks/useCareerProfile';
import { useApplications } from './application/hooks/useApplications';
import { useCoach } from './application/hooks/useCoach';
import { useRoadmapServices } from './application/hooks/useRoadmapServices';
import { Navbar } from './presentation/components/Navbar';
import { Login } from './presentation/pages/Login';
import { Dashboard } from './presentation/pages/Dashboard';
import { Profile } from './presentation/pages/Profile';
import { JobMatchHub } from './presentation/pages/JobMatchHub';
import { CareerProfilePage } from './presentation/pages/CareerProfilePage';
import { StrategyPage } from './presentation/pages/StrategyPage';
import { CoachDashboard } from './presentation/pages/CoachDashboard';
import { Menu } from 'lucide-react';

function App() {
  const { user, profile, loading, loginWithEmail, signUpWithEmail, loginWithOAuth, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { resumes, uploadResume, deleteResume, isUploading } = useResumes(profile?.id);
  const { jobs, createJob, isCreating } = useJobs(profile?.id);
  const { matches, calculateMatch, isCalculating, getMatchDetails } = useMatches(profile?.id);
  const { careerProfile, updateCareerProfile, isUpdating: isSavingProfile } = useCareerProfile(profile?.id);
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

  // Se não estiver logado, renderizar tela de Autenticação
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
        {activeTab === 'dashboard' && (
          <Dashboard
            profile={profile}
            resumes={resumes}
            matches={matches}
            careerProfile={careerProfile}
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            setActiveTab={setActiveTab}
            applications={applications}
            careerGoals={careerGoals}
          />
        )}

        {activeTab === 'profile' && (
          <Profile
            profile={profile}
            resumes={resumes}
            onUploadResume={(file, rawText) => uploadResume({ file, rawText })}
            onDeleteResume={deleteResume}
            isUploading={isUploading}
            applications={applications}
          />
        )}

        {activeTab === 'career-profile' && (
          <CareerProfilePage
            careerProfile={careerProfile}
            onSaveProfile={updateCareerProfile}
            isSaving={isSavingProfile}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'strategy' && (
          <StrategyPage
            careerProfile={careerProfile}
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
