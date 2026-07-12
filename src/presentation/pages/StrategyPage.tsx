import { useState, useEffect, type FormEvent } from 'react';
import { CardGlass } from '../components/CardGlass';
import { CandidateStrategyService } from '../../application/services/CandidateStrategyService';
import { ApplicationPipelineService } from '../../application/services/ApplicationPipelineService';
import { CareerAnalyticsService } from '../../application/services/CareerAnalyticsService';
import type { 
  Job, Resume, CareerProfile, Application, ApplicationStage,
  CompanyProfile, WeeklyPlanner, WeeklyGoal
} from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { 
  Flame, Sparkles, AlertCircle, Clock, Plus, Trash2, 
  Compass, CheckCircle2, ChevronRight, ChevronLeft,
  X, Briefcase, Layout, AlertTriangle,
  Smile, Meh, Frown, CheckSquare, Square, Building2, BookOpen, Target, Loader2, List
} from 'lucide-react';

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
  setActiveTab,
  userId,
  companyProfiles,
  saveCompanyProfile,
  deleteCompanyProfile,
  getWeeklyPlannerQuery,
  saveWeeklyPlanner,
  getWeeklyGoalQuery,
  saveWeeklyGoal,
  getPostLogQuery,
  savePostLog,
  onStartSimulation,
  initialSubTab
}: StrategyPageProps) {
  const [subTab, setSubTab] = useState<'strategy' | 'planner' | 'pipeline' | 'journal'>(initialSubTab || 'strategy');

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [intelSubTab, setIntelSubTab] = useState<'companies' | 'diary'>('companies');
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];

  // Week configuration (default is week 202628)
  const currentWeekNumber = 202628;

  // Local overrides for job metrics (ROI calculation)
  const [jobMetricsOverride, setJobMetricsOverride] = useState<Record<string, { stagesCount: number, caseHours: number }>>({});

  // Fetch planner and goals queries
  const { data: planner } = getWeeklyPlannerQuery(currentWeekNumber);
  const { data: goal } = getWeeklyGoalQuery(currentWeekNumber);

  // Kanban Pipeline Map
  const pipelineColumns = ApplicationPipelineService.getColumnMap(applications);

  const columnsOrder = [
    'encontradas',
    'aplicar_depois',
    'cv_enviado',
    'triagem',
    'entrevista_rh',
    'entrevista_tecnica',
    'case_tecnico',
    'oferta',
    'contratado',
    'recusado',
    'arquivado'
  ];

  const handleMoveStage = async (app: Application, direction: 'prev' | 'next') => {
    const currentColumnId = Object.keys(pipelineColumns).find(key => 
      (pipelineColumns as any)[key].apps.some((a: any) => a.id === app.id)
    );

    if (!currentColumnId) return;

    const currentIndex = columnsOrder.indexOf(currentColumnId);
    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex >= 0 && targetIndex < columnsOrder.length) {
      const targetColumnId = columnsOrder[targetIndex];
      const targetStatus = (pipelineColumns as any)[targetColumnId].defaultStatus;
      await handleQuickStatusChange(app, targetStatus);
    }
  };

  const handleApplyFromStrategy = async (job: Job) => {
    const app = applications.find(a => a.jobId === job.id);
    if (app) {
      await handleQuickStatusChange(app, '📨 Me candidatei');
    } else {
      await onCreateApplication({
        jobId: job.id,
        companyName: job.companyName,
        jobTitle: job.title,
        status: '📨 Me candidatei',
        resumeVersionId: primaryResume?.resumeVersionId || undefined
      });
    }
  };

  // States for manual creation
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualCompany, setManualCompany] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualStatus, setManualStatus] = useState<Application['status']>('📨 Me candidatei');
  const [manualSource, setManualSource] = useState('LinkedIn');

  // Stages/Timeline Modal States
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const selectedApp = applications.find(a => a.id === selectedAppId);
  const { data: activeStages = [], isLoading: loadingStages } = getStagesQuery(selectedAppId || '');

  // Form for new Stage
  const [newStageName, setNewStageName] = useState('👥 Entrevista com recrutador');
  const [newStageStatus, setNewStageStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
  const [newStageNotes, setNewStageNotes] = useState('');

  // Rejection Modal State
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);

  // Company Intelligence states
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('Média');
  const [companyRating, setCompanyRating] = useState('4.0');
  const [companyProcess, setCompanyProcess] = useState('');
  const [companyBenefits, setCompanyBenefits] = useState('');
  const [companyRemote, setCompanyRemote] = useState('Híbrido');
  const [companySalary, setCompanySalary] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [companyCulture, setCompanyCulture] = useState(4);
  const [companyApplyAgain, setCompanyApplyAgain] = useState(true);

  // AI Journal reflection log states
  const [journalAppId, setJournalAppId] = useState<string>('');
  const [journalFeeling, setJournalFeeling] = useState<string>('😐');
  const [journalConfidence, setJournalConfidence] = useState<number>(7);
  const [journalDiff, setJournalDiff] = useState<string>('');
  const [journalLearned, setJournalLearned] = useState<string>('');
  const [journalDifferent, setJournalDifferent] = useState<string>('');
  const { data: activePostLog } = getPostLogQuery(journalAppId || 'none');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddForm(false);
        setRejectingApp(null);
        setSelectedAppId(null);
        setShowCompanyForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate dynamic list of jobs with metrics overrides
  const mappedJobs = jobs.map(j => {
    const override = jobMetricsOverride[j.id];
    return {
      ...j,
      stagesCount: override ? override.stagesCount : (j.stagesCount || 3),
      caseHours: override ? override.caseHours : (j.caseHours || 0)
    };
  });

  const grouped = CandidateStrategyService.groupJobs(primaryResume, mappedJobs, careerProfile, careerProfileNew);

  const handleUpdateJobMetrics = (jobId: string, stages: number, hours: number) => {
    setJobMetricsOverride(prev => ({
      ...prev,
      [jobId]: { stagesCount: stages, caseHours: hours }
    }));
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
        appliedAt: manualStatus.includes('Me candidatei') ? new Date().toISOString() : undefined,
        resumeVersionId: primaryResume?.resumeVersionId
      });
      setManualCompany('');
      setManualTitle('');
      setManualNotes('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRejectionReason = async (reason: Application['rejectionReason']) => {
    if (!rejectingApp) return;

    try {
      await onUpdateApplication({
        ...rejectingApp,
        status: '❌ Rejeitada',
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      });
      setRejectingApp(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickStatusChange = async (app: Application, newStatus: Application['status']) => {
    if (newStatus === '❌ Rejeitada') {
      setRejectingApp(app);
      return;
    }

    try {
      await onUpdateApplication({
        ...app,
        status: newStatus,
        appliedAt: newStatus.includes('Me candidatei') && !app.appliedAt ? new Date().toISOString() : app.appliedAt,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
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
      
      let finalStatus: Application['status'] = selectedApp!.status;
      if (newStageName.includes('Oferta') && newStageStatus === 'passed') {
        finalStatus = '🏆 Oferta recebida';
      } else if (newStageName.includes('Rejeitada') || newStageStatus === 'failed') {
        finalStatus = '❌ Rejeitada';
      }
      
      if (finalStatus !== selectedApp!.status) {
        await onUpdateApplication({
          ...selectedApp!,
          status: finalStatus,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!selectedAppId) return;
    try {
      await deleteStage({ appId: selectedAppId, stageId });
    } catch (err) {
      console.error(err);
    }
  };

  // Weekly Planner tasks toggler
  const handleToggleTask = async (dayName: string, taskId: string) => {
    if (!planner) return;
    const updatedPlannerData = { ...planner.plannerData };
    const dayTasks = updatedPlannerData[dayName]?.tasks || [];
    updatedPlannerData[dayName] = {
      tasks: dayTasks.map((t: any) => t.id === taskId ? { ...t, completed: !t.completed } : t)
    };

    try {
      await saveWeeklyPlanner({
        ...planner,
        plannerData: updatedPlannerData
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (dayName: string, text: string) => {
    if (!planner || !text.trim()) return;
    const updatedPlannerData = { ...planner.plannerData };
    const dayTasks = updatedPlannerData[dayName]?.tasks || [];
    updatedPlannerData[dayName] = {
      tasks: [
        ...dayTasks,
        { id: `task-${Date.now()}`, text, completed: false }
      ]
    };

    try {
      await saveWeeklyPlanner({
        ...planner,
        plannerData: updatedPlannerData
      });
    } catch (err) {
      console.error(err);
    }
  };



  const handleSaveCompany = async (e: FormEvent) => {
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
      setShowCompanyForm(false);
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

  // Compile Dynamic Funnel Stats
  const funnel = CareerAnalyticsService.getFunnel(applications);

  return (
    <div className="space-y-8 animate-fade-in font-sans p-0">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
            Minha Estratégia de Busca
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
            CRM inteligente que planeja, calcula o ROI e monitora a performance da sua recolocação.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus size={14} />
            Candidatura Manual
          </button>
        </div>
      </div>

      {/* Sub Tabs Switcher */}
      <div className="flex flex-wrap border-b border-slate-800 dark:border-slate-800 light:border-slate-200 gap-6">
        {[
          { id: 'strategy', label: 'Painel Estratégico', icon: Flame },
          { id: 'planner', label: 'Planner & Progresso', icon: CheckSquare },
          { id: 'pipeline', label: 'Pipeline de Vagas', icon: Layout },
          { id: 'journal', label: 'Inteligência & Journal', icon: BookOpen }
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
      {/* 1. Modal: Candidatura Manual */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CardGlass className="w-full max-w-md min-w-[320px] sm:min-w-[400px] space-y-6 relative border border-slate-800">
            <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-200">Acompanhar Nova Vaga</h3>
              <p className="text-xs text-slate-500 mt-1">Registre o status atual do processo.</p>
            </div>
            <form onSubmit={handleCreateManualApp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Empresa</label>
                  <input
                    type="text"
                    placeholder="Ex: Pipefy"
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
                    placeholder="Ex: CSM Lead"
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select
                    value={manualStatus}
                    onChange={e => setManualStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                  >
                    <option value="🔎 Encontrada">🔎 Encontrada</option>
                    <option value="⭐ Tenho interesse">⭐ Tenho interesse</option>
                    <option value="📝 Vou me candidatar">📝 Vou me candidatar</option>
                    <option value="📨 Me candidatei">📨 Me candidatei</option>
                    <option value="👥 Entrevista com recrutador">👥 Entrevista RH</option>
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
                  placeholder="Observações..."
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
                  Confirmar Registro
                </button>
              </div>
            </form>
          </CardGlass>
        </div>
      )}

      {/* 2. Modal: Rejeição */}
      {rejectingApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CardGlass className="w-full max-w-sm min-w-[300px] sm:min-w-[360px] space-y-6 relative border border-slate-800 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-200">Qual foi o motivo da recusa?</h3>
              <p className="text-xs text-slate-400 mt-1">Ajuda a IA a calibrar suas recomendações.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2 text-left">
              {[
                'Experiência insuficiente', 'Senioridade incompatível', 'Pretensão salarial',
                'Falta de conhecimento técnico', 'Idioma', 'Cultura', 'Empresa pausou vaga',
                'Sem retorno', 'Outro'
              ].map(reason => (
                <button
                  key={reason}
                  onClick={() => handleSaveRejectionReason(reason as any)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-300 hover:bg-slate-850 hover:text-white transition-all text-left"
                >
                  {reason}
                </button>
              ))}
            </div>
          </CardGlass>
        </div>
      )}

      {/* 3. Modal: Timeline stages */}
      {selectedAppId && selectedApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CardGlass className="w-full max-w-xl min-w-[320px] sm:min-w-[500px] space-y-6 relative border border-slate-800 flex flex-col md:flex-row gap-6 max-h-[85vh] overflow-y-auto">
            <button onClick={() => setSelectedAppId(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-extrabold uppercase">Detalhes da Vaga</span>
                <h3 className="font-display font-bold text-lg text-slate-200 mt-1">{selectedApp.jobTitle}</h3>
                <p className="text-xs text-slate-400">{selectedApp.companyName}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Anotações da Jornada</label>
                <textarea
                  value={selectedApp.notes || ''}
                  onChange={e => onUpdateApplication({ ...selectedApp, notes: e.target.value, updatedAt: new Date().toISOString() })}
                  placeholder="Insira notas de acompanhamento..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-300 h-32 resize-none"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l border-slate-900 pt-4 md:pt-0 md:pl-6 flex flex-col">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-brand-500" />
                Etapas
              </h4>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[220px]">
                {loadingStages ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 py-1">
                    <Loader2 size={12} className="animate-spin text-brand-500" />
                    <span>Buscando etapas da candidatura...</span>
                  </div>
                ) : activeStages.length === 0 ? (
                  <span className="text-[10px] text-slate-500 block">Nenhuma etapa.</span>
                ) : (
                  activeStages.map((st: ApplicationStage) => (
                    <div key={st.id} className="p-2 rounded bg-slate-900/60 border border-slate-850 flex justify-between items-start gap-2">
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-200 block">{st.stageName}</span>
                        {st.notes && <span className="text-[10px] text-slate-400 block mt-0.5">{st.notes}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[8px] px-1 rounded uppercase font-extrabold ${
                          st.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {st.status}
                        </span>
                        <button onClick={() => handleDeleteStage(st.id)} className="text-slate-500 hover:text-red-400">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAddStage} className="space-y-2 border-t border-slate-900 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-[10px] rounded p-1.5 text-slate-200 outline-none"
                  >
                    <option value="📨 Me candidatei">📨 Aplicada</option>
                    <option value="👥 Entrevista com recrutador">👥 Entrevista RH</option>
                    <option value="🎯 Entrevista com gestor">🎯 Entrevista Gestor</option>
                    <option value="🧩 Case técnico">🧩 Case Técnico</option>
                    <option value="🤝 Fit cultural">🤝 Fit Cultural</option>
                    <option value="🏆 Oferta recebida">🏆 Oferta Recebida</option>
                  </select>
                  <select
                    value={newStageStatus}
                    onChange={e => setNewStageStatus(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-[10px] rounded p-1.5 text-slate-200 outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="passed">Aprovado</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Nota..."
                  value={newStageNotes}
                  onChange={e => setNewStageNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded px-2 py-1 outline-none text-slate-200"
                />
                <button type="submit" className="w-full py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px]">
                  Gravar Etapa
                </button>
              </form>
            </div>
          </CardGlass>
        </div>
      )}

      {/* ==========================================
          SUB TAB 1: PRIORITIES CPI & ROI
          ========================================== */}
      {subTab === 'strategy' && (
        <div className="space-y-6 animate-slide-in">
          <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-500 font-extrabold uppercase rounded-lg">Candidacy ROI Engine</span>
              <p className="text-xs text-slate-300 mt-2">
                Analisamos as vagas e calculamos o **ROI (Retorno sobre Tempo)** para você focar no que realmente importa.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('match')}
              className="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center gap-1.5 transition-all shrink-0"
            >
              <Compass size={14} />
              Encontrar mais vagas
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hot priorities */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 pb-1 border-b border-slate-900">
                <Flame size={16} className="text-emerald-500 fill-emerald-500" />
                <h3 className="font-bold text-sm text-slate-200">Alta Prioridade ({grouped.hot.length})</h3>
              </div>

              {grouped.hot.map((rec, idx) => (
                <CardGlass key={idx} className="p-4 space-y-4 hover:border-slate-800">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 truncate max-w-[150px]">{rec.job.title}</h4>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">{rec.job.companyName}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20">
                        {rec.cpi}% CPI
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold border ${
                        rec.roi >= 80 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        ROI {rec.roi}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Metrics Override Inputs */}
                  <div className="p-2 rounded bg-slate-900/50 border border-slate-900 flex justify-between items-center text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>Etapas:</span>
                      <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={rec.job.stagesCount || 3} 
                        onChange={e => handleUpdateJobMetrics((rec.job as any).id, parseInt(e.target.value) || 3, rec.job.caseHours || 0)}
                        className="w-8 bg-slate-950 border border-slate-800 text-center text-slate-100 rounded"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Case (Horas):</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="50" 
                        value={rec.job.caseHours || 0} 
                        onChange={e => handleUpdateJobMetrics((rec.job as any).id, rec.job.stagesCount || 3, parseInt(e.target.value) || 0)}
                        className="w-10 bg-slate-950 border border-slate-800 text-center text-slate-100 rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    {rec.matchedReasons.map((reason, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {rec.roi < 60 && (
                    <div className="p-2 rounded bg-red-500/5 border border-red-500/15 text-[10px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>ROI baixo devido ao case longo ou excesso de etapas. Talvez não valha o seu tempo.</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-900/50">
                    <button
                      onClick={() => handleApplyFromStrategy(rec.job as Job)}
                      className="flex-1 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
                    >
                      Aplicar
                    </button>
                    {onStartSimulation && (
                      <button
                        onClick={() => onStartSimulation(rec.job as Job)}
                        className="py-1.5 px-3 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 font-bold text-xs flex items-center justify-center gap-1 transition"
                        title="Simular Entrevista"
                      >
                        🎤 Simular
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (window.confirm(`Deseja realmente excluir a vaga "${rec.job.title}" de sua estratégia?`)) {
                          if (onDeleteJob) {
                            await onDeleteJob((rec.job as any).id);
                          }
                        }
                      }}
                      className="p-1.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 flex items-center justify-center transition"
                      title="Excluir Vaga"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </CardGlass>
              ))}
            </div>

            {/* Warm priorities */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 pb-1 border-b border-slate-900">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="font-bold text-sm text-slate-200">Ajustar antes ({grouped.warm.length})</h3>
              </div>

              {grouped.warm.map((rec, idx) => (
                <CardGlass key={idx} className="p-4 space-y-4 hover:border-slate-800">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 truncate max-w-[150px]">{rec.job.title}</h4>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">{rec.job.companyName}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-extrabold border border-amber-500/20">
                        {rec.cpi}% CPI
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-extrabold border border-slate-850">
                        ROI {rec.roi}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed bg-slate-950/20 p-2.5 rounded-xl border border-slate-900">
                    <p>💡 <strong>Dica da IA:</strong> Adicione termos ausentes: <strong className="text-slate-200">{rec.missingSkills.slice(0, 2).join(', ')}</strong>.</p>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setActiveTab('match')}
                      className="flex-1 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      Otimizar
                      <ChevronRight size={14} />
                    </button>
                    {onStartSimulation && (
                      <button
                        onClick={() => onStartSimulation(rec.job as Job)}
                        className="py-1.5 px-3 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 font-bold text-xs flex items-center justify-center gap-1 transition"
                        title="Simular Entrevista"
                      >
                        🎤 Simular
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (window.confirm(`Deseja realmente excluir a vaga "${rec.job.title}" de sua estratégia?`)) {
                          if (onDeleteJob) {
                            await onDeleteJob((rec.job as any).id);
                          }
                        }
                      }}
                      className="p-1.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 flex items-center justify-center transition"
                      title="Excluir Vaga"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </CardGlass>
              ))}
            </div>

            {/* Cold priorities */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 pb-1 border-b border-slate-900">
                <AlertCircle size={16} className="text-slate-500" />
                <h3 className="font-bold text-sm text-slate-200">Baixa Aderência ({grouped.cold.length})</h3>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {grouped.cold.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/10 border border-slate-900 flex justify-between items-center text-xs gap-3 hover:border-slate-800"
                  >
                    <div className="truncate flex-1">
                      <h4 className="font-bold text-slate-300 truncate">{rec.job.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{rec.job.companyName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 font-semibold">{rec.cpi}% CPI</span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Deseja realmente excluir a vaga "${rec.job.title}" de sua estratégia?`)) {
                            if (onDeleteJob) {
                              await onDeleteJob((rec.job as any).id);
                            }
                          }
                        }}
                        className="p-1 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-300 transition"
                        title="Excluir Vaga"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 2: PLANNER SEMANAL
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
                            <div 
                              key={task.id} 
                              onClick={() => handleToggleTask(day, task.id)}
                              className="flex gap-2 items-start text-[11px] text-slate-300 hover:text-white cursor-pointer select-none"
                            >
                              <span className="shrink-0 mt-0.5 text-brand-500">
                                {task.completed ? <CheckSquare size={13} /> : <Square size={13} />}
                              </span>
                              <span className={task.completed ? 'line-through text-slate-600' : ''}>{task.text}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Add fast task */}
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
              Nenhum planner ativo encontrado para a semana {currentWeekNumber}.
            </div>
          )}

          {/* Fusão de Abas: Metas Semanais & Progresso */}
          {goal && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-800/60 mt-6">
              <CardGlass className="p-5 space-y-4 border border-slate-900">
                <div>
                  <h4 className="font-display font-bold text-xs text-brand-400 uppercase tracking-wider">Metas Operacionais</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Configure seus objetivos operacionais para esta semana.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold block">Candidaturas</label>
                    <input 
                      type="number" 
                      value={goal.targetApplications}
                      onChange={e => saveWeeklyGoal({ ...goal, targetApplications: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold block">Conversas RH</label>
                    <input 
                      type="number" 
                      value={goal.targetInterviewsRh}
                      onChange={e => saveWeeklyGoal({ ...goal, targetInterviewsRh: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold block">Entrev. Gestor</label>
                    <input 
                      type="number" 
                      value={goal.targetInterviewsManager}
                      onChange={e => saveWeeklyGoal({ ...goal, targetInterviewsManager: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </CardGlass>

              <CardGlass className="p-5 space-y-4 border border-slate-905">
                <div>
                  <h4 className="font-display font-bold text-xs text-brand-400 uppercase tracking-wider">Seu Progresso Real</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Progresso calculado automaticamente a partir de suas candidaturas.</p>
                </div>
                <div className="space-y-3">
                  {/* Apps progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Candidaturas Realizadas</span>
                      <span className="font-bold text-slate-200">{funnel.applied} / {goal.targetApplications}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-955 overflow-hidden">
                      <div 
                        className="h-full bg-brand-500 rounded-full" 
                        style={{ width: `${Math.min(100, goal.targetApplications > 0 ? (funnel.applied / goal.targetApplications) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* RH progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Entrevistas com Recrutadores</span>
                      <span className="font-bold text-slate-200">
                        {applications.filter(a => a.status === '👥 Entrevista com recrutador').length} / {goal.targetInterviewsRh}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-955 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${Math.min(100, goal.targetInterviewsRh > 0 ? (applications.filter(a => a.status === '👥 Entrevista com recrutador').length / goal.targetInterviewsRh) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Manager progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Entrevistas com Gestores</span>
                      <span className="font-bold text-slate-200">
                        {applications.filter(a => a.status === '🎯 Entrevista com gestor').length} / {goal.targetInterviewsManager}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-955 overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${Math.min(100, goal.targetInterviewsManager > 0 ? (applications.filter(a => a.status === '🎯 Entrevista com gestor').length / goal.targetInterviewsManager) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardGlass>
            </div>
          )}
        </div>
      )}



      {/* ==========================================
          SUB TAB 4: INTELIGÊNCIA DE EMPRESAS (COMPANY INTEL) & AI JOURNAL
          ========================================== */}
      {subTab === 'journal' && (
        <div className="space-y-6 animate-slide-in">
          {/* Inner Tab Selector */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setIntelSubTab('companies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  intelSubTab === 'companies'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 size={13} />
                Empresas Monitoradas
              </button>
              <button
                type="button"
                onClick={() => setIntelSubTab('diary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  intelSubTab === 'diary'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen size={13} />
                Diário / AI Journal
              </button>
            </div>
            
            {intelSubTab === 'companies' && (
              <button 
                type="button"
                onClick={() => setShowCompanyForm(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                <Plus size={13} />
                Avaliar Empresa
              </button>
            )}
          </div>

          {intelSubTab === 'companies' && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-200">Inteligência de Empresas</h3>
                  <p className="text-xs text-slate-500 mt-1">Monitore e analise o fit corporativo das empresas com quem você interage.</p>
                </div>
              </div>

          {/* Form Modal for Company */}
          {showCompanyForm && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <CardGlass className="w-full max-w-md min-w-[320px] sm:min-w-[400px] space-y-4 relative border border-slate-800 max-h-[85vh] overflow-y-auto">
                <button onClick={() => setShowCompanyForm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
                  <X size={18} />
                </button>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-200">Nova Inteligência Corporativa</h3>
                  <p className="text-xs text-slate-500 mt-1">Colete dados para futuras análises de conversão.</p>
                </div>
                <form onSubmit={handleSaveCompany} className="space-y-3.5 text-xs text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400">Nome da Empresa</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Stripe"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Indústria / Segmento</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Finanças, SaaS"
                        value={companyIndustry}
                        onChange={e => setCompanyIndustry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400">Glassdoor</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="1" 
                        max="5"
                        value={companyRating}
                        onChange={e => setCompanyRating(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Tamanho</label>
                      <select 
                        value={companySize} 
                        onChange={e => setCompanySize(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                      >
                        <option value="Pequena">Pequena</option>
                        <option value="Média">Média</option>
                        <option value="Grande">Grande</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Modelo Trabalho</label>
                      <select 
                        value={companyRemote} 
                        onChange={e => setCompanyRemote(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                      >
                        <option value="Remoto">Remoto</option>
                        <option value="Híbrido">Híbrido</option>
                        <option value="Presencial">Presencial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400">Faixa Salarial</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 14k - 18k"
                        value={companySalary}
                        onChange={e => setCompanySalary(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Benefícios (separar por vírgula)</label>
                      <input 
                        type="text" 
                        placeholder="VR, Saúde, Gympass"
                        value={companyBenefits}
                        onChange={e => setCompanyBenefits(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Processo Seletivo (Resumo)</label>
                    <input 
                      type="text" 
                      placeholder="RH -> Teste Técnico -> Painel Gestor"
                      value={companyProcess}
                      onChange={e => setCompanyProcess(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Minhas Notas / Fit Cultural</label>
                    <textarea 
                      placeholder="O time parece organizado..."
                      value={companyNotes}
                      onChange={e => setCompanyNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 h-16 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={companyApplyAgain}
                        onChange={e => setCompanyApplyAgain(e.target.checked)}
                        className="scale-110"
                      />
                      <label className="text-slate-300 font-semibold">Candidataria de novo?</label>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <label className="text-slate-400">Score Cultura:</label>
                      <select 
                        value={companyCulture}
                        onChange={e => setCompanyCulture(parseInt(e.target.value) || 4)}
                        className="bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200"
                      >
                        <option value="1">1/5</option>
                        <option value="2">2/5</option>
                        <option value="3">3/5</option>
                        <option value="4">4/5</option>
                        <option value="5">5/5</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowCompanyForm(false)} className="px-3 py-1.5 text-slate-400">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded font-bold">Salvar Avaliação</button>
                  </div>
                </form>
              </CardGlass>
            </div>
          )}

          {/* Companies List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {companyProfiles.map(comp => (
              <CardGlass key={comp.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-slate-800 relative group">
                <button 
                  onClick={() => deleteCompanyProfile(comp.id)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
                <div className="space-y-2">
                  <div className="flex justify-between items-start pr-6">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{comp.companyName}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{comp.industry || 'Tecnologia'} • {comp.size || 'Média'}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-400 font-extrabold border border-brand-500/20 rounded shrink-0">
                      ★ {comp.glassdoorRating || '4.0'} Glassdoor
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/50 border border-slate-900 text-[11px] text-slate-400 space-y-1">
                    <div><strong>Modelo:</strong> {comp.remotePolicy || 'Híbrido'}</div>
                    {comp.salaryRange && <div><strong>Salário:</strong> {comp.salaryRange}</div>}
                    {comp.interviewProcess && <div><strong>Processo:</strong> {comp.interviewProcess}</div>}
                  </div>

                  {comp.userNotes && (
                    <p className="text-[11px] text-slate-500 italic mt-2 leading-relaxed">
                      "{comp.userNotes}"
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60 text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-extrabold uppercase ${
                    comp.wouldApplyAgain ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {comp.wouldApplyAgain ? '✔ Aplicaria de novo' : '✖ Não aplicaria'}
                  </span>
                  <span className="text-slate-400">
                    Cultura: <strong className="text-brand-500">{comp.cultureScore || 4}/5</strong>
                  </span>
                </div>
              </CardGlass>
            ))}
          </div>
          </div>
          )}

          {intelSubTab === 'diary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-in">
          {/* Reflections Logger */}
          <CardGlass className="p-6 space-y-6">
            <div>
              <h3 className="font-display font-bold text-base text-slate-200">Refletir sobre a Entrevista</h3>
              <p className="text-xs text-slate-500 mt-1">Ao mapear suas sensações, a IA ajuda a calibrar suas falas técnicas.</p>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-4 text-xs text-left">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Para qual processo seletivo?</label>
                <select 
                  required 
                  value={journalAppId} 
                  onChange={e => setJournalAppId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="">Selecione a candidatura...</option>
                  {applications
                    .filter(a => !['🔎 Encontrada', '⭐ Tenho interesse', '🚫 Fora do meu objetivo'].includes(a.status))
                    .map(app => (
                      <option key={app.id} value={app.id}>{app.companyName} - {app.jobTitle}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-1.5 flex-1 w-full text-left">
                  <label className="text-slate-400 font-semibold block">Como se sentiu?</label>
                  <div className="flex gap-2">
                    {[
                      { icon: Smile, val: 'happy', label: '😄' },
                      { icon: Meh, val: 'neutral', label: '😐' },
                      { icon: Frown, val: 'sad', label: '😔' }
                    ].map(f => (
                      <button 
                        key={f.val}
                        type="button" 
                        onClick={() => setJournalFeeling(f.label)}
                        className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-base ${
                          journalFeeling === f.label ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <f.icon size={18} />
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 w-full sm:w-1/3 text-left">
                  <label className="text-slate-400 font-semibold block">Score de Confiança (1-10)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={journalConfidence}
                    onChange={e => setJournalConfidence(parseInt(e.target.value) || 7)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">O que achou difícil? (Ex: SQL, Salesforce...)</label>
                <textarea 
                  required
                  placeholder="Perguntaram sobre Churn negativo e fiquei travado..."
                  value={journalDiff}
                  onChange={e => setJournalDiff(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 h-20 resize-none outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">O que aprendeu?</label>
                <textarea 
                  required
                  placeholder="Preciso estudar a forma como o Stripe lida com chargeback..."
                  value={journalLearned}
                  onChange={e => setJournalLearned(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 h-20 resize-none outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">O que faria diferente?</label>
                <textarea 
                  required
                  placeholder="Deveria ter citado o framework STAR logo no início..."
                  value={journalDifferent}
                  onChange={e => setJournalDifferent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 h-20 resize-none outline-none focus:border-brand-500"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-lg"
              >
                Registrar no Diário
              </button>
            </form>
          </CardGlass>

          {/* Reflections analysis / Dynamic AI Advisor */}
          <div className="space-y-6">
            <CardGlass className="p-6 bg-gradient-to-br from-brand-600/10 to-indigo-600/10 border border-brand-500/15 flex gap-4">
              <div className="p-3 rounded-2xl bg-brand-500/15 text-brand-400 shrink-0">
                <Target size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-sm text-slate-100">Análise de Padrões Pós-Entrevista</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Após 15 reflexões salvas, o coach identificará medos técnicos ocultos ou barreiras. Atualmente, com base nas notas:
                </p>
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-[10px] text-slate-400 leading-relaxed space-y-1">
                  {(() => {
                    const isPharmacy = /farmac|estet|saude|saúde|cosmet/i.test(careerProfileNew?.personal?.headline || '');
                    if (isPharmacy) {
                      return (
                        <>
                          <div>💡 <strong>Insegurança detectada:</strong> Você costuma perder confiança quando perguntado sobre procedimentos clínicos complexos ou regulamentações da ANVISA.</div>
                          <div className="mt-1">📚 <strong>Dica de Ação:</strong> Treine no módulo Coach com simulador voltado para perguntas de biossegurança, atendimento a pacientes e farmacologia clínica.</div>
                        </>
                      );
                    }
                    return (
                      <>
                        <div>💡 <strong>Insegurança detectada:</strong> Você costuma perder confiança quando perguntado sobre frameworks operacionais pesados como **SQL** ou **Salesforce**.</div>
                        <div className="mt-1">📚 <strong>Dica de Ação:</strong> Treine no módulo Coach com simulador voltado para perguntas de banco de dados e controle de pipeline de vendas.</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardGlass>

            {/* List of journal reflections */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {applications
                .filter(a => a.status === '❌ Rejeitada' || a.status === '👥 Entrevista com recrutador')
                .map(app => (
                  <div key={app.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">{app.companyName}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{app.jobTitle}</span>
                    </div>
                    <span className="text-lg p-2 rounded bg-slate-900 border border-slate-800">
                      {app.status === '❌ Rejeitada' ? '😔' : '😄'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* ==========================================
          SUB TAB 6: PIPELINE DE VAGAS (KANBAN & LISTA INTEGRADOS)
          ========================================== */}
      {subTab === 'pipeline' && (
        <div className="space-y-6 animate-slide-in">
          {/* Alternância de Visualização (Toggle) */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200">Pipeline de Vagas</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Acompanhe e movimente o status de seus processos seletivos.</p>
            </div>
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layout size={13} />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List size={13} />
                Lista
              </button>
            </div>
          </div>

          {viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-6 items-start scrollbar-thin select-none">
              {Object.values(pipelineColumns).map(col => (
            <div 
              key={col.id} 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const appId = e.dataTransfer.getData('text/plain');
                if (appId) {
                  const appObj = applications.find(a => a.id === appId);
                  if (appObj) {
                    handleQuickStatusChange(appObj, col.defaultStatus);
                  }
                }
              }}
              className={`p-3 rounded-2xl border ${col.color} min-w-[220px] flex flex-col gap-3 min-h-[550px] transition-all hover:bg-slate-900/5`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <span className="font-bold text-xs text-slate-200">{col.title}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900/40 text-slate-405">{col.apps.length}</span>
              </div>

              {col.apps.length === 0 ? (
                <div className="py-16 border border-dashed border-slate-900/60 rounded-xl text-center text-[10px] text-slate-600">
                  Sem processos
                </div>
              ) : (
                col.apps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', app.id);
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-900 hover:border-slate-800 transition-all cursor-grab active:cursor-grabbing space-y-3 relative group text-left"
                  >
                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-slate-950/90 pl-1 py-0.5 rounded-lg border border-slate-900/60 z-10" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Retirar da fila (Arquivar)"
                        onClick={() => handleQuickStatusChange(app, '🚫 Fora do meu objetivo')}
                        className="p-1 hover:bg-slate-900 text-slate-400 hover:text-amber-500 rounded transition-all"
                      >
                        <AlertCircle size={11} />
                      </button>
                      <button
                        type="button"
                        title="Apagar Candidatura"
                        onClick={async () => {
                          if (window.confirm(`Excluir permanentemente o acompanhamento de ${app.jobTitle} em ${app.companyName}?`)) {
                            try {
                              await onDeleteApplication(app.id);
                            } catch (e) {
                              alert("Erro ao excluir candidatura.");
                            }
                          }
                        }}
                        className="p-1 hover:bg-slate-900 text-slate-400 hover:text-red-500 rounded transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-[11px] text-slate-100 truncate pr-4">{app.jobTitle}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{app.companyName}</span>
                    </div>

                    <div className="flex justify-between items-center gap-1 text-[9px] text-slate-500">
                      <span>{app.sourcePlatform || 'Discover'}</span>
                      {app.appliedAt && <span>{new Date(app.appliedAt).toLocaleDateString()}</span>}
                    </div>

                    {/* Ações Visíveis da Vaga (Simular e Remover da Estratégia) */}
                    <div onClick={e => e.stopPropagation()} className="pt-0.5 space-y-1">
                      {onStartSimulation && (
                        <button
                          type="button"
                          onClick={() => onStartSimulation(app.id)}
                          className="w-full py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 font-bold text-[9px] uppercase flex items-center justify-center gap-1 transition"
                        >
                          🎤 Simular Entrevista
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Remover permanentemente a vaga "${app.jobTitle}" de "${app.companyName}" da sua estratégia?`)) {
                            try {
                              await onDeleteApplication(app.id);
                            } catch (e) {
                              alert("Erro ao remover vaga da estratégia.");
                            }
                          }
                        }}
                        className="w-full py-1 rounded-lg bg-red-950/15 hover:bg-red-950/30 border border-red-900/25 text-red-400 font-bold text-[9px] uppercase flex items-center justify-center gap-1 transition"
                      >
                        <Trash2 size={10} />
                        Remover da Estratégia
                      </button>
                    </div>

                    {/* Controles de Etapa (Setas + Dropdown) */}
                    <div className="flex items-center justify-between gap-1 pt-1" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleMoveStage(app, 'prev')}
                        disabled={app.status === '🔎 Encontrada'}
                        className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Voltar Etapa"
                      >
                        <ChevronLeft size={14} />
                      </button>

                      <select
                        value={app.status}
                        onChange={e => handleQuickStatusChange(app, e.target.value as any)}
                        className="bg-slate-900 border border-slate-855 text-[9px] text-slate-350 rounded p-1 cursor-pointer focus:outline-none flex-1 max-w-[120px]"
                      >
                        <option value="🔎 Encontrada">🔎 Encontrada</option>
                        <option value="⭐ Tenho interesse">⭐ Tenho interesse</option>
                        <option value="📝 Vou me candidatar">📝 Vou me candidatar</option>
                        <option value="📨 Me candidatei">📨 Me candidatei</option>
                        <option value="⏳ Aguardando retorno">⏳ Retorno</option>
                        <option value="👥 Entrevista com recrutador">👥 Entrevista RH</option>
                        <option value="🎯 Entrevista com gestor">🎯 Entrevista Gestor</option>
                        <option value="🧩 Case técnico">🧩 Case Técnico</option>
                        <option value="🤝 Fit cultural">🤝 Fit Cultural</option>
                        <option value="🏆 Oferta recebida">🏆 Oferta Recebida</option>
                        <option value="✅ Aceita">✅ Aceita</option>
                        <option value="❌ Rejeitada">❌ Rejeitada</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleMoveStage(app, 'next')}
                        disabled={app.status === '🚫 Fora do meu objetivo'}
                        className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Próxima Etapa"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* Ações Rápidas Persistentes (Arquivar / Excluir) */}
                    <div className="flex justify-between items-center gap-1.5 pt-1.5 border-t border-slate-900/60" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(app, '🚫 Fora do meu objetivo')}
                        className="text-[9px] text-slate-500 hover:text-amber-500 flex items-center gap-0.5 transition-all"
                        title="Remover da estratégia (Arquivar)"
                      >
                        <AlertCircle size={12} />
                        <span>Arquivar</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Excluir permanentemente o acompanhamento de ${app.jobTitle} em ${app.companyName}?`)) {
                            try {
                              await onDeleteApplication(app.id);
                            } catch (e) {
                              alert("Erro ao excluir candidatura.");
                            }
                          }
                        }}
                        className="text-[9px] text-slate-500 hover:text-red-500 flex items-center gap-0.5 transition-all"
                        title="Excluir permanentemente"
                      >
                        <Trash2 size={12} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : (
        <CardGlass className="p-6 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-900">
            <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2">
              <Briefcase size={18} className="text-brand-500" />
              Processos em Andamento
            </h3>
          </div>

          {applications.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl">
              <span>Nenhuma candidatura registrada.</span>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-bold">Empresa / Vaga</th>
                    <th className="py-3 px-4 font-bold">Origem</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Data</th>
                    <th className="py-3 px-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200 block">{app.jobTitle}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{app.companyName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {app.sourcePlatform || 'Discover'}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={app.status}
                          onChange={e => handleQuickStatusChange(app, e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="🔎 Encontrada">🔎 Encontrada</option>
                          <option value="⭐ Tenho interesse">⭐ Tenho interesse</option>
                          <option value="📝 Vou me candidatar">📝 Vou me candidatar</option>
                          <option value="📨 Me candidatei">📨 Me candidatei</option>
                          <option value="⏳ Aguardando retorno">⏳ Retorno</option>
                          <option value="👥 Entrevista com recrutador">👥 Entrevista RH</option>
                          <option value="🎯 Entrevista com gestor">🎯 Entrevista Gestor</option>
                          <option value="🧩 Case técnico">🧩 Case Técnico</option>
                          <option value="🤝 Fit cultural">🤝 Fit Cultural</option>
                          <option value="🏆 Oferta recebida">🏆 Oferta Recebida</option>
                          <option value="✅ Aceita">✅ Aceita</option>
                          <option value="❌ Rejeitada">❌ Rejeitada</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right flex justify-end gap-2">
                        {onStartSimulation && (
                          <button
                            onClick={() => onStartSimulation(app.id)}
                            className="px-2.5 py-1 rounded bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 font-bold transition-colors"
                          >
                            🎤 Simular
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800 transition-colors"
                        >
                          Linha do Tempo
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir a candidatura para a vaga "${app.jobTitle}" na empresa "${app.companyName}"? Todos os estágios e logs desta candidatura serão removidos permanentemente.`)) {
                              onDeleteApplication(app.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardGlass>
      )}
        </div>
      )}
    </div>
  );
}
