import { useState, type FormEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CardGlass } from '../components/CardGlass';
import { RadarChart } from '../components/RadarChart';
import { useJobDiscovery } from '../../application/hooks/useJobDiscovery';
import { useCoach } from '../../application/hooks/useCoach';
import { useCareerIntelligence } from '../../application/hooks/useCareerIntelligence';
import { CareerCoachService } from '../../application/services/CareerCoachService';
import { MatchingEngine } from '../../application/services/matchingEngine';
import type { Job, Resume, Match, CareerProfile, JobFeedbackReason } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { useEscapeToClose } from '../../application/hooks/useEscapeToClose';
import { Play, Clipboard, Award, CheckCircle, AlertTriangle, AlertCircle, X, ChevronRight, BookOpen, Plus, Search, MapPin, Loader2, ArrowUpRight, Flame, Sparkles, Trash2, Briefcase, Heart, DollarSign, Building, FileText, Printer, Check, Target, Zap, ThumbsUp, ThumbsDown, RotateCcw, Filter, Info } from 'lucide-react';
import { useJobTrash } from '../../application/hooks/useJobTrash';

import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { AppError } from '../../application/errors/AppError';
import { ErrorState, EmptyState, ProcessingState } from '../components/ErrorVisuals';
import { ProgressRing, Badge } from '../components/ds';
import { jobIngestionService } from '../../application/services/JobIngestionService';
import type { IngestionResult } from '../../application/services/parsers/BaseJobParser';
import { printElementHtml } from '../../application/utils/pdfExport';
import { tracker } from '../../infrastructure/analytics/tracker';
import { JobMatchFeedbackService, type JobMatchRejectionReason } from '../../application/services/JobMatchFeedbackService';
import { useAuth } from '../../application/hooks/useAuth';
import { useEntitlements, PaywallModal, CheckoutModal } from '../../modules/billing';
import { ApplicationPipelineService } from '../../application/services/ApplicationPipelineService';
import { useToast } from '../../application/context/ToastContext';
import { ProductValidationSurveyModal } from '../components/ProductValidationSurveyModal';
import { SurveyService } from '../../application/services/SurveyService';




const isValidUrl = (url?: string): boolean => !!(url && (url.startsWith('http://') || url.startsWith('https://')));

function renderFormattedMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const clean = text.replace(/\*\*\*/g, '**');
  const parts = clean.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const BRAZILIAN_LOCATIONS = [
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Brasília, DF",
  "Salvador, BA",
  "Fortaleza, CE",
  "Recife, PE",
  "Porto Alegre, RS",
  "Curitiba, PR",
  "Manaus, AM",
  "Belém, PA",
  "Goiânia, GO",
  "Florianópolis, SC",
  "Campinas, SP",
  "Guarulhos, SP",
  "São Bernardo do Campo, SP",
  "Santo André, SP",
  "Osasco, SP",
  "Niterói, RJ",
  "São Gonçalo, RJ",
  "Duque de Caxias, RJ",
  "Porto Velho, RO",
  "Rio Branco, AC",
  "Macapá, AP",
  "Boa Vista, RR",
  "Palmas, TO",
  "Cuiabá, MT",
  "Campo Grande, MS",
  "Teresina, PI",
  "São Luís, MA",
  "Natal, RN",
  "João Pessoa, PB",
  "Maceió, AL",
  "Aracaju, SE",
  "Vitória, ES",
  "Santos, SP",
  "Joinville, SC",
  "Londrina, PR",
  "Caxias do Sul, RS",
  "Uberlândia, MG",
  "Juiz de Fora, MG",
  "Ribeirão Preto, SP",
  "São José dos Campos, SP",
  "Sorocaba, SP",
  "Feira de Santana, BA",
  "Vitória da Conquista, BA",
  "Caruaru, PE",
  "Campina Grande, PB",
  "Remoto",
  "Híbrido",
  "Presencial"
];

interface JobMatchHubProps {
  userId: string | undefined;
  resumes: Resume[];
  jobs: Job[];
  onDeleteJob?: (jobId: string) => Promise<any>;
  matches: Match[];
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  onCreateJob: (data: { 
    title: string; 
    description: string; 
    requirements: string[]; 
    companyName?: string;
    location?: string;
    workMode?: string;
    seniority?: string;
    salary?: string;
    salaryNumeric?: number;
    benefits?: string[];
    sourceUrl?: string;
    sourcePlatform?: string;
  }) => Promise<any>;
  onCalculateMatch: (data: { resume: Resume; job: Job; consolidatedProfile?: CareerProfileNew | null }) => Promise<any>;
  getMatchDetails: (matchId: string) => { data: any; isLoading: boolean };
  isCreating: boolean;
  isCalculating: boolean;
  activeResumeVersionId?: string | null;
  applications?: any[];
  onCreateApplication?: (data: any) => Promise<any>;
  onUpdateApplication?: (data: any) => Promise<any>;
  onDeleteApplication?: (id: string) => Promise<any>;
  setActiveTab?: (tab: string) => void;
  selectedJobId?: string | null;
  onSelectJob?: (id: string | null) => void;
  onStartSimulation?: (target: Job | string) => void;
  initialSubTab?: 'my-jobs' | 'discover' | 'trash';
}

const METRO_REGIONS: Record<string, string[]> = {
  'são paulo': ['são paulo', 'sao paulo', 'sp', 'itapevi', 'osasco', 'barueri', 'guarulhos', 'santo andré', 'santo andre', 'são bernardo', 'sao bernardo', 'diadema', 'alphaville', 'cotia', 'taboão', 'taboao', 'mauá', 'maua', 'mogi', 'jundiaí', 'jundiai', 'campinas', 'santos', 'santana de parnaíba', 'araraquara', 'sorocaba', 'piracicaba'],
  'rio de janeiro': ['rio de janeiro', 'rj', 'niterói', 'niteroi', 'duque de caxias', 'nova iguaçu', 'nova iguacu', 'petrópolis', 'petropolis', 'volta redonda', 'macaé', 'macae'],
  'belo horizonte': ['belo horizonte', 'bh', 'mg', 'contagem', 'betim', 'nova lima', 'uberlândia', 'uberlandia', 'juiz de fora', 'sete lagoas'],
  'curitiba': ['curitiba', 'pr', 'são josé dos pinhais', 'sao jose dos pinhais', 'londrina', 'maringá', 'maringa'],
  'porto alegre': ['porto alegre', 'rs', 'canoas', 'caxias do sul', 'pelotas'],
  'florianópolis': ['florianópolis', 'florianopolis', 'sc', 'joinville', 'blumenau', 'são josé', 'sao jose']
};

function isMetropolitanMatch(targetLocRaw: string, jobLocRaw: string, workMode?: string): boolean {
  if (!targetLocRaw) return true;

  const targetLoc = targetLocRaw.toLowerCase().trim();
  const jobLoc = (jobLocRaw || '').toLowerCase().trim();

  if (targetLoc === 'brasil' || targetLoc === 'remoto' || targetLoc === '') return true;
  if (workMode === 'remote' || jobLoc.includes('remot') || jobLoc.includes('qualquer lugar') || jobLoc.includes('brasil')) return true;

  const cleanTarget = targetLoc.replace(/,\s*sp/g, '').replace(/,\s*rj/g, '').replace(/,\s*mg/g, '').trim();
  if (jobLoc.includes(cleanTarget)) return true;

  for (const [regionName, cities] of Object.entries(METRO_REGIONS)) {
    const isTargetInRegion = cities.some(c => targetLoc.includes(c) || regionName.includes(cleanTarget));
    if (isTargetInRegion) {
      const isJobInRegion = cities.some(c => jobLoc.includes(c));
      if (isJobInRegion) return true;
    }
  }

  const targetStateMatch = targetLoc.match(/\b(sp|rj|mg|pr|rs|sc|ba|pe|ce|df|go|am|pa)\b/);
  const jobStateMatch = jobLoc.match(/\b(sp|rj|mg|pr|rs|sc|ba|pe|ce|df|go|am|pa)\b/);

  if (targetStateMatch && jobStateMatch && targetStateMatch[1] === jobStateMatch[1]) {
    return true;
  }

  return false;
}

export function JobMatchHub({
  userId,
  resumes,
  jobs,
  onDeleteJob,
  matches,
  careerProfile,
  careerProfileNew,
  onCreateJob,
  onCalculateMatch,
  getMatchDetails,
  isCreating,
  isCalculating,
  activeResumeVersionId,
  applications = [],
  onCreateApplication,
  onUpdateApplication,
  onDeleteApplication,
  setActiveTab,
  selectedJobId: propSelectedJobId,
  onSelectJob: propOnSelectJob,
  onStartSimulation,
  initialSubTab
}: JobMatchHubProps) {
  const { user } = useAuth();
  const { 
    isPro, 
    canExportPdf,
    weeklyActionCount, 
    isJobUnlocked,
    canUnlockJob,
    unlockJob,
    canImproveResume,
    canGenerateCoverLetter,
    paywallState, 
    triggerPaywall, 
    closePaywall 
  } = useEntitlements(user?.id || userId);

  const [showCheckout, setShowCheckout] = useState(false);
  const { trashedJobs, trashedJobIds, moveToTrash, restoreFromTrash, removeFromTrash, clearTrash } = useJobTrash(user?.id || userId, jobs);

  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'my-jobs' | 'discover' | 'trash'>(initialSubTab || 'discover');
  const [showHiddenJobs, setShowHiddenJobs] = useState(false);
  
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const triggerDiscovery = localStorage.getItem('vocentro_trigger_discovery');
    if (triggerDiscovery === 'true') {
      setSubTab('discover');
      localStorage.removeItem('vocentro_trigger_discovery');
    }
  }, []);

  const [coachTab, setCoachTab] = useState<'coach-evaluation' | 'optimize-cv' | 'cover-letter' | 'interview-questions'>('coach-evaluation');
  const [isDeletingAnalyses, setIsDeletingAnalyses] = useState(false);
  const [letterStyle, setLetterStyle] = useState<'formal' | 'direct' | 'executive'>('formal');
  const [appError, setAppError] = useState<AppError | null>(null);
  const [isAddingToStrategy, setIsAddingToStrategy] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [manualStrategyStatus, setManualStrategyStatus] = useState<string>('auto');
  const [localSelectedJobId, setLocalSelectedJobId] = useState<string | null>(jobs[0]?.id || null);
  const selectedJobId = propSelectedJobId !== undefined ? propSelectedJobId : localSelectedJobId;
  const setSelectedJobId = propOnSelectJob !== undefined ? propOnSelectJob : setLocalSelectedJobId;

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const primaryResume = (activeResumeVersionId ? resumes.find(r => r.resumeVersionId === activeResumeVersionId) : null) || resumes.find(r => r.isPrimary) || resumes[0];

  const [showAdaptationModal, setShowAdaptationModal] = useState(false);
  const [rejectReasonModal, setRejectReasonModal] = useState(false);
  const [matchRejectionModal, setMatchRejectionModal] = useState(false);
  const [matchFeedbackGiven, setMatchFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const ahaMomentTriggered = useRef(false);
  const { showToast } = useToast();
  const setToast = showToast;

  // Lógica de Exibição da Pesquisa de Usuários Fundadores (v1_founders_validation)
  const [showSurveyModal, setShowSurveyModal] = useState<boolean>(false);
  const [surveyCohort, setSurveyCohort] = useState<'activated' | 'not_activated' | 'beta_general'>('beta_general');

  useEffect(() => {
    if (!user || !user.email) return;

    // Exclusão estrita de contas de teste
    const email = user.email.toLowerCase();
    const isTestAccount = ['example.com', 'hardening', 'e2e', 'admin', 'vocentro.com.br', 'demo', 'qa'].some(pat => email.includes(pat));
    
    // Contagem de Sessões de Uso Real (exige pelo menos o 2º login/acesso para exibir pesquisa)
    const sessionKey = `vocentro_session_count_${user.id}`;
    const sessionTrackedKey = `vocentro_session_tracked_${user.id}`;
    if (!sessionStorage.getItem(sessionTrackedKey)) {
      sessionStorage.setItem(sessionTrackedKey, 'true');
      const currentSessions = Number(localStorage.getItem(sessionKey) || '0');
      localStorage.setItem(sessionKey, String(currentSessions + 1));
    }
    const sessionCount = Number(localStorage.getItem(sessionKey) || '1');

    let isCancelled = false;
    const checkCompletionAndTrigger = async () => {
      const isDismissed = localStorage.getItem(`survey_dismissed_${user.id}`);
      const searchParams = new URLSearchParams(window.location.search);
      const forceOpen = searchParams.get('open_survey') === 'true';

      const isCompleted = await SurveyService.hasCompletedSurvey(user.id);
      if (isCancelled) return;

      // Exibir APENAS a partir do 2º acesso com uso real (vagas/matches), ou se forçado pela URL
      const hasRealUsage = (matches?.length || 0) >= 1 || isPro;
      const isEligibleForSurvey = sessionCount >= 2 && hasRealUsage;

      if (forceOpen || (isEligibleForSurvey && !isCompleted && !isDismissed && !isTestAccount)) {
        // Determinar Coorte
        const matchesCount = matches?.length || 0;
        const appsCount = applications?.length || 0;
        let cohort: 'activated' | 'not_activated' | 'beta_general' = 'beta_general';

        if (matchesCount >= 1 && (appsCount >= 1 || isPro)) {
          cohort = 'activated';
        } else if (matchesCount === 0) {
          cohort = 'not_activated';
        }

        setSurveyCohort(cohort);
        setShowSurveyModal(true);
      }
    };

    const timer = setTimeout(checkCompletionAndTrigger, 3500);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [user, matches, applications, isPro]);


  useEffect(() => {
    if (showAdaptationModal || rejectReasonModal || matchRejectionModal || showSurveyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAdaptationModal, rejectReasonModal, matchRejectionModal, showSurveyModal]);


  const {
    explanation,
    isLoadingExplanation,
    adaptation,
    isLoadingAdaptation,
    updateAdaptationStatus,
    recordFeedback,
    updateApplicationStatus
  } = useCareerIntelligence(userId, selectedJob || null, primaryResume, careerProfileNew);

  useEffect(() => {
    if (primaryResume && explanation && selectedJob && !ahaMomentTriggered.current) {
      ahaMomentTriggered.current = true;
      tracker.trackAhaMoment({
        user_id: userId,
        career_score: explanation.careerFitScore,
        first_job_match_score: explanation.careerFitScore,
        time_since_signup: 60
      });
    }
  }, [primaryResume, explanation, selectedJob, userId]);


  const [matchSteps, setMatchSteps] = useState<{ id: string; label: string; status: 'pending' | 'running' | 'success' | 'error' }[]>([
    { id: 'preparing', label: 'Comparando seu perfil com a vaga', status: 'pending' },
    { id: 'analyzing_resume', label: 'Analisando requisitos técnicos', status: 'pending' },
    { id: 'comparing_job', label: 'Identificando pontos fortes', status: 'pending' },
    { id: 'generating_score', label: 'Encontrando possíveis gaps', status: 'pending' },
    { id: 'completed', label: 'Preparando recomendações', status: 'pending' }
  ]);

  const [showDelayWarning, setShowDelayWarning] = useState(false);
  const matchTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    } else if (selectedJobId) {
      tracker.track('job_match_viewed', 'CareerIntelligence', { jobId: selectedJobId });
    }
  }, [jobs, selectedJobId, setSelectedJobId]);

  useEffect(() => {
    if (isCalculating) {
      setShowDelayWarning(false);
      matchTimerRef.current = setTimeout(() => {
        setShowDelayWarning(true);
      }, 10000);
    } else {
      setShowDelayWarning(false);
      if (matchTimerRef.current) {
        clearTimeout(matchTimerRef.current);
        matchTimerRef.current = null;
      }
    }
    return () => {
      if (matchTimerRef.current) {
        clearTimeout(matchTimerRef.current);
      }
    };
  }, [isCalculating]);

  const prevResumeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentResumeId = primaryResume?.resumeVersionId || primaryResume?.id || null;
    if (prevResumeIdRef.current !== null && prevResumeIdRef.current !== currentResumeId) {
      // O currículo mudou! Limpar contexto
      if (propOnSelectJob) {
        propOnSelectJob(null);
      }
      
      // Limpar filtros/descoberta na sessionStorage
      sessionStorage.removeItem('job_search_keyword');
      sessionStorage.removeItem('job_search_location');
      sessionStorage.removeItem('job_search_remote');
      sessionStorage.removeItem('job_search_page');
      sessionStorage.removeItem('job_search_input_keyword');
      sessionStorage.removeItem('job_search_input_location');
      sessionStorage.removeItem('job_search_input_remote');
      
      // Obter preferências novas do perfil selecionado
      const newPref = (careerProfileNew?.personal as any)?.preferences || {};
      const newKeyword = newPref.targetRoles?.[0] || newPref.searchKeywords?.[0] || careerProfile?.searchKeywords?.[0] || (primaryResume as any)?.headline?.split('|')[0]?.trim() || primaryResume?.skills?.[0]?.name || '';
      const newLocation = newPref.preferredLocations?.[0] || careerProfile?.preferredLocations?.[0] || 'Brasil';
      const newRemote = true;

      // Resetar para as preferências do novo perfil
      setSearchKeyword(newKeyword);
      setSearchLocation(newLocation);
      setSearchRemoteOnly(newRemote);
      setSearchPage(1);
      setActiveFilters({
        keyword: newKeyword,
        location: newLocation,
        remoteOnly: newRemote,
        workModes: ['remote'],
        seniority: 'all'
      });
      setErrorMsg('');
      setAppError(null);
    }
    prevResumeIdRef.current = currentResumeId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryResume?.id, primaryResume?.resumeVersionId, careerProfileNew]);

  const [copiedSummary, setCopiedSummary] = useState(false);
  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  useEffect(() => {
    // Apenas seleciona a vaga se a aba não for explicitamente de descoberta de vagas
    if (propSelectedJobId && subTab !== 'discover') {
      setCoachTab('optimize-cv');
    }
  }, [propSelectedJobId, subTab]);

  // Keydown Escape hook calls are registered below to ensure all states are in scope

  const handleApplyClick = async (targetJob: any) => {
    if (!targetJob) return;

    const targetJobId = String(targetJob.id || targetJob.jobId || '');
    if (!isPro && !canUnlockJob(targetJobId)) {
      triggerPaywall('weekly_limit', 'Link de Candidatura Exclusivo Pro', 'Desbloqueie o acesso direto aos links oficiais de candidatura com o Plano Pro.');
      return;
    }

    // Normalizar a busca da URL da vaga em todas as variantes de propriedade
    const rawUrl = targetJob.sourceUrl || targetJob.source_url || targetJob.url || targetJob.external_url || targetJob.link;

    // 1. Abrir a URL externa da vaga real normalmente em nova aba se for válida
    if (rawUrl && isValidUrl(rawUrl)) {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
    } else if (targetJob.id || targetJob.jobId) {
      // 1b. Se for vaga interna sem link externo, navega para os detalhes da vaga específica no VoCentro
      const targetId = targetJob.id || targetJob.jobId;
      setSelectedJobId(targetId);
      setSubTab('my-jobs');
    }

    // 2. Adicionar simultaneamente a vaga no Kanban (applications) com status intermediário
    try {
      const existingApp = (applications || []).find(a => 
        String(a.jobId || a.job_id) === String(targetJob.id || targetJob.jobId) ||
        (rawUrl && a.sourcePlatform && String(a.sourcePlatform).includes(rawUrl))
      );

      if (!existingApp) {
        if (onCreateApplication) {
          await onCreateApplication({
            jobId: targetJob.id || targetJob.jobId,
            companyName: targetJob.companyName || 'Empresa',
            jobTitle: targetJob.title || targetJob.jobTitle,
            status: '🕐 Candidatura em andamento',
            sourcePlatform: rawUrl || targetJob.sourcePlatform || 'web',
            appliedAt: new Date().toISOString()
          });
          showToast('Vaga adicionada ao seu Pipeline (🕐 Candidatura em andamento)', 'info');
        }
      } else {
        const cleanSt = ApplicationPipelineService.getCleanStatus(existingApp.status);
        if (cleanSt === 'found' || cleanSt === 'saved') {
          if (onUpdateApplication) {
            await onUpdateApplication({
              ...existingApp,
              status: '🕐 Candidatura em andamento'
            });
            showToast('Status atualizado no Pipeline para 🕐 Candidatura em andamento', 'info');
          }
        }
      }
    } catch (err) {
      console.warn('[APPLY CLICK] Erro ao registrar no pipeline (navegação mantida):', err);
    }
  };

  useEffect(() => {
    if (!isCalculating || !userId || !selectedJobId || !isSupabaseConfigured || !supabase) {
      setMatchSteps([
        { id: 'preparing', label: 'Comparando seu perfil com a vaga', status: 'pending' },
        { id: 'analyzing_resume', label: 'Analisando requisitos técnicos', status: 'pending' },
        { id: 'comparing_job', label: 'Identificando pontos fortes', status: 'pending' },
        { id: 'generating_score', label: 'Encontrando possíveis gaps', status: 'pending' },
        { id: 'completed', label: 'Preparando recomendações', status: 'pending' }
      ]);
      return;
    }

    let isSubscribed = true;
    let timeoutId: any = null;
    const pollingStartTime = Date.now();

    const fetchMatchLogs = async () => {
      if (!isSubscribed) return;

      const elapsedSeconds = (Date.now() - pollingStartTime) / 1000;

      // Timeout de 5 minutos (300 segundos)
      if (elapsedSeconds >= 300) {
        setAppError(new AppError({
          code: 'AI_TIMEOUT',
          title: 'Tempo Excedido',
          message: 'Seu match está demorando mais que o esperado. Continuaremos processando em segundo plano. Você pode retornar depois.',
          severity: 'warning',
          retryable: false
        }));
        return;
      }

      const client = supabase;
      if (!client || !selectedJobId) return;

      try {
        const { data: logs, error } = await client
          .from('career_match_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('job_id', selectedJobId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (logs && isSubscribed) {
          const logPreparing = logs.find(l => l.step === 'preparing');
          const logAnalyzing = logs.find(l => l.step === 'analyzing_resume');
          const logComparing = logs.find(l => l.step === 'comparing_job');
          const logGenerating = logs.find(l => l.step === 'generating_score');
          const logCompleted = logs.find(l => l.step === 'completed' || l.status === 'success');
          const logFailed = logs.find(l => l.step === 'failed' || l.status === 'failed' || l.status === 'error');

          const steps = [
            { 
              id: 'preparing', 
              label: logPreparing?.status === 'completed' || logPreparing?.status === 'success' ? '✔ Comparando seu perfil com a vaga' : logPreparing?.status === 'running' ? 'Comparando seu perfil com a vaga...' : 'Comparando seu perfil com a vaga', 
              status: logPreparing?.status === 'completed' || logPreparing?.status === 'success' ? 'success' : logPreparing?.status === 'running' ? 'running' : 'pending' 
            },
            { 
              id: 'analyzing_resume', 
              label: logAnalyzing?.status === 'completed' || logAnalyzing?.status === 'success' ? '✔ Analisando requisitos técnicos' : logAnalyzing?.status === 'running' ? 'Analisando requisitos técnicos...' : 'Analisando requisitos técnicos', 
              status: logAnalyzing?.status === 'completed' || logAnalyzing?.status === 'success' ? 'success' : logAnalyzing?.status === 'running' ? 'running' : 'pending' 
            },
            { 
              id: 'comparing_job', 
              label: logComparing?.status === 'completed' || logComparing?.status === 'success' ? '✔ Identificando pontos fortes' : logComparing?.status === 'running' ? 'Identificando pontos fortes...' : 'Identificando pontos fortes', 
              status: logComparing?.status === 'completed' || logComparing?.status === 'success' ? 'success' : logComparing?.status === 'running' ? 'running' : 'pending' 
            },
            { 
              id: 'generating_score', 
              label: logGenerating?.status === 'completed' || logGenerating?.status === 'success' ? '✔ Encontrando possíveis gaps' : logGenerating?.status === 'running' ? 'Encontrando possíveis gaps...' : 'Encontrando possíveis gaps', 
              status: logGenerating?.status === 'completed' || logGenerating?.status === 'success' ? 'success' : logGenerating?.status === 'running' ? 'running' : 'pending' 
            },
            {
              id: 'completed',
              label: logCompleted || logGenerating?.status === 'completed' ? '✔ Preparando recomendações' : logComparing?.status === 'completed' ? 'Preparando recomendações...' : 'Preparando recomendações',
              status: logCompleted ? 'success' : logGenerating?.status === 'completed' ? 'running' : 'pending'
            }
          ];

          setMatchSteps(steps as any);

          if (logCompleted || logFailed || logs.some(l => l.step === 'completed' || l.step === 'failed')) {
            // Parar imediatamente se concluído ou falhado
            return;
          }
        }
      } catch (err) {
        console.error("Erro ao carregar logs do match:", err);
      }

      // Definir delay de polling adaptativo
      let delayMs = 2000;
      if (elapsedSeconds > 120) {
        delayMs = 10000;
      } else if (elapsedSeconds > 30) {
        delayMs = 5000;
      }

      timeoutId = setTimeout(fetchMatchLogs, delayMs);
    };

    fetchMatchLogs();

    return () => {
      isSubscribed = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isCalculating, userId, selectedJobId]);

  const handleDeleteAnalyses = async () => {
    const currentResume = (activeResumeVersionId ? resumes.find(r => r.resumeVersionId === activeResumeVersionId) : null) || resumes.find(r => r.isPrimary) || resumes[0];
    if (!userId || !currentResume) return;
    
    const confirm = window.confirm("Você irá remover todas as análises feitas pela IA deste currículo (Match da vaga, otimizações, STAR questions). O currículo físico continuará ativo. Deseja continuar?");
    if (!confirm) return;

    try {
      setIsDeletingAnalyses(true);
      
      if (isSupabaseConfigured && supabase) {
        // 1. Apagar matches associados
        const { error: matchesErr } = await supabase
          .from('matches')
          .delete()
          .eq('resume_id', currentResume.id);
        if (matchesErr) throw matchesErr;

        // 2. Apagar job_matches associados
        if (currentResume.resumeVersionId) {
          await supabase
            .from('job_matches')
            .delete()
            .eq('resume_version_id', currentResume.resumeVersionId);
        }

        // 3. Apagar resume_optimizations associados
        await supabase
          .from('resume_optimizations')
          .delete()
          .eq('resume_id', currentResume.id);

        // 4. Apagar cover_letters associadas
        if (currentResume.resumeVersionId) {
          const { data: apps } = await supabase
            .from('applications')
            .select('id')
            .eq('resume_version_id', currentResume.resumeVersionId);
          
          if (apps && apps.length > 0) {
            const appIds = apps.map(a => a.id);
            await supabase
              .from('cover_letters')
              .delete()
              .in('application_id', appIds);
          }
        }

        // 5. Apagar career_insights associados
        if (currentResume.resumeVersionId) {
          await supabase
            .from('career_insights')
            .delete()
            .eq('resume_version_id', currentResume.resumeVersionId);
        }

        // 6. Apagar ai_analysis_cache relacionado
        const activeProfileForHash = careerProfileNew || careerProfile;
        if (activeProfileForHash) {
          const textToHash = JSON.stringify(activeProfileForHash);
          const msgUint8 = new TextEncoder().encode(textToHash);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          
          await supabase
            .from('ai_analysis_cache')
            .delete()
            .eq('resume_hash', hashHex);
        }
      } else {
        // MODO LOCAL / MOCK
        // 1. Apagar matches locais
        try {
          const matchesRaw = localStorage.getItem('vocentro_matches');
          if (matchesRaw) {
            const list = JSON.parse(matchesRaw);
            const filtered = list.filter((m: any) => m.resumeId !== currentResume.id && m.resume_id !== currentResume.id);
            localStorage.setItem('vocentro_matches', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }

        // 2. Apagar otimizações locais
        try {
          const optRaw = localStorage.getItem('vocentro_resume_optimizations');
          if (optRaw) {
            const list = JSON.parse(optRaw);
            const filtered = list.filter((o: any) => o.resumeId !== currentResume.id && o.resume_id !== currentResume.id);
            localStorage.setItem('vocentro_resume_optimizations', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }

        // 3. Apagar cover letters locais
        try {
          const letterRaw = localStorage.getItem('vocentro_cover_letters_v2');
          if (letterRaw) {
            const list = JSON.parse(letterRaw);
            const filtered = list.filter((l: any) => l.resumeVersionId !== currentResume.resumeVersionId && l.resume_version_id !== currentResume.resumeVersionId);
            localStorage.setItem('vocentro_cover_letters_v2', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }

        // 4. Apagar prep locais
        try {
          const prepRaw = localStorage.getItem('vocentro_interview_preparations');
          if (prepRaw) {
            const list = JSON.parse(prepRaw);
            const filtered = list.filter((p: any) => p.resumeVersionId !== currentResume.resumeVersionId && p.resume_version_id !== currentResume.resumeVersionId);
            localStorage.setItem('vocentro_interview_preparations', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }
      }

      // ── APAGAR VAGAS IMPORTADAS DO USUÁRIO ──
      if (isSupabaseConfigured && supabase) {
        await supabase.from('jobs').delete().eq('user_id', userId);
      } else {
        try {
          const jobsRaw = localStorage.getItem('vocentro_jobs');
          if (jobsRaw) {
            const list = JSON.parse(jobsRaw);
            const filtered = list.filter((j: any) => j.userId !== userId && j.user_id !== userId);
            localStorage.setItem('vocentro_jobs', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }
      }

      // Invalida todos os caches no frontend para refletir a remoção imediatamente de forma reativa
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-details'] });
      queryClient.invalidateQueries({ queryKey: ['resume-optimization'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letter'] });
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      queryClient.invalidateQueries({ queryKey: ['career-insights'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['copilot'] });

      if (propOnSelectJob) {
        propOnSelectJob(null);
      }
      setSelectedJobId(null);

      setToast({ message: "Análises e vagas importadas apagadas com sucesso! Você pode recalcular o Match da vaga.", type: 'info' });
    } catch (err: any) {
      console.error("Erro ao apagar análises:", err);
      const formatted = AppError.from(err);
      setAppError(formatted);
      if (isSupabaseConfigured && supabase) {
        AppError.logError(err, supabase, 'JobMatchHub.handleDeleteAnalyses', userId);
      }
    } finally {
      setIsDeletingAnalyses(false);
    }
  };

  const handleDeleteSelectedAnalysis = async () => {
    if (!userId || !selectedJob || !currentMatch) return;

    const confirm = window.confirm(`Deseja realmente apagar a análise de Match da vaga e otimizações criadas especificamente para a vaga "${selectedJob.title}" em "${selectedJob.companyName}"? O currículo físico e a vaga permanecerão intactos.`);
    if (!confirm) return;

    try {
      setIsDeletingAnalyses(true);
      
      const matchResumeId = currentMatch.resumeId;

      if (isSupabaseConfigured && supabase) {
        // 1. Apagar matches associados para esta vaga
        const { error: matchesErr } = await supabase
          .from('matches')
          .delete()
          .eq('id', currentMatch.id);
        if (matchesErr) throw matchesErr;

        // 2. Apagar job_matches associados para esta vaga
        const { error: jmErr } = await supabase
          .from('job_matches')
          .delete()
          .eq('job_id', selectedJob.id);
        if (jmErr) {
          console.warn('[DELETE ANALYSIS] Falha ao deletar job_matches (pode não existir):', jmErr);
        }

        // 3. Apagar resume_optimizations associados para esta vaga
        const { error: optErr } = await supabase
          .from('resume_optimizations')
          .delete()
          .eq('resume_id', matchResumeId)
          .eq('job_id', selectedJob.id);
        if (optErr) throw optErr;

        // 4. Apagar cover_letters e candidaturas automáticas associadas para esta vaga
        const { data: apps } = await supabase
          .from('applications')
          .select('id, status')
          .eq('user_id', userId)
          .eq('job_id', selectedJob.id);
        
        if (apps && apps.length > 0) {
          const appIds = apps.map(a => a.id);
          await supabase
            .from('cover_letters')
            .delete()
            .in('application_id', appIds);

          // Remover candidaturas geradas exclusivamente pela análise do match
          const autoApps = apps.filter((a: any) => a.status === '🎯 Alta Prioridade' || a.status === '🔎 Encontrada' || a.status === 'found');
          if (autoApps.length > 0) {
            await supabase
              .from('applications')
              .delete()
              .in('id', autoApps.map(a => a.id));
          }
        }

        // 5. Apagar cache específico da IA
        let resumeHash = '';
        if (careerProfileNew) {
          const textToHash = JSON.stringify(careerProfileNew);
          const msgUint8 = new TextEncoder().encode(textToHash);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          resumeHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        } else if (careerProfile) {
          const textToHash = JSON.stringify(careerProfile);
          const msgUint8 = new TextEncoder().encode(textToHash);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          resumeHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        }

        let jobHash = '';
        if (selectedJob) {
          const textToHash = JSON.stringify(selectedJob);
          const msgUint8 = new TextEncoder().encode(textToHash);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          jobHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        }

        if (resumeHash && jobHash) {
          await supabase
            .from('ai_analysis_cache')
            .delete()
            .eq('resume_hash', resumeHash)
            .eq('job_hash', jobHash);
        }
      } else {
        // MODO LOCAL / MOCK
        const mockApp = applications.find((a: any) => String(a.jobId) === String(selectedJob.id));
        const mockAppId = mockApp?.id || 'mock-app-id';

        try {
          const matchesRaw = localStorage.getItem('vocentro_matches');
          if (matchesRaw) {
            const list = JSON.parse(matchesRaw);
            const filtered = list.filter((m: any) => !(String(m.jobId) === String(selectedJob.id) && (String(m.resumeId || m.resume_id) === String(matchResumeId))));
            localStorage.setItem('vocentro_matches', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }

        try {
          const optRaw = localStorage.getItem('vocentro_resume_optimizations');
          if (optRaw) {
            const list = JSON.parse(optRaw);
            const filtered = list.filter((o: any) => !(String(o.jobId) === String(selectedJob.id) && (String(o.resumeId || o.resume_id) === String(matchResumeId))));
            localStorage.setItem('vocentro_resume_optimizations', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }

        try {
          const letterRaw = localStorage.getItem('vocentro_cover_letters_v2');
          if (letterRaw) {
            const list = JSON.parse(letterRaw);
            const filtered = list.filter((l: any) => !(String(l.applicationId || l.application_id) === String(mockAppId)));
            localStorage.setItem('vocentro_cover_letters_v2', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }

        try {
          const prepRaw = localStorage.getItem('vocentro_interview_preparations');
          if (prepRaw) {
            const list = JSON.parse(prepRaw);
            const filtered = list.filter((p: any) => !(String(p.jobId) === String(selectedJob.id)));
            localStorage.setItem('vocentro_interview_preparations', JSON.stringify(filtered));
          }
        } catch (e) { console.error(e); }
      }

      // Invalida os caches do React Query e limpa a vaga selecionada
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-details'] });
      queryClient.invalidateQueries({ queryKey: ['resume-optimization'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letter'] });
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['copilot'] });

      if (propOnSelectJob) {
        propOnSelectJob(null);
      }
      setSelectedJobId(null);

      setToast({ message: "Análise desta vaga excluída com sucesso! Você pode recalcular o Match da vaga quando desejar.", type: 'info' });
    } catch (err: any) {
      console.error("Erro ao apagar análise selecionada:", err);
      const formatted = AppError.from(err);
      setAppError(formatted);
      if (isSupabaseConfigured && supabase) {
        AppError.logError(err, supabase, 'JobMatchHub.handleDeleteSelectedAnalysis', userId);
      }
    } finally {
      setIsDeletingAnalyses(false);
    }
  };

  const { 
    getResumeOptimizationQuery, 
    generateResumeOptimization,
    isGeneratingOptimization,
    getCoverLetterQuery, 
    generateCoverLetter, 
    isGeneratingLetter, 
    useInterviewPrepQuery,
    generateInterviewPrep,
    isGeneratingPrep
  } = useCoach(userId);

  const handleGenerateOptimization = async () => {
    if (!primaryResume || !selectedJob) return;
    try {
      await generateResumeOptimization({
        resumeId: primaryResume.id,
        resumeVersionId: primaryResume.resumeVersionId || primaryResume.id,
        jobId: selectedJob.id
      });
      setToast({ message: 'Currículo otimizado com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Erro ao gerar otimização: ' + (err.message || err), type: 'error' });
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!primaryResume || !selectedJob) return;
    try {
      // 1. Verificar se já existe uma candidatura real para este job
      let activeApp = applications.find((app: any) => app.jobId === selectedJob.id);
      
      // 2. Se não existir, criar uma automaticamente com status 'found'
      if (!activeApp && onCreateApplication) {
        activeApp = await onCreateApplication({
          jobId: selectedJob.id,
          companyName: selectedJob.companyName,
          jobTitle: selectedJob.title,
          status: 'found',
          resumeVersionId: primaryResume.resumeVersionId || undefined
        });
      }

      const appId = activeApp?.id || mockAppId || `mock-app-${Date.now()}`;

      await generateCoverLetter({
        resumeId: primaryResume.id,
        resumeVersionId: primaryResume.resumeVersionId || primaryResume.id,
        jobId: selectedJob.id,
        applicationId: appId
      });
      setToast({ message: 'Cartas de apresentação geradas com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Erro ao gerar cartas: ' + (err.message || err), type: 'error' });
    }
  };

  const handleGenerateInterviewPrep = async () => {
    if (!primaryResume || !selectedJob) return;
    try {
      await generateInterviewPrep({
        resumeId: primaryResume.id,
        resumeVersionId: primaryResume.resumeVersionId || primaryResume.id,
        jobId: selectedJob.id
      });
      setToast({ message: 'Roteiro STAR gerado com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Erro ao gerar roteiro STAR: ' + (err.message || err), type: 'error' });
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  
  // States para colagem manual de vaga
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // States para Job Ingestion Engine
  const [ingestionTab, setIngestionTab] = useState<'text' | 'url' | 'pdf' | 'greenhouse'>('text');
  const [ingestionUrl, setIngestionUrl] = useState('');
  const [ingestionFile, setIngestionFile] = useState<File | null>(null);
  const [greenhouseUrl, setGreenhouseUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState<'idle' | 'preparing' | 'extracting' | 'normalizing' | 'completed' | 'error'>('idle');
  const [ingestionStepText, setIngestionStepText] = useState('');
  const [restrictedPlatformMsg, setRestrictedPlatformMsg] = useState(false);
  
  // Preview / Editor States
  const [previewData, setPreviewData] = useState<IngestionResult | null>(null);

  const resetIngestionStates = () => {
    setTitle('');
    setCompanyName('');
    setDescription('');
    setRequirementsInput('');
    setIngestionUrl('');
    setIngestionFile(null);
    setGreenhouseUrl('');
    setIsIngesting(false);
    setIngestionStep('idle');
    setIngestionStepText('');
    setRestrictedPlatformMsg(false);
    setPreviewData(null);
    setErrorMsg('');
  };

  useEscapeToClose(showAddForm, () => {
    resetIngestionStates();
    setShowAddForm(false);
  });
  useEscapeToClose(showAdaptationModal, () => setShowAdaptationModal(false));
  useEscapeToClose(rejectReasonModal, () => setRejectReasonModal(false));
  useEscapeToClose(matchRejectionModal, () => setMatchRejectionModal(false));
  useEscapeToClose(!!selectedJobId, () => setSelectedJobId(null));

  // States para a descoberta de vagas baseada no Career Profile ou fallback
  const pref = (careerProfileNew?.personal as any)?.preferences || {};
  const initialKeyword = sessionStorage.getItem('job_search_keyword') || pref.searchKeywords?.[0] || pref.targetRoles?.[0] || careerProfile?.searchKeywords?.[0] || primaryResume?.skills?.[0]?.name || '';

  const initialLocation = sessionStorage.getItem('job_search_location') || pref.preferredLocations?.[0] || careerProfile?.preferredLocations?.[0] || 'Brasil';
  
  const storedRemote = sessionStorage.getItem('job_search_remote');
  const initialRemote = storedRemote !== null ? storedRemote === 'true' : (pref.preferredWorkModes ? pref.preferredWorkModes.includes('remote') : (careerProfile ? careerProfile.preferredWorkModes.includes('remote') : true));

  const initialInputKeyword = sessionStorage.getItem('job_search_input_keyword') || initialKeyword;
  const initialInputLocation = sessionStorage.getItem('job_search_input_location') || initialLocation;
  const storedInputRemote = sessionStorage.getItem('job_search_input_remote');
  const initialInputRemote = storedInputRemote !== null ? storedInputRemote === 'true' : initialRemote;

  const storedPage = sessionStorage.getItem('job_search_page');
  const initialPage = storedPage !== null ? Number(storedPage) : 1;

  const [searchKeyword, setSearchKeyword] = useState(initialInputKeyword);
  const [searchLocation, setSearchLocation] = useState(initialInputLocation);
  const [searchRemoteOnly, setSearchRemoteOnly] = useState(initialInputRemote);
  const [searchPage, setSearchPage] = useState(initialPage);

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const storedWorkModes = sessionStorage.getItem('job_search_work_modes');
  const initialWorkModes = storedWorkModes ? JSON.parse(storedWorkModes) : ['remote', 'hybrid', 'onsite'];
  const [searchSeniority, setSearchSeniority] = useState<string>('all');
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);
  const [filterScoreOver80, setFilterScoreOver80] = useState<boolean>(false);
  const [searchWorkModes, setSearchWorkModes] = useState<string[]>(initialWorkModes);
  
  const [activeFilters, setActiveFilters] = useState({
    keyword: initialKeyword,
    location: initialLocation,
    remoteOnly: initialRemote,
    workModes: initialWorkModes as string[],
    seniority: 'all'
  });

  // Salvar entradas do usuário e filtros ativos na sessionStorage para manter o estado ao navegar
  useEffect(() => {
    sessionStorage.setItem('job_search_keyword', activeFilters.keyword);
    sessionStorage.setItem('job_search_location', activeFilters.location);
    sessionStorage.setItem('job_search_remote', String(activeFilters.remoteOnly));
    sessionStorage.setItem('job_search_work_modes', JSON.stringify(activeFilters.workModes));
    sessionStorage.setItem('job_search_page', String(searchPage));
  }, [activeFilters, searchPage]);

  useEffect(() => {
    sessionStorage.setItem('job_search_input_keyword', searchKeyword);
  }, [searchKeyword]);

  useEffect(() => {
    sessionStorage.setItem('job_search_input_location', searchLocation);
  }, [searchLocation]);

  useEffect(() => {
    sessionStorage.setItem('job_search_input_remote', String(searchRemoteOnly));
  }, [searchRemoteOnly]);

  useEffect(() => {
    sessionStorage.setItem('job_search_input_work_modes', JSON.stringify(searchWorkModes));
  }, [searchWorkModes]);

  // Gatilho de redirecionamento automático do Dashboard
  useEffect(() => {
    const trigger = localStorage.getItem('vocentro_trigger_discovery');
    const activeProf = careerProfileNew || careerProfile;
    if (trigger === 'true' && activeProf) {
      localStorage.removeItem('vocentro_trigger_discovery');
      setSubTab('discover');
      
      const preferences = (careerProfileNew?.personal as any)?.preferences || {};
      const keyword = preferences.targetRoles?.[0] || preferences.searchKeywords?.[0] || (careerProfile as any)?.targetRoles?.[0] || (careerProfile as any)?.searchKeywords?.[0] || (primaryResume as any)?.headline?.split('|')[0]?.trim() || '';
      const loc = preferences.preferredLocations?.[0] || (careerProfile as any)?.preferredLocations?.[0] || 'Brasil';
      const isRemote = preferences.preferredWorkModes ? preferences.preferredWorkModes.includes('remote') : ((careerProfile as any)?.preferredWorkModes?.includes('remote') ?? true);
      const preferredModes = preferences.preferredWorkModes || (careerProfile as any)?.preferredWorkModes || ['remote'];
      
      setSearchKeyword(keyword);
      setSearchLocation(loc);
      setSearchRemoteOnly(isRemote);
      setSearchWorkModes(preferredModes);
      
      setActiveFilters({
        keyword,
        location: loc,
        remoteOnly: isRemote,
        workModes: preferredModes,
        seniority: 'all'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerProfile, careerProfileNew]);

  // Sincronizar e resetar palavras-chave de busca quando o currículo ativo for alterado/carregado
  useEffect(() => {
    const activeProf = careerProfileNew || careerProfile;
    if (activeProf) {
      const preferences = (careerProfileNew?.personal as any)?.preferences || {};
      const targetRolesList = preferences.targetRoles || (careerProfile as any)?.targetRoles || [];

      // Regra de Negócio Item 8: Priorizar cargo mais recente da experiência em relação ao headline consolidado
      const latestExpRole = careerProfileNew?.experience?.[0]?.role || (careerProfile as any)?.experience?.[0]?.role;
      const primaryKeyword = latestExpRole || targetRolesList[0] || preferences.searchKeywords?.[0] || (careerProfile as any)?.searchKeywords?.[0] || (primaryResume as any)?.headline?.split('|')[0]?.trim() || '';
      
      const defaultLoc = preferences.preferredLocations?.[0] || (careerProfile as any)?.preferredLocations?.[0] || 'Brasil';
      const defaultRemote = preferences.preferredWorkModes ? preferences.preferredWorkModes.includes('remote') : ((careerProfile as any)?.preferredWorkModes?.includes('remote') ?? true);
      const preferredModes = preferences.preferredWorkModes || (careerProfile as any)?.preferredWorkModes || ['remote'];

      setSearchKeyword(primaryKeyword);
      setSearchLocation(defaultLoc);
      setSearchRemoteOnly(defaultRemote);
      setSearchWorkModes(preferredModes);

      setActiveFilters({
        keyword: primaryKeyword,
        location: defaultLoc,
        remoteOnly: defaultRemote,
        workModes: preferredModes,
        seniority: 'all'
      });
    } else {
      setSearchKeyword('');
      setActiveFilters(prev => ({
        ...prev,
        keyword: ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryResume?.id, activeResumeVersionId, careerProfileNew]);

  const { data: optimization = null, isLoading: isLoadingOpt } = getResumeOptimizationQuery(primaryResume || null, selectedJob || null);
  const { data: prep = null, isLoading: isLoadingPrep } = useInterviewPrepQuery(primaryResume || null, selectedJob || null);
  const mockAppId = selectedJob ? `app-mock-${selectedJob.id}` : undefined;
  const realApp = selectedJob ? applications.find((app: any) => app.jobId === selectedJob.id) : null;
  const { data: coverLetter = null } = getCoverLetterQuery(realApp?.id || mockAppId);
  const currentMatch = selectedJob ? matches.find(m => m.jobId === selectedJob.id) : null;
  const { data: matchDetails } = getMatchDetails(currentMatch?.id || '');

  const handleAddToStrategy = async () => {
    if (!selectedJob || !userId || !onCreateApplication) return;
    try {
      setIsAddingToStrategy(true);
      
      // Determine Kanban column based on match score or manual selection
      let matchScore = currentMatch?.scoreOverall;
      if (matchScore === undefined && primaryResume) {
        const syncMatch = MatchingEngine.calculateMatchSync(primaryResume, selectedJob, careerProfileNew);
        matchScore = syncMatch.scoreOverall;
      }
      matchScore = matchScore ?? 0;

      let status = '📝 Candidatura planejada';
      if (manualStrategyStatus !== 'auto') {
        status = manualStrategyStatus;
      } else {
        if (matchScore >= 80) {
          status = '🎯 Alta Prioridade';
        } else if (matchScore >= 50) {
          status = '📝 Candidatura planejada';
        } else if (matchScore >= 20) {
          status = '🔧 Ajustar antes';
        } else {
          status = '⚠️ Match baixo com a vaga';
        }
      }
      
      await onCreateApplication({
        jobId: selectedJob.id,
        companyName: selectedJob.companyName || 'Empresa Confidencial',
        jobTitle: selectedJob.title,
        status,
        resumeVersionId: primaryResume?.resumeVersionId
      });
      setToast({ message: 'Vaga adicionada ao Pipeline! Redirecionando para a Jornada.', type: 'success' });
      
      // Redirect to strategy tab
      if (setActiveTab) {
        setActiveTab('strategy');
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Erro ao adicionar vaga à estratégia.', type: 'error' });
    } finally {
      setIsAddingToStrategy(false);
    }
  };

  // Hook do módulo de Job Discovery — passa searchPage e careerProfileNew
  const { 
    discoveredJobs, 
    totalCount,
    fallbackLevel,
    fallbackTermUsed,
    isLoading: isLoadingDiscovery, 
    isError: isErrorDiscovery,
    error: errorDiscovery,
    importJob, 
    isImporting 
  } = useJobDiscovery(userId, {
    keyword: activeFilters.keyword,
    location: activeFilters.location,
    remoteOnly: activeFilters.remoteOnly,
    workModes: activeFilters.workModes,
    seniority: activeFilters.seniority,
    page: searchPage
  }, careerProfileNew);

  const handleIngestManual = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title || !description) {
      setErrorMsg('Título e descrição da vaga são obrigatórios.');
      return;
    }

    try {
      const result = await jobIngestionService.ingestText({
        title,
        companyName,
        description,
        requirementsInput
      });
      setPreviewData(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar a vaga.');
    }
  };

  const handleIngestUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!ingestionUrl.trim()) return;

    setIsIngesting(true);
    setIngestionStep('preparing');
    setIngestionStepText('Analisando link da vaga...');
    setRestrictedPlatformMsg(false);

    try {
      setIngestionStep('extracting');
      setIngestionStepText('Limpando HTML (removendo scripts, menus e rodapés)...');
      
      const result = await jobIngestionService.ingestUrl(ingestionUrl.trim());
      
      setIngestionStep('normalizing');
      setIngestionStepText('Extraindo requisitos e qualificações com IA...');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setPreviewData(result);
      setIngestionStep('completed');
    } catch (err: any) {
      if (err.message === 'RESTRICTED_PLATFORM') {
        setRestrictedPlatformMsg(true);
        setIngestionStep('idle');
      } else {
        setIngestionStep('error');
        setIngestionStepText(err.message || 'Erro ao processar o link.');
      }
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestPdf = async (e: FormEvent) => {
    e.preventDefault();
    if (!ingestionFile) return;

    setIsIngesting(true);
    setIngestionStep('preparing');
    setIngestionStepText('Enviando documento PDF...');

    try {
      setIngestionStep('extracting');
      setIngestionStepText('Executando extração de texto (e OCR se necessário)...');

      const result = await jobIngestionService.ingestPdf(ingestionFile);

      setIngestionStep('normalizing');
      setIngestionStepText('Estruturando descrição, competências e benefícios com IA...');

      await new Promise(resolve => setTimeout(resolve, 800));

      setPreviewData(result);
      setIngestionStep('completed');
    } catch (err: any) {
      setIngestionStep('error');
      setIngestionStepText(err.message || 'Erro ao analisar o PDF.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestGreenhouse = async (e: FormEvent) => {
    e.preventDefault();
    if (!greenhouseUrl.trim()) return;

    setIsIngesting(true);
    setIngestionStep('preparing');
    setIngestionStepText('Conectando à API do Greenhouse...');

    try {
      setIngestionStep('extracting');
      setIngestionStepText('Buscando payload estruturado da vaga...');

      const result = await jobIngestionService.ingestUrl(greenhouseUrl.trim());

      setIngestionStep('normalizing');
      setIngestionStepText('Normalizando tipos de vaga e localização...');

      await new Promise(resolve => setTimeout(resolve, 800));

      setPreviewData(result);
      setIngestionStep('completed');
    } catch (err: any) {
      setIngestionStep('error');
      setIngestionStepText(err.message || 'Erro ao carregar dados do Greenhouse.');
    } finally {
      setIsIngesting(false);
    }
  };

  const [isSubmittingNewJob, setIsSubmittingNewJob] = useState(false);

  const handleConfirmSaveIngestedJob = async () => {
    if (!previewData || isSubmittingNewJob || isCreating) return;

    try {
      setIsSubmittingNewJob(true);
      // Garantir requisitos mínimos
      let reqs = previewData.requirements;
      if (!reqs || reqs.length === 0) {
        reqs = ['Geral'];
      }

      const newJob = await onCreateJob({
        title: previewData.title,
        companyName: previewData.companyName,
        description: previewData.description,
        requirements: reqs,
        location: previewData.location,
        workMode: previewData.workMode,
        seniority: previewData.seniority,
        salary: previewData.salary,
        salaryNumeric: previewData.salaryNumeric,
        benefits: previewData.benefits,
        sourceUrl: previewData.sourceUrl,
        sourcePlatform: previewData.sourcePlatform
      });

      if (newJob && newJob.id) {
        setSelectedJobId(newJob.id);
        resetIngestionStates();
        setShowAddForm(false);
        // Disparar o match da vaga adicionada automaticamente para agilizar o fluxo do usuário
        handleTriggerMatch(newJob);
      } else {
        throw new Error('Não foi possível obter o ID da vaga criada.');
      }
    } catch (err: any) {
      const formatted = AppError.from(err);
      setAppError(formatted);
      AppError.logError(err, supabase, 'JobMatchHub.handleConfirmSaveIngestedJob', userId);
    } finally {
      setIsSubmittingNewJob(false);
    }
  };

  const handleTriggerMatch = async (targetJob?: Job) => {
    const activeJob = targetJob || selectedJob;
    if (!primaryResume) {
      setErrorMsg('Por favor, faça o upload de um currículo antes de calcular o Match.');
      return;
    }
    if (!activeJob) return;

    let jobToMatch: Job = activeJob;
    setAnalyzingJobId(String(jobToMatch.id));
    setErrorMsg('');
    setAppError(null);
    try {
      // Se a vaga for da Descoberta (ID sintético agg_... ou não salva no banco), salva a vaga primeiro
      if (jobToMatch.id && (String(jobToMatch.id).startsWith('agg_') || !jobs.some(j => j.id === jobToMatch?.id))) {
        try {
          const imported = await importJob(jobToMatch);
          if (imported && imported.id) {
            jobToMatch = imported as any;
            setSelectedJobId(imported.id);
            setAnalyzingJobId(String(imported.id));
          }
        } catch (e) {
          console.warn('[handleTriggerMatch] Falha ao importar vaga da descoberta:', e);
        }
      }

      const matchResult = await onCalculateMatch({
        resume: primaryResume,
        job: jobToMatch,
        consolidatedProfile: careerProfileNew
      });

      const score = matchResult?.score_overall ?? matchResult?.scoreOverall ?? 0;
      
      // Atualização Otimista Imediata do Cache de Matches no React Query (0ms delay no refletimento)
      if (matchResult) {
        queryClient.setQueryData<Match[]>(['matches', userId], old => {
          const list = old || [];
          const existingIdx = list.findIndex(m => String(m.jobId) === String(jobToMatch.id));
          const newMatchObj: Match = {
            id: matchResult.id || `match-${jobToMatch.id}`,
            userId: userId || '',
            resumeId: primaryResume.id,
            jobId: jobToMatch.id,
            jobTitle: jobToMatch.title,
            companyName: jobToMatch.companyName || '',
            scoreOverall: score,
            scoreTechnical: matchResult.scoreTechnical ?? matchResult.score_technical ?? score,
            scoreBehavioral: matchResult.scoreBehavioral ?? matchResult.score_behavioral ?? score,
            scoreSeniority: matchResult.scoreSeniority ?? matchResult.score_seniority ?? score,
            scoreLocation: 100,
            explanation: matchResult.explanation || '',
            createdAt: matchResult.created_at || new Date().toISOString()
          };
          if (existingIdx >= 0) {
            const updated = [...list];
            updated[existingIdx] = newMatchObj;
            return updated;
          }
          return [newMatchObj, ...list];
        });
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }

      // Inserção Idempotente: Se a vaga ainda não estiver no Pipeline, insere com status 'found'
      if (onCreateApplication) {
        const existingApp = applications.find((app: any) => String(app.jobId) === String(jobToMatch.id));
        if (!existingApp) {
          await onCreateApplication({
            jobId: jobToMatch.id,
            companyName: jobToMatch.companyName || 'Vaga Selecionada',
            jobTitle: jobToMatch.title,
            status: 'found',
            notes: `Calculado Match de ${score}%.`,
            resumeVersionId: activeResumeVersionId || primaryResume?.resumeVersionId
          });
        }
      }

      tracker.track('match_calculated', 'JobMatchHub', { 
        jobId: jobToMatch.id, 
        score,
        user_id: userId 
      });
    } catch (err: any) {
      const formatted = AppError.from(err);
      setAppError(formatted);
      setErrorMsg(err.message || '⚠️ Não foi possível calcular o Match da vaga. Tente novamente.');
      AppError.logError(err, supabase, 'JobMatchHub.handleTriggerMatch', userId);
    } finally {
      setAnalyzingJobId(null);
    }
  };

  const handleSearchDiscovery = (e: FormEvent) => {
    e.preventDefault();
    setSearchPage(1);
    setActiveFilters({
      keyword: searchKeyword,
      location: searchLocation,
      remoteOnly: searchWorkModes.includes('remote') && searchWorkModes.length === 1,
      workModes: searchWorkModes,
      seniority: searchSeniority
    });
  };

  const handleImportAndMatch = async (discJob: any) => {
    const initialJobId = String(discJob.id || discJob.jobId || 'temp_disc');
    if (!isPro && !canUnlockJob(initialJobId)) {
      triggerPaywall('weekly_limit', 'Limite Semanal Atingido', 'Usuários no plano gratuito possuem cota semanal de análises de match.');
      return;
    }

    setAnalyzingJobId(initialJobId);
    try {
      if (!isPro) {
        await unlockJob(initialJobId);
      }

      // Importa a vaga para a lista do usuário
      const imported = await importJob(discJob);
      setSelectedJobId(imported.id);
      setSubTab('my-jobs');
      setAnalyzingJobId(String(imported.id));
      
      // Executa o match automaticamente
      await handleTriggerMatch(imported as any);
    } catch (err: any) {
      const formatted = AppError.from(err);
      setAppError(formatted);
      AppError.logError(err, supabase, 'JobMatchHub.handleImportAndMatch', userId);
    } finally {
      setAnalyzingJobId(null);
    }
  };

  const handleSimulateDiscovery = async (discJob: any) => {
    const initialJobId = String(discJob.id || discJob.jobId || 'temp_disc');
    if (!isPro && !canUnlockJob(initialJobId)) {
      triggerPaywall('weekly_limit', 'Limite Semanal Atingido', 'Simulações de entrevista exigem plano Pro ou cota disponível.');
      return;
    }

    try {
      if (!isPro) {
        await unlockJob(initialJobId);
      }
      const imported = await importJob(discJob);
      setSelectedJobId(imported.id);
      setSubTab('my-jobs');
      await handleTriggerMatch(imported as any);
      if (onStartSimulation) {
        onStartSimulation(imported as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate quick stats
  const avgOverallMatch = jobs.length > 0 && matches.length > 0
    ? Math.round(matches.reduce((acc, m) => acc + m.scoreOverall, 0) / matches.length)
    : 0;

  // ── UNIFIED MATCH SCORE (SINGLE SOURCE OF TRUTH FOR SELECTED JOB) ──
  const currentSelectedMatch = selectedJob ? matches.find(m => m.jobId === selectedJob.id) : null;
  const unifiedJobMatchScore = selectedJob
    ? (currentSelectedMatch?.scoreOverall ?? explanation?.careerFitScore ?? (selectedJob?.scores as any)?.overall ?? null)
    : null;

  // ── Cálculo Escalável e Robusto do Salário Médio ──
  const targetJobsForSalary = (subTab === 'discover' && discoveredJobs.length > 0) ? discoveredJobs : (discoveredJobs.length > 0 ? discoveredJobs : jobs);
  const rawSalaries: number[] = [];

  targetJobsForSalary.forEach(j => {
    let min = j.salaryMin || 0;
    let max = j.salaryMax || 0;
    let numeric = j.salaryNumeric || 0;

    // Normalização Anual -> Mensal (Valores > 15.000 vindos de APIs como Adzuna são remunerações anuais)
    if (min > 15000) min = Math.round(min / 12);
    if (max > 15000) max = Math.round(max / 12);
    if (numeric > 15000) numeric = Math.round(numeric / 12);

    const mid = min && max ? (min + max) / 2 : (numeric || max || min || 0);
    if (mid > 0) rawSalaries.push(mid);
  });

  // Filtro Estatístico de Outliers Extremos (IQR / Median Trimmed Mean)
  let averageSalary = 0;
  if (rawSalaries.length > 0) {
    const sorted = [...rawSalaries].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Manter valores dentro de 0.3x e 2.5x a mediana da busca
    const validSalaries = sorted.filter(s => s >= median * 0.3 && s <= median * 2.5);
    const pool = validSalaries.length > 0 ? validSalaries : sorted;
    averageSalary = Math.round(pool.reduce((a, b) => a + b, 0) / pool.length);
  }

  // Fallback Inteligente de Segurança por Categoria/Senioridade caso os dados externos não contenham salários
  if (searchKeyword && /estágio|estagio|estagiár|estagiario|internship|bolsa/i.test(searchKeyword)) {
    if (averageSalary === 0 || averageSalary > 3500) {
      averageSalary = 1500;
    }
  } else if (averageSalary === 0 && searchKeyword) {
    const key = searchKeyword.toLowerCase();
    if (key.includes('estágio') || key.includes('estagio') || key.includes('estagiár') || key.includes('intern')) {
      averageSalary = 1500;
    } else if (key.includes('cozinheir') || key.includes('auxiliar') || key.includes('atendente') || key.includes('operador') || key.includes('limpeza') || key.includes('portari')) {
      averageSalary = 2450;
    } else if (key.includes('analista') || key.includes('especialista') || key.includes('desenvolv') || key.includes('designer')) {
      averageSalary = 6500;
    } else if (key.includes('gerente') || key.includes('supervisor') || key.includes('coordenador') || key.includes('head') || key.includes('lead')) {
      averageSalary = 12500;
    } else {
      averageSalary = 3800;
    }
  }



  const uniqueCompaniesCount = new Set(jobs.map(j => j.companyName)).size;

  return (
    <div className="space-y-6 animate-fade-in font-sans p-0">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Mapeamento de Vagas & Match
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Encontre vagas compatíveis via buscas inteligentes ou analise descrições de cargos de forma personalizada.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 items-center">
          {primaryResume && (
            <button
              onClick={handleDeleteAnalyses}
              disabled={isDeletingAnalyses}
              className="btn-secondary text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center justify-center gap-2 leading-none cursor-pointer"
              title="Excluir todas as análises feitas pela IA deste currículo"
            >
              {isDeletingAnalyses ? (
                <Loader2 size={15} className="animate-spin shrink-0" />
              ) : (
                <Trash2 size={15} className="shrink-0" />
              )}
              <span>Excluir minhas análises</span>
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-xs inline-flex items-center justify-center gap-2 leading-none cursor-pointer"
          >
            <Plus size={15} className="shrink-0" />
            <span>Analisar Nova Vaga</span>
          </button>
        </div>
      </div>

      {/* Top AI Guidance Banner */}
      <div className="bg-white dark:bg-[#162032] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#4F8EF7] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#4F8EF7] uppercase tracking-wider">Recomendação da IA</span>
              <Badge variant="premium" size="sm">Gemini Matching</Badge>
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
              {discoveredJobs.length > 0 
                ? `Identificamos ${discoveredJobs.length} vaga(s) ativas com alto potencial para seu perfil.` 
                : matches.length > 0
                ? `Você possui ${matches.length} vaga(s) analisada(s) em seu histórico.`
                : 'Insira palavras-chave ou cole o link de uma vaga para analisar o Match da vaga com a IA.'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              O copiloto calcula o Match da vaga e lacunas técnicas comparando com seu currículo selecionado.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setSubTab('discover'); setSelectedJobId(null); }}
          className="btn-secondary text-xs shrink-0 self-start md:self-center"
        >
          <span>Explorar Vagas</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Vagas Analisadas</span>
            <Briefcase size={16} className="text-primary" />
          </div>
          <p className="text-xl font-bold text-on-surface">{jobs.length}</p>
        </div>
        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              {selectedJob ? "Match da Vaga Selecionada" : "Match da vaga (Média)"}
            </span>
            <Heart size={16} className="text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-on-surface">
            {selectedJob 
              ? (unifiedJobMatchScore !== null ? `${unifiedJobMatchScore}%` : '--')
              : (avgOverallMatch > 0 ? `${avgOverallMatch}%` : '--')}
          </p>
        </div>
        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Salário Médio</span>
            <DollarSign size={16} className="text-amber-400" />
          </div>
          <p className="text-xl font-bold text-on-surface">{averageSalary > 0 ? `R$ ${(averageSalary / 1000).toFixed(0)}k` : '--'}</p>
        </div>
        <div className="premium-card rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Empresas</span>
            <Building size={16} className="text-secondary" />
          </div>
          <p className="text-xl font-bold text-on-surface">{uniqueCompaniesCount}</p>
        </div>
      </div>

      {/* Sub Tabs switcher */}
      <div className="flex border-b border-slate-800 dark:border-slate-800 light:border-slate-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setSubTab('discover')}
          className={`pb-3 font-semibold text-sm transition-all relative shrink-0 ${
            subTab === 'discover'
              ? 'text-brand-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {subTab === 'discover' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
          Descoberta de Vagas
        </button>
        <button
          onClick={() => setSubTab('my-jobs')}
          className={`pb-3 font-semibold text-sm transition-all relative shrink-0 ${
            subTab === 'my-jobs'
              ? 'text-brand-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {subTab === 'my-jobs' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
          Minhas Análises
        </button>
        <button
          onClick={() => setSubTab('trash')}
          className={`pb-3 font-semibold text-sm transition-all relative shrink-0 flex items-center gap-1.5 ${
            subTab === 'trash'
              ? 'text-red-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {subTab === 'trash' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500" />}
          <span>🗑️ Lixeira de Vagas</span>
          {trashedJobs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
              {trashedJobs.length}
            </span>
          )}
        </button>
      </div>

      {appError ? (
        <ErrorState
          error={appError}
          onRetry={() => {
            setAppError(null);
            setErrorMsg('');
            if (subTab === 'discover') {
              setActiveFilters(prev => ({ ...prev }));
            } else {
              handleTriggerMatch();
            }
          }}
          onAction={() => {
            setAppError(null);
            setErrorMsg('');
          }}
        />
      ) : errorMsg ? (
        <ErrorState
          error={new AppError({
            code: 'VALIDATION_ERROR',
            title: 'Validação de Dados',
            message: errorMsg,
            severity: 'warning',
            retryable: false
          })}
        />
      ) : null}

      {/* Modal de colagem de vaga manual / Job Ingestion Engine */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <CardGlass className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 relative border border-slate-800 my-auto">
            <button
              onClick={() => {
                resetIngestionStates();
                setShowAddForm(false);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X size={18} />
            </button>

            {previewData ? (
              // STEP 2: PREVIEW / VALIDATION EDITOR
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
                    <Sparkles size={14} />
                    <span>Dados Normalizados pela IA</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-200 mt-1">
                    Validar e Confirmar Vaga
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Por favor, revise as informações identificadas pela IA antes de salvar e gerar o Match.
                  </p>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Título do Cargo</label>
                      <input
                        type="text"
                        value={previewData.title}
                        onChange={e => setPreviewData({ ...previewData, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Nome da Empresa (Opcional)</label>
                      <input
                        type="text"
                        value={previewData.companyName}
                        onChange={e => setPreviewData({ ...previewData, companyName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Localização</label>
                      <input
                        type="text"
                        value={previewData.location}
                        onChange={e => setPreviewData({ ...previewData, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Modelo de Trabalho</label>
                      <select
                        value={previewData.workMode}
                        onChange={e => setPreviewData({ ...previewData, workMode: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                      >
                        <option value="remote">Remoto (Remote)</option>
                        <option value="hybrid">Híbrido (Hybrid)</option>
                        <option value="onsite">Presencial (Onsite)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Senioridade</label>
                      <select
                        value={previewData.seniority}
                        onChange={e => setPreviewData({ ...previewData, seniority: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                      >
                        <option value="junior">Júnior (Junior)</option>
                        <option value="pleno">Pleno (Pleno)</option>
                        <option value="senior">Sênior (Senior)</option>
                        <option value="lead">Lead (Lead)</option>
                        <option value="director">Diretor (Director)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Salário / Remuneração</label>
                      <input
                        type="text"
                        value={previewData.salary || ''}
                        onChange={e => setPreviewData({ ...previewData, salary: e.target.value })}
                        placeholder="Ex: R$ 12.000 - R$ 15.000 ou A combinar"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">URL de Origem (Opcional)</label>
                      <input
                        type="text"
                        value={previewData.sourceUrl || ''}
                        onChange={e => setPreviewData({ ...previewData, sourceUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Descrição / Escopo da Vaga</label>
                    <textarea
                      value={previewData.description}
                      onChange={e => setPreviewData({ ...previewData, description: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Requisitos Técnicos (Separados por vírgula)</label>
                    <input
                      type="text"
                      value={previewData.requirements.join(', ')}
                      onChange={e => setPreviewData({
                        ...previewData,
                        requirements: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Benefícios (Separados por vírgula)</label>
                    <input
                      type="text"
                      value={(previewData.benefits || []).join(', ')}
                      onChange={e => setPreviewData({
                        ...previewData,
                        benefits: e.target.value.split(',').map(b => b.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setPreviewData(null)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                  >
                    ← Voltar
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetIngestionStates();
                        setShowAddForm(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSaveIngestedJob}
                      disabled={isCreating}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/10 disabled:opacity-50"
                    >
                      {isCreating ? 'Salvando...' : 'Confirmar e Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // STEP 1: SELECT IMPORT METHOD
              <div className="space-y-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-200">
                    Adicionar Nova Vaga
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Selecione o melhor método para importar a vaga. O Vocentro extrairá os requisitos automaticamente.
                  </p>
                </div>

                {/* TABS SWITCHER */}
                <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setIngestionTab('text');
                      setRestrictedPlatformMsg(false);
                    }}
                    className={`pb-2 transition ${ingestionTab === 'text' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Colar Descrição
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIngestionTab('url');
                      setRestrictedPlatformMsg(false);
                    }}
                    className={`pb-2 transition ${ingestionTab === 'url' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Link da Vaga
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIngestionTab('pdf');
                      setRestrictedPlatformMsg(false);
                    }}
                    className={`pb-2 transition ${ingestionTab === 'pdf' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Upload de PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIngestionTab('greenhouse');
                      setRestrictedPlatformMsg(false);
                    }}
                    className={`pb-2 transition ${ingestionTab === 'greenhouse' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Greenhouse
                  </button>
                </div>

                {isIngesting ? (
                  // LOADER / PROGRESSIVE TRACKER
                  <div className="space-y-4 py-8 text-center bg-slate-900/10 rounded-2xl border border-slate-900">
                    <Loader2 size={32} className="animate-spin text-brand-500 mx-auto" />
                    <p className="text-xs font-medium text-slate-200 mt-2">{ingestionStepText}</p>
                    <div className="max-w-xs mx-auto text-left mt-6 space-y-3 p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                      <div className="flex items-center gap-2.5 text-[10px]">
                        <span>{ingestionStep === 'preparing' ? '⚡' : (ingestionStep === 'error' ? '❌' : '✅')}</span>
                        <span className={ingestionStep === 'preparing' ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                          Iniciando e abrindo conexões...
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px]">
                        <span>{ingestionStep === 'extracting' ? '⚡' : (ingestionStep === 'preparing' ? '⚪' : (ingestionStep === 'error' ? '❌' : '✅'))}</span>
                        <span className={ingestionStep === 'extracting' ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                          Removendo cabeçalhos e scripts inúteis...
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px]">
                        <span>{ingestionStep === 'normalizing' ? '⚡' : (ingestionStep === 'completed' ? '✅' : (ingestionStep === 'error' ? '❌' : '⚪'))}</span>
                        <span className={ingestionStep === 'normalizing' ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                          Mapeando stacks e qualificando cargo...
                        </span>
                      </div>
                    </div>
                  </div>
                ) : restrictedPlatformMsg ? (
                  // RESTRICTED PLATFORM FALLBACK VIEW
                  <div className="p-5 rounded-2xl border border-yellow-900/30 bg-yellow-950/15 space-y-4">
                    <div className="flex gap-2.5 items-start">
                      <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <h4 className="font-semibold text-xs text-yellow-500">Restrição de Extração</h4>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Esta vaga está hospedada em uma plataforma que restringe a extração automatizada de conteúdo em seus Termos de Uso (como LinkedIn ou Gupy). Para respeitar essas regras, o Vocentro não realiza a importação automática dessa página.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          setRestrictedPlatformMsg(false);
                          setIngestionTab('text');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-200 transition"
                      >
                        ✏️ Colar a Descrição
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRestrictedPlatformMsg(false);
                          setIngestionTab('pdf');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-200 transition"
                      >
                        📄 Importar PDF
                      </button>
                    </div>
                  </div>
                ) : ingestionStep === 'error' ? (
                  // ERROR STATE FOR PIPELINE
                  <div className="p-4 rounded-xl border border-red-950/30 bg-red-950/10 text-center space-y-3">
                    <AlertCircle className="text-red-500 mx-auto" size={24} />
                    <p className="text-xs text-slate-300 font-semibold">{ingestionStepText}</p>
                    <button
                      type="button"
                      onClick={() => setIngestionStep('idle')}
                      className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 font-semibold"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : (
                  // ACTIVE TAB PANEL
                  <div className="min-h-[220px]">
                    {ingestionTab === 'text' && (
                      <form onSubmit={handleIngestManual} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Título do Cargo</label>
                            <input
                              type="text"
                              placeholder="Ex: Senior Frontend Engineer"
                              value={title}
                              onChange={e => setTitle(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Empresa</label>
                            <input
                              type="text"
                              placeholder="Ex: Vocentro"
                              value={companyName}
                              onChange={e => setCompanyName(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Descrição / Escopo da Vaga</label>
                          <textarea
                            placeholder="Cole aqui a descrição completa da vaga..."
                            rows={5}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Stacks / Requisitos Principais (Separados por vírgula)</label>
                          <input
                            type="text"
                            placeholder="Ex: React, Next.js, Node.js, GraphQL"
                            value={requirementsInput}
                            onChange={e => setRequirementsInput(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              resetIngestionStates();
                              setShowAddForm(false);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/10"
                          >
                            Analisar e Avançar
                          </button>
                        </div>
                      </form>
                    )}

                    {ingestionTab === 'url' && (
                      <form onSubmit={handleIngestUrl} className="space-y-4 pt-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">URL / Link da Vaga</label>
                          <input
                            type="url"
                            placeholder="Ex: https://jobs.lever.co/stripe/425678 ou https://company.ashbyhq.com/..."
                            value={ingestionUrl}
                            onChange={e => setIngestionUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                            required
                          />
                        </div>

                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          O Vocentro baixará o HTML e estruturará os requisitos de forma inteligente, limpando anúncios e scripts de layout.
                        </p>

                        <div className="flex gap-3 justify-end pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              resetIngestionStates();
                              setShowAddForm(false);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/10"
                          >
                            Importar e Mapear
                          </button>
                        </div>
                      </form>
                    )}

                    {ingestionTab === 'pdf' && (
                      <form onSubmit={handleIngestPdf} className="space-y-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Upload de Arquivo PDF</label>
                          
                          <div className="border border-dashed border-slate-800 hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer transition relative bg-slate-900/10">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setIngestionFile(e.target.files[0]);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {ingestionFile ? (
                              <div className="space-y-2">
                                <FileText className="mx-auto text-brand-400" size={32} />
                                <p className="text-xs font-semibold text-slate-200">{ingestionFile.name}</p>
                                <p className="text-[9px] text-slate-500">{(ingestionFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <ArrowUpRight className="mx-auto text-slate-500" size={32} />
                                <p className="text-xs font-semibold text-slate-350">Arraste ou clique para selecionar o PDF da vaga</p>
                                <p className="text-[9px] text-slate-500">Tamanho máximo: 10MB</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              resetIngestionStates();
                              setShowAddForm(false);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={!ingestionFile}
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/10 disabled:opacity-50"
                          >
                            Analisar PDF
                          </button>
                        </div>
                      </form>
                    )}

                    {ingestionTab === 'greenhouse' && (
                      <form onSubmit={handleIngestGreenhouse} className="space-y-4 pt-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Link da Vaga no Greenhouse</label>
                          <input
                            type="url"
                            placeholder="Ex: https://boards.greenhouse.io/stripe/jobs/4256721"
                            value={greenhouseUrl}
                            onChange={e => setGreenhouseUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                            required
                          />
                        </div>

                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          A API pública e oficial do Greenhouse será consultada de forma transparente para importar a vaga de maneira limpa e rápida.
                        </p>

                        <div className="flex gap-3 justify-end pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              resetIngestionStates();
                              setShowAddForm(false);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/10"
                          >
                            Conectar e Buscar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardGlass>
        </div>
      )}

      {/* VIEW 1: Minhas Análises */}
      {subTab === 'my-jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Listagem de Vagas */}
          <div className="lg:col-span-1 space-y-4">
            <CardGlass className="p-4 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Vagas Disponíveis</span>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {(() => {
                  const analyzedJobs = matches.map(m => {
                    const existingJob = jobs.find(j => String(j.id) === String(m.jobId));
                    if (existingJob) return existingJob;
                    return {
                      id: m.jobId,
                      title: (m as any).jobTitle || (m as any).job_title || `Vaga (${m.jobId?.slice(0, 8) || 'analisada'})`,
                      companyName: (m as any).companyName || (m as any).company_name || 'Empresa'
                    };
                  }).filter((job, idx, self) => idx === self.findIndex(j => String(j.id) === String(job.id)));

                  const rawList = analyzedJobs.length > 0 ? analyzedJobs : jobs;
                  const listToRender = rawList.filter(j => !trashedJobIds.has(j.id));

                  if (listToRender.length === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                        Nenhuma vaga ativa disponível.
                      </div>
                    );
                  }

                  return listToRender.map(job => {
                    const isActive = String(job.id) === String(selectedJobId);
                    const match = matches.find(m => 
                      String(m.jobId) === String(job.id) || 
                      (m as any).job_id === String(job.id) || 
                      ((job as any).sourceUrl && (m as any).sourceUrl === (job as any).sourceUrl)
                    );
                    const isItemAnalyzing = (isCalculating && isActive) || analyzingJobId === String(job.id);
                    return (
                      <div
                        key={job.id}
                        onClick={async () => {
                          setSelectedJobId(job.id);
                          tracker.trackJobDiscovered(job.id, { title: job.title, company: job.companyName });
                          if (!isPro && !isJobUnlocked(job.id)) {
                            if (!canUnlockJob(job.id)) {
                              triggerPaywall('weekly_limit');
                            } else {
                              await unlockJob(job.id);
                            }
                          }
                        }}
                        className={`p-3 rounded-xl cursor-pointer border transition-all text-xs flex justify-between items-center group ${
                          isActive
                            ? 'bg-brand-500/10 border-brand-500/30 text-slate-200'
                            : 'bg-slate-900/20 dark:bg-slate-900/20 light:bg-slate-50 border-slate-900 dark:border-slate-900 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-700 hover:border-slate-800'
                        }`}
                      >

                        <div className="truncate max-w-[130px]">
                          <h4 className="font-bold truncate text-slate-200 dark:text-slate-200 light:text-slate-800">{job.title}</h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{job.companyName}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isItemAnalyzing ? (
                            <span className="font-bold font-display text-xs px-2 py-0.5 rounded-lg border bg-brand-500/10 text-brand-400 border-brand-500/20 flex items-center gap-1">
                              <Loader2 size={11} className="animate-spin" />
                              Calculando...
                            </span>
                          ) : match ? (
                            <span className={`font-bold font-display text-xs px-2 py-0.5 rounded-lg border ${
                              match.scoreOverall >= 85 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : match.scoreOverall >= 70 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : 'bg-slate-500/10 text-slate-350 border-slate-700/30'
                            }`}>
                              {match.scoreOverall}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-800 px-2 py-0.5 rounded-lg">Sem Match</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToTrash(job);
                              showToast(`Vaga "${job.title}" movida para a Lixeira.`, 'info');
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition cursor-pointer"
                            title="Mover vaga para a Lixeira"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardGlass>
          </div>

          {/* Coluna Direita: Análise de Match & Gap Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {selectedJob ? (
              <div className="space-y-6">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="shrink-0 text-red-400" />
                      <span>{errorMsg}</span>
                    </div>
                    <button
                      onClick={() => {
                        setErrorMsg('');
                        handleTriggerMatch();
                      }}
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold shrink-0 transition cursor-pointer"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}

                {/* Descrição e Trigger */}
                <CardGlass className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] px-2.5 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 rounded-lg font-bold uppercase tracking-wider whitespace-nowrap inline-block">
                        Vaga Selecionada
                      </span>
                      <h3 className="font-display font-bold text-lg text-slate-200 dark:text-slate-200 light:text-slate-800 mt-2">
                        {selectedJob.title}
                      </h3>
                    </div>
                    {!currentMatch && (
                      <button
                        onClick={() => handleTriggerMatch()}
                        disabled={isCalculating}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/10 disabled:opacity-50 shrink-0"
                      >
                        {isCalculating ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play size={12} />
                        )}
                        Calcular Match
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 line-clamp-3 leading-relaxed">
                    {selectedJob.description}
                  </p>

                  {selectedJob.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedJob.requirements.map((req, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-300 font-semibold uppercase"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  )}
                </CardGlass>

                {/* ── FASE 1 & FASE 2: CARD "POR QUE ESSA VAGA COMBINA COM VOCÊ?" ── */}
                {selectedJob && (
                  <div className="w-full max-w-full overflow-hidden bg-gradient-to-b from-[#182338] to-[#121927] border border-blue-500/20 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6 animate-fade-in text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                            <Sparkles size={16} />
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Job Match Explanation Engine</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-100 mt-1">
                          Por que essa vaga combina com você?
                        </h2>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        {/* Secondary Score Badge: Career Fit (Objetivo de Carreira) */}
                        <div 
                          className="bg-slate-900/60 p-2.5 rounded-2xl border border-blue-500/20 text-right shrink-0 relative group cursor-help"
                          title="Career Fit Score: Pontuação de sinergia entre os objetivos da sua carreira e a empresa contratante."
                        >
                          <span className="text-[9px] uppercase font-bold text-slate-300 flex items-center gap-1 justify-end">
                            💼 Career Fit Score
                          </span>
                          <span className="text-xs font-extrabold text-blue-300 block">
                            {isCalculating || (analyzingJobId && selectedJob && analyzingJobId === selectedJob.id) || isLoadingExplanation ? '--' : (currentMatch ? `${currentMatch.scoreOverall}%` : '--')}
                          </span>
                          <span className="text-[8px] text-slate-400 block">Alinhamento de objetivo</span>
                        </div>

                        {/* Primary Score Circle: Match da Vaga (Compatibilidade Geral) */}
                        <div 
                          className="flex items-center gap-3 bg-brand-950/40 p-2.5 rounded-2xl border border-brand-500/30 relative group cursor-help shadow-md shadow-emerald-500/5"
                          title="Match da Vaga (Compatibilidade Geral): Pontuação master que calcula a aderência de requisitos técnicos, experiência e competências do seu currículo em relação à vaga."
                        >
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-brand-300 flex items-center gap-1 justify-end">
                              🎯 Match da Vaga
                            </span>
                            <span className="text-[10px] text-slate-300 block font-semibold">Compatibilidade Geral</span>
                          </div>
                          {isCalculating || (analyzingJobId && selectedJob && analyzingJobId === selectedJob.id) || isLoadingExplanation ? (
                            <div className="w-[56px] h-[56px] flex items-center justify-center">
                              <Loader2 size={24} className="animate-spin text-brand-400" />
                            </div>
                          ) : (
                            <ProgressRing 
                              value={currentMatch ? currentMatch.scoreOverall : 0} 
                              size={56} 
                              strokeWidth={4}
                              label={
                                <span className="text-emerald-400 font-extrabold text-sm font-display">
                                  {currentMatch ? `${currentMatch.scoreOverall}%` : '--'}
                                </span>
                              } 
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {!primaryResume && !careerProfileNew ? (
                      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                          <AlertTriangle size={20} className="shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
                          <div>
                            <span className="font-bold block text-amber-200">Sem dados suficientes para análise profunda</span>
                            <span className="text-[11px] text-amber-300/80">Envie seu currículo em PDF para calcularmos o Match da vaga e ativarmos a IA.</span>
                          </div>
                        </div>
                        {setActiveTab && (
                          <button
                            onClick={() => setActiveTab('profile')}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 self-start sm:self-center transition shadow-md shadow-amber-500/10 cursor-pointer"
                          >
                            Ir para Meu Perfil
                          </button>
                        )}
                      </div>
                    ) : isLoadingExplanation ? (
                      <div className="py-8 text-center text-slate-400 space-y-2">
                        <Loader2 size={24} className="animate-spin text-blue-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-200">Calculando match & gerando análise IA...</p>
                        <p className="text-[10px] text-slate-500">Sintetizando os fatores de Match da vaga e pontos fortes...</p>
                      </div>
                    ) : (
                      <>
                        {/* Resumo Geral do Match */}
                        <div className="p-4 rounded-xl bg-blue-900/40 border border-blue-500/40 text-white text-xs leading-relaxed flex items-start gap-3">
                          <Zap size={18} className="text-blue-300 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-blue-200 block mb-0.5">Diagnóstico do Copiloto:</span>
                            {explanation?.overallMatchReason || 'Sua trajetória e competências apresentam alta sinergia com os requisitos essenciais desta posição.'}
                          </div>
                        </div>

                        {/* 7-Factor Transparency Breakdown */}
                        {explanation?.breakdown && (
                          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/60 space-y-3">
                            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">Transparência dos 7 Fatores de Fit:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                              <div className="p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                                <span className="text-[9px] text-slate-300 uppercase font-semibold block">Skills (30%)</span>
                                <span className="font-bold text-emerald-300">{explanation.breakdown.skillsScore}%</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                                <span className="text-[9px] text-slate-300 uppercase font-semibold block">Experiência (25%)</span>
                                <span className="font-bold text-blue-300">{explanation.breakdown.experienceScore}%</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                                <span className="text-[9px] text-slate-300 uppercase font-semibold block">Senioridade (15%)</span>
                                <span className="font-bold text-indigo-300">{explanation.breakdown.seniorityScore}%</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                                <span className="text-[9px] text-slate-300 uppercase font-semibold block">Objetivos (15%)</span>
                                <span className="font-bold text-purple-300">{explanation.breakdown.careerGoalScore}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Grid: Pontos Fortes e Pontos de Atenção */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Pontos Fortes */}
                          <div className="space-y-3 p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/40">
                            <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                              <CheckCircle size={15} />
                              Seus Pontos Fortes
                            </h3>
                            <div className="space-y-2">
                              {explanation?.strengths && explanation.strengths.length > 0 ? (
                                explanation.strengths.map((item, i) => (
                                  <div key={i} className="p-2.5 rounded-lg bg-emerald-900/20 border border-emerald-800/40 text-xs space-y-0.5">
                                    <span className="font-bold text-emerald-200 block">{item.skill}</span>
                                    <span className="text-slate-300 text-[11px] block">{item.reason}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-300">Vivência relevante em projetos de escopo similar.</p>
                              )}
                            </div>
                          </div>

                          {/* Pontos de Atenção */}
                          <div className="space-y-3 p-4 rounded-xl bg-amber-950/10 border border-amber-500/20">
                            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <AlertTriangle size={15} />
                              Pontos de Atenção
                            </h3>
                            <div className="space-y-2">
                              {explanation?.gaps && explanation.gaps.length > 0 ? (
                                explanation.gaps.map((gap, i) => (
                                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-amber-900/40 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-amber-300">{gap.requirement}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${gap.impact === 'Alto' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                        Impacto {gap.impact}
                                      </span>
                                    </div>
                                    <span className="text-slate-400 text-[11px] block">💡 {gap.suggestion}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400">Nenhum bloqueio crítico de pré-requisitos detectado.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Estratégia de Candidatura */}
                        {explanation?.recommendation && (
                          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <Target size={14} />
                              Estratégia Recomendada
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {explanation.recommendation}
                            </p>
                          </div>
                        )}

                        {/* Match IA Quality Feedback Bar (Item 1 & 2) */}
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-200">Essa recomendação faz sentido para você?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  setMatchFeedbackGiven('positive');
                                  await JobMatchFeedbackService.recordMatchFeedback({
                                    userId,
                                    jobId: selectedJob.id,
                                    careerFitScore: explanation?.careerFitScore || 0,
                                    jobScore: selectedJob.scores?.overall || 0,
                                    feedbackType: 'positive',
                                    jobTitle: selectedJob.title,
                                    companyName: selectedJob.companyName
                                  });
                                  showToast('✓ Feedback registrado com sucesso! Obrigado.', 'success');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                  matchFeedbackGiven === 'positive'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                }`}
                              >
                                <ThumbsUp size={13} className="text-emerald-400" />
                                <span>Sim, combina comigo</span>
                              </button>

                              <button
                                onClick={() => setMatchRejectionModal(true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                  matchFeedbackGiven === 'negative'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                }`}
                              >
                                <ThumbsDown size={13} className="text-red-400" />
                                <span>Não combina comigo</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ── REGRA 6: BANNERS E CTAS CONTEXTUAIS DE MATCH (FREE -> PRO CONVERSION) ── */}
                        {explanation && (
                          (explanation.careerFitScore || 0) < 70 ? (
                            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3 animate-fade-in">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                                  <AlertTriangle size={20} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-sm text-amber-300">
                                    ⚠️ Seu currículo tem {explanation.careerFitScore || 45}% de aderência a esta vaga.
                                  </h4>
                                  <p className="text-xs text-amber-200/90 leading-relaxed">
                                    O Copiloto IA pode ajudar a adaptar suas experiências aos requisitos desta oportunidade.
                                  </p>
                                </div>
                              </div>
                              <div className="pt-1">
                                <button
                                  onClick={() => {
                                    tracker.trackMatchUpgradeCtaClicked(explanation.careerFitScore || 0, selectedJob.id, 'copilot');
                                    if (isPro) {
                                      onStartSimulation?.(selectedJob);
                                    } else {
                                      triggerPaywall('copilot', 'Adapte suas Experiências com o Copiloto IA 🤖', 'O Copiloto IA analisa os requisitos desta vaga e ajuda você a destacar as habilidades certas para aumentar sua aderência!');
                                    }
                                  }}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
                                >
                                  <Sparkles size={16} />
                                  <span>Melhorar meu Match com IA</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-fade-in">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                                  <Sparkles size={20} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-sm text-emerald-300">
                                    🎉 Excelente compatibilidade! ({explanation.careerFitScore}%)
                                  </h4>
                                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                                    Seu currículo está bem alinhado a esta vaga. Gere a versão otimizada para ATS e prepare-se para a candidatura.
                                  </p>
                                </div>
                              </div>
                              <div className="pt-1">
                                <button
                                  onClick={() => {
                                    tracker.trackResumeExportUpgradeCtaClicked(explanation.careerFitScore || 0, selectedJob.id, 'resume_export');
                                    setShowAdaptationModal(true);
                                  }}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
                                >
                                  <FileText size={16} />
                                  <span>Exportar currículo otimizado</span>
                                </button>
                              </div>
                            </div>
                          )
                        )}


                        {/* Botão de Adaptação de Currículo */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                          <button
                            onClick={() => {
                              setShowAdaptationModal(true);
                              tracker.track('resume_adaptation_opened', 'CareerIntelligence', { jobId: selectedJobId });
                              tracker.trackQualifiedAction({
                                user_id: userId,
                                job_id: selectedJob.id,
                                action: 'resume_adaptation',
                                career_fit_score: explanation?.careerFitScore || 0
                              });
                            }}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
                          >
                            <Sparkles size={16} />
                            <span>Adaptar meu currículo para essa vaga</span>
                          </button>

                          {/* Quick Feedback Bar */}
                          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
                            <button
                              onClick={async () => {
                                recordFeedback({ jobId: selectedJob.id, action: 'SAVED' });
                                await updateApplicationStatus({ job: selectedJob, status: 'SAVED' });
                                queryClient.invalidateQueries({ queryKey: ['applications'] });
                                queryClient.invalidateQueries({ queryKey: ['job-applications-list'] });
                                queryClient.invalidateQueries({ queryKey: ['user-applications'] });
                                showToast('✓ Vaga salva na sua jornada', 'success');

                                if (explanation?.careerFitScore && explanation.careerFitScore >= 75) {
                                  tracker.trackQualifiedAction({
                                    user_id: userId,
                                    job_id: selectedJob.id,
                                    action: 'saved',
                                    career_fit_score: explanation.careerFitScore
                                  });
                                }
                              }}
                              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                              title="Salvar Vaga"
                            >
                              <Heart size={14} className="text-pink-400" />
                              <span>Salvar</span>
                            </button>
                            <button
                              onClick={async () => {
                                recordFeedback({ jobId: selectedJob.id, action: 'APPLIED' });
                                await updateApplicationStatus({ job: selectedJob, status: 'APPLIED' });
                                queryClient.invalidateQueries({ queryKey: ['applications'] });
                                queryClient.invalidateQueries({ queryKey: ['job-applications-list'] });
                                queryClient.invalidateQueries({ queryKey: ['user-applications'] });
                                showToast('✓ Candidatura registrada', 'success');

                                if (explanation?.careerFitScore && explanation.careerFitScore >= 75) {
                                  tracker.trackQualifiedAction({
                                    user_id: userId,
                                    job_id: selectedJob.id,
                                    action: 'applied',
                                    career_fit_score: explanation.careerFitScore
                                  });
                                }
                              }}
                              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                              title="Marcar Candidatura"
                            >
                              <CheckCircle size={14} className="text-emerald-400" />
                              <span>Candidatar-se</span>
                            </button>
                            <button
                              onClick={() => setRejectReasonModal(true)}
                              className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg font-medium transition flex items-center gap-1"
                              title="Rejeitar Vaga"
                            >
                              <X size={14} />
                              <span>Rejeitar</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* MODAL DE ADAPTAÇÃO DE CURRÍCULO (SUGESTÕES APROVÁVEIS) */}
                {showAdaptationModal && selectedJob && createPortal(
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 min-h-screen w-screen overflow-y-auto">
                    <div className="bg-[#121927] border border-slate-800 rounded-2xl max-w-2xl min-w-[320px] w-full p-6 space-y-6 shadow-2xl animate-scale-up relative my-auto max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <FileText size={20} />
                          </span>
                          <div>
                            <h3 className="font-bold text-base text-slate-100">Sugestões de Adaptação de Currículo</h3>
                            <p className="text-xs text-slate-400">Vaga: {selectedJob.title} na {selectedJob.companyName}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAdaptationModal(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {isLoadingAdaptation ? (
                        <div className="py-8 text-center text-slate-400 space-y-2">
                          <Loader2 size={24} className="animate-spin text-blue-400 mx-auto" />
                          <p className="text-xs">Analisando currículo em relação aos requisitos ATS...</p>
                        </div>
                      ) : (
                        <div className="space-y-5 text-xs">
                          {/* Status Banner */}
                          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-blue-400" />
                              <span>Status: <strong className="text-white">{adaptation?.status === 'APPLIED' ? '✅ Aplicado no Currículo' : '📋 Sugestões Prontas para Aplicação'}</strong></span>
                            </div>
                            {adaptation?.status === 'APPLIED' && (
                              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold uppercase text-[10px]">
                                Aprovado
                              </span>
                            )}
                          </div>

                          {/* Seções Recomendadas (Preview Borrado para Free na Regra 7) */}
                          {adaptation?.adaptedSections?.map((section, idx) => (
                            <div key={idx} className={`p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 transition-all ${
                              !isPro && idx >= 1 ? 'blur-[5px] select-none pointer-events-none opacity-60' : ''
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-400 block uppercase tracking-wider text-[11px]">{section.sectionName}</span>
                                {isPro ? (
                                  <button
                                    onClick={() => handleCopySummary(section.suggestedText)}
                                    className="text-[10px] text-slate-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    <Clipboard size={12} />
                                    <span>Copiar Texto</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-amber-400 font-mono font-bold">🔒 PRO</span>
                                )}
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-slate-400 text-[11px]">
                                <span className="font-semibold text-slate-500 block mb-0.5 uppercase text-[9px] tracking-wider">Texto Atual no Currículo:</span>
                                {section.originalText}
                              </div>
                              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/25 text-slate-100 text-[11px] leading-relaxed">
                                <span className="font-bold text-blue-400 block mb-1 uppercase text-[9px] tracking-wider">Sugestão de Otimização ATS:</span>
                                {section.suggestedText}
                              </div>
                              <p className="text-slate-400 text-[10px] italic">💡 Justificativa da IA: {section.reasoning}</p>
                            </div>
                          ))}

                          {/* ── REGRA 7: OVERLAY DE PREVIEW DO CURRÍCULO PRO ── */}
                          {!isPro && (
                            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-purple-950/90 border border-amber-500/40 space-y-3 text-center animate-fade-in shadow-xl">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] uppercase border border-amber-500/30">
                                  🔒 Seu currículo otimizado para esta vaga está pronto!
                                </span>
                                <p className="text-xs text-slate-200 max-w-md mx-auto leading-relaxed">
                                  Desbloqueie a exportação em PDF e o formato ATS amigável com o plano PRO.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  tracker.trackPaywallCtaClicked('pdf_export', { cta_text: 'Desbloquear currículo PRO' });
                                  triggerPaywall('pdf_export', 'Desbloqueie a Exportação em PDF ATS 📄', 'Baixe a versão final do seu currículo formatada profissionalmente para aprovação em filtros ATS.');
                                }}
                                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-xs shadow-lg cursor-pointer transition-all inline-flex items-center gap-2"
                              >
                                <Sparkles size={16} />
                                <span>Desbloquear currículo PRO</span>
                              </button>
                            </div>
                          )}

                          {/* Palavras-chave Adicionadas */}
                          {adaptation?.keywordsAdded && adaptation.keywordsAdded.length > 0 && (
                            <div className={`p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 ${!isPro ? 'blur-[4px] select-none opacity-50' : ''}`}>
                              <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px]">Palavras-chave ATS Sugeridas:</span>
                              <div className="flex flex-wrap gap-2">
                                {adaptation.keywordsAdded.map((kw, i) => (
                                  <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px] flex items-center gap-1">
                                    <Plus size={12} className="text-emerald-400" />
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ações de Aprovação */}
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800">
                            <button
                              onClick={() => {
                                if (!isPro) {
                                  triggerPaywall('pdf_export', 'Desbloqueie a Copia e Exportação em PDF 📄', 'A cópia e exportação completa em formato ATS é exclusiva do plano PRO.');
                                  return;
                                }
                                const allTexts = (adaptation?.adaptedSections || []).map(s => `=== ${s.sectionName} ===\n${s.suggestedText}`).join('\n\n');
                                handleCopySummary(allTexts);
                                showToast('✓ Todas as sugestões copiadas para a área de transferência!', 'success');
                              }}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Clipboard size={14} />
                              Copiar Todas as Sugestões
                            </button>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => {
                                  if (adaptation) updateAdaptationStatus({ adaptationId: adaptation.id, status: 'DISMISSED' });
                                  setShowAdaptationModal(false);
                                }}
                                className="px-3.5 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                              >
                                Descartar
                              </button>
                              <button
                                onClick={() => {
                                  if (!isPro) {
                                    triggerPaywall('pdf_export', 'Desbloqueie a Exportação em PDF ATS 📄', 'Aprovar e exportar versões ilimitadas do currículo em PDF é um recurso exclusivo do plano PRO.');
                                    return;
                                  }
                                  if (adaptation) updateAdaptationStatus({ adaptationId: adaptation.id, status: 'APPLIED' });
                                  setShowAdaptationModal(false);
                                  showToast('✓ Otimizações marcadas como aplicadas!', 'success');
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check size={14} />
                                Aprovar Sugestões
                              </button>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}

                {/* MODAL DE MOTIVO DE REJEIÇÃO */}
                {rejectReasonModal && selectedJob && createPortal(
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 min-h-screen w-full font-sans">
                    <div className="bg-[#121927] text-white border border-slate-800 rounded-2xl w-full max-w-lg min-w-[300px] shrink-0 p-6 space-y-4 shadow-2xl relative my-auto font-sans block">
                      <h3 className="font-bold text-sm text-white block break-normal">Por que esta vaga não interessa?</h3>
                      <p className="text-xs text-slate-300 block break-normal">Seu feedback ajuda a treinar o algoritmo de recomendação do VoCentro.</p>
                      
                      <div className="space-y-2 text-xs w-full min-w-0 block">
                        {[
                          { id: 'LOW_SALARY', label: 'Salário abaixo da expectativa' },
                          { id: 'BAD_LOCATION', label: 'Localização ou modalidade inviável' },
                          { id: 'BAD_MATCH', label: 'Requisitos sem relação com meu perfil' },
                          { id: 'WRONG_LEVEL', label: 'Nível de senioridade incompatível' },
                          { id: 'ALREADY_APPLIED', label: 'Já me candidatei previamente' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={async () => {
                              recordFeedback({ jobId: selectedJob.id, action: 'REJECTED', reason: item.id as JobFeedbackReason });
                              await updateApplicationStatus({ job: selectedJob, status: 'REJECTED' });
                              if (onDeleteJob && selectedJob) {
                                onDeleteJob(selectedJob.id);
                              }
                              setSelectedJobId(null);
                              setRejectReasonModal(false);
                              showToast('✓ Vaga rejeitada e removida do seu painel.', 'warning');
                            }}
                            className="w-full text-left p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 text-slate-100 font-medium transition cursor-pointer flex items-center justify-between min-w-0 gap-3"
                          >
                            <span className="flex-1 min-w-0 font-medium break-normal">{item.label}</span>
                            <ChevronRight size={14} className="text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 text-right">
                        <button
                          onClick={() => setRejectReasonModal(false)}
                          className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

                {/* MODAL DE FEEDBACK DE REJEIÇÃO DO MATCH IA (Item 2) */}
                {matchRejectionModal && selectedJob && createPortal(
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 min-h-screen w-full font-sans">
                    <div className="bg-[#121927] text-white border border-slate-800 rounded-2xl w-full max-w-md min-w-[300px] shrink-0 p-6 space-y-4 shadow-2xl relative my-auto font-sans block">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white block break-normal">Ajude a melhorar sua recomendação</h3>
                          <p className="text-[11px] text-slate-300 block break-normal">Por que essa vaga não combina com você?</p>
                        </div>
                        <button
                          onClick={() => setMatchRejectionModal(false)}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-2 pt-2 w-full min-w-0 block">
                        {[
                          { id: 'seniority_mismatch', label: 'Senioridade diferente' },
                          { id: 'skill_gap', label: 'Não tenho essas habilidades' },
                          { id: 'career_direction', label: 'Cargo não faz sentido para minha carreira' },
                          { id: 'location', label: 'Localização incompatível' },
                          { id: 'other', label: 'Outro motivo' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={async () => {
                              setMatchFeedbackGiven('negative');
                              await JobMatchFeedbackService.recordMatchFeedback({
                                userId,
                                jobId: selectedJob.id,
                                careerFitScore: explanation?.careerFitScore || 0,
                                jobScore: selectedJob.scores?.overall || 0,
                                feedbackType: 'negative',
                                reason: opt.id as JobMatchRejectionReason,
                                jobTitle: selectedJob.title,
                                companyName: selectedJob.companyName
                              });
                              setMatchRejectionModal(false);
                              showToast('✓ Motivo registrado! O algoritmo usará essa informação.', 'success');
                            }}
                            className="w-full text-left p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 hover:text-white transition flex items-center justify-between cursor-pointer min-w-0 gap-3"
                          >
                            <span className="flex-1 min-w-0 font-medium break-normal">{opt.label}</span>
                            <ChevronRight size={14} className="text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 text-right">
                        <button
                          onClick={() => setMatchRejectionModal(false)}
                          className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

                {/* Resultados de Compatibilidade Existentes */}
                {currentMatch ? (

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Gráfico Radar */}
                      <RadarChart
                        scores={{
                          technical: currentMatch.scoreTechnical,
                          behavioral: currentMatch.scoreBehavioral,
                          seniority: currentMatch.scoreSeniority,
                          overall: currentMatch.scoreOverall,
                          location: currentMatch.scoreLocation
                        }}
                      />

                      {/* Resumo da Pontuação + Breakdown detalhado */}
                      <div className="space-y-4">
                        <CardGlass className="flex flex-col justify-center space-y-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Qualidade da Oportunidade (Job Score)</span>
                            <div className="flex items-baseline gap-2 mt-1">
                              <h2 className="font-display font-extrabold text-5xl text-brand-500">
                                {currentMatch.scoreOverall}%
                              </h2>
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900 text-slate-400 font-semibold">
                                {currentMatch.scoreOverall >= 90 ? 'Excelente 🔥' : currentMatch.scoreOverall >= 70 ? 'Boa ⚡' : 'Regular ⚠️'}
                              </span>
                            </div>
                            {currentMatch.processingTimeMs && (
                              <div className="text-[10px] text-slate-500 font-semibold mt-1">
                                ⏱ Análise concluída em {(currentMatch.processingTimeMs / 1000).toFixed(1)} segundos
                              </div>
                            )}
                            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                              {currentMatch.scoreOverall >= 90
                                ? 'Seu currículo possui um Match alto com os requisitos técnicos e comportamentais exigidos por esta oportunidade.'
                                : currentMatch.scoreOverall >= 70
                                ? 'Há um bom Match com os requisitos principais. Com pequenos ajustes, suas chances podem aumentar ainda mais.'
                                : 'Match moderado com a vaga. Recomendamos otimizar as seções e palavras-chave de seu currículo para esta oportunidade.'}
                            </p>
                          </div>
                          
                          <div className="pt-2 border-t border-slate-900 flex flex-col gap-2">
                            {selectedJob.sourceUrl && (
                              <button
                                type="button"
                                onClick={() => handleApplyClick(selectedJob)}
                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white font-extrabold text-[11px] tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                              >
                                <span>Candidatar-se</span>
                                <ArrowUpRight size={14} className="text-white" />
                              </button>
                            )}
                             <div className="flex gap-2">
                               <button
                                 onClick={handleDeleteSelectedAnalysis}
                                 disabled={isDeletingAnalyses}
                                 className="flex-1 py-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 text-[10px] font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                               >
                                 {isDeletingAnalyses ? (
                                   <Loader2 size={11} className="animate-spin" />
                                 ) : (
                                   <Trash2 size={11} />
                                 )}
                                 Excluir esta análise
                               </button>

                               <button
                                 onClick={async () => {
                                   if (window.confirm(`Deseja realmente excluir a vaga "${selectedJob.title}"? Isso removerá a vaga e todo o histórico de análises permanentemente.`)) {
                                     if (onDeleteJob) {
                                       await onDeleteJob(selectedJob.id);
                                       propOnSelectJob?.(null);
                                     }
                                   }
                                 }}
                                 className="flex-1 py-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 text-[10px] font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                               >
                                 <Trash2 size={11} />
                                 Excluir esta vaga
                               </button>
                             </div>

                            {selectedJob && (() => {
                              const isAdded = applications.some((app: any) => app.jobId === selectedJob.id);
                              return (
                                <div className="space-y-2 text-left">
                                  {isAdded ? (
                                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1">
                                      <CheckCircle size={11} />
                                      Vaga em Acompanhamento na Estratégia
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between gap-2 px-1">
                                        <span className="text-[10px] text-slate-400 font-semibold font-sans">Coluna Kanban:</span>
                                        <select
                                          value={manualStrategyStatus}
                                          onChange={(e) => setManualStrategyStatus(e.target.value)}
                                          className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] rounded-lg px-2 py-0.5 outline-none focus:border-brand-500 font-semibold"
                                        >
                                          <option value="auto">Automático (Score)</option>
                                          <option value="🎯 Alta Prioridade">🎯 Alta Prioridade</option>
                                          <option value="📝 Candidatura planejada">📝 Candidatura planejada</option>
                                          <option value="🔧 Ajustar antes">🔧 Ajustar antes</option>
                                          <option value="⚠️ Match baixo com a vaga">⚠️ Match baixo com a vaga</option>
                                        </select>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleAddToStrategy}
                                        disabled={isAddingToStrategy}
                                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold tracking-wider uppercase transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                      >
                                        {isAddingToStrategy ? (
                                          <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                          <Plus size={11} />
                                        )}
                                        Adicionar à Minha Estratégia
                                      </button>
                                    </>
                                  )}
                                  {onStartSimulation && (
                                    <button
                                      onClick={() => onStartSimulation(selectedJob)}
                                      className="w-full py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 text-[11px] font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Play size={12} />
                                      Simular Entrevista
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 text-center">
                            <div className="flex flex-col items-center">
                              <ProgressRing 
                                value={currentMatch.scoreTechnical} 
                                size={32} 
                                strokeWidth={3} 
                                color={currentMatch.scoreTechnical >= 85 ? 'stroke-emerald-500' : currentMatch.scoreTechnical >= 70 ? 'stroke-amber-500' : 'stroke-slate-500'}
                              />
                              <span className="text-[9px] text-slate-400 font-bold mt-1 block">Técnico</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <ProgressRing 
                                value={currentMatch.scoreBehavioral} 
                                size={32} 
                                strokeWidth={3} 
                                color={currentMatch.scoreBehavioral >= 85 ? 'stroke-emerald-500' : currentMatch.scoreBehavioral >= 70 ? 'stroke-amber-500' : 'stroke-slate-500'}
                              />
                              <span className="text-[9px] text-slate-400 font-bold mt-1 block">Comport.</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <ProgressRing 
                                value={currentMatch.scoreSeniority} 
                                size={32} 
                                strokeWidth={3} 
                                color={currentMatch.scoreSeniority >= 85 ? 'stroke-emerald-500' : currentMatch.scoreSeniority >= 70 ? 'stroke-amber-500' : 'stroke-slate-500'}
                              />
                              <span className="text-[9px] text-slate-400 font-bold mt-1 block">Seniorid.</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <ProgressRing 
                                value={currentMatch.scoreLocation} 
                                size={32} 
                                strokeWidth={3} 
                                color={currentMatch.scoreLocation >= 85 ? 'stroke-emerald-500' : currentMatch.scoreLocation >= 70 ? 'stroke-amber-500' : 'stroke-slate-500'}
                              />
                              <span className="text-[9px] text-slate-400 font-bold mt-1 block">Localiz.</span>
                            </div>
                          </div>
                        </CardGlass>

                        {/* Breakdown detalhado de competências */}
                        {(() => {
                          if (!primaryResume || !selectedJob) return null;
                          const breakdown = MatchingEngine.calculateMatchSync(
                            primaryResume,
                            selectedJob,
                            careerProfileNew
                          );
                          const found = breakdown.matchedSkills || [];
                          const missing = breakdown.missingSkills || [];
                          const total = found.length + missing.length;
                          if (total === 0) return null;
                          return (
                            <CardGlass className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300">
                                  Competências: {found.length}/{total} encontradas
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                  found.length === total
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : found.length >= total * 0.7
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {Math.round((found.length / Math.max(total, 1)) * 100)}% Técnico
                                </span>
                              </div>

                              {found.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Encontradas no perfil</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {found.map((sk, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold"
                                      >
                                        <CheckCircle size={9} />
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {missing.length > 0 && (
                                <div className="space-y-1.5 pt-3 border-t border-slate-900">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Não identificadas</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {missing.map((sk, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-500 font-semibold"
                                      >
                                        • {sk}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardGlass>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Explicações IA */}
                    <CardGlass className="space-y-6">
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-2">
                        <Award size={18} className="text-brand-500" />
                        Diagnóstico Semântico da IA
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Fortalezas */}
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pontos Fortes</span>
                          <div className="space-y-2">
                            {currentMatch.explanation.strengths.map((str, idx) => (
                              <div key={idx} className="flex gap-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                                <CheckCircle size={14} className="text-brand-500 shrink-0 mt-0.5" />
                                <span>{str}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Atenções */}
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pontos de Atenção</span>
                          <div className="space-y-2">
                            {currentMatch.explanation.weaknesses.map((weak, idx) => (
                              <div key={idx} className="flex gap-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <span>{weak}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardGlass>

                    {/* Gap Analysis */}
                    {matchDetails?.gapAnalysis && (
                      <CardGlass className="space-y-6">
                        <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-2">
                          <BookOpen size={18} className="text-indigo-400" />
                          Plano de Ação (Gap Analysis)
                        </h3>

                        <div className="space-y-6">
                          {matchDetails.gapAnalysis.missingSkills && matchDetails.gapAnalysis.missingSkills.length > 0 && (
                            <div className="space-y-2.5">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Requisitos / Ferramentas Ausentes</span>
                              <div className="flex flex-wrap gap-2">
                                {matchDetails.gapAnalysis.missingSkills.map((sk: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded bg-red-500/5 border border-red-500/10 text-xs text-red-400 font-semibold"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchDetails.gapAnalysis.skillsToLearn && matchDetails.gapAnalysis.skillsToLearn.length > 0 && (
                            <div className="space-y-3">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">O que você deve estudar/aprender</span>
                              <div className="space-y-2">
                                {matchDetails.gapAnalysis.skillsToLearn.map((learn: string, idx: number) => (
                                  <div key={idx} className="flex gap-2.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                                    <ChevronRight size={14} className="text-brand-500 shrink-0 mt-0.5" />
                                    <span>{learn}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                            <div className="space-y-2.5">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">O que destacar ou incluir no CV</span>
                              <ul className="list-disc pl-4 space-y-1.5 text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs">
                                {matchDetails.gapAnalysis.toIncludeInResume?.map((inc: string, idx: number) => (
                                  <li key={idx}>{inc}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2.5">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">O que excluir ou reduzir do CV</span>
                              <ul className="list-disc pl-4 space-y-1.5 text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs">
                                {matchDetails.gapAnalysis.toExcludeFromResume?.map((exc: string, idx: number) => (
                                  <li key={idx}>{exc}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardGlass>
                    )}

                    {/* Painel do AI Career Coach */}
                    <CardGlass id="ai-career-coach-panel" className="p-6 space-y-6 border border-brand-500/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-900">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-500 font-extrabold uppercase rounded-lg">AI Coach Integrado</span>
                          <h4 className="font-display font-bold text-sm text-slate-200 mt-1">Assistente Estratégico de Carreira</h4>
                        </div>
                        <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          {[
                            { id: 'coach-evaluation', label: 'Avaliação' },
                            { id: 'optimize-cv', label: 'Otimizar CV' },
                            { id: 'cover-letter', label: 'Carta' },
                            { id: 'interview-questions', label: 'Perguntas STAR' }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                if (tab.id === 'coach-evaluation') {
                                  setCoachTab('coach-evaluation');
                                  return;
                                }
                                // Bloqueia a geração com base na cota semanal compartilhada
                                const hasEntitlement = tab.id === 'cover-letter' 
                                  ? canGenerateCoverLetter(selectedJobId || undefined)
                                  : canImproveResume(selectedJobId || undefined);

                                if (!isPro && !hasEntitlement) {
                                  triggerPaywall('weekly_limit');
                                  return;
                                }
                                setCoachTab(tab.id as any);
                              }}
                              type="button"
                              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
                                coachTab === tab.id
                                  ? 'bg-brand-600 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                              {coachTab === 'coach-evaluation' && (() => {
                        const evalRes = CareerCoachService.evaluateCandidacy(
                          primaryResume,
                          selectedJob!,
                          careerProfile,
                          careerProfileNew,  // passa o perfil consolidado
                          currentMatch
                        );
                        return (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                              <span className="font-semibold text-slate-300">Vale a pena aplicar para esta vaga?</span>
                              <span className={`px-3 py-1 rounded-lg font-extrabold text-[10px] uppercase border ${
                                evalRes.shouldApply.includes('Sim') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                evalRes.shouldApply.includes('Ajustar') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {evalRes.shouldApply}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2 p-4 rounded-xl bg-slate-900/30 border border-slate-900/60">
                                <strong className="text-slate-200 block">🟢 Motivos para aplicar:</strong>
                                <ul className="list-disc pl-4 space-y-1 text-slate-450">
                                  {evalRes.reasons.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                              <div className="space-y-2 p-4 rounded-xl bg-slate-900/30 border border-slate-900/60">
                                <strong className="text-slate-200 block">🟡 Pontos de atenção:</strong>
                                <ul className="list-disc pl-4 space-y-1 text-slate-450">
                                  {evalRes.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                              </div>
                            </div>

                            <div className="p-3 bg-brand-500/5 border border-brand-500/10 text-brand-400 rounded-xl">
                              <strong>Recomendação de Envio:</strong> {evalRes.recommendation}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Content 2: Otimizar CV */}
                      {coachTab === 'optimize-cv' && isLoadingOpt && (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                          <Loader2 className="animate-spin text-brand-500" size={24} />
                          <span>Analisando currículo e sugerindo melhorias com IA...</span>
                        </div>
                      )}

                      {coachTab === 'optimize-cv' && !optimization && !isLoadingOpt && (
                        <div className="py-12 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                          <span className="text-slate-400 text-xs">O seu currículo ainda não foi otimizado para esta vaga específica.</span>
                          <button
                            onClick={handleGenerateOptimization}
                            disabled={isGeneratingOptimization}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {isGeneratingOptimization ? (
                              <>
                                <Loader2 className="animate-spin" size={14} />
                                Otimizando...
                              </>
                            ) : (
                              'Otimizar CV para esta vaga'
                            )}
                          </button>
                        </div>
                      )}

                      {coachTab === 'optimize-cv' && optimization && (
                        <div className="space-y-4 animate-fade-in text-xs">
                          <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/30 border border-slate-900/60 relative">
                            <div className="flex justify-between items-center mb-1">
                              <strong className="text-slate-200 text-[11px]">Resumo Profissional Otimizado (sem inventar fatos):</strong>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopySummary(optimization.optimizedSummary)}
                                  className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                                >
                                  {copiedSummary ? (
                                    <>
                                      <CheckCircle size={11} className="text-emerald-500" />
                                      <span>Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clipboard size={11} />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isPro && !canExportPdf) {
                                      triggerPaywall('pdf_export');
                                      return;
                                    }
                                    if (!optimization || !selectedJob) return;
                                    const experiencesHtml = (optimization.keyExperiences || []).map((exp: any) => `
                                      <div class="card" style="margin-bottom: 12px;">
                                        <div style="font-weight: bold; color: #1e293b;">${exp.role} <span style="color: #64748b; font-weight: normal;">• ${exp.company}</span></div>
                                        <p style="margin-top: 6px;">${(exp.description || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                                      </div>
                                    `).join('');

                                    const htmlContent = `
                                      <h1>Currículo Otimizado</h1>
                                      <div style="font-size: 10pt; color: #64748b; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                                        Vaga: <strong>${selectedJob.title}</strong> | Empresa: <strong>${selectedJob.companyName || 'Empresa Confidencial'}</strong>
                                      </div>

                                      <div class="card">
                                        <div class="card-title">Resumo Profissional Otimizado</div>
                                        <p>${(optimization.optimizedSummary || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                                      </div>

                                      <h2>Reestruturação de Experiências</h2>
                                      ${experiencesHtml}

                                      <div class="grid-2" style="margin-top: 25px;">
                                        <div class="grid-col">
                                          <div class="card">
                                            <div class="card-title" style="color: #059669;">Termos a Destacar</div>
                                            <p>${(optimization.missingKeywords || []).join(', ')}</p>
                                          </div>
                                        </div>
                                        <div class="grid-col">
                                          <div class="card">
                                            <div class="card-title" style="color: #d97706;">Termos a Reduzir</div>
                                            <p>${(optimization.redundantInfo || []).join(', ')}</p>
                                          </div>
                                        </div>
                                      </div>
                                    `;
                                    printElementHtml(`Curriculo_Otimizado_${selectedJob.title.replace(/\s+/g, '_')}`, htmlContent);
                                  }}
                                  className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-[10px] text-white font-bold flex items-center gap-1 transition shadow cursor-pointer"
                                >
                                  <Printer size={11} />
                                  <span>Exportar PDF</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-350 leading-relaxed italic">"{renderFormattedMarkdown(optimization.optimizedSummary)}"</p>
                          </div>

                          <div className="space-y-2.5">
                            <strong className="text-slate-200 block">Sugestões de reestruturação para suas experiências:</strong>
                            <div className="space-y-3">
                              {optimization.keyExperiences.map((exp: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-200">{exp.role}</span>
                                    <span className="text-slate-500">{exp.company}</span>
                                  </div>
                                  <p className="text-slate-400 leading-relaxed text-[11px] mt-1">{renderFormattedMarkdown(exp.description)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-xl space-y-1">
                              <strong className="text-[10px] text-slate-500 uppercase block">Termos a destacar</strong>
                              <div className="flex flex-wrap gap-1">
                                {optimization.missingKeywords.map((k: string) => (
                                  <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{k}</span>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-xl space-y-1">
                              <strong className="text-[10px] text-slate-500 uppercase block">Termos a reduzir</strong>
                              <div className="flex flex-wrap gap-1">
                                {optimization.redundantInfo.map((r: string) => (
                                  <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">{r}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content 3: Carta de Apresentação */}
                      {coachTab === 'cover-letter' && (
                        <div className="space-y-4 animate-fade-in text-xs">
                          {coverLetter ? (
                            <div className="space-y-4">
                              <div className="flex gap-2 p-1 bg-slate-950/40 border border-slate-900 rounded-xl w-fit">
                                {(['formal', 'direct', 'executive'] as const).map((style) => (
                                  <button
                                    key={style}
                                    type="button"
                                    onClick={() => setLetterStyle(style)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all capitalize cursor-pointer ${
                                      letterStyle === style
                                        ? 'bg-brand-600 text-white shadow'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {style === 'formal' ? 'Formal' : style === 'direct' ? 'Direto / Moderno' : 'Executivo'}
                                  </button>
                                ))}
                              </div>

                              <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                                    Carta ({letterStyle === 'formal' ? 'Formal' : letterStyle === 'direct' ? 'Direta' : 'Executiva'})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = letterStyle === 'formal'
                                        ? ((coverLetter as any).textFormal || (coverLetter as any).content)
                                        : letterStyle === 'direct'
                                        ? ((coverLetter as any).textDirect || (coverLetter as any).content)
                                        : ((coverLetter as any).textExecutive || (coverLetter as any).content);
                                      navigator.clipboard.writeText(text);
                                      setToast({ message: 'Carta de apresentação copiada!', type: 'success' });
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-bold border border-slate-850 flex items-center gap-1 transition cursor-pointer"
                                  >
                                    Copiar
                                  </button>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 text-slate-300 font-mono text-[10px] leading-relaxed whitespace-pre-line">
                                  {letterStyle === 'formal'
                                    ? ((coverLetter as any).textFormal || (coverLetter as any).content)
                                    : letterStyle === 'direct'
                                    ? ((coverLetter as any).textDirect || (coverLetter as any).content)
                                    : ((coverLetter as any).textExecutive || (coverLetter as any).content)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-12 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                              <span className="text-slate-400 text-xs">Gere cartas de apresentação personalizadas com IA baseadas na vaga e empresa.</span>
                              <button
                                type="button"
                                onClick={handleGenerateCoverLetter}
                                disabled={isGeneratingLetter}
                                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow cursor-pointer text-xs"
                              >
                                {isGeneratingLetter ? 'Gerando Cartas...' : 'Gerar Cartas de Apresentação'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content 4: Perguntas STAR */}
                      {coachTab === 'interview-questions' && isLoadingPrep && (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                          <Loader2 className="animate-spin text-brand-500" size={24} />
                          <span>Mapeando perguntas prováveis e elaborando respostas STAR com IA...</span>
                        </div>
                      )}

                      {coachTab === 'interview-questions' && !prep && !isLoadingPrep && (
                        <div className="py-12 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                          <span className="text-slate-400 text-xs">As perguntas preparatórias baseadas no método STAR ainda não foram criadas para esta vaga.</span>
                          <button
                            onClick={handleGenerateInterviewPrep}
                            disabled={isGeneratingPrep}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isGeneratingPrep ? (
                              <>
                                <Loader2 className="animate-spin" size={14} />
                                Gerando Perguntas...
                              </>
                            ) : (
                              'Gerar perguntas STAR e roteiro'
                            )}
                          </button>
                        </div>
                      )}

                      {coachTab === 'interview-questions' && prep && (
                        <div className="space-y-4 animate-fade-in text-xs max-h-[420px] overflow-y-auto pr-1">
                          {/* Card Informativo do Método STAR */}
                          <div className="p-3.5 bg-brand-500/5 border border-brand-500/10 rounded-xl space-y-2 text-left">
                            <p className="font-bold text-slate-200 text-xs">💡 O que é o Método STAR?</p>
                            <p className="text-[11px] text-slate-450 leading-relaxed">
                              O método STAR é uma técnica recomendada para responder a perguntas comportamentais em entrevistas de emprego. Ele ajuda a estruturar suas respostas focando em quatro pilares:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] pt-1">
                              <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 leading-tight">
                                <strong className="text-brand-400 block font-bold">1. Situação (S)</strong>
                                Contextualize o desafio ou problema enfrentado.
                              </div>
                              <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 leading-tight">
                                <strong className="text-amber-400 block font-bold">2. Tarefa (T)</strong>
                                Explique seu papel e objetivo a ser atingido.
                              </div>
                              <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 leading-tight">
                                <strong className="text-emerald-400 block font-bold">3. Ação (A)</strong>
                                Detalhe o que fez para solucionar o desafio.
                              </div>
                              <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 leading-tight">
                                <strong className="text-indigo-400 block font-bold">4. Resultado (R)</strong>
                                Mostre os frutos e métricas obtidas.
                              </div>
                            </div>
                          </div>

                          {prep.questions.map((q: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900/60 space-y-3 text-left">
                              <div className="flex justify-between items-start gap-2">
                                <strong className="text-slate-200 text-xs">P: {q.question}</strong>
                                <span className="text-[9px] px-1.5 rounded uppercase font-extrabold bg-brand-500/10 text-brand-400">
                                  {q.type}
                                </span>
                              </div>
                              <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-lg space-y-3 text-[11px] leading-relaxed">
                                <span className="text-[9px] text-slate-500 uppercase font-bold block border-b border-slate-900 pb-1">Sugestão de Resposta (STAR):</span>
                                <div className="space-y-2.5">
                                  <div>
                                    <span className="text-brand-400 font-bold block text-[10px] uppercase tracking-wider">Situação e Tarefa (S/T)</span>
                                    <p className="text-slate-300 mt-0.5 font-sans">{q.answerStar.context}</p>
                                  </div>
                                  <div>
                                    <span className="text-emerald-400 font-bold block text-[10px] uppercase tracking-wider">Ação (A)</span>
                                    <p className="text-slate-300 mt-0.5 font-sans">{q.answerStar.action}</p>
                                  </div>
                                  <div>
                                    <span className="text-indigo-400 font-bold block text-[10px] uppercase tracking-wider">Resultado (R)</span>
                                    <p className="text-slate-300 mt-0.5 font-sans">{q.answerStar.result}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardGlass>
                  </div>
                ) : isCalculating ? (
                  <ProcessingState 
                    title="🎯 Comparando seu perfil com os requisitos da vaga..." 
                    subtitle={showDelayWarning
                      ? "Essa análise pode levar alguns segundos porque estamos comparando sua trajetória profissional."
                      : "Identificando seus pontos fortes e competências técnicas..."
                    }
                    expectedTime="Tempo estimado: alguns segundos"
                    steps={matchSteps}
                  />
                ) : (
                  <div className="h-64 rounded-2xl border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                    <Clipboard size={28} className="mb-2 text-slate-600" />
                    <span>Nenhum match calculado para esta vaga. Clique em "Calcular Match" no painel acima.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 rounded-2xl border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <Clipboard size={28} className="mb-2 text-slate-600" />
                <span>Nenhuma vaga selecionada no painel esquerdo. Cole uma vaga ou busque no painel "Job Discovery".</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Descoberta de Vagas (Discovery) */}
      {subTab === 'discover' && (() => {
        const rawScored = discoveredJobs.map(job => {
          if (!primaryResume && !careerProfileNew) {
            return { ...job, scoreOverall: 0, cpi: 0, missingSkills: [] as string[], matchedSkills: [] as string[] };
          }
          // Verificar se já existe um match completo calculado no banco de dados para essa vaga
          const jobIdStr = (job as any).id;
          const existingMatch = (matches || []).find(m => 
            (jobIdStr && m.jobId === jobIdStr) || 
            (jobIdStr && (m as any).job_id === jobIdStr) || 
            (job.sourceUrl && (m as any).sourceUrl === job.sourceUrl)
          );

          if (existingMatch) {
            const scoreOverall = existingMatch.scoreOverall ?? (existingMatch as any).score_overall ?? 0;
            const cpi = (existingMatch as any).cpi ?? scoreOverall;
            return {
              ...job,
              scoreOverall,
              cpi,
              missingSkills: (existingMatch as any).gapAnalysis?.missingSkills || [],
              matchedSkills: (existingMatch as any).gapAnalysis?.matchedSkills || []
            };
          }

          // CÁLCULO DE ADERÊNCIA REAL DO CURRÍCULO ATIVO DO CANDIDATO:
          // Se ainda não houver um match oficial no banco de dados para esta vaga,
          // calcula deterministicamente a aderência do candidato via MatchingEngine.calculateMatchSync.
          // Isso substitui o score de busca por palavra-chave do backend (ex: 99% em Cozinheiro x Cozinheiro),
          // garantindo que vagas totalmente fora da área do perfil (ex: CS x Cozinheiro) exibam pontuação condizente (~5-15%).
          const syncMatch = primaryResume ? MatchingEngine.calculateMatchSync(primaryResume, job as any, careerProfileNew) : null;
          const candidateFitScore = syncMatch ? syncMatch.scoreOverall : 15;

          return {
            ...job,
            scoreOverall: candidateFitScore,
            cpi: candidateFitScore,
            missingSkills: syncMatch?.missingSkills || (job as any).missingSkills || [],
            matchedSkills: syncMatch?.matchedSkills || (job as any).matchedSkills || []
          };
        });

        const targetLoc = (activeFilters.location || '').toLowerCase().trim();
        const targetModes = activeFilters.workModes || [];

        const hiddenDiscoveredJobs: any[] = [];

        const scoredDiscoveredJobs = rawScored.filter(job => {
          if (filterActiveOnly && job.isActive === false) return false;
          if (filterScoreOver80 && job.scoreOverall < 80 && job.cpi < 80) return false;

          // Filtragem de Modelo de Trabalho
          if (targetModes.length > 0) {
            const jMode = (job.workMode || 'onsite').toLowerCase();
            const titleLower = (job.title || '').toLowerCase();
            const modeMatches = targetModes.some(m => {
              if (m === 'remote') return jMode.includes('remot') || titleLower.includes('remot');
              if (m === 'hybrid') return jMode.includes('hibrid') || jMode.includes('híbrid') || titleLower.includes('híbrid') || titleLower.includes('hibrid');
              if (m === 'onsite') return jMode === 'onsite' || (!jMode.includes('remot') && !jMode.includes('hibrid'));
              return false;
            });
            if (!modeMatches) {
              hiddenDiscoveredJobs.push({ ...job, isHiddenByFilter: true, filterReason: `Modalidade de trabalho (${job.workMode || 'presencial'})` });
              return false;
            }
          }

          // Filtragem Metropolitana Regional de Localidade
          if (targetLoc && targetLoc !== 'brasil' && targetLoc !== 'remoto') {
            const isMetro = isMetropolitanMatch(targetLoc, job.location, job.workMode);
            if (!isMetro) {
              hiddenDiscoveredJobs.push({ ...job, isHiddenByFilter: true, filterReason: `Fora da região metropolitana (${job.location})` });
              return false;
            }
          }

          // Relevância Mínima
          const currentKw = (activeFilters.keyword || '').trim().toLowerCase();
          if (currentKw && currentKw !== 'vagas' && currentKw !== 'brasil') {
            const titleLow = (job.title || '').toLowerCase();
            const descLow = (job.description || '').toLowerCase();
            const companyLow = (job.companyName || '').toLowerCase();
            
            const stopwords = ['de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com', 'por', 'sem', 'ou', 'e', 'a', 'o'];
            const tokens = currentKw.split(/\s+/).filter((w: string) => !stopwords.includes(w) && w.length >= 2);
            
            const hasKeywordMatch = tokens.some((t: string) => titleLow.includes(t) || descLow.includes(t) || companyLow.includes(t));
            if (!hasKeywordMatch && (job.scoreOverall < 20 && job.cpi < 20)) {
              hiddenDiscoveredJobs.push({ ...job, isHiddenByFilter: true, filterReason: 'Baixa relevância com a busca' });
              return false;
            }
          }

          return true;
        }).sort((a, b) => b.cpi - a.cpi);

        const getPriorityBadge = (score: number) => {
          if (score >= 80) {
            return (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20">
                <Flame size={10} className="fill-emerald-400 shrink-0" />
                Match alto com a vaga (Aplicar Hoje)
              </span>
            );
          } else if (score >= 50) {
            return (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                <Sparkles size={10} className="shrink-0" />
                Match moderado com a vaga (Otimizar CV)
              </span>
            );
          } else {
            return (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 font-medium border border-slate-500/20">
                <AlertCircle size={10} className="shrink-0" />
                Em Análise / Capacitação Recomendada
              </span>
            );
          }
        };

        const isValidUrl = (url: string) => {
          try {
            return url && (url.startsWith('http://') || url.startsWith('https://'));
          } catch {
            return false;
          }
        };

        return (
          <div className="space-y-6">
            {fallbackLevel > 0 && fallbackTermUsed && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fade-in">
                <Info size={16} className="text-amber-400 shrink-0" />
                <span>
                  Ampliamos sua busca para incluir vagas de áreas relacionadas.
                </span>
              </div>
            )}
            {/* Warning de API não configurada */}
            {isErrorDiscovery && errorDiscovery?.message?.includes('API_NOT_CONFIGURED') ? (
              <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 max-w-lg mx-auto p-8 bg-slate-900/10">
                <AlertTriangle size={48} className="mb-4 text-amber-500 animate-pulse" />
                <h3 className="font-display font-bold text-lg text-slate-200">Adzuna API não configurada</h3>
                <p className="text-slate-400 text-xs text-center mt-2 max-w-sm leading-relaxed">
                  Para habilitar a descoberta de vagas públicas integradas com a IA, você deve configurar suas credenciais do Adzuna no cofre do Supabase:
                </p>
                <pre className="p-3.5 mt-4 rounded-xl bg-slate-950 border border-slate-900 text-[10px] text-brand-400 text-left font-mono select-all w-full overflow-x-auto">
                  supabase secrets set ADZUNA_APP_ID=seu_app_id ADZUNA_APP_KEY=sua_app_key
                </pre>
                <p className="text-slate-500 text-[10px] text-center mt-3 leading-relaxed">
                  Obtenha chaves de acesso gratuitas criando uma conta de desenvolvedor no portal oficial da Adzuna.
                </p>
              </div>
            ) : (
              <>
                {/* Barra de Filtros */}
                <CardGlass className="space-y-4">
                  <form onSubmit={handleSearchDiscovery} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <Search size={12} />
                        Palavra-chave / Cargo
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: React, Node.js"
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <MapPin size={12} />
                        Localidade
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: São Paulo, SP ou Remoto"
                        value={searchLocation}
                        onChange={e => {
                          setSearchLocation(e.target.value);
                          setShowLocationDropdown(true);
                        }}
                        onFocus={() => setShowLocationDropdown(true)}
                        onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                      {showLocationDropdown && searchLocation.trim().length >= 1 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl z-50 shadow-2xl divide-y divide-slate-900/50">
                          {BRAZILIAN_LOCATIONS.filter(loc => 
                            loc.toLowerCase().includes(searchLocation.toLowerCase())
                          ).map(loc => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setSearchLocation(loc);
                                setShowLocationDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-brand-500/10 hover:text-brand-400 transition-colors"
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <Briefcase size={12} />
                        Senioridade
                      </label>
                      <select
                        value={searchSeniority}
                        onChange={e => setSearchSeniority(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                      >
                        <option value="all">Todas as Senioridades</option>
                        <option value="junior">Júnior (Junior)</option>
                        <option value="pleno">Pleno (Pleno)</option>
                        <option value="senior">Sênior (Senior)</option>
                        <option value="lead">Lead (Lead)</option>
                        <option value="director">Diretor (Director)</option>
                      </select>
                    </div>

                    <div className="space-y-1 min-w-[140px]">
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Modelo de Trabalho</label>
                      <div className="flex flex-wrap gap-2 py-1.5">
                        {[
                          { id: 'remoto', label: 'Remoto', val: 'remote' },
                          { id: 'hibrido', label: 'Híbrido', val: 'hybrid' },
                          { id: 'presencial', label: 'Presencial', val: 'onsite' }
                        ].map(mode => {
                          const isChecked = searchWorkModes.includes(mode.val);
                          return (
                            <label key={mode.id} className="flex items-center gap-1.5 text-xs text-slate-350 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSearchWorkModes(searchWorkModes.filter(m => m !== mode.val));
                                  } else {
                                    setSearchWorkModes([...searchWorkModes, mode.val]);
                                  }
                                }}
                                className="h-3.5 w-3.5 accent-brand-500 rounded bg-slate-900 border-slate-800"
                              />
                              {mode.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingDiscovery}
                      className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 disabled:opacity-50"
                    >
                      {isLoadingDiscovery ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      Buscar Vagas
                    </button>
                  </form>

                  {/* Pre-render Filters Switchers */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-900 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none font-medium hover:text-slate-200 transition">
                        <input
                          type="checkbox"
                          checked={filterActiveOnly}
                          onChange={e => setFilterActiveOnly(e.target.checked)}
                          className="h-3.5 w-3.5 accent-brand-500 rounded bg-slate-900 border-slate-800"
                        />
                        <span>Exibir apenas vagas ativas</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none font-medium hover:text-slate-200 transition">
                        <input
                          type="checkbox"
                          checked={filterScoreOver80}
                          onChange={e => setFilterScoreOver80(e.target.checked)}
                          className="h-3.5 w-3.5 accent-brand-500 rounded bg-slate-900 border-slate-800"
                        />
                        <span className="text-emerald-400 font-semibold">Match Superior a 80% (Match alto com a vaga)</span>
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 flex-wrap">
                      <span>Exibindo {scoredDiscoveredJobs.length} vaga(s) visível(is)</span>
                    </span>
                  </div>
                </CardGlass>

                {/* Banner de Transparência dos Filtros de Localidade/Senioridade */}
                {hiddenDiscoveredJobs.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        <Filter size={16} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">
                          Filtros de Transparência: <strong>{hiddenDiscoveredJobs.length} vaga(s) adicional(is)</strong> oculta(s) por filtro de região/modalidade.
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Todas as oportunidades encontradas no mercado permanecem acessíveis para você.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHiddenJobs(prev => !prev)}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition cursor-pointer shrink-0 shadow-xs"
                    >
                      {showHiddenJobs ? 'Ocultar Vagas Filtradas' : `Ver Todas (${hiddenDiscoveredJobs.length} ocultas)`}
                    </button>
                  </div>
                )}

                {/* Banner Discreto Inline de Expansão de Busca por Área Relacionada (Cascata Camada 3+) */}
                {fallbackLevel >= 3 && fallbackTermUsed && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 text-xs shadow-lg">
                    <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">
                        Ampliamos sua busca para incluir vagas de áreas relacionadas.
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Oportunidades expandidas para a área de <strong className="text-brand-300">{fallbackTermUsed}</strong> para apresentar mais opções relevantes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Listagem de Resultados */}
                {isLoadingDiscovery ? (
                  <ProcessingState
                    title="🔎 Procurando oportunidades compatíveis..."
                    subtitle="Buscando e unificando as melhores oportunidades do mercado..."
                  />
                ) : (scoredDiscoveredJobs.length > 0 || (showHiddenJobs && hiddenDiscoveredJobs.length > 0)) ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(showHiddenJobs ? [...scoredDiscoveredJobs, ...hiddenDiscoveredJobs] : scoredDiscoveredJobs)
                        .filter(j => !trashedJobIds.has((j as any).id || (j as any).jobId))
                        .map((job, idx) => {
                        const isUnlocked = isJobUnlocked((job as any).id || (job as any).jobId || String(idx));
                        const isBlurred = !isPro && !isUnlocked && (weeklyActionCount >= 3 || idx >= 3);

                        return (
                          <CardGlass 
                            key={idx} 
                            className="flex flex-col justify-between space-y-4 hover:border-brand-500/30 transition-all relative overflow-hidden"
                          >
                            <div className="space-y-2">

                              <div className="flex justify-between items-start gap-3">
                                <div className="flex gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                  {!isPro && !canUnlockJob(String(job.id || job.jobId || '')) ? '🔒' : job.companyName?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800 truncate" title={job.title}>
                                    {job.title}
                                  </h4>
                                  <span className="text-xs text-brand-500 font-semibold truncate block">
                                    {!isPro && !canUnlockJob(String(job.id || job.jobId || '')) ? (
                                      <span className="text-slate-400 font-medium filter blur-[4px] select-none pointer-events-none" title="Empresa oculta na versão Free">
                                        Empresa Confidencial (Pro)
                                      </span>
                                    ) : (
                                      job.companyName
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 items-center flex-wrap shrink-0">
                                {(job.sources && job.sources.length > 0 ? job.sources : [job.sourcePlatform || 'JobAggregator']).map((src: string, i: number) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-800/80 text-[#4F8EF7] font-semibold">
                                    {src}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Selo de Prioridade CPI e Transparência */}
                            <div className="pt-1 flex gap-2 items-center flex-wrap">
                              {getPriorityBadge(job.scoreOverall)}
                              {(job as any).isHiddenByFilter && (
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                                  💡 Oculta: {(job as any).filterReason}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-semibold">
                                Match Estimado: {job.scoreOverall}%
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed pt-1">
                              {job.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 pt-2">
                              <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-500 font-medium">
                                {job.location}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-brand-500/10 text-[10px] text-brand-500 font-bold uppercase">
                                {job.workMode === 'remote' ? 'Remoto' : job.workMode === 'hybrid' ? 'Híbrido' : 'Presencial'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[10px] text-indigo-400 font-bold uppercase">
                                {job.seniority}
                              </span>
                              {job.salary && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 font-bold">
                                  {job.salary}
                                </span>
                              )}
                            </div>

                            {/* Detalhamento de Relevância e Explainability (VSR) */}
                            {job.scores && job.scores.explanation && (
                              <div className="mt-2 text-[10px] text-slate-400 bg-slate-900/40 dark:bg-slate-950/40 light:bg-slate-100/50 border border-slate-800/40 dark:border-slate-800/50 light:border-slate-200 rounded-xl p-2.5 space-y-1">
                                <div className="flex justify-between items-center text-slate-350 dark:text-slate-350 light:text-slate-700">
                                  <span className="font-semibold flex items-center gap-1.5">
                                    🔍 Relevância da Busca: <span className={job.scores.overall >= 80 ? 'text-emerald-400 font-bold' : job.scores.overall >= 70 ? 'text-indigo-400 font-bold' : 'text-slate-400 font-bold'}>{job.scores.overall}%</span> 
                                    <span className="text-[8px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400">
                                      {job.scores.confidence === 'high' ? 'Alta Confiança' : 'Média Confiança'}
                                    </span>
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-600 italic font-mono leading-normal">{job.scores.explanation}</p>
                                
                                {((job.scores.adjustments?.boosts && job.scores.adjustments.boosts.length > 0) || 
                                  (job.scores.adjustments?.penalties && job.scores.adjustments.penalties.length > 0)) && (
                                  <div className="pt-1 flex gap-1.5 flex-wrap text-[8px] font-bold">
                                    {job.scores.adjustments.boosts?.map((b: string, i: number) => (
                                      <span key={i} className="text-emerald-500 dark:text-emerald-400 bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-900/30">
                                        {b}
                                      </span>
                                    ))}
                                    {job.scores.adjustments.penalties?.map((p: string, i: number) => (
                                      <span key={i} className="text-red-500 dark:text-red-400 bg-red-950/20 px-1 py-0.5 rounded border border-red-900/30">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Exibição de lacunas de competências */}
                            <div className="pt-2 border-t border-slate-900/60 text-[10px] text-slate-400">
                              {job.missingSkills.length > 0 ? (
                                <div className="flex gap-1.5 items-start">
                                  <span className="text-red-400 font-semibold">Gaps técnicos:</span>
                                  <span className="text-slate-500 line-clamp-1">{job.missingSkills.join(', ')}</span>
                                </div>
                              ) : (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle size={10} />
                                  Perfil 100% alinhado com a vaga!
                                </span>
                              )}
                            </div>

                            {isBlurred && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerPaywall('weekly_limit');
                                }}
                                className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/40 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-500/80 transition-all shadow-lg my-1"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-amber-400 text-base shrink-0">🔒</span>
                                  <div className="text-left">
                                    <p className="text-xs font-extrabold text-slate-200">Análise Estratégica & Copiloto Protegidos</p>
                                    <p className="text-[10px] text-slate-400">Desbloqueie Matching IA Gemini, ATS & Candidaturas</p>
                                  </div>
                                </div>
                                <button className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shrink-0 transition-colors shadow">
                                  Desbloquear Vaga
                                </button>
                              </div>
                            )}

                          </div>


                          <div className="pt-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 flex justify-between items-center gap-4">

                            {isValidUrl(job.sourceUrl || '') ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyClick(job);
                                }}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition"
                              >
                                <span>Me candidatar</span>
                                <ArrowUpRight size={12} />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-650 cursor-not-allowed flex items-center gap-1" title="Link original indisponível para esta oportunidade simulada">
                                Link indisponível
                              </span>
                            )}
                            
                            <div className="flex gap-2 flex-wrap">
                              {onStartSimulation && (
                                <button
                                  onClick={() => handleSimulateDiscovery(job)}
                                  disabled={isImporting}
                                  className="px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 hover:bg-brand-500/20 text-brand-400 font-bold text-xs flex items-center gap-1.5 shadow disabled:opacity-50"
                                >
                                  🎤 Simular Entrevista
                                </button>
                              )}

                              <button
                                onClick={() => handleImportAndMatch(job)}
                                disabled={isImporting}
                                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow shadow-brand-500/10 disabled:opacity-50"
                              >
                                Importar e Analisar Match
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        </CardGlass>
                      );
                    })}
                    </div>

                    {/* Controles de Paginação com suporte a navegação remota contínua */}
                    {(() => {
                      const itemsPerPage = 15;
                      const calculatedTotalPages = Math.max(1, Math.ceil((totalCount || scoredDiscoveredJobs.length) / itemsPerPage));
                      const totalPages = calculatedTotalPages;
                      const safePage = Math.min(Math.max(1, searchPage), totalPages);

                      return (
                        <div className="flex flex-col items-center gap-3 pt-6 border-t border-slate-900/60 select-none">
                          <div className="flex justify-center items-center gap-4">
                            <button
                              onClick={() => {
                                setSearchPage(p => Math.max(1, p - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              disabled={safePage <= 1 || isLoadingDiscovery}
                              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-bold transition-all shadow-sm cursor-pointer"
                            >
                              Anterior
                            </button>
                            
                            <span className="text-xs text-slate-300 dark:text-slate-300 font-bold px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-lg">
                              Página {safePage} de {totalPages}
                            </span>

                            <button
                              onClick={() => {
                                setSearchPage(p => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              disabled={isLoadingDiscovery || safePage >= totalPages}
                              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white border border-brand-500 disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-bold transition-all shadow-sm shadow-brand-500/20 cursor-pointer"
                            >
                              Próxima
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Exibindo {scoredDiscoveredJobs.length} vagas nesta página (Página {safePage})
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <EmptyState
                    title="🔍 Ainda não encontramos vagas compatíveis"
                    message="Não localizamos vagas públicas com os filtros fornecidos. Tente ajustar os termos ou alterar a cidade na barra de pesquisa acima."
                    suggestions={[
                      "Remover ou simplificar termos de busca adicionais",
                      "Alterar ou ampliar a localidade (ex: de Cidade para Estado/País)",
                      "Alternar a opção 'Apenas Remoto'",
                      "Cadastrar novas competências e experiências no perfil para ampliar a taxonomia"
                    ]}
                    actionText="Restaurar Busca Padrão"
                    onAction={() => {
                      setSearchKeyword(initialKeyword);
                      setSearchLocation(initialLocation);
                      setActiveFilters({
                        keyword: initialKeyword,
                        location: initialLocation,
                        remoteOnly: initialRemote,
                        workModes: initialRemote ? ['remote'] : ['remote', 'hybrid', 'onsite'],
                        seniority: 'all'
                      });
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      })()}

      {subTab === 'trash' && (
        <CardGlass className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-200 flex items-center gap-2">
                <Trash2 className="text-red-400" size={20} />
                Lixeira de Vagas Excluídas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vagas removidas temporariamente. Você pode restaurá-las para a lista de Vagas Disponíveis ou excluí-las permanentemente.
              </p>
            </div>
            {trashedJobs.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Tem certeza que deseja esvaziar a lixeira e excluir permanentemente todas as vagas contidas nela?')) {
                    const linkedAppJobIds = new Set(applications.map(a => a.jobId));
                    let deletedCount = 0;
                    let skippedCount = 0;
                    for (const item of trashedJobs) {
                      if (linkedAppJobIds.has(item.id)) {
                        skippedCount++;
                      } else {
                        if (onDeleteJob) await onDeleteJob(item.id);
                        deletedCount++;
                      }
                    }
                    clearTrash();
                    if (skippedCount > 0) {
                      showToast(`${deletedCount} vaga(s) removida(s). ${skippedCount} vaga(s) mantida(s) por possuírem candidatura ativa no Pipeline.`, 'warning');
                    } else {
                      showToast('Lixeira esvaziada com sucesso.', 'success');
                    }
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center shadow-md shadow-red-950/20"
              >
                <Trash2 size={14} />
                Esvaziar Lixeira
              </button>
            )}
          </div>

          {trashedJobs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Trash2 size={36} className="mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">Sua lixeira está vazia</p>
              <p className="text-xs text-slate-500">Nenhuma vaga foi excluída recentemente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trashedJobs.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-slate-200">{item.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(item.deletedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-brand-400 font-medium mt-0.5">{item.companyName}</p>
                    {item.location && <p className="text-[10px] text-slate-500 mt-1">{item.location}</p>}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        restoreFromTrash(item.id);
                        showToast(`Vaga "${item.title}" restaurada para Vagas Disponíveis!`, 'success');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      Restaurar Vaga
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const linkedApp = applications.find(a => String(a.jobId) === String(item.id) || String(a.id) === String(item.id));
                        let confirmMsg = `Excluir permanentemente a vaga "${item.title}"? Esta ação não pode ser desfeita.`;
                        if (linkedApp) {
                          confirmMsg = `A vaga "${item.title}" possui uma candidatura ativa no seu Kanban. Deseja excluir permanentemente a vaga E a candidatura do Kanban?`;
                        }

                        if (window.confirm(confirmMsg)) {
                          try {
                            if (linkedApp && onDeleteApplication) {
                              await onDeleteApplication(linkedApp.id);
                            }
                            await removeFromTrash(item.id);
                            if (onDeleteJob) await onDeleteJob(item.id);
                            showToast(`Vaga "${item.title}" excluída permanentemente.`, 'success');
                          } catch (err: any) {
                            showToast(err?.message || `Não foi possível excluir a vaga "${item.title}".`, 'error');
                          }
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Excluir permanentemente"
                    >
                      <Trash2 size={13} />
                      Excluir Definitivamente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardGlass>
      )}

      <PaywallModal
        isOpen={paywallState.isOpen}
        onClose={closePaywall}
        feature={paywallState.feature}
        title={paywallState.title}
        description={paywallState.description}
        primaryButtonText={paywallState.primaryButtonText}
        secondaryButtonText={paywallState.secondaryButtonText}
        onUpgrade={() => setShowCheckout(true)}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        userId={user?.id}
        userEmail={user?.email}
        userName={user?.email?.split('@')[0]}
      />

      {user?.id && (
        <ProductValidationSurveyModal
          isOpen={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
          userId={user.id}
          userEmail={user.email || ''}
          cohort={surveyCohort}
          isHighIntent={isPro || (matches?.length || 0) >= 3}
        />
      )}
    </div>
  );
}

