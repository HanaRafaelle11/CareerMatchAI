import { useState } from 'react';
import { X, User, Mail, Clock, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import type { RiskAlert, AffectedUserItem } from '../../application/services/ProductAtRiskService';

interface ProductAtRiskUsersModalProps {
  alert: RiskAlert | null;
  onClose: () => void;
}

export function ProductAtRiskUsersModal({ alert, onClose }: ProductAtRiskUsersModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!alert) return null;

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = alert.affectedUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-955/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-[#121929] border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                alert.priority === 'P1 - Crítica' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : alert.priority === 'P2 - Alta'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {alert.priority}
              </span>

              {alert.status === 'parcial' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Dado Parcial
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <span>{alert.title}</span>
              <span className="text-xs font-normal text-slate-400">({alert.count} afetados)</span>
            </h3>

            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {alert.impact}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou detalhe..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          />
          <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
            {filteredUsers.length} de {alert.affectedUsers.length}
          </span>
        </div>

        {/* Users List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-1">
              <p className="font-semibold text-slate-400">Nenhum candidato encontrado nesta categoria.</p>
              <p className="text-[11px]">Refine sua busca ou verifique outros alertas de risco.</p>
            </div>
          ) : (
            filteredUsers.map((user: AffectedUserItem) => (
              <div 
                key={user.id} 
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-brand-400 shrink-0" />
                    <span className="font-bold text-xs text-slate-200">{user.name}</span>
                    {user.score !== undefined && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Match {user.score}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Mail size={12} className="shrink-0 text-slate-500" />
                    <span>{user.email}</span>
                    <button
                      onClick={() => handleCopyEmail(user.email, user.id)}
                      className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition cursor-pointer"
                      title="Copiar e-mail"
                    >
                      {copiedId === user.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 pt-0.5 leading-snug">
                    {user.detail}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock size={12} className="text-slate-500" />
                    <span>{user.lastActivity}</span>
                  </div>

                  <a
                    href={`mailto:${user.email}?subject=Acompanhamento%20Vocentro&body=Olá%20${encodeURIComponent(user.name)},%0A%0ANotamos%20que...`}
                    className="px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Contatar</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Ações de suporte registradas via audit log automático.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
