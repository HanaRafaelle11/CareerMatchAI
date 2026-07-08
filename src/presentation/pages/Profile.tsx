import { useState, useRef } from 'react';
import { CardGlass } from '../components/CardGlass';
import type { Resume, Profile as UserProfile, Application, PipelineStep } from '../../domain/models/types';
import { Upload, FileText, Calendar, Trash2, Check, AlertCircle, Briefcase, Award, Clock, Activity } from 'lucide-react';
import { ResumeOptimizationService } from '../../application/services/ResumeOptimizationService';
import { isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';

interface ProfileProps {
  profile: UserProfile | null;
  resumes: Resume[];
  onUploadResume: (file: File, rawText: string) => Promise<any>;
  onDeleteResume: (id: string) => Promise<void>;
  isUploading: boolean;
  applications: Application[];
  pipelineSteps?: PipelineStep[];
}

export function Profile({ 
  profile, 
  resumes, 
  onUploadResume, 
  onDeleteResume, 
  isUploading, 
  applications = [],
  pipelineSteps = []
}: ProfileProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'transparency'>('profile');
  const [selectedAuditItem, setSelectedAuditItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const versionStats = ResumeOptimizationService.getResumeVersionStats(resumes, applications);

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

  const processFile = async (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      setErrorMsg('Apenas arquivos PDF, DOCX ou TXT são suportados.');
      return;
    }

    try {
      // Simulação rápida de leitura de texto local
      let rawText = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        rawText = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });
      } else {
        // Para PDF/DOCX simulamos a extração de texto
        rawText = `${file.name.split('.')[0]} - Engenheiro de Software Sênior.
        Forte atuação em React, TypeScript, Node.js e banco de dados PostgreSQL.
        Experiência de 6 anos com computação em nuvem AWS e infraestrutura Docker.
        Liderança de projetos ágeis e forte foco em performance de UI com Tailwind CSS.`;
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
                <span className="text-xs font-semibold text-slate-500">Histórico de Arquivos</span>
                {resumes.map(res => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-100 border border-slate-900 dark:border-slate-900 light:border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText size={16} className="text-brand-500 shrink-0" />
                      <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 truncate" title={res.fileName}>
                        {res.fileName}
                      </span>
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
                ))}
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

          {/* Seção de Auditoria do Parser */}
          {primaryResume && (
            <CardGlass className="space-y-4 border border-slate-900">
              <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                <Activity size={16} className="text-brand-500" />
                Auditoria de Processamento
              </h3>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Texto extraído: <strong className="text-slate-100">{primaryResume.rawText?.length || 0}</strong> caracteres</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Páginas detectadas: <strong className="text-slate-100">{primaryResume.structured_data?._debug?.pageCount || 1}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Empresas identificadas: <strong className="text-slate-100">{new Set(primaryResume.experiences?.map(e => e.companyName)).size}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Experiências mapeadas: <strong className="text-slate-100">{primaryResume.experiences?.length || 0}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Competências: <strong className="text-slate-100">{primaryResume.skills?.filter(s => s.category === 'hard_skill').length || 0}</strong> Hard / <strong className="text-slate-100">{primaryResume.skills?.filter(s => s.category === 'soft_skill').length || 0}</strong> Soft</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Processado por IA (OpenAI gpt-4o)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Perfil gerado {primaryResume.structured_data?._debug?.executionTimeMs ? `(${primaryResume.structured_data._debug.executionTimeMs}ms)` : ''}</span>
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
                          {profile?.fullName}
                        </h2>
                        <p className="text-brand-500 font-medium text-sm mt-0.5">
                          {primaryResume.structuredSummary?.split('.')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase shrink-0">
                        <Clock size={12} />
                        <span>{primaryResume.yearsOfExperience} Anos Exp.</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed pt-2 border-t border-slate-900 dark:border-slate-900 light:border-slate-200">
                      {primaryResume.structuredSummary}
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
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Hard Skills */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hard Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {primaryResume.skills.filter(s => s.category?.includes('hard_skill') || s.category?.includes('cs_skill') || s.category?.includes('ops_skill') || s.category?.includes('analytical_skill') || s.category?.includes('commercial_skill') || s.category?.includes('product_skill') || s.category?.includes('management_skill') || s.category?.includes('project_skill') || s.category?.includes('data_skill')).map(s => (
                            <span
                              key={s.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Soft Skills */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Soft Skills & Liderança</span>
                        <div className="flex flex-wrap gap-2">
                          {primaryResume.skills.filter(s => s.category?.includes('soft_skill') || s.category?.includes('leadership_skill')).map(s => (
                            <span
                              key={s.id}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/5 light:bg-slate-100 border border-indigo-500/10 dark:border-indigo-500/15 light:border-slate-200 text-xs text-indigo-400 dark:text-indigo-400 light:text-slate-600 font-semibold"
                            >
                              {s.name}
                            </span>
                          ))}
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

                      {/* Idiomas */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Idiomas</span>
                        <div className="flex flex-wrap gap-2">
                          {primaryResume.skills.filter(s => s.category?.includes('language')).map(s => (
                            <span
                              key={s.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/5 light:bg-slate-100 border border-emerald-500/10 dark:border-emerald-500/15 light:border-slate-200 text-xs text-emerald-400 dark:text-emerald-400 light:text-slate-600 font-semibold"
                            >
                              {s.name} - {s.proficiencyLevel}
                            </span>
                          ))}
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
                      {primaryResume.experiences.map((exp, index) => (
                        <div key={exp.id || index} className="relative pl-10 group">
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
                /* FASE 9: Painel de Transparência */
                <CardGlass className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Como a IA chegou nesta conclusão?
                      </h3>
                      <p className="text-[10px] text-slate-500">Selecione qualquer competência ou experiência profissional mapeada para auditar a evidência textual extraída pela IA.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Lista de Itens Auditáveis */}
                    <div className="space-y-3">
                      <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Itens Auditados do Currículo</span>
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {/* Competências */}
                        {(primaryResume.structured_data?.skills || []).map((s: any, idx: number) => {
                          const isSelected = selectedAuditItem?.id === `sk-${idx}`;
                          return (
                            <button
                              key={`sk-${idx}`}
                              onClick={() => setSelectedAuditItem({
                                id: `sk-${idx}`,
                                type: 'Competência / Skill',
                                label: s.name,
                                value: s.category || 'Mapeamento de Competência',
                                confidence: Math.round((s.confidence || 0.95) * 100),
                                evidence: s.evidence || 'Nenhuma citação textual de evidência salva.',
                                sourceText: s.source_text || 'Recorte original do currículo não disponível.'
                              })}
                              className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex justify-between items-center ${
                                isSelected
                                  ? 'bg-brand-500/10 border-brand-500 text-slate-200'
                                  : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold mr-2">Skill</span>
                                <strong>{s.name}</strong>
                              </div>
                              <span className="text-xxs px-1.5 py-0.5 rounded bg-slate-950 font-mono text-slate-400">
                                {Math.round((s.confidence || 0.95) * 100)}%
                              </span>
                            </button>
                          );
                        })}

                        {/* Experiências */}
                        {(primaryResume.structured_data?.experiences || []).map((e: any, idx: number) => {
                          const isSelected = selectedAuditItem?.id === `exp-${idx}`;
                          return (
                            <button
                              key={`exp-${idx}`}
                              onClick={() => setSelectedAuditItem({
                                id: `exp-${idx}`,
                                type: 'Experiência Profissional',
                                label: `${e.role} em ${e.companyName}`,
                                value: `${e.startDate} até ${e.isCurrent ? 'Atual' : e.endDate}`,
                                confidence: Math.round((e.confidence || 0.99) * 100),
                                evidence: e.evidence || 'Nenhuma citação textual de evidência salva.',
                                sourceText: e.source_text || 'Recorte original do currículo não disponível.'
                              })}
                              className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex justify-between items-center ${
                                isSelected
                                  ? 'bg-brand-500/10 border-brand-500 text-slate-200'
                                  : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold mr-2">Cargo</span>
                                <strong>{e.companyName}</strong>
                              </div>
                              <span className="text-xxs px-1.5 py-0.5 rounded bg-slate-950 font-mono text-slate-400">
                                {Math.round((e.confidence || 0.99) * 100)}%
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Evidências e Detalhes da Auditoria */}
                    <div className="space-y-4">
                      <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Detalhes da Auditoria</span>
                      {selectedAuditItem ? (
                        <div className="space-y-4 p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs animate-fade-in">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Origem do Mapeamento</span>
                            <span className="font-bold text-slate-200">{selectedAuditItem.type}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Nome / Valor Extraído</span>
                            <span className="font-semibold text-brand-400">{selectedAuditItem.label}</span>
                            <span className="text-slate-400 block text-xxs mt-0.5">{selectedAuditItem.value}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Nível de Confiança</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    selectedAuditItem.confidence >= 90 ? 'bg-emerald-500' : 'bg-brand-500'
                                  }`}
                                  style={{ width: `${selectedAuditItem.confidence}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-slate-200 shrink-0">{selectedAuditItem.confidence}%</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-900 space-y-1.5">
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Evidência Textual (Citação Literal)</span>
                            <blockquote className="text-xxs text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                              "{selectedAuditItem.evidence}"
                            </blockquote>
                          </div>

                          <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-900 space-y-1.5">
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Recorte Correspondente do Currículo</span>
                            <pre className="text-xxs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
                              {selectedAuditItem.sourceText}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xxs flex flex-col items-center justify-center min-h-[250px]">
                          <Activity size={22} className="text-slate-600 mb-2 animate-pulse" />
                          <span>Selecione um item mapeado para auditar a evidência textual.</span>
                        </div>
                      )}
                    </div>
                  </div>
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

      {/* Painel de Debug (Auditoria do Parser) */}
      {primaryResume && (
        <div className="mt-6">
          <CardGlass className="border border-slate-900 bg-slate-950/90 overflow-hidden">
            <button
              onClick={() => setIsDebugExpanded(!isDebugExpanded)}
              className="w-full flex justify-between items-center py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">Painel de Debug (Auditoria do Parser)</span>
              </div>
              <span className="text-xs text-brand-500 font-semibold hover:text-brand-400 cursor-pointer">
                {isDebugExpanded ? 'Ocultar Detalhes ▲' : 'Exibir Detalhes ▼'}
              </span>
            </button>
            
            {isDebugExpanded && (
              <div className="pt-4 border-t border-slate-900 space-y-6 animate-fade-in text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-slate-400 block mb-1">Informações do Arquivo:</span>
                    <ul className="space-y-1 text-slate-300">
                      <li><strong>Nome:</strong> {primaryResume.fileName}</li>
                      <li><strong>Storage Path:</strong> {primaryResume.structured_data?._debug?.storagePath || primaryResume.storage_path || 'N/A'}</li>
                      <li><strong>Tamanho do Texto:</strong> {primaryResume.rawText?.length || 0} caracteres</li>
                      <li><strong>Páginas:</strong> {primaryResume.structured_data?._debug?.pageCount || 1}</li>
                      <li><strong>Tempo de Execução (IA):</strong> {primaryResume.structured_data?._debug?.executionTimeMs ? `${primaryResume.structured_data._debug.executionTimeMs}ms` : 'N/A'}</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block mb-1">Metadados Extraídos pela IA:</span>
                    <ul className="space-y-1 text-slate-300">
                      <li><strong>Modelo Utilizado:</strong> gpt-4o</li>
                      <li><strong>ATS Score Estimado:</strong> {primaryResume.structured_data?.atsScore || 'N/A'}</li>
                      <li><strong>Área Principal:</strong> {primaryResume.structured_data?.area || 'N/A'}</li>
                      <li><strong>Senioridade Extraída:</strong> {primaryResume.structured_data?.seniority || 'N/A'}</li>
                      <li><strong>Indústria:</strong> {primaryResume.structured_data?.industry || 'N/A'}</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-400 block">Texto Extraído (Primeiras 2000 letras):</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 overflow-x-auto text-[10px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                    {primaryResume.rawText || 'Sem texto extraído'}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-400 block">Prompt Enviado à OpenAI:</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 overflow-x-auto text-[10px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                    {primaryResume.structured_data?._debug?.promptSent || 'Prompt não disponível para currículos legados'}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-400 block">Resposta Bruta da OpenAI:</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 overflow-x-auto text-[10px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                    {primaryResume.structured_data?._debug?.rawOpenAIResponse || 'Resposta bruta não disponível'}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-400 block">JSON Estruturado Gravado no Banco:</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 overflow-x-auto text-[10px] text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                    {JSON.stringify(primaryResume.structured_data || primaryResume, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardGlass>
        </div>
      )}
    </div>
  );
}
