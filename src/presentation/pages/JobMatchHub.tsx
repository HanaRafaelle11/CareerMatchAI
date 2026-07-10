import { useState, type FormEvent, useEffect, useRef } from 'react';
import { CardGlass } from '../components/CardGlass';
import { RadarChart } from '../components/RadarChart';
import { useJobDiscovery } from '../../application/hooks/useJobDiscovery';
import { useCoach } from '../../application/hooks/useCoach';
import { CareerCoachService } from '../../application/services/CareerCoachService';
import { MatchingEngine } from '../../application/services/matchingEngine';
import type { Job, Resume, Match, CareerProfile } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { Play, Clipboard, Award, CheckCircle, AlertTriangle, AlertCircle, X, ChevronRight, BookOpen, Plus, Search, MapPin, Loader2, ArrowUpRight, Flame, Sparkles, Trash2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { AppError } from '../../application/errors/AppError';
import { ErrorState, EmptyState, ProcessingState } from '../components/ErrorVisuals';

interface JobMatchHubProps {
  userId: string | undefined;
  resumes: Resume[];
  jobs: Job[];
  matches: Match[];
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  onCreateJob: (data: { title: string; description: string; requirements: string[] }) => Promise<any>;
  onCalculateMatch: (data: { resume: Resume; job: Job; consolidatedProfile?: CareerProfileNew | null }) => Promise<any>;
  getMatchDetails: (matchId: string) => { data: any; isLoading: boolean };
  isCreating: boolean;
  isCalculating: boolean;
}

export function JobMatchHub({
  userId,
  resumes,
  jobs,
  matches,
  careerProfile,
  careerProfileNew,
  onCreateJob,
  onCalculateMatch,
  getMatchDetails,
  isCreating,
  isCalculating
}: JobMatchHubProps) {
  const [subTab, setSubTab] = useState<'my-jobs' | 'discover'>('my-jobs');
  const [coachTab, setCoachTab] = useState<'coach-evaluation' | 'optimize-cv' | 'cover-letter' | 'interview-questions'>('coach-evaluation');
  const [isDeletingAnalyses, setIsDeletingAnalyses] = useState(false);
  const [appError, setAppError] = useState<AppError | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id || null);

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];

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
    const currentResumeId = primaryResume?.id || null;
    if (prevResumeIdRef.current !== null && prevResumeIdRef.current !== currentResumeId) {
      // O currículo mudou! Limpar contexto
      setSelectedJobId(null);
      
      // Limpar filtros/descoberta na sessionStorage
      sessionStorage.removeItem('job_search_keyword');
      sessionStorage.removeItem('job_search_location');
      sessionStorage.removeItem('job_search_remote');
      sessionStorage.removeItem('job_search_page');
      sessionStorage.removeItem('job_search_input_keyword');
      sessionStorage.removeItem('job_search_input_location');
      sessionStorage.removeItem('job_search_input_remote');
      
      // Resetar states locais
      setSearchKeyword('');
      setSearchLocation('Brasil');
      setSearchRemoteOnly(true);
      setSearchPage(1);
      setActiveFilters({
        keyword: '',
        location: 'Brasil',
        remoteOnly: true
      });
      setErrorMsg('');
      setAppError(null);
    }
    prevResumeIdRef.current = currentResumeId;
  }, [primaryResume?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    if (!userId || !primaryResume || !isSupabaseConfigured || !supabase) return;
    
    const confirm = window.confirm("Você irá remover todas as análises feitas pela IA deste currículo. Deseja continuar?");
    if (!confirm) return;

    try {
      setIsDeletingAnalyses(true);
      
      // 1. Apagar da tabela public.resume_versions (as restrições cascade do banco apagam career_profiles, career_insights e job_matches em cascata)
      if (primaryResume.resumeVersionId) {
        console.log(`[CLEANUP] Removendo versão do currículo: ${primaryResume.resumeVersionId}`);
        const { error: rvError } = await supabase
          .from('resume_versions')
          .delete()
          .eq('id', primaryResume.resumeVersionId);
        if (rvError) throw rvError;
      }

      // 2. Apagar da tabela public.resumes (deleta matches em cascata)
      console.log(`[CLEANUP] Removendo currículo legado: ${primaryResume.id}`);
      const { error: rError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', primaryResume.id);
      if (rError) throw rError;

      alert("Análises deste currículo apagadas com sucesso!");
      window.location.reload();
    } catch (err: any) {
      console.error("Erro ao apagar análises:", err);
      const formatted = AppError.from(err);
      setAppError(formatted);
      AppError.logError(err, supabase, 'JobMatchHub.handleDeleteAnalyses', userId);
    } finally {
      setIsDeletingAnalyses(false);
    }
  };
  
  const { 
    getResumeOptimizationQuery, 
    getCoverLetterQuery, 
    generateCoverLetter, 
    isGeneratingLetter, 
    getInterviewPrepQuery 
  } = useCoach(userId);

  const [showAddForm, setShowAddForm] = useState(false);
  
  // States para colagem manual de vaga
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // States para a descoberta de vagas baseada no Career Profile ou fallback
  const initialKeyword = sessionStorage.getItem('job_search_keyword') || careerProfile?.searchKeywords?.[0] || primaryResume?.skills?.[0]?.name || 'React';
  const initialLocation = sessionStorage.getItem('job_search_location') || careerProfile?.preferredLocations?.[0] || 'Brasil';
  
  const storedRemote = sessionStorage.getItem('job_search_remote');
  const initialRemote = storedRemote !== null ? storedRemote === 'true' : (careerProfile ? careerProfile.preferredWorkModes.includes('remote') : true);

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
  
  const [activeFilters, setActiveFilters] = useState({
    keyword: initialKeyword,
    location: initialLocation,
    remoteOnly: initialRemote
  });

  // Salvar entradas do usuário e filtros ativos na sessionStorage para manter o estado ao navegar
  useEffect(() => {
    sessionStorage.setItem('job_search_keyword', activeFilters.keyword);
    sessionStorage.setItem('job_search_location', activeFilters.location);
    sessionStorage.setItem('job_search_remote', String(activeFilters.remoteOnly));
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

  // Gatilho de redirecionamento automático do Dashboard
  useEffect(() => {
    const trigger = localStorage.getItem('careermatch_trigger_discovery');
    if (trigger === 'true' && careerProfile) {
      localStorage.removeItem('careermatch_trigger_discovery');
      setSubTab('discover');
      
      const keyword = careerProfile.searchKeywords[0] || 'React';
      const loc = careerProfile.preferredLocations[0] || 'Brasil';
      const isRemote = careerProfile.preferredWorkModes.includes('remote');
      
      setSearchKeyword(keyword);
      setSearchLocation(loc);
      setSearchRemoteOnly(isRemote);
      
      setActiveFilters({
        keyword,
        location: loc,
        remoteOnly: isRemote
      });
    }
  }, [careerProfile]);

  const { data: optimization = null } = getResumeOptimizationQuery(primaryResume || null, selectedJob || null);
  const { data: prep = null } = getInterviewPrepQuery(primaryResume || null, selectedJob || null);
  const mockAppId = selectedJob ? `app-mock-${selectedJob.id}` : undefined;
  const { data: coverLetter = null } = getCoverLetterQuery(mockAppId);
  const currentMatch = selectedJob ? matches.find(m => m.jobId === selectedJob.id) : null;
  const { data: matchDetails } = getMatchDetails(currentMatch?.id || '');

  // Hook do módulo de Job Discovery — passa searchPage e careerProfileNew
  const { 
    discoveredJobs, 
    totalCount,
    isLoading: isLoadingDiscovery, 
    isError: isErrorDiscovery,
    error: errorDiscovery,
    importJob, 
    isImporting 
  } = useJobDiscovery(userId, {
    keyword: activeFilters.keyword,
    location: activeFilters.location,
    remoteOnly: activeFilters.remoteOnly,
    page: searchPage
  }, careerProfileNew);

  const handleAddJob = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title || !description) {
      setErrorMsg('Título e descrição da vaga são obrigatórios.');
      return;
    }

    const reqs = requirementsInput
      .split(',')
      .map(r => r.trim())
      .filter(Boolean);

    try {
      const newJob = await onCreateJob({
        title,
        description,
        requirements: reqs.length > 0 ? reqs : ['React', 'TypeScript', 'Node.js']
      });
      setTitle('');
      setDescription('');
      setRequirementsInput('');
      setShowAddForm(false);
      setSelectedJobId(newJob.id);
    } catch (err: any) {
      const formatted = AppError.from(err);
      setAppError(formatted);
      AppError.logError(err, supabase, 'JobMatchHub.handleAddJob', userId);
    }
  };

  const handleTriggerMatch = async (targetJob?: Job) => {
    const jobToMatch = targetJob || selectedJob;
    if (!primaryResume) {
      setErrorMsg('Por favor, faça o upload de um currículo antes de calcular o Match.');
      return;
    }
    if (!jobToMatch) return;

    setErrorMsg('');
    setAppError(null);
    try {
      await onCalculateMatch({
        resume: primaryResume,
        job: jobToMatch,
        consolidatedProfile: careerProfileNew  // injeta o perfil consolidado
      });
    } catch (err: any) {
      const formatted = AppError.from(err);
      setAppError(formatted);
      AppError.logError(err, supabase, 'JobMatchHub.handleTriggerMatch', userId);
    }
  };

  const handleSearchDiscovery = (e: FormEvent) => {
    e.preventDefault();
    setActiveFilters({
      keyword: searchKeyword,
      location: searchLocation,
      remoteOnly: searchRemoteOnly
    });
  };

  const handleImportAndMatch = async (discJob: any) => {
    setErrorMsg('');
    setAppError(null);
    try {
      // Importa a vaga para a lista do usuário
      const imported = await importJob(discJob);
      setSelectedJobId(imported.id);
      setSubTab('my-jobs');
      
      // Executa o match automaticamente
      await handleTriggerMatch(imported as any);
    } catch (err: any) {
      const formatted = AppError.from(err);
      setAppError(formatted);
      AppError.logError(err, supabase, 'JobMatchHub.handleImportAndMatch', userId);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-2">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
            Módulo de Vagas
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
            Encontre vagas compatíveis via buscas ou analise descrições de cargos manualmente.
          </p>
        </div>
        <div className="flex gap-3">
          {primaryResume && (
            <button
              onClick={handleDeleteAnalyses}
              disabled={isDeletingAnalyses}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/20 border border-red-900/30 hover:border-red-900/60 text-red-400 font-semibold text-sm transition-all disabled:opacity-50"
              title="Excluir todas as análises feitas pela IA deste currículo"
            >
              {isDeletingAnalyses ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Excluir minhas análises
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <Plus size={16} />
            Colar Nova Vaga
          </button>
        </div>
      </div>

      {/* Sub Tabs switcher */}
      <div className="flex border-b border-slate-800 dark:border-slate-800 light:border-slate-200 gap-6">
        <button
          onClick={() => setSubTab('my-jobs')}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            subTab === 'my-jobs'
              ? 'text-brand-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {subTab === 'my-jobs' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
          Minhas Análises
        </button>
        <button
          onClick={() => setSubTab('discover')}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            subTab === 'discover'
              ? 'text-brand-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {subTab === 'discover' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500" />}
          Descoberta de Vagas (Discovery)
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

      {/* Modal de colagem de vaga manual */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CardGlass className="w-full max-w-lg space-y-6 relative border border-slate-800">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-200">
                Colar Nova Vaga de Emprego
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Insira as especificações abaixo para a IA mapear.
              </p>
            </div>
            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Título do Cargo</label>
                <input
                  type="text"
                  placeholder="Ex: Senior Frontend Engineer"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-sm text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Descrição / Escopo da Vaga</label>
                <textarea
                  placeholder="Cole aqui a descrição completa da vaga..."
                  rows={6}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-sm text-slate-200 resize-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Stacks / Requisitos Principais (Separados por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: React, Next.js, Node.js, GraphQL"
                  value={requirementsInput}
                  onChange={e => setRequirementsInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-sm text-slate-200"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/10 disabled:opacity-50"
                >
                  {isCreating ? 'Salvando...' : 'Salvar Vaga'}
                </button>
              </div>
            </form>
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
                {jobs.map(job => {
                  const isActive = job.id === selectedJobId;
                  const match = matches.find(m => m.jobId === job.id);
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all text-xs flex justify-between items-center ${
                        isActive
                          ? 'bg-brand-500/10 border-brand-500/30 text-slate-200'
                          : 'bg-slate-900/20 dark:bg-slate-900/20 light:bg-slate-50 border-slate-900 dark:border-slate-900 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-700 hover:border-slate-800'
                      }`}
                    >
                      <div className="truncate max-w-[150px]">
                        <h4 className="font-bold truncate text-slate-200 dark:text-slate-200 light:text-slate-800">{job.title}</h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{job.companyName}</p>
                      </div>
                      {match ? (
                        <span className={`font-bold font-display text-xs px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800 ${
                          match.scoreOverall >= 85 ? 'text-brand-500' : match.scoreOverall >= 70 ? 'text-amber-500' : 'text-slate-500'
                        }`}>
                          {match.scoreOverall}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-800 px-2 py-0.5 rounded-lg">Sem Match</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardGlass>
          </div>

          {/* Coluna Direita: Análise de Match & Gap Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {selectedJob ? (
              <div className="space-y-6">
                {/* Descrição e Trigger */}
                <CardGlass className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 font-semibold uppercase tracking-wider">
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
                        Calcular Compatibilidade
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

                {/* Resultados de Compatibilidade */}
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
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compatibilidade Geral</span>
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
                                ? 'Seu currículo possui um excelente alinhamento com os requisitos técnicos e comportamentais exigidos por esta oportunidade.'
                                : currentMatch.scoreOverall >= 70
                                ? 'Há uma boa compatibilidade com os requisitos principais. Com pequenos ajustes, suas chances podem aumentar ainda mais.'
                                : 'Compatibilidade moderada. Recomendamos otimizar as seções e palavras-chave de seu currículo para esta oportunidade.'}
                            </p>
                          </div>
                          
                          <div className="pt-2 border-t border-slate-900">
                            <button
                              onClick={() => setCoachTab('optimize-cv')}
                              className="w-full py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase transition font-display flex items-center justify-center gap-1"
                            >
                              <Sparkles size={11} />
                              Melhorar meu currículo para essa vaga
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                            <div>
                              <span className="text-[10px] text-slate-500 block font-semibold">Técnico</span>
                              <span className="text-sm font-bold text-slate-300 dark:text-slate-300 light:text-slate-700">{currentMatch.scoreTechnical}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block font-semibold">Comportamental</span>
                              <span className="text-sm font-bold text-slate-300 dark:text-slate-300 light:text-slate-700">{currentMatch.scoreBehavioral}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block font-semibold">Senioridade</span>
                              <span className="text-sm font-bold text-slate-300 dark:text-slate-300 light:text-slate-700">{currentMatch.scoreSeniority}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block font-semibold">Localização</span>
                              <span className="text-sm font-bold text-slate-300 dark:text-slate-300 light:text-slate-700">{currentMatch.scoreLocation}%</span>
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
                    <CardGlass className="p-6 space-y-6 border border-brand-500/20">
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
                              onClick={() => setCoachTab(tab.id as any)}
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
                          careerProfileNew  // passa o perfil consolidado
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
                      {coachTab === 'optimize-cv' && optimization && (
                        <div className="space-y-4 animate-fade-in text-xs">
                          <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/30 border border-slate-900/60">
                            <strong className="text-slate-200 block text-[11px]">Resumo Profissional Otimizado (sem inventar fatos):</strong>
                            <p className="text-slate-350 leading-relaxed italic">"{optimization.optimizedSummary}"</p>
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
                                  <p className="text-slate-400 leading-relaxed text-[11px] mt-1">{exp.description}</p>
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
                              <div className="space-y-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">Estilo Formal</span>
                                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-slate-300 font-mono text-[10px] leading-relaxed whitespace-pre-line">
                                  {(coverLetter as any).textFormal || (coverLetter as any).content}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">Estilo Direto</span>
                                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-slate-300 font-mono text-[10px] leading-relaxed whitespace-pre-line">
                                  {(coverLetter as any).textDirect || (coverLetter as any).content}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">Estilo Executivo</span>
                                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-slate-300 font-mono text-[10px] leading-relaxed whitespace-pre-line">
                                  {(coverLetter as any).textExecutive || (coverLetter as any).content}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-12 border border-dashed border-slate-900 rounded-xl flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                              <span>Gere apresentações customizadas com IA baseadas no perfil da vaga e da empresa.</span>
                              <button
                                type="button"
                                onClick={() => generateCoverLetter({ applicationId: mockAppId!, jobTitle: selectedJob!.title, companyName: selectedJob!.companyName })}
                                disabled={isGeneratingLetter}
                                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow"
                              >
                                {isGeneratingLetter ? 'Gerando Cartas...' : 'Gerar Cartas de Apresentação'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content 4: Perguntas STAR */}
                      {coachTab === 'interview-questions' && prep && (
                        <div className="space-y-4 animate-fade-in text-xs max-h-[350px] overflow-y-auto pr-1">
                          {prep.questions.map((q, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900/60 space-y-3 text-left">
                              <div className="flex justify-between items-start gap-2">
                                <strong className="text-slate-200 text-xs">P: {q.question}</strong>
                                <span className="text-[9px] px-1.5 rounded uppercase font-extrabold bg-brand-500/10 text-brand-400">
                                  {q.type}
                                </span>
                              </div>
                              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg space-y-1.5 text-[11px] leading-relaxed">
                                <span className="text-[9px] text-slate-500 uppercase font-bold block">Sugestão de Resposta (STAR):</span>
                                <div><strong>S/C:</strong> {q.answerStar.context}</div>
                                <div><strong>Ação:</strong> {q.answerStar.action}</div>
                                <div><strong>Result:</strong> {q.answerStar.result}</div>
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
                      ? "Essa análise pode levar alguns segundos porque estamos comparando sua trajetória com inteligência artificial."
                      : "Encontramos pontos fortes no seu perfil..."
                    }
                    expectedTime="Tempo esperado: ~12 segundos"
                    steps={matchSteps}
                  />
                ) : (
                  <div className="h-64 rounded-2xl border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                    <Clipboard size={28} className="mb-2 text-slate-600" />
                    <span>Nenhum match calculado para esta vaga. Clique em "Calcular Compatibilidade" no painel acima.</span>
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
        const scoredDiscoveredJobs = discoveredJobs.map(job => {
          if (!primaryResume) {
            return { ...job, scoreOverall: 0, cpi: 0, missingSkills: [] as string[], matchedSkills: [] as string[] };
          }
          // Usa o perfil consolidado como fonte primária
          const analysis = MatchingEngine.calculateMatchSync(primaryResume, job, careerProfileNew);
          const recencyBonus = 10;
          const skillsGapBonus = Math.max(0, 10 - (analysis.missingSkills.length * 2.5));
          const cpi = Math.round(
            (analysis.scoreOverall * 0.60) +
            (analysis.scoreTechnical * 0.20) +
            recencyBonus +
            skillsGapBonus
          );

          return {
            ...job,
            scoreOverall: analysis.scoreOverall,
            cpi,
            missingSkills: analysis.missingSkills,
            matchedSkills: analysis.matchedSkills || []
          };
        }).sort((a, b) => b.cpi - a.cpi);

        const getPriorityBadge = (cpi: number) => {
          if (cpi >= 85) {
            return (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20">
                <Flame size={10} className="fill-emerald-400 shrink-0" />
                Prioridade Máxima (Aplicar Hoje)
              </span>
            );
          } else if (cpi >= 70) {
            return (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                <Sparkles size={10} className="shrink-0" />
                Prioridade Média (Otimizar CV)
              </span>
            );
          } else {
            return (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 font-medium border border-slate-500/20">
                <AlertCircle size={10} className="shrink-0" />
                Prioridade Baixa (Capacitação)
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
            {/* Seção explicativa da busca automatizada com o perfil */}
            {careerProfileNew ? (
              <CardGlass className="p-4 bg-slate-900/30 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">Busca Inteligente Ativa</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    A IA gerou buscas para: <strong className="text-slate-100">{((careerProfileNew.personal as any)?.preferences?.targetRoles)?.join(', ') || careerProfileNew.personal?.headline || 'Seus cargos desejados'}</strong>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {((careerProfileNew.personal as any)?.preferences?.targetRoles || []).slice(0, 3).map((role: string, i: number) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[9px] font-semibold border border-brand-500/20 uppercase">
                      {role}
                    </span>
                  ))}
                </div>
              </CardGlass>
            ) : careerProfile && (
              <CardGlass className="p-4 bg-slate-900/30 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">Filtro Inteligente Ativo</span>
                  <p className="text-xs text-slate-300 mt-1">
                    Buscando vagas para <strong className="text-slate-100">{careerProfile.targetRoles.join(', ')}</strong>.
                  </p>
                </div>
              </CardGlass>
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
                <CardGlass>
                  <form onSubmit={handleSearchDiscovery} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <Search size={12} />
                        Palavra-chave adicional
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: React, Node.js"
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <MapPin size={12} />
                        Localidade
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Brasil, Remoto"
                        value={searchLocation}
                        onChange={e => setSearchLocation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                      />
                    </div>

                    <div className="flex items-center gap-2 h-10 px-2 select-none">
                      <input
                        type="checkbox"
                        id="remote-only"
                        checked={searchRemoteOnly}
                        onChange={e => setSearchRemoteOnly(e.target.checked)}
                        className="h-4 w-4 accent-brand-500 rounded bg-slate-900 border-slate-800 cursor-pointer"
                      />
                      <label htmlFor="remote-only" className="text-xs font-semibold text-slate-400 cursor-pointer">
                        Apenas Remoto
                      </label>
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
                </CardGlass>

                {/* Listagem de Resultados */}
                {isLoadingDiscovery ? (
                  <ProcessingState
                    title="🔎 Procurando oportunidades compatíveis..."
                    subtitle="Consultando bases de dados do Adzuna e unificando vagas com IA."
                  />
                ) : scoredDiscoveredJobs.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {scoredDiscoveredJobs.map((job, idx) => (
                        <CardGlass key={idx} className="flex flex-col justify-between space-y-4 hover:border-slate-800">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800">
                                  {job.title}
                                </h4>
                                <span className="text-xs text-brand-500 font-semibold">{job.companyName}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-semibold shrink-0">
                                {job.sourcePlatform}
                              </span>
                            </div>

                            {/* Selo de Prioridade CPI */}
                            <div className="pt-1 flex gap-2 items-center flex-wrap">
                              {getPriorityBadge(job.cpi)}
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
                                {job.workMode}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[10px] text-indigo-400 font-bold uppercase">
                                {job.seniority}
                              </span>
                            </div>

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
                          </div>

                          <div className="pt-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 flex justify-between items-center gap-4">
                            {isValidUrl(job.sourceUrl || '') ? (
                              <a
                                href={job.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                              >
                                Ver vaga original
                                <ArrowUpRight size={12} />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-650 cursor-not-allowed flex items-center gap-1" title="Link original indisponível para esta oportunidade simulada">
                                Link indisponível
                              </span>
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
                        </CardGlass>
                      ))}
                    </div>

                     {/* Controles de Paginação */}
                     <div className="flex flex-col items-center gap-3 pt-6 border-t border-slate-900/60 select-none">
                       <div className="flex justify-center items-center gap-4">
                         <button
                           onClick={() => {
                             setSearchPage(p => Math.max(1, p - 1));
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           disabled={searchPage === 1 || isLoadingDiscovery}
                           className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all"
                         >
                           Anterior
                         </button>
                         
                         <span className="text-xs text-slate-400 font-semibold">
                           Página {searchPage} de {Math.max(1, Math.ceil(totalCount / 15))}
                         </span>

                         <button
                           onClick={() => {
                             setSearchPage(p => p + 1);
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           disabled={isLoadingDiscovery || scoredDiscoveredJobs.length < 15 || searchPage >= Math.ceil(totalCount / 15)}
                           className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all"
                         >
                           Próxima
                         </button>
                       </div>
                       <div className="text-[10px] text-slate-500 font-medium">
                         Mostrando {scoredDiscoveredJobs.length} resultados nesta página (Total encontrado: {totalCount})
                       </div>
                     </div>
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
                        remoteOnly: initialRemote
                      });
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}
