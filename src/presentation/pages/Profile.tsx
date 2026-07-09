import { useState, useRef } from 'react';
import { CardGlass } from '../components/CardGlass';
import type { Resume, Profile as UserProfile, Application, PipelineStep } from '../../domain/models/types';
import type { CareerProfileNew, CareerInsight } from '../../application/hooks/useMyProfileAi';
import { calcYearsFromExperiences } from '../../application/services/matchingEngine';
import { Upload, FileText, Calendar, Trash2, Check, AlertCircle, Briefcase, Award, Clock, Activity, Brain, Zap, Info } from 'lucide-react';
import { ResumeOptimizationService } from '../../application/services/ResumeOptimizationService';
import { isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'transparency'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setErrorMsg('');
    setUploadSuccess(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
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
      setErrorMsg(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite máximo é 10 MB.`);
      return;
    }

    // 2. Validação de tamanho mínimo (arquivo vazio)
    if (file.size === 0) {
      setErrorMsg('O arquivo está vazio. Selecione um currículo válido.');
      return;
    }

    // 3. Validação de extensão perigosa
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
      setErrorMsg(`Tipo de arquivo "${fileExtension}" não é permitido. Envie apenas PDF, DOCX ou TXT.`);
      return;
    }

    // 4. Validação de tipo MIME
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      setErrorMsg('Apenas arquivos PDF, DOCX ou TXT são suportados.');
      return;
    }

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
          setErrorMsg('O conteúdo do currículo é muito curto (menos de 50 caracteres). Envie um currículo mais completo.');
          return;
        }

        // 6. Sanitização anti-XSS do texto
        rawText = sanitizeText(rawText);
      } else if (!isSupabaseConfigured) {
        // PDF/DOCX sem Supabase: orienta o usuário claramente
        setErrorMsg('Para analisar arquivos PDF/DOCX, conecte o Supabase nas configurações. Como alternativa, salve seu currículo como .TXT e faça o upload.');
        return;
      } else {
        // PDF/DOCX com Supabase: envia o arquivo binário; a Edge Function fará a extração
        rawText = '__binary_upload__';
      }

      await onUploadResume(file, rawText);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error('[UPLOAD ERROR DETECTED]', err);
      const detailedMessage = err?.message || err?.error_description || err?.error || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setErrorMsg(`Falha ao processar o arquivo: ${detailedMessage}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-2">
      {/* Título */}
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
          Perfil Profissional
        </h1>
        <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
          Envie seu currículo atualizado para extração e estruturação do seu perfil de competências com IA.
        </p>
      </div>

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
              {pipelineSteps && pipelineSteps.length > 0 ? (
                <div className="text-left w-full mx-auto space-y-3 p-1 select-none" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 light:text-slate-400 uppercase tracking-wider">Etapas de Processamento</span>
                    {isUploading ? (
                      <span className="h-3.5 w-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : pipelineSteps.some(s => s.status === 'error') ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-[10px] text-red-500 dark:text-red-400 font-bold hover:underline cursor-pointer"
                      >
                        Tentar novamente
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-[10px] text-brand-500 dark:text-brand-400 font-bold hover:underline cursor-pointer"
                      >
                        Enviar outro
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {pipelineSteps.map((step) => (
                      <div key={step.id} className="flex items-start gap-2 text-xs transition-all duration-300">
                        {step.status === 'success' && <span className="text-emerald-500 dark:text-emerald-400 font-bold shrink-0">✔</span>}
                        {step.status === 'error' && <span className="text-red-500 dark:text-red-400 font-bold shrink-0">✖</span>}
                        {step.status === 'running' && (
                          <div className="h-3 w-3 mt-0.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                        {step.status === 'pending' && <div className="h-2 w-2 mt-1.5 mx-0.5 rounded-full bg-slate-800 dark:bg-slate-800 light:bg-slate-300 shrink-0" />}
                        <span className={`leading-tight
                          ${step.status === 'success' ? 'text-emerald-400 dark:text-emerald-400 light:text-emerald-600 font-medium' : ''}
                          ${step.status === 'error' ? 'text-red-400 dark:text-red-400 light:text-red-600 font-semibold' : ''}
                          ${step.status === 'running' ? 'text-brand-400 dark:text-brand-400 light:text-brand-600 font-semibold' : ''}
                          ${step.status === 'pending' ? 'text-slate-600 dark:text-slate-600 light:text-slate-400' : ''}
                        `}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs">
                <Check size={14} className="shrink-0" />
                <span>Análise de IA concluída com sucesso!</span>
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
                  Perfil Estruturado
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

              {activeProfileTab === 'profile' ? (
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Hard Skills — career_profiles */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hard Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {displaySkills.length > 0
                            ? displaySkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold"
                              >
                                {s.name}
                              </span>
                            ))
                            : primaryResume.skills.filter(s => s.category?.includes('hard_skill')).map(s => (
                              <span key={s.id} className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-semibold">{s.name}</span>
                            ))
                          }
                        </div>
                      </div>

                      {/* Soft Skills — career_profiles */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Soft Skills & Liderança</span>
                        <div className="flex flex-wrap gap-2">
                          {displaySoftSkills.length > 0
                            ? displaySoftSkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/5 light:bg-slate-100 border border-indigo-500/10 dark:border-indigo-500/15 light:border-slate-200 text-xs text-indigo-400 dark:text-indigo-400 light:text-slate-600 font-semibold"
                              >
                                {s}
                              </span>
                            ))
                            : primaryResume.skills.filter(s => s.category?.includes('soft_skill') || s.category?.includes('leadership_skill')).map(s => (
                              <span key={s.id} className="px-2.5 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-400 font-semibold">{s.name}</span>
                            ))
                          }
                        </div>
                      </div>

                      {/* Ferramentas / Tecnologias */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ferramentas & Ferramental</span>
                        <div className="flex flex-wrap gap-2">
                          {primaryResume.skills.filter(s => s.category?.includes('tool')).map(s => (
                            <span
                              key={s.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Idiomas — career_profiles */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Idiomas</span>
                        <div className="flex flex-wrap gap-2">
                          {displayLanguages.length > 0
                            ? displayLanguages.map((l, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/5 light:bg-slate-100 border border-emerald-500/10 dark:border-emerald-500/15 light:border-slate-200 text-xs text-emerald-400 dark:text-emerald-400 light:text-slate-600 font-semibold"
                              >
                                {l.language}{l.proficiency ? ` — ${l.proficiency}` : ''}
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
              ) : (
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

    </div>
  );
}
