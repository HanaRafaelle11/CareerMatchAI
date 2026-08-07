import { useState, useEffect, type FormEvent } from 'react';
import { CardGlass } from '../components/CardGlass';
import { CandidateStrategyService } from '../../application/services/CandidateStrategyService';
import { ApplicationPipelineService, type PipelineColumnId } from '../../application/services/ApplicationPipelineService';
import { REJECTION_REASONS } from '../../domain/models/types';
import type { 
  Job, Resume, CareerProfile, Application, ApplicationStage,
  CompanyProfile, WeeklyPlanner, WeeklyGoal
} from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { useEscapeToClose } from '../../application/hooks/useEscapeToClose';
import { 
  Flame, Sparkles, AlertCircle, Clock, Plus, Trash2, 
  X, Layout, AlertTriangle, Briefcase,
  CheckSquare, Square, BookOpen, Target, Loader2,
  Calendar, UserCheck, MessageSquare, ShieldAlert, Archive, Send, RefreshCcw
} from 'lucide-react';
import { Badge } from '../components/ds';
import { tracker } from '../../infrastructure/analytics/tracker';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { isAppliedStatus, isSavedStatus } from '../../domain/models/applicationStatusConstants';

import { useToast } from '../../application/context/ToastContext';
import { HiredCongratulationModal } from '../components/HiredCongratulationModal';

interface StrategyPageProps {
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  resumes: Resume[];
  jobs: Job[];
  onDeleteJob?: (jobId: string) => Promise<any>;
  applications: Application[];
  onCreateApplication: (data: Omit<Application, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateApplication: (data: Application) => Promise<any>;
  onDeleteApplication: (id: string) => Promise<any>;
  getStagesQuery: (appId: string) => any;
  addStage: (args: { appId: string, stage: Omit<ApplicationStage, 'id' | 'createdAt'> }) => Promise<any>;
  deleteStage: (args: { appId: string, stageId: string }) => Promise<any>;
  setActiveTab: (tab: string) => void;
  userId?: string;
  preferences?: any;
  updatePreferences?: (newUpdates: any) => Promise<void>;
  // Roadmap services
  companyProfiles: CompanyProfile[];
  saveCompanyProfile: (profile: CompanyProfile) => Promise<any>;
  deleteCompanyProfile: (id: string) => Promise<any>;
  getWeeklyPlannerQuery: (weekNumber: number) => any;
  saveWeeklyPlanner: (planner: WeeklyPlanner) => Promise<any>;
  getWeeklyGoalQuery: (weekNumber: number) => any;
  saveWeeklyGoal: (goal: WeeklyGoal) => Promise<any>;
  getPostLogQuery: (appId: string) => any;
  savePostLog: (log: any) => Promise<any>;
  onStartSimulation?: (target: Job | string) => void;
  setSelectedJobId?: (id: string | null) => void;
  initialSubTab?: 'strategy' | 'planner' | 'pipeline' | 'journal';
}

export function StrategyPage({
  careerProfile,
  careerProfileNew,
  resumes,
  jobs,
  onDeleteJob,
  applications,
  onCreateApplication,
  onUpdateApplication,
  onDeleteApplication,
  getStagesQuery,
  addStage,
  deleteStage,
  setActiveTab: _setActiveTab,
  userId,
  preferences,
  updatePreferences,
  companyProfiles: _companyProfiles,
  saveCompanyProfile,
  deleteCompanyProfile: _deleteCompanyProfile,
  getWeeklyPlannerQuery,
  saveWeeklyPlanner,
  getWeeklyGoalQuery,
  saveWeeklyGoal: _saveWeeklyGoal,
  getPostLogQuery,
  savePostLog,
  onStartSimulation: _onStartSimulation,
  initialSubTab
}: StrategyPageProps) {
  const [subTab, setSubTab] = useState<'strategy' | 'planner' | 'pipeline' | 'journal'>(initialSubTab || 'pipeline');

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [_intelSubTab, _setIntelSubTab] = useState<'companies' | 'diary'>('companies');
  const [showArchived, setShowArchived] = useState(false);
  const [showChoiceStep, setShowChoiceStep] = useState(true);

  // Modals for confirmation
  const [backwardConfirmApp, setBackwardConfirmApp] = useState<{ app: Application; targetStatus: string } | null>(null);
  const [advancedRejectConfirmApp, setAdvancedRejectConfirmApp] = useState<{ app: Application } | null>(null);

  // Rejection & Hired Modal States
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
  const [hiredModalApp, setHiredModalApp] = useState<Application | null>(null);

  // Drag-and-Drop and Permanent Delete States
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);

  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const currentWeekNumber = 202628;

  // Local overrides for job metrics (ROI calculation)
  const [jobMetricsOverride] = useState<Record<string, { stagesCount: number, caseHours: number }>>({});
  const [columnOverrides, setColumnOverrides] = useState<Record<string, 'hot' | 'warm' | 'cold'>>({});

  useEffect(() => {
    if (preferences?.strategy_column_overrides) {
      setColumnOverrides(preferences.strategy_column_overrides);
    }
  }, [preferences?.strategy_column_overrides]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleMoveJobColumn = (jobId: string, targetCol: 'hot' | 'warm' | 'cold') => {
    const updated = { ...columnOverrides, [jobId]: targetCol };
    setColumnOverrides(updated);
    if (updatePreferences) {
      updatePreferences({ strategy_column_overrides: updated });
    }
  };
  void _handleMoveJobColumn; // reserved for future Strategy tab

  // Fetch planner and goals queries
  const { data: planner } = getWeeklyPlannerQuery(currentWeekNumber);
  const { data: _goal } = getWeeklyGoalQuery(currentWeekNumber);

  // Kanban Pipeline Map
  const pipelineColumns = ApplicationPipelineService.getColumnMap(applications);

  const activeColumnsOrder: PipelineColumnId[] = [
    'found',
    'saved',
    'applied',
    'hr',
    'interview',
    'offer',
    'hired'
  ];

  // Toast State
  const { showToast } = useToast();
  const setToast = showToast;

  const handleSoftDelete = async () => {
    if (!deletingApp) return;
    try {
      if (onDeleteApplication) {
        await onDeleteApplication(deletingApp.id);
      } else {
        await onUpdateApplication({
          ...deletingApp,
          status: 'deleted',
          updatedAt: new Date().toISOString()
        });
      }
      if (selectedAppId === deletingApp.id) {
        setSelectedAppId(null);
      }
      setDeletingApp(null);
      showToast('Candidatura excluída com sucesso.', 'info');
      tracker.track('application_removed', 'StrategyPage', {
        appId: deletingApp.id,
        user_id: userId
      });
    } catch (err) {
      console.error('Erro ao remover candidatura:', err);
      setToast({ message: 'Não foi possível remover a candidatura. Tente novamente.', type: 'error' });
    }
  };

  // Detailed Card Drawer State
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const selectedApp = applications.find(a => a.id === selectedAppId);
  const { data: activeStages = [], isLoading: loadingStages } = getStagesQuery(selectedAppId || '');

  // Card Drawer Form States
  const [cardNextAction, setCardNextAction] = useState('');
  const [cardNextActionDate, setCardNextActionDate] = useState('');
  const [cardRecruiterName, setCardRecruiterName] = useState('');
  const [cardFeedback, setCardFeedback] = useState('');
  const [cardNotes, setCardNotes] = useState('');
  const [isSavingCardDetails, setIsSavingCardDetails] = useState(false);

  useEffect(() => {
    if (selectedApp) {
      setCardNextAction((selectedApp as any).nextAction || (selectedApp as any).next_action || '');
      setCardNextActionDate((selectedApp as any).nextActionDate || (selectedApp as any).next_action_date || '');
      setCardRecruiterName((selectedApp as any).recruiterName || (selectedApp as any).recruiter_name || '');
      setCardFeedback((selectedApp as any).feedback || '');
      setCardNotes(selectedApp.notes || '');
    } else {
      setCardNextAction('');
      setCardNextActionDate('');
      setCardRecruiterName('');
      setCardFeedback('');
      setCardNotes('');
    }
    setNewStageName('applied');
    setNewStageStatus('pending');
    setNewStageNotes('');
  }, [selectedAppId, (selectedApp as any)?.updatedAt, (selectedApp as any)?.status]);

  // Form for new Stage
  const [newStageName, setNewStageName] = useState('applied');
  const [newStageStatus, setNewStageStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
  const [newStageNotes, setNewStageNotes] = useState('');

  // States for manual creation
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualCompany, setManualCompany] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualStatus, setManualStatus] = useState<Application['status']>('applied');
  const [manualSource, setManualSource] = useState('LinkedIn');

  // Strategy Job Details Modal State
  const [_viewingStrategyJob, _setViewingStrategyJob] = useState<Job | null>(null);

  // Company Intelligence states
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  void showCompanyForm; // reserved for Company Intelligence tab
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, _setCompanySize] = useState('Média');
  const [companyRating, _setCompanyRating] = useState('4.0');
  const [companyProcess, setCompanyProcess] = useState('');
  const [companyBenefits, setCompanyBenefits] = useState('');
  const [companyRemote, _setCompanyRemote] = useState('Híbrido');
  const [companySalary, setCompanySalary] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [companyCulture, _setCompanyCulture] = useState(4);
  const [companyApplyAgain, _setCompanyApplyAgain] = useState(true);

  // AI Journal reflection log states
  const [journalAppId, setJournalAppId] = useState<string>('');
  const [journalFeeling, setJournalFeeling] = useState<string>('😐');
  const [journalConfidence, _setJournalConfidence] = useState<number>(7);
  const [journalDiff, setJournalDiff] = useState<string>('');
  const [journalLearned, setJournalLearned] = useState<string>('');
  const [journalDifferent, setJournalDifferent] = useState<string>('');
  const { data: activePostLog } = getPostLogQuery(journalAppId || 'none');

  useEscapeToClose(showAddForm, () => setShowAddForm(false));
  useEscapeToClose(!!rejectingApp, () => setRejectingApp(null));
  useEscapeToClose(!!selectedAppId, () => setSelectedAppId(null));
  useEscapeToClose(!!deletingApp, () => setDeletingApp(null));
  useEscapeToClose(!!backwardConfirmApp, () => setBackwardConfirmApp(null));
  useEscapeToClose(!!advancedRejectConfirmApp, () => setAdvancedRejectConfirmApp(null));
  useEscapeToClose(!!hiredModalApp, () => setHiredModalApp(null));

  // Helper function: Helper to match job score
  const getJobMatchScore = (jobId?: string): number => {
    if (!jobId) return 75;
    const job = jobs.find(j => j.id === jobId);
    if (!job) return 75;
    return job.scores?.overall || 75;
  };

  // Helper function: Calculate average duration in column
  const getAverageDaysInColumn = (colApps: Application[]): string => {
    if (!colApps || colApps.length === 0) return ' — ';
    let totalDays = 0;
    let validCount = 0;
    const now = new Date().getTime();

    colApps.forEach(app => {
      const dateStr = app.updatedAt || app.createdAt || app.appliedAt;
      if (dateStr) {
        const time = new Date(dateStr).getTime();
        if (!isNaN(time)) {
          const diffDays = Math.max(0, Math.floor((now - time) / (1000 * 60 * 60 * 24)));
          totalDays += diffDays;
          validCount++;
        }
      }
    });

    if (validCount === 0) return ' — ';
    const avg = Math.round(totalDays / validCount);
    return avg === 0 ? '< 1 dia' : `${avg}d`;
  };

  // Helper function: Calculate probability of advancement
  const getAverageProbability = (colApps: Application[], baseStageScore: number): string => {
    if (!colApps || colApps.length === 0) return ' — ';
    let sumProbs = 0;

    colApps.forEach(app => {
      const matchScore = getJobMatchScore(app.jobId);
      const prob = baseStageScore * (0.5 + (0.5 * (matchScore / 100)));
      sumProbs += prob;
    });

    return `${Math.round(sumProbs / colApps.length)}%`;
  };

  // Helper function: Sort apps in column by IA Match Score
  const sortAppsByIA = (colApps: Application[]): Application[] => {
    return [...colApps].sort((a, b) => getJobMatchScore(b.jobId) - getJobMatchScore(a.jobId));
  };

  // Execute status change with unidirectional/backward checks
  const handleQuickStatusChange = async (app: Application, targetStatus: string) => {
    const cleanCurrentStatus = ApplicationPipelineService.getCleanStatus(app.status);
    const cleanTargetStatus = ApplicationPipelineService.getCleanStatus(targetStatus);

    if (cleanCurrentStatus === cleanTargetStatus) return;

    // Check if target is rejected
    if (cleanTargetStatus === 'rejected') {
      const advancedStatuses: PipelineColumnId[] = ['hr', 'interview', 'offer'];
      if (advancedStatuses.includes(cleanCurrentStatus)) {
        setAdvancedRejectConfirmApp({ app });
        return;
      }
      setRejectingApp(app);
      return;
    }

    // Check if moving backward
    const currentIndex = activeColumnsOrder.indexOf(cleanCurrentStatus);
    const targetIndex = activeColumnsOrder.indexOf(cleanTargetStatus);

    if (currentIndex !== -1 && targetIndex !== -1 && targetIndex < currentIndex) {
      setBackwardConfirmApp({ app, targetStatus: cleanTargetStatus });
      return;
    }

    await executeStatusChange(app, cleanTargetStatus);
  };

  const executeStatusChange = async (app: Application, targetStatus: string) => {
    try {
      const cleanTarget = ApplicationPipelineService.getCleanStatus(targetStatus);
      const newStatus = (targetStatus === '🕐 Candidatura em andamento' || targetStatus === '📨 Me candidatei') 
        ? targetStatus 
        : cleanTarget;
      const updatedApp: Application = {
        ...app,
        status: newStatus as any,
        updatedAt: new Date().toISOString()
      };
      await onUpdateApplication(updatedApp);

      // Record stage transition log in database if Supabase configured
      if (isSupabaseConfigured && supabase) {
        await supabase.from('application_stages').insert({
          application_id: app.id,
          stage_name: cleanTarget,
          from_status: app.status,
          to_status: cleanTarget,
          status: 'passed',
          stage_date: new Date().toISOString()
        });
      }

      tracker.track('application_stage_updated', 'StrategyPage', {
        appId: app.id,
        fromStatus: app.status,
        toStatus: cleanTarget,
        user_id: userId
      });

      if (cleanTarget === 'hr' || cleanTarget === 'interview') {
        setToast({ 
          message: 'Candidatura avançou para fase de Entrevista! Recomenda-se realizar o Treino STAR no Copiloto IA.', 
          type: 'success' 
        });
      } else if (cleanTarget === 'hired' || cleanTarget === 'offer' || targetStatus.toLowerCase().includes('contratad') || targetStatus.toLowerCase().includes('aceita')) {
        setHiredModalApp(updatedApp);
      }
    } catch (err) {
      console.error('Erro ao atualizar estágio:', err);
      setToast({ message: 'Erro ao mover estágio da candidatura. Tente novamente.', type: 'error' });
    }
  };

  const handleConfirmBackwardMove = async () => {
    if (!backwardConfirmApp) return;
    const { app, targetStatus } = backwardConfirmApp;
    setBackwardConfirmApp(null);
    await executeStatusChange(app, targetStatus);
  };

  const handleConfirmAdvancedRejection = () => {
    if (!advancedRejectConfirmApp) return;
    const app = advancedRejectConfirmApp.app;
    setAdvancedRejectConfirmApp(null);
    setRejectingApp(app);
  };

  const handleSaveRejectionReason = async (reason: Application['rejectionReason']) => {
    if (!rejectingApp) return;

    try {
      await onUpdateApplication({
        ...rejectingApp,
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      });

      tracker.track('application_archived', 'StrategyPage', {
        appId: rejectingApp.id,
        jobId: rejectingApp.jobId,
        reason,
        user_id: userId
      });

      setRejectingApp(null);
      setToast({ message: 'Vaga arquivada com sucesso.', type: 'info' });
      if (selectedAppId === rejectingApp.id) {
        setSelectedAppId(null);
      }
    } catch (err) {
      console.error('Erro ao salvar rejeição:', err);
      setToast({ message: 'Não foi possível registrar o motivo da recusa. Tente novamente.', type: 'error' });
    }
  };

  const handleSaveCardDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setIsSavingCardDetails(true);
      const updatedApp = {
        ...selectedApp,
        notes: cardNotes,
        updatedAt: new Date().toISOString()
      };

      await onUpdateApplication(updatedApp);

      if (isSupabaseConfigured && supabase) {
        await supabase.from('applications').update({
          notes: cardNotes,
          next_action: cardNextAction,
          next_action_date: cardNextActionDate,
          recruiter_name: cardRecruiterName,
          feedback: cardFeedback,
          updated_at: new Date().toISOString()
        }).eq('id', selectedApp.id);
      }

      tracker.track('application_notes_saved', 'StrategyPage', {
        appId: selectedApp.id,
        user_id: userId
      });

      if (cardNextActionDate) {
        tracker.track('interview_scheduled', 'StrategyPage', {
          appId: selectedApp.id,
          nextActionDate: cardNextActionDate,
          user_id: userId
        });
      }

      setToast({ message: 'Detalhes salvos com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Erro ao salvar detalhes do card:', err);
      setToast({ message: 'Erro ao salvar detalhes da candidatura.', type: 'error' });
    } finally {
      setIsSavingCardDetails(false);
    }
  };

  const handleCreateManualApp = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualCompany || !manualTitle) return;

    try {
      await onCreateApplication({
        companyName: manualCompany,
        jobTitle: manualTitle,
        status: manualStatus,
        sourcePlatform: manualSource,
        notes: manualNotes || undefined,
        appliedAt: new Date().toISOString(),
        resumeVersionId: primaryResume?.resumeVersionId
      });
      setManualCompany('');
      setManualTitle('');
      setManualNotes('');
      setShowAddForm(false);
      setToast({ message: 'Candidatura adicionada com sucesso!', type: 'success' });
    } catch (err) {
      console.error('Erro ao criar candidatura:', err);
      setToast({ message: 'Não foi possível criar a candidatura. Tente novamente.', type: 'error' });
    }
  };

  const handleAddStage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;

    try {
      await addStage({
        appId: selectedAppId,
        stage: {
          applicationId: selectedAppId,
          stageName: newStageName,
          status: newStageStatus,
          notes: newStageNotes || undefined,
          stageDate: new Date().toISOString()
        }
      });
      setNewStageNotes('');
      setToast({ message: 'Etapa registrada no histórico!', type: 'success' });

      // Sync: if stage registered is a pipeline status, also advance the application
      const stageToStatusMap: Record<string, string> = {
        applied: 'applied',
        hr: 'hr',
        interview: 'interview',
        offer: 'offer',
        hired: 'hired'
      };
      const mappedStatus = stageToStatusMap[newStageName];
      const isAppRejected = String(selectedApp?.status || '').toLowerCase().includes('reject') || String(selectedApp?.status || '').toLowerCase().includes('rejeit');
      
      if (mappedStatus && selectedApp && !isAppRejected) {
        const statusOrder = ['found', 'saved', 'applied', 'hr', 'interview', 'offer', 'hired'];
        const currentIdx = statusOrder.indexOf(String(selectedApp.status).toLowerCase());
        const targetIdx = statusOrder.indexOf(mappedStatus);
        // Only advance active applications forward, never backward or out of rejected automatically
        if (currentIdx !== -1 && targetIdx > currentIdx) {
          const updatedApp: Application = { ...selectedApp, status: mappedStatus as Application['status'], updatedAt: new Date().toISOString() };
          await onUpdateApplication(updatedApp);
          if (mappedStatus === 'hired' || mappedStatus === 'offer') {
            setHiredModalApp(updatedApp);
          }
          tracker.track('application_stage_updated', 'Pipeline', {
            applicationId: selectedAppId,
            fromStatus: String(selectedApp.status),
            toStatus: mappedStatus,
            source: 'stage_form_sync'
          });
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar etapa:', err);
      setToast({ message: 'Não foi possível registrar a etapa.', type: 'error' });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!selectedAppId) return;
    try {
      await deleteStage({ appId: selectedAppId, stageId });
      setToast({ message: 'Etapa removida com sucesso.', type: 'info' });
    } catch (err) {
      console.error('Erro ao remover etapa:', err);
      setToast({ message: 'Não foi possível remover a etapa.', type: 'error' });
    }
  };

  const handleToggleTask = async (dayName: string, taskId: string) => {
    if (!planner) return;
    const updatedPlannerData = { ...planner.plannerData };
    const dayTasks = updatedPlannerData[dayName]?.tasks || [];
    updatedPlannerData[dayName] = {
      tasks: dayTasks.map((t: any) => t.id === taskId ? { ...t, completed: !t.completed } : t)
    };
    try {
      await saveWeeklyPlanner({ ...planner, plannerData: updatedPlannerData });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (dayName: string, text: string) => {
    if (!planner || !text.trim()) return;
    const updatedPlannerData = { ...planner.plannerData };
    const dayTasks = updatedPlannerData[dayName]?.tasks || [];
    updatedPlannerData[dayName] = {
      tasks: [...dayTasks, { id: `task-${Date.now()}`, text, completed: false }]
    };
    try {
      await saveWeeklyPlanner({ ...planner, plannerData: updatedPlannerData });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (dayName: string, taskId: string) => {
    if (!planner) return;
    const updatedPlannerData = { ...planner.plannerData };
    const dayTasks = updatedPlannerData[dayName]?.tasks || [];
    updatedPlannerData[dayName] = {
      tasks: dayTasks.filter((t: any) => t.id !== taskId)
    };
    try {
      await saveWeeklyPlanner({ ...planner, plannerData: updatedPlannerData });
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    try {
      await saveCompanyProfile({
        id: `cp-${Date.now()}`,
        userId: userId || '',
        companyName,
        industry: companyIndustry || undefined,
        size: companySize || undefined,
        glassdoorRating: parseFloat(companyRating) || undefined,
        interviewProcess: companyProcess || undefined,
        benefits: companyBenefits.split(',').map(b => b.trim()).filter(Boolean),
        remotePolicy: companyRemote || undefined,
        salaryRange: companySalary || undefined,
        userNotes: companyNotes || undefined,
        wouldApplyAgain: companyApplyAgain,
        cultureScore: companyCulture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowCompanyForm(false); // reset form
      setCompanyName('');
      setCompanyIndustry('');
      setCompanyProcess('');
      setCompanyBenefits('');
      setCompanySalary('');
      setCompanyNotes('');
    } catch (err) {
      console.error(err);
    }
  };
  void _handleSaveCompany; // reserved for Company Intelligence tab

  const handleSaveJournal = async (e: FormEvent) => {
    e.preventDefault();
    if (!journalAppId) return;

    try {
      await savePostLog({
        id: activePostLog?.id,
        applicationId: journalAppId,
        confidenceScore: journalConfidence,
        difficultQuestions: journalDiff ? journalDiff.split('\n') : [],
        improvements: journalDifferent,
        companyPerception: journalLearned,
        feeling: journalFeeling,
        whatLearned: journalLearned,
        doDifferent: journalDifferent
      });
      setJournalDiff('');
      setJournalLearned('');
      setJournalDifferent('');
      setJournalAppId('');
    } catch (err) {
      console.error(err);
    }
  };

  // Mapeamento das recomendações ROI para a aba 'strategy'
  const mappedJobs = jobs.map(j => {
    const override = jobMetricsOverride[j.id];
    return {
      ...j,
      stagesCount: override ? override.stagesCount : (j.stagesCount || 3),
      caseHours: override ? override.caseHours : (j.caseHours || 0)
    };
  });

  // Excluir vagas finalizadas (Contratadas ou Rejeitadas) da Matriz de Prioridades ROI
  const finalizedJobIds = new Set(
    applications
      .filter(a => {
        const clean = ApplicationPipelineService.getCleanStatus(a.status);
        return clean === 'hired' || clean === 'rejected';
      })
      .map(a => a.jobId || a.id)
      .filter(Boolean)
  );

  const uniqueMappedJobs = mappedJobs.filter((j, index, self) => 
    index === self.findIndex(t => (
      (t.id && t.id === j.id) ||
      (t.title.toLowerCase().trim() === j.title.toLowerCase().trim() &&
       t.companyName.toLowerCase().trim() === j.companyName.toLowerCase().trim())
    ))
  );

  const activeJobsForROI = uniqueMappedJobs.filter(j => !finalizedJobIds.has(j.id));

  const grouped = CandidateStrategyService.groupJobs(primaryResume, activeJobsForROI, careerProfile, careerProfileNew);
  const finalGrouped = {
    hot: [...grouped.hot],
    warm: [...grouped.warm],
    cold: [...grouped.cold]
  };

  Object.entries(columnOverrides).forEach(([jobId, targetCol]) => {
    let foundRec: any = null;
    for (const colKey of ['hot', 'warm', 'cold'] as const) {
      const idx = finalGrouped[colKey].findIndex(rec => (rec.job as any).id === jobId);
      if (idx !== -1) {
        foundRec = finalGrouped[colKey][idx];
        finalGrouped[colKey].splice(idx, 1);
        break;
      }
    }
    if (foundRec && targetCol) {
      finalGrouped[targetCol].push(foundRec);
    }
  });

  const rejectedCount = pipelineColumns.rejected?.apps?.length || 0;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-7xl mx-auto animate-fade-in font-sans block">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Jornada de Carreira & Pipeline
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 block break-normal whitespace-normal">
            Acompanhe o ciclo de vida de suas candidaturas em 7 etapas estratégicas sem ruído.
          </p>
        </div>
      </div>

      {/* Top AI Guidance Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Recomendação da IA</span>
              <Badge variant="premium" size="sm">Pipeline de Vagas</Badge>
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
              {applications.length > 0
                ? (() => {
                    const enviadasCount = applications.filter(a => isAppliedStatus(a.status)).length;
                    const salvasCount = applications.filter(a => isSavedStatus(a.status)).length;
                    return `Você enviou ${enviadasCount} candidatura(s) e possui ${salvasCount} vaga(s) salva(s) em prospecção.`;
                  })()
                : 'Adicione suas candidaturas ao Pipeline para monitorar prazos e métricas de avanço.'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              O copiloto recalcula as probabilidades de conversão em tempo real conforme você atualiza o status.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`btn-secondary text-xs ${showArchived ? 'border-brand-500 text-brand-400' : ''}`}
            title="Alternar exibição de vagas arquivadas/rejeitadas"
          >
            <Archive size={14} />
            <span>{showArchived ? 'Ocultar Arquivadas' : `Ver Arquivadas (${rejectedCount})`}</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-xs"
          >
            <Plus size={14} />
            <span>Nova Candidatura</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Switcher */}
      <div className="flex flex-wrap border-b border-slate-800 dark:border-slate-800 light:border-slate-200 gap-6">
        {[
          { id: 'pipeline', label: 'Pipeline (CRM Kanban)', icon: Layout },
          { id: 'strategy', label: 'Prioridades (ROI)', icon: Flame },
          { id: 'planner', label: 'Planner Semanal', icon: CheckSquare },
          { id: 'journal', label: 'Diário de entrevistas', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
                subTab === tab.id ? 'text-brand-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {subTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MODALS */}
      {/* 1. Modal: Escolha Inicial ou Formulário de Candidatura Manual (Item 12) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CardGlass role="dialog" aria-modal="true" className="w-full max-w-lg mx-4 space-y-6 relative border border-slate-800">
            <button onClick={() => { setShowAddForm(false); setShowChoiceStep(true); }} aria-label="Fechar modal" className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
              <X size={18} />
            </button>

            {showChoiceStep ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-200">Como deseja adicionar a candidatura?</h3>
                  <p className="text-xs text-slate-400 mt-1">Escolha o melhor método para cadastrar a oportunidade no seu pipeline.</p>
                </div>
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      _setActiveTab('match');
                    }}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 to-indigo-950/60 border border-brand-500/40 hover:border-brand-400 text-left transition-all group flex items-start gap-3.5 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-300 shrink-0 mt-0.5">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-100 group-hover:text-brand-300 block">
                        🔍 Buscar Vaga & Calcular Match (Inteligente)
                      </strong>
                      <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                        Explore nosso catálogo de vagas ou cole um link para calcular a compatibilidade técnica com seu currículo.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChoiceStep(false)}
                    className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-left transition-all group flex items-start gap-3.5 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                      <Plus size={20} />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-200 group-hover:text-slate-100 block">
                        📝 Adicionar Candidatura Manualmente
                      </strong>
                      <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                        Preencha o formulário rápido para vagas já em andamento fora da plataforma (sem cálculo de Match).
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-200">Acompanhar Nova Vaga Manual</h3>
                  <button type="button" onClick={() => setShowChoiceStep(true)} className="text-[11px] text-brand-400 hover:underline">
                    ← Voltar às opções
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Registre a empresa e o cargo no Pipeline.</p>
              </div>
            )}
            {!showChoiceStep && (
              <form onSubmit={handleCreateManualApp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Empresa</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank"
                    value={manualCompany}
                    onChange={e => setManualCompany(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Cargo</label>
                  <input
                    type="text"
                    placeholder="Ex: Frontend Engineer"
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Etapa Inicial</label>
                  <select
                    value={manualStatus}
                    onChange={e => setManualStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                  >
                    <option value="found">🔎 Encontradas</option>
                    <option value="saved">⭐ Salvas</option>
                    <option value="applied">📨 Aplicadas</option>
                    <option value="hr">👥 Entrevista RH</option>
                    <option value="interview">🎯 Entrevista Gestor</option>
                    <option value="offer">🏆 Oferta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Origem</label>
                  <input
                    type="text"
                    placeholder="Ex: LinkedIn"
                    value={manualSource}
                    onChange={e => setManualSource(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Observações</label>
                <textarea
                  placeholder="Anotações gerais..."
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200 resize-none h-20"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-semibold text-slate-400">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg">
                  Adicionar ao Pipeline
                </button>
              </div>
              </form>
            )}
          </CardGlass>
        </div>
      )}

      {/* 2. Modal: Confirmação de Movimento para Trás — Item 11: compacto */}
      {backwardConfirmApp && (
        <div
          className="fixed inset-0 bg-slate-950/80 light:bg-slate-800/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-3"
          onKeyDown={e => e.key === 'Escape' && setBackwardConfirmApp(null)}
          tabIndex={-1}
        >
          <div className="w-full max-w-xs bg-slate-900 light:bg-white border border-amber-500/30 light:border-amber-400/40 rounded-2xl text-center p-4 shadow-2xl space-y-3">
            <div className="mx-auto w-9 h-9 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-100 light:text-slate-900">Mover Candidatura para Trás?</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1 leading-snug">
                Deseja mover <strong className="text-slate-200 light:text-slate-800">{backwardConfirmApp.app.jobTitle}</strong> ({backwardConfirmApp.app.companyName}) de volta para a etapa anterior?
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                autoFocus
                onClick={() => setBackwardConfirmApp(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 text-xs font-semibold hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBackwardMove}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Confirmação Reforçada para Rejeição em Estágios Avançados */}
      {advancedRejectConfirmApp && (
        <div className="fixed inset-0 bg-slate-950/85 light:bg-slate-800/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 light:bg-white border border-red-500/40 light:border-red-400/40 rounded-2xl text-center p-5 shadow-2xl space-y-4">
            <div className="mx-auto w-11 h-11 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center animate-pulse">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 light:text-slate-900">Encerrar Processo em Estágio Avançado?</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-2 leading-relaxed">
                Esta candidatura para <strong className="text-slate-200 light:text-slate-800">{advancedRejectConfirmApp.app.jobTitle}</strong> ({advancedRejectConfirmApp.app.companyName}) já está em etapa avançada de entrevista. Deseja realmente arquivar esta oportunidade?
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-1">
              <button
                onClick={() => setAdvancedRejectConfirmApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 text-xs font-semibold hover:bg-slate-800 light:hover:bg-slate-100"
              >
                Manter Ativa
              </button>
              <button
                onClick={handleConfirmAdvancedRejection}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md"
              >
                Confirmar Encerramento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Motivo da Rejeição */}
      {rejectingApp && (
        <div className="fixed inset-0 bg-slate-950/80 light:bg-slate-800/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl text-center p-5 shadow-2xl space-y-4">
            <div className="mx-auto w-11 h-11 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 light:text-slate-900">Qual foi o motivo da recusa?</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1">Essa informação calibra o copiloto para futuras buscas.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-1 text-left max-h-52 overflow-y-auto pr-1">
              {REJECTION_REASONS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveRejectionReason(reason);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-800/60 light:bg-slate-50 text-xs text-slate-300 light:text-slate-700 hover:bg-red-500/20 hover:text-white light:hover:text-red-700 transition-all text-left font-medium cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRejectingApp(null)}
              className="text-xs text-slate-500 light:text-slate-500 hover:text-slate-300 light:hover:text-slate-700 mt-1 block mx-auto"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* 4b. Modal: Confirmação de Exclusão Permanente */}
      {deletingApp && (
        <div className="fixed inset-0 bg-slate-950/80 light:bg-slate-800/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 light:bg-white border border-red-500/40 light:border-red-400/40 rounded-2xl text-center p-5 shadow-2xl space-y-4">
            <div className="mx-auto w-11 h-11 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 light:text-slate-900">Remover do Acompanhamento?</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
                Deseja remover <strong className="text-slate-200 light:text-slate-800">{deletingApp.jobTitle}</strong> ({deletingApp.companyName}) do acompanhamento ativo?
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeletingApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 text-xs font-semibold hover:bg-slate-800 light:hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSoftDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md"
              >
                Remover Candidatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Drawer Completo do Card da Candidatura — Centro de Gestão da Candidatura */}
      {selectedAppId && selectedApp && (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-card border-l border-border shadow-2xl z-[999] overflow-y-auto p-5 transition-all space-y-6">
          {/* Header Visual: Cargo, Empresa, Status Atual e Botão Fechar */}
          <div className="flex justify-between items-start border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-extrabold uppercase border border-brand-500/20">
                  Etapa Atual: {ApplicationPipelineService.getCleanStatus(selectedApp.status)}
                </span>
                {selectedApp.jobId && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
                    Match IA {getJobMatchScore(selectedApp.jobId)}%
                  </span>
                )}
                {selectedApp.sourcePlatform && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                    Origem: {selectedApp.sourcePlatform}
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mt-1">{selectedApp.jobTitle}</h3>
              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Briefcase size={14} className="text-brand-400" />
                {selectedApp.companyName}
              </p>
            </div>
            <button
              onClick={() => setSelectedAppId(null)}
              aria-label="Fechar detalhes da candidatura"
              className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── ALTA PRIORIDADE: AÇÃO PRIMÁRIA DA CANDIDATURA ── */}
          {ApplicationPipelineService.getCleanStatus(selectedApp.status) === 'rejected' ? (
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <Archive size={16} />
                <span>Vaga arquivada no histórico de candidaturas</span>
              </div>
              {selectedApp.rejectionReason && (
                <p className="text-xs text-slate-300">
                  Motivo da recusa informado: <strong className="text-red-300">{selectedApp.rejectionReason}</strong>
                </p>
              )}
              <button
                type="button"
                onClick={() => handleQuickStatusChange(selectedApp, 'applied')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all border border-emerald-400/30"
              >
                <RefreshCcw size={15} />
                <span>Reativar vaga e reenviar para o Kanban</span>
              </button>
            </div>
          ) : (
            <>
              {ApplicationPipelineService.getCleanStatus(selectedApp.status) !== 'applied' &&
               ApplicationPipelineService.getCleanStatus(selectedApp.status) !== 'hr' &&
               ApplicationPipelineService.getCleanStatus(selectedApp.status) !== 'interview' &&
               ApplicationPipelineService.getCleanStatus(selectedApp.status) !== 'offer' &&
               ApplicationPipelineService.getCleanStatus(selectedApp.status) !== 'hired' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange(selectedApp, 'applied')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all border border-emerald-400/30"
                >
                  <Send size={16} />
                  <span>Informar que me candidatei a esta vaga</span>
                </button>
              )}
            </>
          )}

          {/* ── MÉDIA PRIORIDADE: FORMULÁRIO DE GESTÃO DA VAGA SELECIONADA ── */}
          <form onSubmit={handleSaveCardDetails} className="space-y-4 p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs text-foreground">
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
              <UserCheck size={15} className="text-brand-400" />
              Gestão de Contato & Próximos Passos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <UserCheck size={13} className="text-brand-400" />
                  Contato / Recrutador
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mariana Silva (Tech Recruiter)"
                  value={cardRecruiterName}
                  onChange={e => setCardRecruiterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-brand-500 placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Calendar size={13} className="text-brand-400" />
                  Data da Próxima Ação / Entrevista
                </label>
                <input
                  type="date"
                  value={cardNextActionDate}
                  onChange={e => setCardNextActionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Target size={13} className="text-brand-400" />
                Próxima Ação Planejada
              </label>
              <input
                type="text"
                placeholder="Ex: Enviar e-mail de follow-up pós-entrevista..."
                value={cardNextAction}
                onChange={e => setCardNextAction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-brand-500 placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <MessageSquare size={13} className="text-brand-400" />
                Feedback & Impressões Pós-Processo
              </label>
              <textarea
                value={cardFeedback}
                onChange={e => setCardFeedback(e.target.value)}
                placeholder="Pontos fortes destacados pelo gestor, perguntas difíceis..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-brand-500 h-16 resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <BookOpen size={13} className="text-brand-400" />
                Anotações Gerais da Jornada
              </label>
              <textarea
                value={cardNotes}
                onChange={e => setCardNotes(e.target.value)}
                placeholder="Observações do candidato..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-brand-500 h-16 resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingCardDetails}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSavingCardDetails ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* ── TIMELINE E REGISTRO DE ETAPAS (ISOLADO PARA ESTA VAGA) ── */}
          <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
              <Clock size={15} className="text-brand-400" />
              Histórico do Processo (Timeline da Vaga)
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {loadingStages ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 size={14} className="animate-spin text-brand-400" />
                  <span>Carregando linha do tempo da vaga...</span>
                </div>
              ) : activeStages.length === 0 ? (
                <span className="text-xs text-muted-foreground italic block py-1">Nenhum evento registrado no histórico desta vaga ainda.</span>
              ) : (
                activeStages.map((st: ApplicationStage) => {
                  const stageNameTranslation: Record<string, string> = {
                    found: 'Vaga Encontrada',
                    saved: 'Vaga Salva',
                    applied: 'Candidatura Enviada',
                    hr: 'Entrevista RH',
                    interview: 'Entrevista com Gestor',
                    offer: 'Proposta / Oferta Recebida',
                    hired: 'Contratado(a)',
                    rejected: 'Processo Finalizado'
                  };

                  const stageStatusTranslation: Record<string, string> = {
                    passed: 'Aprovado',
                    failed: 'Reprovado',
                    pending: 'Pendente',
                    scheduled: 'Agendado'
                  };

                  const displayStageName = stageNameTranslation[st.stageName.toLowerCase()] || st.stageName;
                  const displayStatus = stageStatusTranslation[st.status.toLowerCase()] || st.status;

                  return (
                    <div key={st.id} className="p-3 rounded-xl bg-muted/80 border border-border flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-foreground block">{displayStageName}</span>
                        {st.notes && <span className="text-[11px] text-muted-foreground block mt-0.5">{st.notes}</span>}
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{new Date(st.stageDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          st.status === 'passed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {displayStatus}
                        </span>
                        <button onClick={() => handleDeleteStage(st.id)} className="text-muted-foreground hover:text-red-400 cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Adicionar nova etapa exclusiva */}
            <form onSubmit={handleAddStage} className="space-y-2.5 pt-3 border-t border-border">
              <span className="text-[11px] font-bold text-muted-foreground block">Registrar Novo Evento na Timeline</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  className="bg-background border border-border text-xs rounded-xl p-2 text-foreground outline-none focus:border-brand-500"
                >
                  <option value="applied">📨 Aplicada</option>
                  <option value="hr">👥 Entrevista RH</option>
                  <option value="interview">🎯 Entrevista Gestor</option>
                  <option value="offer">🏆 Oferta Recebida</option>
                  <option value="hired">✅ Contratado</option>
                </select>
                <select
                  value={newStageStatus}
                  onChange={e => setNewStageStatus(e.target.value as any)}
                  className="bg-background border border-border text-xs rounded-xl p-2 text-foreground outline-none focus:border-brand-500"
                >
                  <option value="pending">Pendente</option>
                  <option value="passed">Aprovado</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Observação da etapa..."
                value={newStageNotes}
                onChange={e => setNewStageNotes(e.target.value)}
                className="w-full bg-background border border-border text-xs rounded-xl px-3 py-2 outline-none text-foreground placeholder:text-muted-foreground focus:border-brand-500"
              />
              <button type="submit" className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                Registrar no Histórico
              </button>
            </form>
          </div>

          {/* ── BAIXA PRIORIDADE: AÇÕES DE ENCERRAMENTO E EXCLUSÃO NO RODAPÉ ── */}
          <div className="pt-4 border-t border-border flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setRejectingApp(selectedApp)}
              className="text-red-600 dark:text-red-400 hover:text-red-500 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 cursor-pointer transition-colors"
            >
              <AlertTriangle size={14} />
              <span>Arquivar / Rejeitar Vaga</span>
            </button>
            <button
              type="button"
              onClick={() => setDeletingApp(selectedApp)}
              className="text-muted-foreground hover:text-red-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
              <span>Excluir Permanentemente</span>
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 1: KANBAN PIPELINE DE CARREIRA
          ========================================== */}
      {subTab === 'pipeline' && (
        <div className="space-y-6 animate-slide-in">
          {/* Matriz das 7 Colunas do Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
            {activeColumnsOrder.map(colId => {
              const col = pipelineColumns[colId];
              if (!col) return null;

              const colApps = sortAppsByIA(col.apps || []);
              const avgDays = getAverageDaysInColumn(colApps);
              const avgProb = getAverageProbability(colApps, col.baseStageScore);

              return (
                <div
                  key={colId}
                  className={`space-y-3 rounded-2xl p-3 min-h-[500px] border flex flex-col justify-between ${col.color}`}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
                    if (!appId) return;
                    const targetApp = applications.find(a => a.id === appId);
                    if (targetApp) handleQuickStatusChange(targetApp, colId);
                    setDraggedAppId(null);
                  }}
                >
                  <div className="space-y-2">
                    {/* Header da Coluna com Métricas */}
                    <div className="border-b border-border/80 pb-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-xs text-foreground leading-tight">{col.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-extrabold ml-1 shrink-0">
                          {colApps.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-0.5">
                        <span title="Tempo médio de permanência dos cards nesta etapa">⏱ {avgDays}</span>
                        <span title="Probabilidade de avanço ponderada pelo Match" className="text-emerald-500 font-semibold">🎯 {avgProb}</span>
                      </div>
                    </div>

                    {/* Lista de Cards Organizada por Prioridade IA */}
                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                       {colApps.length === 0 ? (
                        <div className="py-8 text-center text-[10px] text-muted-foreground italic border border-dashed border-border/60 rounded-xl">
                          Nenhuma vaga
                        </div>
                      ) : (
                        colApps.map(app => {
                          const matchScore = getJobMatchScore(app.jobId);
                          const isManualApp = app.sourcePlatform === 'manual' || (app as any).isManual || app.sourcePlatform === 'web';
                          return (
                            <CardGlass
                              key={app.id}
                              draggable
                              title={`${app.jobTitle} — ${app.companyName}`}
                              onDragStart={e => {
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', app.id);
                                setDraggedAppId(app.id);
                              }}
                              onDragEnd={() => setDraggedAppId(null)}
                              onClick={() => setSelectedAppId(app.id)}
                              className={`p-3.5 space-y-2.5 hover:border-brand-500/40 cursor-grab active:cursor-grabbing text-xs border-border dark:border-slate-800/80 bg-card/60 dark:bg-slate-900/60 transition-all relative group ${
                                draggedAppId === app.id ? 'opacity-40 border-brand-500 border-dashed' : ''
                              }`}
                            >

                              <div className="flex justify-between items-start gap-1">
                                <div className="truncate flex-1">
                                  <h4 className="font-bold text-foreground truncate text-xs">{app.jobTitle}</h4>
                                  <span className="text-[10px] text-muted-foreground block truncate">{app.companyName}</span>
                                </div>
                                {isManualApp ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-800/80 text-slate-300 border border-slate-700 shrink-0" title="Candidatura adicionada manualmente sem cálculo de Match IA">
                                    Manual
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                    {matchScore}%
                                  </span>
                                )}
                              </div>

                              {(app as any).nextAction && (
                                <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-[9px] text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                  <Target size={11} className="shrink-0 text-blue-500 dark:text-blue-400" />
                                  <span className="truncate">{(app as any).nextAction}</span>
                                </div>
                              )}

                              {app.status === '🕐 Candidatura em andamento' && (
                                <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/40 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-1.5">
                                  <span className="font-semibold truncate">🕐 Candidatura em andamento</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickStatusChange(app, '📨 Me candidatei');
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider transition cursor-pointer shrink-0 shadow-sm"
                                    title="Confirmar que concluiu a candidatura no site externo"
                                  >
                                    Confirmar
                                  </button>
                                </div>
                              )}

                              {/* Seletor Rápido de Estágio (Design Limpo e Espaçoso) */}
                              <div className="flex flex-col gap-1.5 pt-2.5 border-t border-border/80 mt-2">
                                <span className="text-[10px] font-semibold text-muted-foreground">Mover para estágio:</span>
                                <select
                                  value={app.status === '🕐 Candidatura em andamento' ? '🕐 Candidatura em andamento' : colId}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => {
                                    e.stopPropagation();
                                    handleQuickStatusChange(app, e.target.value);
                                  }}
                                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground text-xs font-medium outline-none focus:border-brand-500 hover:border-border transition-colors cursor-pointer shadow-xs"
                                >
                                  <option value="found">🔎 Encontrada</option>
                                  <option value="saved">⭐ Tenho interesse</option>
                                  <option value="🕐 Candidatura em andamento">🕐 Candidatura em andamento</option>
                                  <option value="📨 Me candidatei">📨 Me candidatei (Confirmada)</option>
                                  <option value="hr">👥 Entrevista RH</option>
                                  <option value="interview">🎯 Entrevista Gestor</option>
                                  <option value="offer">🏆 Oferta recebida</option>
                                  <option value="hired">✅ Contratado</option>
                                  <option value="rejected">❌ Arquivar / Rejeitar</option>
                                </select>
                              </div>
                            </CardGlass>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coluna Opcional de Arquivadas / Rejeitadas */}
          {showArchived && (
            <div className="mt-4 border-t border-border/80 pt-3 space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <Archive size={16} />
                <h3 className="font-bold text-xs text-foreground">Candidaturas Arquivadas / Encerradas ({rejectedCount})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {pipelineColumns.rejected?.apps?.map(app => (
                  <CardGlass key={app.id} onClick={() => setSelectedAppId(app.id)} className="p-3 space-y-1.5 opacity-75 border-red-500/20 hover:opacity-100 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-foreground text-xs truncate max-w-[150px]">{app.jobTitle}</h4>
                        <span className="text-[10px] text-muted-foreground block">{app.companyName}</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold">
                        Arquivada
                      </span>
                    </div>
                    {app.rejectionReason && (
                      <p className="text-[10px] text-red-800 dark:text-red-300/80 bg-red-50 dark:bg-red-950/30 p-1.5 rounded border border-red-200 dark:border-red-900/40">
                        Motivo: {app.rejectionReason}
                      </p>
                    )}
                  </CardGlass>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUB TAB 2: PRIORIDADES ROI
          ========================================== */}
      {subTab === 'strategy' && (
        <div className="space-y-6 animate-slide-in">
          <div>
            <h3 className="font-display font-bold text-base text-foreground">Priorização por Matriz de ROI</h3>
            <p className="text-xs text-muted-foreground mt-1">Calcule a relação entre senioridade, esforço de processo e retorno esperado.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hot priorities */}
            <div className="space-y-4 rounded-2xl p-3 bg-card border border-border">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Flame size={16} className="text-emerald-500 fill-emerald-500" />
                <h3 className="font-bold text-sm text-foreground">Alta Prioridade ({finalGrouped.hot.length})</h3>
              </div>
              {finalGrouped.hot.map((rec, idx) => (
                <CardGlass key={idx} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{rec.job.title}</h4>
                      <span className="text-xs text-muted-foreground font-medium block">{rec.job.companyName}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      Match {rec.cpi}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Mover:</span>
                      <select
                        value="hot"
                        onChange={(e) => setColumnOverrides(prev => ({ ...prev, [(rec.job as any).id]: e.target.value as any }))}
                        className="bg-background border border-border rounded px-1.5 py-0.5 text-foreground text-[10px] outline-none"
                      >
                        <option value="hot">🔥 Alta Prioridade</option>
                        <option value="warm">⚡ Ajustar antes</option>
                        <option value="cold">❄️ Match baixo</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteJob?.((rec.job as any).id)}
                      className="text-muted-foreground hover:text-red-400 p-1 transition-colors"
                      title="Remover card da matriz"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </CardGlass>
              ))}
            </div>

            {/* Warm priorities */}
            <div className="space-y-4 rounded-2xl p-3 bg-card border border-border">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">Ajustar antes ({finalGrouped.warm.length})</h3>
              </div>
              {finalGrouped.warm.map((rec, idx) => (
                <CardGlass key={idx} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{rec.job.title}</h4>
                      <span className="text-xs text-muted-foreground font-medium block">{rec.job.companyName}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                      Match {rec.cpi}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Mover:</span>
                      <select
                        value="warm"
                        onChange={(e) => setColumnOverrides(prev => ({ ...prev, [(rec.job as any).id]: e.target.value as any }))}
                        className="bg-background border border-border rounded px-1.5 py-0.5 text-foreground text-[10px] outline-none"
                      >
                        <option value="hot">🔥 Alta Prioridade</option>
                        <option value="warm">⚡ Ajustar antes</option>
                        <option value="cold">❄️ Match baixo</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteJob?.((rec.job as any).id)}
                      className="text-muted-foreground hover:text-red-400 p-1 transition-colors"
                      title="Remover card da matriz"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </CardGlass>
              ))}
            </div>

            {/* Cold priorities */}
            <div className="space-y-4 rounded-2xl p-3 bg-card border border-border">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <AlertCircle size={16} className="text-slate-400" />
                <h3 className="font-bold text-sm text-foreground">Match baixo com a vaga ({finalGrouped.cold.length})</h3>
              </div>
              {finalGrouped.cold.map((rec, idx) => (
                <CardGlass key={idx} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{rec.job.title}</h4>
                      <span className="text-xs text-muted-foreground font-medium block">{rec.job.companyName}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                      Match {rec.cpi}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Mover:</span>
                      <select
                        value="cold"
                        onChange={(e) => setColumnOverrides(prev => ({ ...prev, [(rec.job as any).id]: e.target.value as any }))}
                        className="bg-background border border-border rounded px-1.5 py-0.5 text-foreground text-[10px] outline-none"
                      >
                        <option value="hot">🔥 Alta Prioridade</option>
                        <option value="warm">⚡ Ajustar antes</option>
                        <option value="cold">❄️ Match baixo</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteJob?.((rec.job as any).id)}
                      className="text-muted-foreground hover:text-red-400 p-1 transition-colors"
                      title="Remover card da matriz"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </CardGlass>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 3: PLANNER SEMANAL
          ========================================== */}
      {subTab === 'planner' && (
        <div className="space-y-6 animate-slide-in">
          <div>
            <h3 className="font-display font-bold text-base text-slate-200">Planner Operacional Semanal</h3>
            <p className="text-xs text-slate-500 mt-1">Monitore e gerencie tarefas diárias de recolocação.</p>
          </div>

          {planner ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(day => {
                const dayData = planner.plannerData[day] || { tasks: [] };
                return (
                  <CardGlass key={day} className="p-4 flex flex-col justify-between min-h-[250px] border border-slate-900/80">
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-brand-400 border-b border-slate-900 pb-1.5">{day}</h4>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-0.5">
                        {dayData.tasks.length === 0 ? (
                          <span className="text-[10px] text-slate-600 block italic py-2">Sem tarefas</span>
                        ) : (
                          dayData.tasks.map((task: any) => (
                            <div key={task.id} className="flex gap-2 items-start text-[11px] text-slate-300 group">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(day, task.id)}
                                className="shrink-0 mt-0.5 text-brand-500 cursor-pointer"
                              >
                                {task.completed ? <CheckSquare size={13} /> : <Square size={13} />}
                              </button>
                              <span
                                onClick={() => handleToggleTask(day, task.id)}
                                className={`flex-1 cursor-pointer hover:text-white select-none ${task.completed ? 'line-through text-slate-600' : ''}`}
                              >
                                {task.text}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(day, task.id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 cursor-pointer transition-opacity"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <form 
                      onSubmit={e => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem('taskInput') as HTMLInputElement);
                        handleAddTask(day, input.value);
                        input.value = '';
                      }}
                      className="mt-3 pt-2 border-t border-slate-900/60"
                    >
                      <input 
                        name="taskInput"
                        type="text" 
                        placeholder="Nova tarefa..." 
                        className="w-full bg-slate-950 border border-slate-900 text-[10px] rounded px-2 py-1 text-slate-200 outline-none focus:border-brand-500"
                      />
                    </form>
                  </CardGlass>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Nenhum planner ativo para esta semana.
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUB TAB 4: JOURNAL & REFLEXÕES
          ========================================== */}
      {subTab === 'journal' && (
        <div className="space-y-6 animate-slide-in">
          <div>
            <h3 className="font-display font-bold text-base text-slate-200">Diário de Bordo</h3>

            <p className="text-xs text-slate-500 mt-1">Registre reflexões pós-entrevista para refinar sua comunicação.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CardGlass className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-sm text-slate-200">Refletir sobre uma Entrevista</h4>
                <p className="text-xs text-slate-500 mt-1">Selecione uma candidatura e registre impressões do processo.</p>
              </div>

              <form onSubmit={handleSaveJournal} className="space-y-4 text-xs text-slate-200">
                <div className="space-y-1">
                  <label className="text-slate-400">Selecione a Candidatura</label>
                  <select
                    value={journalAppId}
                    onChange={e => setJournalAppId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="">Selecione uma vaga...</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.jobTitle} - {app.companyName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Qual foi a sensação da conversa?</label>
                  <div className="flex gap-4 pt-1">
                    {['😃', '🙂', '😐', '🙁', '😰'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setJournalFeeling(emoji)}
                        className={`text-xl p-2 rounded-xl border transition-all ${journalFeeling === emoji ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900/50'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Perguntas complexas ou desafiadoras</label>
                  <textarea
                    value={journalDiff}
                    onChange={e => setJournalDiff(e.target.value)}
                    placeholder="Quais perguntas te pegaram de surpresa?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none h-20 resize-none"
                  />
                </div>

                <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg">
                  Salvar Reflexão no Diário
                </button>
              </form>
            </CardGlass>
          </div>
        </div>
      )}
      {/* Modal Celebratório de Contratação & SLA */}
      <HiredCongratulationModal
        isOpen={!!hiredModalApp}
        app={hiredModalApp}
        onClose={() => setHiredModalApp(null)}
      />
    </div>
  );
}
