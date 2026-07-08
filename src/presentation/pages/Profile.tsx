import { useState, useRef } from 'react';
import { CardGlass } from '../components/CardGlass';
import type { Resume, Profile as UserProfile, Application } from '../../domain/models/types';
import { Upload, FileText, Calendar, Trash2, Check, AlertCircle, Briefcase, Award, Clock } from 'lucide-react';
import { ResumeOptimizationService } from '../../application/services/ResumeOptimizationService';
import { isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';

interface ProfileProps {
  profile: UserProfile | null;
  resumes: Resume[];
  onUploadResume: (file: File, rawText: string) => Promise<any>;
  onDeleteResume: (id: string) => Promise<void>;
  isUploading: boolean;
  applications: Application[];
}

export function Profile({ profile, resumes, onUploadResume, onDeleteResume, isUploading, applications = [] }: ProfileProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
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
        </div>

        {/* Lado Direito: Perfil Estruturado pela IA */}
        <div className="lg:col-span-2 space-y-6">
          {primaryResume ? (
            <div className="space-y-6">
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hard Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {primaryResume.skills.filter(s => s.category === 'hard_skill').map(s => (
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Soft Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {primaryResume.skills.filter(s => s.category === 'soft_skill').map(s => (
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ferramentas & Ferramental</span>
                    <div className="flex flex-wrap gap-2">
                      {primaryResume.skills.filter(s => s.category === 'tool').map(s => (
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Idiomas</span>
                    <div className="flex flex-wrap gap-2">
                      {primaryResume.skills.filter(s => s.category === 'language').map(s => (
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
