import { useState, useRef, useEffect } from 'react';
import { CardGlass } from '../components/CardGlass';
import type { Resume, Profile as UserProfile, Application, PipelineStep } from '../../domain/models/types';
import type { CareerProfileNew, CareerInsight } from '../../application/hooks/useMyProfileAi';
import { calcYearsFromExperiences } from '../../application/services/matchingEngine';
import { Upload, FileText, Calendar, Trash2, Check, AlertCircle, Briefcase, Award, Clock, Activity, Brain, Zap, Info, Sparkles, CheckCircle } from 'lucide-react';
import { ResumeOptimizationService } from '../../application/services/ResumeOptimizationService';
import { isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';
import { ProcessingState, ErrorState } from '../components/ErrorVisuals';
import { AppError } from '../../application/errors/AppError';

interface ProfileProps {
  profile: UserProfile | null;
  resumes: Resume[];
  careerProfileNew: CareerProfileNew | null;
  careerInsights: CareerInsight | null;
  onUploadResume: (file: File, rawText: string) => Promise<any>;
  onDeleteResume: (id: string) => Promise<void>;
  isUploading: boolean;
  applications: Application[];
  pipelineSteps?: PipelineStep[];
  activeResumeVersionId?: string | null;
  onSelectResumeVersion?: (versionId: string) => void;
}

export function Profile({ 
  profile, 
  resumes,
  careerProfileNew,
  careerInsights,
  onUploadResume, 
  onDeleteResume, 
  isUploading, 
  applications = [],
  pipelineSteps = [],
  activeResumeVersionId,
  onSelectResumeVersion
}: ProfileProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<AppError | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadSuccessSeconds, setUploadSuccessSeconds] = useState<number | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'ai-profile' | 'transparency'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDelayWarning, setShowDelayWarning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isUploading) {
      setShowDelayWarning(false);
      timerRef.current = setTimeout(() => {
        setShowDelayWarning(true);
      }, 10000);
    } else {
      setShowDelayWarning(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isUploading]);

  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const versionStats = ResumeOptimizationService.getResumeVersionStats(resumes, applications);

  // Anos de experiência a partir do perfil consolidado (fonte primária)
  const yearsOfExperience = careerProfileNew && careerProfileNew.experience.length > 0
    ? calcYearsFromExperiences(careerProfileNew.experience)
    : (primaryResume?.yearsOfExperience || 0);

  // Skills a exibir: usar career_profiles como fonte primária
  const displaySkills = careerProfileNew?.skills || [];
  const displaySoftSkills = careerProfileNew?.soft_skills || [];
  const displayLanguages = careerProfileNew?.languages || [];
  const displayExperience = careerProfileNew?.experience || primaryResume?.experiences || [];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);
    setUploadSuccess(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setUploadSuccess(false);
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const DANGEROUS_EXTENSIONS = ['.svg', '.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.exe', '.bat', '.sh', '.php', '.py', '.rb', '.cmd', '.msi', '.dll', '.com', '.vbs', '.ps1'];

  /** Remove tags HTML/script para prevenção de XSS stored */
  const sanitizeText = (text: string): string => {
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  };

  const processFile = async (file: File) => {
    // 1. Validação de tamanho
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: 'Envie um arquivo em formato PDF com até 10MB de tamanho.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    // 2. Validação de tamanho mínimo (arquivo vazio)
    if (file.size === 0) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: 'O arquivo está vazio. Envie um currículo em formato PDF com até 10MB de tamanho.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    // 3. Validação de extensão perigosa
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: `Tipo de arquivo "${fileExtension}" não é permitido. Envie apenas PDF, DOCX ou TXT.`,
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    // 4. Validação de tipo MIME
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      setErrorMsg(new AppError({
        code: 'RESUME_UPLOAD_INVALID',
        title: 'Não conseguimos ler esse arquivo',
        message: 'Apenas arquivos PDF, DOCX ou TXT com até 10MB são suportados.',
        severity: 'warning',
        retryable: false,
        action: 'Enviar novo currículo'
      }));
      return;
    }

    const startTime = Date.now();

    try {
      let rawText = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Para .txt: lê o conteúdo real do arquivo
        const reader = new FileReader();
        rawText = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });

        // 5. Validação de conteúdo mínimo para TXT
        if (rawText.trim().length < 50) {
          setErrorMsg(new AppError({
            code: 'RESUME_UPLOAD_INVALID',
            title: 'Não conseguimos ler esse arquivo',
            message: 'O conteúdo do currículo é muito curto (menos de 50 caracteres). Envie um currículo mais completo.',
            severity: 'warning',
            retryable: false,
            action: 'Enviar novo currículo'
          }));
          return;
        }

        // 6. Sanitização anti-XSS do texto
        rawText = sanitizeText(rawText);
      } else if (!isSupabaseConfigured) {
        // PDF/DOCX sem Supabase: orienta o usuário claramente
        setErrorMsg(new AppError({
          code: 'RESUME_UPLOAD_INVALID',
          title: 'Não conseguimos ler esse arquivo',
          message: 'Para analisar arquivos PDF/DOCX, conecte o Supabase nas configurações. Como alternativa, salve seu currículo como .TXT e faça o upload.',
          severity: 'warning',
          retryable: false,
          action: 'Enviar novo currículo'
        }));
        return;
      } else {
        // PDF/DOCX com Supabase: envia o arquivo binário; a Edge Function fará a extração
        rawText = '__binary_upload__';
      }

      await onUploadResume(file, rawText);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      setUploadSuccessSeconds(durationSeconds);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadSuccessSeconds(null);
      }, 5000);
    } catch (err: any) {
      console.error('[UPLOAD ERROR DETECTED]', err);
      setErrorMsg(AppError.from(err));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-0">
      {/* Título */}
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
          Perfil Profissional
        </h1>
        <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
          Envie seu currículo atualizado para extração e estruturação do seu perfil de competências com IA.
        </p>
      </div>

      {pipelineSteps && pipelineSteps.length > 0 ? (
        <CardGlass className="p-8 border border-brand-500/20 max-w-4xl mx-auto">
          <ProcessingState
            title="Processando Currículo com IA..."
            subtitle={showDelayWarning
              ? "Essa análise pode levar alguns segundos porque estamos extraindo e catalogando detalhadamente suas competências."
              : "Nossa IA está lendo seu histórico de experiências, extraindo competências técnicas e comportamentais e mapeando seu perfil."
            }
            expectedTime="Tempo esperado: ~25 segundos"
            steps={pipelineSteps}
          />
        </CardGlass>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo: Upload do Currículo */}
          <div className="lg:col-span-1 space-y-6">
            <CardGlass className="space-y-6">
              <h2 className="font-display font-bold text-lg text-slate-200 dark:text-slate-200 light:text-slate-800">
                Upload de Currículo
              </h2>

              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-slate-800 dark:border-slate-800 light:border-slate-300 bg-slate-900/10 dark:bg-slate-900/10 light:bg-slate-50 hover:border-slate-700'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                    {isUploading ? (
                      <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={22} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                      {isUploading ? 'Analisando Currículo...' : 'Arraste seu arquivo aqui'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Suporta PDF, DOCX ou TXT (Max. 10MB)
                    </p>
                  </div>
                </div>
              </div>

              {errorMsg && (
              <div className="w-full text-left" onClick={(e) => e.stopPropagation()}>
                <ErrorState
                  error={errorMsg}
                  onAction={() => {
                    setErrorMsg(null);
                    fileInputRef.current?.click();
                  }}
                  onRetry={() => {
                    setErrorMsg(null);
                    fileInputRef.current?.click();
                  }}
                />
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs">
                <Check size={14} className="shrink-0" />
                <span>Análise concluída em {uploadSuccessSeconds || 0} segundos</span>
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[10px] text-amber-500 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle size={13} />
                  Modo de Demonstração Local
                </div>
                <p>
                  Extrações de arquivos PDF/DOCX exigem conexão ativa com o Supabase. Para testar o parser semântico offline com suas próprias informações reais, faça o upload de um arquivo de texto simples <strong>(.txt)</strong> com o conteúdo do seu currículo.
                </p>
              </div>
            )}

            {/* Lista de Currículos */}
            {resumes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Histórico de Arquivos (Clique para selecionar o ativo)</span>
                {resumes.map(res => {
                  const isActive = res.resumeVersionId === activeResumeVersionId;
                  return (
                    <div
                      key={res.id}
                      onClick={() => res.resumeVersionId && onSelectResumeVersion?.(res.resumeVersionId)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'border-brand-500 bg-brand-500/10 shadow-md shadow-brand-500/5'
                          : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText size={16} className={isActive ? 'text-brand-400 shrink-0' : 'text-slate-500 shrink-0'} />
                        <span className={`font-semibold truncate ${isActive ? 'text-brand-400' : 'text-slate-300'} dark:${isActive ? 'text-brand-400' : 'text-slate-300'} light:${isActive ? 'text-brand-600' : 'text-slate-700'}`} title={res.fileName}>
                          {res.fileName}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/35 uppercase tracking-wider">
                            Ativo
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteResume(res.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        title="Excluir currículo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardGlass>

          {/* Seção de Versões & Performance */}
          {resumes.length > 0 && (
            <CardGlass className="space-y-4 border border-slate-900">
              <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                <Clock size={16} className="text-brand-500" />
                Versões do Currículo
              </h3>
              <p className="text-[10px] text-slate-500">Mapeamento da conversão de convite para entrevista.</p>
              
              <div className="space-y-3">
                {versionStats.map(stat => (
                  <div key={stat.resumeId} className="p-3 rounded-xl bg-slate-900/40 border border-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{stat.versionLabel}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-extrabold border border-brand-500/20">
                        {stat.conversionRate}% Conversão
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-500">
                      <span>Candidaturas: {stat.applicationsCount}</span>
                      <span>Entrevistas: {stat.interviewsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardGlass>
          )}

          {/* Painel de Processamento amigável (sem dados técnicos) */}
          {(primaryResume || careerProfileNew) && (
            <CardGlass className="space-y-4 border border-slate-900">
              <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                <Activity size={16} className="text-brand-500" />
                Status do Processamento
              </h3>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  {primaryResume ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>Currículo recebido com sucesso</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {careerProfileNew && displayExperience.length > 0 ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>
                    {careerProfileNew && displayExperience.length > 0 ? (
                      <>
                        <strong className="text-slate-100">{displayExperience.length}</strong> experiências identificadas
                      </>
                    ) : (
                      'Identificando experiências...'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {careerProfileNew && displaySkills.length > 0 ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>
                    {careerProfileNew && displaySkills.length > 0 ? (
                      <>
                        <strong className="text-slate-100">{displaySkills.length}</strong> competências mapeadas
                      </>
                    ) : (
                      'Mapeando competências...'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {careerProfileNew && yearsOfExperience > 0 ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>
                    {careerProfileNew && yearsOfExperience > 0 ? (
                      <>
                        <strong className="text-slate-100">{yearsOfExperience} anos</strong> de experiência calculados
                      </>
                    ) : (
                      'Calculando anos de experiência...'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {careerProfileNew ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800 animate-pulse shrink-0" />
                  )}
                  <span>Perfil IA gerado com sucesso</span>
                </div>
              </div>
            </CardGlass>
          )}
        </div>

        {/* Lado Direito: Perfil Estruturado pela IA */}
        <div className="lg:col-span-2 space-y-6">
          {primaryResume ? (
            <div className="space-y-6">
              {/* Navegação por Abas (Fase 9) */}
              <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-900 w-full sm:w-fit select-none">
                <button
                  onClick={() => setActiveProfileTab('profile')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeProfileTab === 'profile'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Currículo Original
                </button>
                <button
                  onClick={() => setActiveProfileTab('ai-profile')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    activeProfileTab === 'ai-profile'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles size={12} />
                  Meu Perfil IA
                </button>
                <button
                  onClick={() => setActiveProfileTab('transparency')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    activeProfileTab === 'transparency'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity size={12} />
                  Como a IA Concluiu?
                </button>
              </div>

              {activeProfileTab === 'profile' && (
                <>
                  {/* Resumo Profissional */}
                  <CardGlass className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h2 className="font-display font-bold text-xl text-slate-100 dark:text-slate-100 light:text-slate-800">
                          {careerProfileNew?.personal?.fullName || profile?.fullName}
                        </h2>
                        <p className="text-brand-500 font-medium text-sm mt-0.5">
                          {careerProfileNew?.personal?.headline || primaryResume.structuredSummary?.split('.')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase shrink-0">
                        <Clock size={12} />
                        <span>{yearsOfExperience > 0 ? `${yearsOfExperience} Anos Exp.` : 'Calculando...'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                      {careerProfileNew?.summary || primaryResume.structuredSummary}
                    </p>
                  </CardGlass>

                  {/* Competências extraídas */}
                  <CardGlass className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Award size={18} />
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Competências Mapeadas
                        <span className="ml-2 text-[10px] font-normal text-slate-500">
                          {displaySkills.length + displaySoftSkills.length} competências identificadas
                        </span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                      {/* Hard Skills */}
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Hard Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {displaySkills.length > 0
                            ? displaySkills.map((s, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-850 dark:border-slate-850 light:border-slate-200">{s.name}</span>
                            ))
                            : primaryResume.skills.filter(s => s.category?.includes('hard') || !s.category).map(s => (
                              <span key={s.id} className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-850 dark:border-slate-850 light:border-slate-200">{s.name}</span>
                            ))
                          }
                        </div>
                      </div>

                      {/* Soft Skills */}
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Soft Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {displaySoftSkills.length > 0
                            ? displaySoftSkills.map((s, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-850 dark:border-slate-850 light:border-slate-200">{s}</span>
                            ))
                            : primaryResume.skills.filter(s => s.category?.includes('soft')).map(s => (
                              <span key={s.id} className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-850 dark:border-slate-850 light:border-slate-200">{s.name}</span>
                            ))
                          }
                        </div>
                      </div>

                      {/* Idiomas */}
                      <div className="space-y-3 md:col-span-2 pt-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Idiomas</span>
                        <div className="flex flex-wrap gap-2">
                          {displayLanguages.length > 0
                            ? displayLanguages.map((lang, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 font-semibold">
                                {lang.language}{lang.proficiency ? ` - ${lang.proficiency}` : ''}
                              </span>
                            ))
                            : primaryResume.skills.filter(s => s.category?.includes('language')).map(s => (
                              <span key={s.id} className="px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 font-semibold">{s.name}{s.proficiencyLevel ? ` - ${s.proficiencyLevel}` : ''}</span>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </CardGlass>

                  {/* Experiência profissional */}
                  <CardGlass className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Briefcase size={18} />
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Experiências Profissionais
                      </h3>
                    </div>

                    <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800 dark:before:bg-slate-800 light:before:bg-slate-200">
                      {displayExperience.map((exp, index) => (
                        <div key={(exp as any).id || index} className="relative pl-10 group">
                          {/* Timeline dot */}
                          <span className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full bg-slate-950 border-2 border-brand-500 z-10 scale-100 group-hover:scale-125 transition-transform duration-200" />
                          
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className="font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800">
                                {exp.role}
                              </h4>
                              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                <Calendar size={12} />
                                {exp.startDate} - {exp.isCurrent ? 'Atual' : exp.endDate}
                              </span>
                            </div>
                            <span className="text-xs text-brand-500/90 font-medium block">
                              {exp.companyName}
                            </span>
                            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                              {exp.description}
                            </p>

                            {/* Highlights */}
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="list-disc pl-4 pt-1 space-y-1 text-slate-500 text-xs">
                                {exp.highlights.map((high, hIdx) => (
                                  <li key={hIdx}>{high}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardGlass>
                </>
              )}

              {activeProfileTab === 'ai-profile' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Identidade Profissional */}
                  {careerInsights?.seniority_prediction && (
                    <CardGlass className="p-6 space-y-4 border-l-4 border-l-indigo-500">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2">
                          <Brain className="text-indigo-400" size={18} />
                          Identidade Profissional
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-900">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                            Senioridade Estimada
                          </span>
                          <p className="text-xl font-bold text-slate-100 mt-1">
                            {careerInsights.seniority_prediction.value || "Não calculada"}
                          </p>
                        </div>
                        <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-900">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                            Índice de Confiança
                          </span>
                          <p className="text-xl font-bold text-slate-100 mt-1">
                            {Math.round((careerInsights.seniority_prediction.confidence || 0) * 100)}%
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 italic bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10 mt-2 leading-relaxed">
                        "Esta é uma estimativa calculada pela inteligência artificial a partir do tempo de carreira e escopo de liderança. {careerInsights.seniority_prediction.reason}"
                      </p>
                    </CardGlass>
                  )}

                  {/* Inteligência de Carreira */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CardGlass className="p-6 space-y-4">
                      <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-3">
                        <CheckCircle size={16} className="text-emerald-400" />
                        Pontos Fortes Mapeados
                      </h3>
                      <div className="space-y-3">
                        {careerInsights?.methodologies && careerInsights.methodologies.length > 0 ? (
                          careerInsights.methodologies.map((m, idx) => (
                            <div key={idx} className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 space-y-1">
                              <span className="font-bold text-xs text-slate-200">{m.methodology_name}</span>
                              <p className="text-[10px] text-slate-400">
                                Evidência com {Math.round(m.confidence * 100)}% de correspondência no currículo.
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500">Mapeamento de evidências concluído.</div>
                        )}
                      </div>
                    </CardGlass>

                    <CardGlass className="p-6 space-y-4">
                      <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-3">
                        <AlertCircle size={16} className="text-amber-400" />
                        Gaps de Competências
                      </h3>
                      <div className="space-y-3">
                        {careerInsights?.missing_skills && careerInsights.missing_skills.value && careerInsights.missing_skills.value.length > 0 ? (
                          careerInsights.missing_skills.value.map((skill, idx) => (
                            <div key={idx} className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10 space-y-1">
                              <span className="font-bold text-xs text-slate-200">{skill}</span>
                              <p className="text-[10px] text-slate-400">
                                {careerInsights.missing_skills.reason} (Confiança: {Math.round(careerInsights.missing_skills.confidence * 100)}%)
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500">Nenhum gap crítico identificado.</div>
                        )}
                      </div>
                    </CardGlass>
                  </div>

                  {/* ATS Optimization */}
                  {careerProfileNew?.ats_keywords && (
                    <CardGlass className="p-6 space-y-6">
                      <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-3">
                        <Award size={18} className="text-slate-400" />
                        Otimização de ATS
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-emerald-400">Já Possui (Existing)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {careerProfileNew.ats_keywords.existing_keywords && careerProfileNew.ats_keywords.existing_keywords.length > 0 ? (
                              careerProfileNew.ats_keywords.existing_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[10px]">Nenhum termo extraído.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-900">
                          <label className="text-xs font-semibold text-red-400">Ausentes no Currículo</label>
                          <div className="flex flex-wrap gap-1.5">
                            {careerProfileNew.ats_keywords.missing_keywords && careerProfileNew.ats_keywords.missing_keywords.length > 0 ? (
                              careerProfileNew.ats_keywords.missing_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/25">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[10px]">Nenhum termo ausente.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-900">
                          <label className="text-xs font-semibold text-indigo-400">Recomendadas para a Vaga</label>
                          <div className="flex flex-wrap gap-1.5">
                            {careerProfileNew.ats_keywords.recommended_keywords && careerProfileNew.ats_keywords.recommended_keywords.length > 0 ? (
                              careerProfileNew.ats_keywords.recommended_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/25">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[10px]">Nenhum termo recomendado.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardGlass>
                  )}
                </div>
              )}

              {activeProfileTab === 'transparency' && (
                /* Painel de Transparência com career_insights — linguagem de usuário */
                <CardGlass className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                      <Brain size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Como a IA chegou nesta conclusão?
                      </h3>
                      <p className="text-[10px] text-slate-500">Aqui estão as principais conclusões da análise do seu currículo, em linguagem simples.</p>
                    </div>
                  </div>

                  {careerInsights ? (
                    <div className="space-y-5">
                      {/* Senioridade */}
                      {careerInsights.seniority_prediction?.value && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">Senioridade</span>
                            <span className="text-[10px] text-slate-500">{Math.round((careerInsights.seniority_prediction.confidence || 0.9) * 100)}% de confiança</span>
                          </div>
                          <p className="text-sm font-bold text-slate-200">{careerInsights.seniority_prediction.value}</p>
                          {careerInsights.seniority_prediction.reason && (
                            <p className="text-xs text-slate-400 mt-1">{careerInsights.seniority_prediction.reason}</p>
                          )}
                        </div>
                      )}

                      {/* Indústria */}
                      {careerInsights.industry_prediction?.value && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Setor Identificado</span>
                          </div>
                          <p className="text-sm font-bold text-slate-200">{careerInsights.industry_prediction.value}</p>
                          {careerInsights.industry_prediction.reason && (
                            <p className="text-xs text-slate-400 mt-1">{careerInsights.industry_prediction.reason}</p>
                          )}
                        </div>
                      )}

                      {/* Metodologias */}
                      {careerInsights.methodologies && careerInsights.methodologies.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Metodologias Identificadas</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {careerInsights.methodologies.map((m, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-xs text-emerald-300 font-semibold">
                                {m.methodology_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills — apenas se genuinamente ausentes */}
                      {careerInsights.missing_skills?.value && careerInsights.missing_skills.value.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-amber-500/10">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Oportunidades de Desenvolvimento</span>
                            <Info size={12} className="text-slate-500" />
                          </div>
                          <p className="text-[10px] text-slate-500 mb-2">{careerInsights.missing_skills.reason}</p>
                          <div className="flex flex-wrap gap-2">
                            {careerInsights.missing_skills.value.slice(0, 8).map((s, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300 font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[200px]">
                      <Zap size={22} className="text-slate-600 mb-2 animate-pulse" />
                      <span>As conclusões da IA aparecerão aqui após o processamento do seu currículo.</span>
                    </div>
                  )}
                </CardGlass>
              )}
            </div>
          ) : (
            <div className="h-64 rounded-2xl border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <FileText size={28} className="mb-2 text-slate-600" />
              <span>Nenhum currículo ativo cadastrado. Realize o upload no painel esquerdo para visualizar a estruturação.</span>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
