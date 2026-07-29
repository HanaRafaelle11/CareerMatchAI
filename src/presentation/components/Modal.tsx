import React, { useEffect } from 'react';
import { CardGlass } from './CardGlass';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'xl'
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 font-sans animate-fade-in">
      <CardGlass className={`w-full ${widthClasses} max-h-[85vh] flex flex-col border border-slate-800 p-6 bg-[#121929] shadow-2xl relative rounded-2xl overflow-hidden`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-900 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {(title || subtitle) && (
          <div className="border-b border-slate-800 pb-3 pr-8 shrink-0">
            {title && <h3 className="font-display font-bold text-base text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pt-4 space-y-4">
          {children}
        </div>
      </CardGlass>
    </div>
  );
}
