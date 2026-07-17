import { useState, type FormEvent, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CardGlass } from '../components/CardGlass';
import { RadarChart } from '../components/RadarChart';
import { useJobDiscovery } from '../../application/hooks/useJobDiscovery';
import { useCoach } from '../../application/hooks/useCoach';
import { CareerCoachService } from '../../application/services/CareerCoachService';
import { MatchingEngine } from '../../application/services/matchingEngine';
import type { Job, Resume, Match, CareerProfile } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { Play, Clipboard, Award, CheckCircle, AlertTriangle, AlertCircle, X, ChevronRight, BookOpen, Plus, Search, MapPin, Loader2, ArrowUpRight, Flame, Sparkles, Trash2, Briefcase, Heart, DollarSign, Building, FileText } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { AppError } from '../../application/errors/AppError';
import { ErrorState, EmptyState, ProcessingState } from '../components/ErrorVisuals';
import { ProgressRing } from '../components/ds';
import { jobIngestionService } from '../../application/services/JobIngestionService';
import type { IngestionResult } from '../../application/services/parsers/BaseJobParser';

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
  setActiveTab?: (tab: string) => void;
  selectedJobId?: string | null;
  onSelectJob?: (id: string | null) => void;
  onStartSimulation?: (target: Job | string) => void;
  initialSubTab?: 'my-jobs' | 'discover';
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
  setActiveTab,
  selectedJobId: propSelectedJobId,
  onSelectJob: propOnSelectJob,
  onStartSimulation,
  initialSubTab
}: JobMatchHubProps) {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'my-jobs' | 'discover'>(initialSubTab || 'discover');
  
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [coachTab, setCoachTab] = useState<'coach-evaluation' | 'optimize-cv' | 'cover-letter' | 'interview-questions'>('coach-evaluation');
  const [isDeletingAnalyses, setIsDeletingAnalyses] = useState(false);
  const [letterStyle, setLetterStyle] = useState<'formal' | 'direct' | 'executive'>('formal');
  const [appError, setAppError] = useState<AppError | null>(null);
  const [isAddingToStrategy, setIsAddingToStrategy] = useState(false);
  const [manualStrategyStatus, setManualStrategyStatus] = useState<string>('auto');
  const [localSelectedJobId, setLocalSelectedJobId] = useState<string | null>(jobs[0]?.id || null);
  const selectedJobId = propSelectedJobId !== undefined ? propSelectedJobId : localSelectedJobId;
  const setSelectedJobId = propOnSelectJob !== undefined ? propOnSelectJob : setLocalSelectedJobId;

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const primaryResume = (activeResumeVersionId ? resumes.find(r => r.resumeVersionId === activeResumeVersionId) : null) || resumes.find(r => r.isPrimary) || resumes[0];

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
      const newKeyword = newPref.searchKeywords?.[0] || newPref.targetRoles?.[0] || careerProfile?.searchKeywords?.[0] || primaryResume?.skills?.[0]?.name || 'React';
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
        minSalary: 0
      });
      setErrorMsg('');
      setAppError(null);
    }
    prevResumeIdRef.current = currentResumeId;
  }, [primaryResume?.id, primaryResume?.resumeVersionId, careerProfileNew]);

  const [copiedSummary, setCopiedSummary] = useState(false);
  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  useEffect(() => {
    if (propSelectedJobId) {
      setSubTab('my-jobs');
      setCoachTab('optimize-cv');
    }
  }, [propSelectedJobId]);

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
    const currentResume = (activeResumeVersionId ? resumes.find(r => r.resumeVersionId === activeResumeVersionId) : null) || resumes.find(r => r.isPrimary) || resumes[0];
    if (!userId || !currentResume) return;
    
    const confirm = window.confirm("Você irá remover todas as análises feitas pela IA deste currículo (compatibilidade, otimizações, STAR questions). O currículo físico continuará ativo. Deseja continuar?");
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

      alert("Análises e vagas importadas apagadas com sucesso! Você pode recalcular compatibilidades.");
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

    const confirm = window.confirm(`Deseja realmente apagar a análise de compatibilidade e otimizações criadas especificamente para a vaga "${selectedJob.title}" em "${selectedJob.companyName}"? O currículo físico e a vaga permanecerão intactos.`);
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

        // 4. Apagar cover_letters associadas para esta vaga/application
        const { data: apps } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', userId)
          .eq('job_id', selectedJob.id);
        
        if (apps && apps.length > 0) {
          const appIds = apps.map(a => a.id);
          await supabase
            .from('cover_letters')
            .delete()
            .in('application_id', appIds);
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

      // Invalida os caches do React Query
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-details'] });
      queryClient.invalidateQueries({ queryKey: ['resume-optimization'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letter'] });
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });

      alert("Análise desta vaga excluída com sucesso! Você pode recalcular a compatibilidade quando desejar.");
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
    getInterviewPrepQuery,
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
      alert('Currículo otimizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar otimização: ' + (err.message || err));
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!primaryResume || !selectedJob) return;
    try {
      // 1. Verificar se já existe uma candidatura real para este job
      let activeApp = applications.find((app: any) => app.jobId === selectedJob.id);
      
      // 2. Se não existir, criar uma automaticamente com status '🔎 Encontrada'
      if (!activeApp && onCreateApplication) {
        activeApp = await onCreateApplication({
          jobId: selectedJob.id,
          companyName: selectedJob.companyName,
          jobTitle: selectedJob.title,
          status: '🔎 Encontrada',
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
      alert('Cartas de apresentação geradas com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar cartas: ' + (err.message || err));
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
      alert('Roteiro STAR gerado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar roteiro STAR: ' + (err.message || err));
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

  // States para a descoberta de vagas baseada no Career Profile ou fallback
  const pref = (careerProfileNew?.personal as any)?.preferences || {};
  const initialKeyword = sessionStorage.getItem('job_search_keyword') || pref.searchKeywords?.[0] || pref.targetRoles?.[0] || careerProfile?.searchKeywords?.[0] || primaryResume?.skills?.[0]?.name || 'React';
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
  const [searchWorkModes, setSearchWorkModes] = useState<string[]>(initialWorkModes);
  
  const initialMinSalary = sessionStorage.getItem('job_search_input_min_salary') || '';
  const [searchMinSalary, setSearchMinSalary] = useState(initialMinSalary);

  const [activeFilters, setActiveFilters] = useState({
    keyword: initialInputKeyword,
    location: initialInputLocation,
    remoteOnly: initialInputRemote,
    workModes: initialWorkModes as string[],
    minSalary: Number(sessionStorage.getItem('job_search_min_salary') || 0)
  });

  // Salvar entradas do usuário e filtros ativos na sessionStorage para manter o estado ao navegar
  useEffect(() => {
    sessionStorage.setItem('job_search_keyword', activeFilters.keyword);
    sessionStorage.setItem('job_search_location', activeFilters.location);
    sessionStorage.setItem('job_search_remote', String(activeFilters.remoteOnly));
    sessionStorage.setItem('job_search_work_modes', JSON.stringify(activeFilters.workModes));
    sessionStorage.setItem('job_search_min_salary', String(activeFilters.minSalary || ''));
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

  useEffect(() => {
    sessionStorage.setItem('job_search_input_min_salary', searchMinSalary);
  }, [searchMinSalary]);

  // Gatilho de redirecionamento automático do Dashboard
  useEffect(() => {
    const trigger = localStorage.getItem('vocentro_trigger_discovery');
    const activeProf = careerProfileNew || careerProfile;
    if (trigger === 'true' && activeProf) {
      localStorage.removeItem('vocentro_trigger_discovery');
      setSubTab('discover');
      
      const preferences = (careerProfileNew?.personal as any)?.preferences || {};
      const keyword = preferences.searchKeywords?.[0] || (careerProfile as any)?.searchKeywords?.[0] || 'React';
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
        minSalary: 0
      });
    }
  }, [careerProfile, careerProfileNew]);

  useEffect(() => {
    const activeProf = careerProfileNew || careerProfile;
    if (activeProf) {
      const preferences = (careerProfileNew?.personal as any)?.preferences || {};
      const targetRolesList = preferences.targetRoles || (careerProfile as any)?.targetRoles || [];
      const defaultKeyword = targetRolesList.join(', ') || preferences.searchKeywords?.[0] || (careerProfile as any)?.searchKeywords?.[0] || '';
      
      if (defaultKeyword && (!searchKeyword || searchKeyword === 'React')) {
        setSearchKeyword(defaultKeyword);
        setActiveFilters(prev => ({
          ...prev,
          keyword: defaultKeyword
        }));
      }

      const defaultLoc = preferences.preferredLocations?.[0] || (careerProfile as any)?.preferredLocations?.[0] || 'Brasil';
      if (defaultLoc && (!searchLocation || searchLocation === 'Brasil')) {
        setSearchLocation(defaultLoc);
        setActiveFilters(prev => ({
          ...prev,
          location: defaultLoc
        }));
      }

      const defaultRemote = preferences.preferredWorkModes ? preferences.preferredWorkModes.includes('remote') : ((careerProfile as any)?.preferredWorkModes?.includes('remote') ?? true);
      const isInitialRemote = sessionStorage.getItem('job_search_input_remote') === null;
      if (isInitialRemote) {
        setSearchRemoteOnly(defaultRemote);
        setActiveFilters(prev => ({
          ...prev,
          remoteOnly: defaultRemote
        }));
      }
    }
  }, [careerProfileNew, careerProfile]);

  const { data: optimization = null, isLoading: isLoadingOpt } = getResumeOptimizationQuery(primaryResume || null, selectedJob || null);
  const { data: prep = null, isLoading: isLoadingPrep } = getInterviewPrepQuery(primaryResume || null, selectedJob || null);
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
      const matchScore = currentMatch?.scoreOverall ?? 0;
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
          status = '⚠️ Baixa aderência';
        }
      }
      
      await onCreateApplication({
        jobId: selectedJob.id,
        companyName: selectedJob.companyName || 'Empresa Confidencial',
        jobTitle: selectedJob.title,
        status,
        notes: `Adicionado a partir do Match Manual (Score: ${matchScore}%)`,
        resumeVersionId: activeResumeVersionId || primaryResume?.resumeVersionId
      });
      
      // Redirect to strategy tab
      if (setActiveTab) {
        setActiveTab('strategy');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao adicionar vaga à estratégia.');
    } finally {
      setIsAddingToStrategy(false);
    }
  };

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
    workModes: activeFilters.workModes,
    minSalary: activeFilters.minSalary || undefined,
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

  const handleConfirmSaveIngestedJob = async () => {
    if (!previewData) return;

    try {
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
      const matchResult = await onCalculateMatch({
        resume: primaryResume,
        job: jobToMatch,
        consolidatedProfile: careerProfileNew  // injeta o perfil consolidado
      });

      // Auto-add to "Alta Prioridade" column if score is above 80%
      const score = matchResult?.score_overall ?? matchResult?.scoreOverall ?? 0;
      if (score > 80 && onCreateApplication) {
        const isAlreadyAdded = applications.some((app: any) => app.jobId === jobToMatch.id);
        if (!isAlreadyAdded) {
          await onCreateApplication({
            jobId: jobToMatch.id,
            companyName: jobToMatch.companyName || 'Vaga Manual',
            jobTitle: jobToMatch.title,
            status: '🎯 Alta Prioridade',
            notes: `Adicionado automaticamente por atingir compatibilidade de ${score}% (> 80%).`,
            resumeVersionId: activeResumeVersionId || primaryResume?.resumeVersionId
          });
        }
      }
    } catch (err: any) {
      const formatted = AppError.from(err);
      setAppError(formatted);
      AppError.logError(err, supabase, 'JobMatchHub.handleTriggerMatch', userId);
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
      minSalary: Number(searchMinSalary) || 0
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

  const handleSimulateDiscovery = async (discJob: any) => {
    try {
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

  const jobsWithSalaries = jobs.filter(j => j.salaryNumeric || j.salaryMin || j.salaryMax);
  const averageSalary = jobs.length > 0 && jobsWithSalaries.length > 0
    ? Math.round(
        jobsWithSalaries.reduce((acc, j) => {
          const min = j.salaryMin || 0;
          const max = j.salaryMax || 0;
          const mid = min && max ? (min + max) / 2 : (j.salaryNumeric || max || min || 0);
          return acc + mid;
        }, 0) / jobsWithSalaries.length
      )
    : 0;

  const uniqueCompaniesCount = new Set(jobs.map(j => j.companyName)).size;

  return (
    <div className="space-y-6 animate-fade-in font-sans p-0">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight text-on-surface">
            Mapeamento de Vagas & Match
          </h1>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Encontre vagas compatíveis via buscas inteligentes ou analise descrições de cargos de forma personalizada.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
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
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Compatibilidade</span>
            <Heart size={16} className="text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-on-surface">{avgOverallMatch > 0 ? `${avgOverallMatch}%` : '--'}</p>
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
      <div className="flex border-b border-slate-800 dark:border-slate-800 light:border-slate-200 gap-6">
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <CardGlass className="w-full max-w-2xl min-w-[320px] sm:min-w-[400px] space-y-6 relative border border-slate-800 my-8">
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
                            <label className="text-xs font-semibold text-slate-400">Título do Cargo</label>
                            <input
                              type="text"
                              placeholder="Ex: Senior Frontend Engineer"
                              value={title}
                              onChange={e => setTitle(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400">Empresa</label>
                            <input
                              type="text"
                              placeholder="Ex: Vocentro"
                              value={companyName}
                              onChange={e => setCompanyName(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Descrição / Escopo da Vaga</label>
                          <textarea
                            placeholder="Cole aqui a descrição completa da vaga..."
                            rows={5}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200 resize-none text-slate-350"
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
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-brand-500 outline-none text-xs text-slate-200"
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
                {jobs.filter(job => matches.some(m => m.jobId === job.id)).map(job => {
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
                          
                          <div className="pt-2 border-t border-slate-900 flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setCoachTab('optimize-cv');
                                document.getElementById('ai-career-coach-panel')?.scrollIntoView({ behavior: 'smooth' });
                                if (!optimization && primaryResume && selectedJob) {
                                  handleGenerateOptimization();
                                }
                              }}
                              className="w-full py-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-[10px] font-bold tracking-wider uppercase transition font-display flex items-center justify-center gap-1"
                            >
                              <Sparkles size={11} />
                              Melhorar meu currículo para essa vaga
                            </button>
                             <div className="flex gap-2">
                               <button
                                 onClick={handleDeleteSelectedAnalysis}
                                 disabled={isDeletingAnalyses}
                                 className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 text-[10px] font-bold tracking-wider uppercase transition font-display flex items-center justify-center gap-1 disabled:opacity-50"
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
                                 className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-600/10 hover:bg-red-100 dark:hover:bg-red-600/20 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 text-[10px] font-bold tracking-wider uppercase transition font-display flex items-center justify-center gap-1"
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
                                    <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1">
                                      <CheckCircle size={11} />
                                      Vaga em Acompanhamento na Estratégia
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between gap-2 px-1">
                                        <span className="text-[10px] text-slate-500 font-semibold font-sans">Coluna Kanban:</span>
                                        <select
                                          value={manualStrategyStatus}
                                          onChange={(e) => setManualStrategyStatus(e.target.value)}
                                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] rounded-lg px-2 py-0.5 outline-none focus:border-brand-500 font-semibold"
                                        >
                                          <option value="auto">Automático (Score)</option>
                                          <option value="🎯 Alta Prioridade">🎯 Alta Prioridade</option>
                                          <option value="📝 Candidatura planejada">📝 Candidatura planejada</option>
                                          <option value="🔧 Ajustar antes">🔧 Ajustar antes</option>
                                          <option value="⚠️ Baixa aderência">⚠️ Baixa aderência</option>
                                        </select>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleAddToStrategy}
                                        disabled={isAddingToStrategy}
                                        className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold tracking-wider uppercase transition font-display flex items-center justify-center gap-1 disabled:opacity-50"
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
                                      type="button"
                                      onClick={() => onStartSimulation(selectedJob)}
                                      className="w-full py-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-400 text-[10px] font-bold tracking-wider uppercase transition font-display flex items-center justify-center gap-1"
                                    >
                                      🎤 Simular entrevista
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
                              'Melhorar meu currículo para essa vaga'
                            )}
                          </button>
                        </div>
                      )}

                      {coachTab === 'optimize-cv' && optimization && (
                        <div className="space-y-4 animate-fade-in text-xs">
                          <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/30 border border-slate-900/60 relative">
                            <div className="flex justify-between items-center mb-1">
                              <strong className="text-slate-200 text-[11px]">Resumo Profissional Otimizado (sem inventar fatos):</strong>
                              <button
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
                            </div>
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
                                      alert('Carta de apresentação copiada!');
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
                        <CardGlass key={idx} className="flex flex-col justify-between space-y-4 hover:border-brand-500/30 transition-all">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                  {job.companyName?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800 truncate" title={job.title}>
                                    {job.title}
                                  </h4>
                                  <span className="text-xs text-brand-500 font-semibold truncate block">{job.companyName}</span>
                                </div>
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
                           disabled={isLoadingDiscovery || searchPage >= Math.ceil(totalCount / 15)}
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
                        remoteOnly: initialRemote,
                        workModes: initialRemote ? ['remote'] : ['remote', 'hybrid', 'onsite'],
                        minSalary: 0
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
