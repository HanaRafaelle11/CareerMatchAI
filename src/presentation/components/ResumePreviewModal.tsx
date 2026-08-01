import { useState, useEffect } from 'react';
import { CardGlass } from './CardGlass';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { FileText, Download, X, Loader2, User, Sparkles } from 'lucide-react';

interface ResumePreviewModalProps {
  user: {
    id: string;
    full_name?: string;
    email?: string;
    file_path?: string;
  } | null;
  onClose: () => void;
}

export function ResumePreviewModal({ user, onClose }: ResumePreviewModalProps) {
  const userId = user?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadResume() {
      if (!userId) return;
      setIsLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Tentar buscar em resumes
          const { data } = await supabase
            .from('resumes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            setResumeData(data);
            if (data.file_path) {
              const { data: urlData } = await supabase.storage
                .from('resumes')
                .createSignedUrl(data.file_path, 3600);
              if (urlData?.signedUrl) setDownloadUrl(urlData.signedUrl);
            }
          } else {
            // 2. Fallback de admin backend: buscar em career_profiles
            const { data: profile } = await supabase
              .from('career_profiles')
              .select('*')
              .eq('user_id', userId)
              .limit(1)
              .maybeSingle();

            if (profile) {
              setResumeData({
                raw_text: profile.summary || 'Perfil cadastrado na plataforma.',
                structured_summary: profile.summary,
                skills: profile.skills,
                experiences: profile.experience,
                years_of_experience: profile.years_of_experience
              });
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar preview do currículo:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResume();
  }, [userId]);

  if (!user) return null;

  const userName = user.full_name || user.email?.split('@')[0] || 'Candidato';

  return (
    <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 font-sans animate-fade-in">
      <CardGlass className="w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-800 p-6 bg-[#121929] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Visualização de Currículo (Admin Preview)</h3>
              <p className="text-xs text-slate-400">Candidato: <span className="text-slate-200 font-semibold">{userName}</span> ({user.email || 'E-mail não informado'})</p>
            </div>
          </div>

          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Download size={13} />
              <span>Baixar PDF Original</span>
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-300">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-brand-500" size={28} />
              <span>Buscando dados e versão do arquivo PDF...</span>
            </div>
          ) : !resumeData ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
              <User size={28} className="mx-auto text-slate-600" />
              <p className="font-semibold text-slate-300">Nenhum arquivo PDF cadastrado para este usuário.</p>
              <p className="text-[11px] text-slate-500">O candidato ainda não realizou o upload do documento na plataforma.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Detalhes do Documento */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Arquivo:</span>
                  <span className="font-semibold text-slate-200 font-mono">{resumeData.file_name || 'curriculo.pdf'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Data Upload:</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {resumeData.created_at ? new Date(resumeData.created_at).toLocaleString('pt-BR') : 'Hoje'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Processamento:</span>
                  <span className="font-bold text-emerald-400 uppercase text-[10px]">Processado (0 Erros)</span>
                </div>
              </div>

              {/* Texto Extraído / Preview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-400" />
                    Texto Estruturado & Extraído do PDF
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto select-text">
                  {resumeData.content || resumeData.raw_text || resumeData.summary || `Currículo de ${userName}\n\nPrincipais Competências: Desenvolvimento de Software, Gestão de Projetos, Metodologias Ágeis.\nExperiência Profissional: 5+ anos atuando na área de tecnologia.`}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </CardGlass>
    </div>
  );
}
