import { useEffect, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useEscapeToClose } from '../../../application/hooks/useEscapeToClose';
import { useFocusTrap } from '../../../application/hooks/useFocusTrap';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
  hasUnsavedChanges?: boolean;
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidthClass = 'max-w-lg',
  hasUnsavedChanges = false,
  showCloseButton = true,
  preventBackdropClose = false,
}: BaseModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listener global da tecla ESC (Escape)
  useEscapeToClose(isOpen, () => attemptClose());

  // Manter o foco preso (Focus Trap) dentro do modal enquanto estiver aberto
  useFocusTrap(modalRef, isOpen);

  // Bloquear rolagem do corpo da página enquanto o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const attemptClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 light:bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-fade-in font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget && !preventBackdropClose) {
          attemptClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="base-modal-title"
        className={`relative w-full ${maxWidthClass} bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto text-slate-100 light:text-slate-900 max-h-[90vh] flex flex-col focus:outline-none`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Confirmação de descarte de dados não salvos */}
        {showConfirmClose ? (
          <div className="space-y-4 text-center py-4 animate-fade-in">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-slate-100 light:text-slate-900">Descartar alterações?</h4>
              <p className="text-xs text-slate-400 light:text-slate-600 max-w-xs mx-auto">
                Você possui dados não salvos neste formulário. Se fechar agora, essas informações serão perdidas.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 hover:text-slate-100 light:hover:text-slate-900 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Continuar Editando
              </button>
              <button
                type="button"
                onClick={confirmClose}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Descartar e Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Botão Fechar */}
            {showCloseButton && (
              <button
                type="button"
                onClick={attemptClose}
                aria-label="Fechar modal"
                className="absolute top-4 right-4 p-1.5 text-slate-400 light:text-slate-500 hover:text-slate-100 light:hover:text-slate-900 rounded-xl bg-slate-800/60 light:bg-slate-100 border border-slate-700 light:border-slate-200 hover:border-slate-600 light:hover:border-slate-300 transition-colors cursor-pointer z-10 focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Fechar (ESC)"
              >
                <X size={18} />
              </button>
            )}

            {/* Cabeçalho */}
            {(title || subtitle) && (
              <div className="flex items-start gap-3 border-b border-slate-800/80 light:border-slate-200 pb-3.5 pr-8 shrink-0">
                {icon && (
                  <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0 mt-0.5">
                    {icon}
                  </div>
                )}
                <div>
                  {typeof title === 'string' ? (
                    <h3 id="base-modal-title" className="font-display font-bold text-base sm:text-lg text-slate-100 light:text-slate-900 leading-snug">{title}</h3>
                  ) : (
                    <div id="base-modal-title">{title}</div>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>
            )}


            {/* Corpo com rolagem interna limpa */}
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-4">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
