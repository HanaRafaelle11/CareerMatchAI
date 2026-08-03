import { useState, type ChangeEvent, type FormEvent } from 'react';
import { BaseModal } from './ds/BaseModal';
import { MessageSquare, Paperclip, Send, Loader2, CheckCircle2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../infrastructure/api/supabaseClient';

interface SupportFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
}

export function SupportFeedbackModal({ isOpen, onClose, userId, userEmail }: SupportFeedbackModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrorMsg('O arquivo anexo deve ter no máximo 10MB.');
        return;
      }
      setFile(selectedFile);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Por favor, preencha o assunto e a mensagem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let attachmentUrl: string | undefined = undefined;

      // 1. Fazer upload do arquivo anexo se houver
      if (file && supabase) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId || 'guest'}_${Date.now()}.${fileExt}`;
        const filePath = `tickets/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase
          .storage
          .from('feedback-attachments')
          .upload(filePath, file, { upsert: true });

        if (uploadErr) {
          console.warn('[SupportFeedbackModal] Aviso no upload do anexo:', uploadErr);
        } else if (uploadData) {
          const { data: publicData } = supabase
            .storage
            .from('feedback-attachments')
            .getPublicUrl(filePath);
          attachmentUrl = publicData.publicUrl;
        }
      }

      // 2. Chamar Edge Function send-support-ticket
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await supabase.functions.invoke('send-support-ticket', {
          body: {
            subject: subject.trim(),
            message: message.trim(),
            attachmentUrl,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (res.error) {
          throw new Error(res.error.message || 'Erro ao enviar chamado de suporte.');
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSubject('');
        setMessage('');
        setFile(null);
        onClose();
      }, 2500);

    } catch (err: any) {
      console.error('[SupportFeedbackModal] Erro ao enviar feedback/suporte:', err);
      setErrorMsg(err.message || 'Falha ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="p-6 space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Fale Conosco & Suporte</h3>
              <p className="text-xs text-muted-foreground">Envie suas dúvidas, sugestões ou relato de problemas.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-extrabold text-lg text-foreground">Recebemos sua mensagem!</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Nossa equipe analisará seu chamado e responderá em breve pelo e-mail <strong>{userEmail || 'cadastrado'}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Campo Assunto */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">
                Assunto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Dúvida sobre o Matching / Relato de bug"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500 text-xs"
              />
            </div>

            {/* Campo Mensagem */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Descreva detalhadamente o que aconteceu ou a sua sugestão..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground outline-none focus:border-brand-500 text-xs resize-none"
              />
            </div>

            {/* Campo Anexo Opcional */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">
                Anexo opcional <span className="text-muted-foreground font-normal">(Imagem ou PDF — máx 10MB)</span>
              </label>

              {!file ? (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-brand-500 bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground cursor-pointer transition-all">
                  <Paperclip size={16} className="text-brand-500" />
                  <span className="font-semibold text-xs">Selecionar print ou documento</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border text-foreground">
                  <div className="flex items-center gap-2 truncate">
                    {file.type.includes('image') ? (
                      <ImageIcon size={16} className="text-brand-500 shrink-0" />
                    ) : (
                      <FileText size={16} className="text-amber-500 shrink-0" />
                    )}
                    <span className="truncate font-medium text-xs">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-red-400 p-1 rounded cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Botão de Envio */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Enviando mensagem...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Mensagem ao Suporte</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </BaseModal>
  );
}
