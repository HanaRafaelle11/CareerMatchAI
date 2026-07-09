import { useState, useRef } from 'react';
import { CardGlass } from '../components/CardGlass';
import { useResumeVersions } from '../../application/hooks/useResumeVersions';
import type { Profile } from '../../domain/models/types';
import { Upload, FileText, Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { ErrorState, ProcessingState } from '../components/ErrorVisuals';
import { AppError } from '../../application/errors/AppError';

interface ResumeUploadProps {
  profile: Profile | null;
}

export function ResumeUpload({ profile }: ResumeUploadProps) {
  const { versions, uploadVersion, isUploadingVersion, uploadError, pipelineSteps } = useResumeVersions(profile?.id);
  
  const [resumeName, setResumeName] = useState('');
  const [professionalGoal, setProfessionalGoal] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        if (!resumeName) {
          // Preencher automaticamente com o nome do arquivo limpo
          setResumeName(file.name.replace(/\.[^/.]+$/, ""));
        }
        setErrorMsg('');
      } else {
        setErrorMsg('Por favor, selecione apenas arquivos em formato PDF.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        if (!resumeName) {
          setResumeName(file.name.replace(/\.[^/.]+$/, ""));
        }
        setErrorMsg('');
      } else {
        setErrorMsg('Por favor, selecione apenas arquivos em formato PDF.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedFile) {
      setErrorMsg('Por favor, selecione um arquivo de currículo em PDF.');
      return;
    }

    if (!resumeName.trim()) {
      setErrorMsg('Por favor, insira um nome para identificar este currículo.');
      return;
    }

    try {
      await uploadVersion({
        file: selectedFile,
        resumeName: resumeName.trim(),
        professionalGoal: professionalGoal.trim() || undefined
      });

      setSuccessMsg('Currículo enviado com sucesso!');
      setSelectedFile(null);
      setResumeName('');
      setProfessionalGoal('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao enviar o arquivo.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold uppercase">
            Enviado
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold uppercase animate-pulse flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
            Processando
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase">
            Concluído
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold uppercase">
            Falhou
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-500/10 border border-slate-500/20 text-slate-400 font-extrabold uppercase">
            Desconhecido
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Upload de Versões do Currículo
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 mt-1">
          Gerencie e envie com segurança novas versões do seu currículo em PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Formulário de Upload */}
        <div className="lg:col-span-1 space-y-6">
          <CardGlass className="space-y-6">
            <h2 className="font-display font-bold text-lg text-slate-200">
              Enviar Novo Currículo
            </h2>

            {isUploadingVersion ? (
              <ProcessingState
                title="Estamos lendo seu currículo 📄"
                subtitle="Isso pode levar de 10 a 20 segundos dependendo do tamanho do arquivo."
                steps={pipelineSteps}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">
                    Nome do Currículo
                  </label>
                  <input
                    type="text"
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    placeholder="Ex: Currículo CS Pleno 2026"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                    Objetivo Profissional (Opcional)
                  </label>
                  <textarea
                    value={professionalGoal}
                    onChange={(e) => setProfessionalGoal(e.target.value)}
                    placeholder="Ex: Buscar vagas de Liderança de CS em empresas de tecnologia SaaS."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none font-sans"
                  />
                </div>

                {/* Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">
                    Arquivo do Currículo (PDF)
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-brand-500 bg-brand-500/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/10'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                        <Upload size={18} />
                      </div>
                      <div>
                        {selectedFile ? (
                          <p className="text-xs font-semibold text-brand-400 truncate max-w-[200px] mx-auto">
                            {selectedFile.name}
                          </p>
                        ) : (
                          <p className="text-xs font-semibold text-slate-300">
                            Clique ou arraste o PDF aqui
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Tamanho máximo: 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-2">
                    <ErrorState 
                      error={new AppError({ 
                        code: 'RESUME_UPLOAD_INVALID', 
                        title: 'Não conseguimos ler esse arquivo', 
                        message: errorMsg, 
                        severity: 'warning', 
                        retryable: false 
                      })} 
                    />
                  </div>
                )}

                {uploadError && (
                  <div className="mb-2">
                    <ErrorState 
                      error={uploadError} 
                      onRetry={handleSubmit as any} 
                    />
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[10px] text-emerald-400 leading-relaxed flex items-start gap-2">
                    <CheckCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingVersion}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 cursor-pointer font-display"
                >
                  <span>Salvar Currículo</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </CardGlass>
        </div>

        {/* Lado Direito: Histórico de Versões */}
        <div className="lg:col-span-2 space-y-6">
          <CardGlass className="space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-200 flex items-center gap-2">
              <Clock size={18} className="text-brand-500" />
              Histórico de Uploads (Pipeline Seguro)
            </h2>
            <p className="text-[10px] text-slate-500">Abaixo estão listadas todas as versões de arquivos de currículo salvas no Storage e registradas no banco de dados.</p>

            {versions.length > 0 ? (
              <div className="space-y-3">
                {versions.map((ver) => (
                  <div key={ver.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-200">{ver.fileName}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-500 font-mono">
                              ID: {ver.id.substring(0, 8)}...
                            </span>
                            <span className="text-[9px] text-slate-500 flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(ver.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-start sm:self-center">
                        {getStatusBadge(ver.status)}
                        <a
                          href={ver.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all font-bold block"
                        >
                          Visualizar PDF
                        </a>
                      </div>
                    </div>

                    {ver.professionalGoal && (
                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-950 text-xxs text-slate-400 leading-relaxed font-sans">
                        <strong className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Objetivo Profissional</strong>
                        {ver.professionalGoal}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <FileText size={28} className="mb-2 text-slate-600" />
                <span>Nenhum currículo enviado ainda. Utilize o formulário ao lado para realizar o primeiro upload.</span>
              </div>
            )}
          </CardGlass>
        </div>
      </div>
    </div>
  );
}
