import { CardGlass } from '../components/CardGlass';
import type { Notification, Job } from '../../domain/models/types';
import { 
  Bell, Trash2, CheckCircle2, AlertCircle, 
  CheckCheck, Info, Briefcase, Eye
} from 'lucide-react';

interface NotificationsProps {
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<any>;
  deleteNotification: (id: string) => Promise<any>;
  markAllNotificationsAsRead: () => Promise<any>;
  setActiveTab: (tab: string) => void;
  jobs: Job[];
  setSelectedJobId?: (id: string | null) => void;
}

export function Notifications({
  notifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  setActiveTab,
  jobs,
  setSelectedJobId
}: NotificationsProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
    }
    
    // Se for um alerta de vaga, redireciona ao matcher com a vaga selecionada
    if (n.type === 'job_alert' || n.title.toLowerCase().includes('vaga') || n.message.toLowerCase().includes('vaga')) {
      const relatedJob = jobs.find(j => 
        n.message.toLowerCase().includes(j.companyName.toLowerCase()) || 
        n.title.toLowerCase().includes(j.companyName.toLowerCase())
      );
      if (relatedJob) {
        setSelectedJobId?.(relatedJob.id);
      }
      setActiveTab('match');
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'job_alert':
        return <Briefcase className="text-brand-400" size={18} />;
      case 'inactivity':
        return <AlertCircle className="text-amber-500" size={18} />;
      default:
        return <Info className="text-indigo-400" size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-900">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800 flex items-center gap-3">
            <Bell className="text-brand-500" />
            Central de Notificações
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
            Monitore alertas de vagas críticas, recomendações e relatórios do Copilot.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-200 text-xs font-bold transition shadow-md"
          >
            <CheckCheck size={14} className="text-emerald-400" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <CardGlass className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-slate-900 border border-slate-850 text-slate-600 animate-pulse">
            <Bell size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-350">Sem notificações no momento</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Você receberá atualizações quando a IA mapear novas vagas críticas ou quando houver tarefas pendentes.</p>
          </div>
        </CardGlass>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const isJobAlert = notif.type === 'job_alert' || notif.title.toLowerCase().includes('vaga') || notif.message.toLowerCase().includes('vaga');
            return (
              <CardGlass
                key={notif.id}
                className={`p-5 transition-all relative border flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-slate-800 ${
                  !notif.isRead 
                    ? 'border-brand-500/20 bg-brand-500/[0.015]' 
                    : 'border-slate-900 bg-slate-950/20'
                }`}
              >
                <div className="flex gap-4 items-start flex-1 text-left">
                  <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-850 shrink-0 ${
                    !notif.isRead ? 'ring-1 ring-brand-500/30' : ''
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-200">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-extrabold text-[8px] uppercase tracking-wider border border-brand-500/20">
                          Nova
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {notif.message}
                    </p>

                    <div className="flex gap-3 items-center text-[10px] text-slate-555 pt-1">
                      <span>
                        {new Date(notif.createdAt).toLocaleDateString('pt-BR')} às {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center justify-end gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                  {isJobAlert && (
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] transition shadow"
                    >
                      <Eye size={12} />
                      Visualizar Vaga
                    </button>
                  )}

                  {!notif.isRead && !isJobAlert && (
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 font-semibold text-[10px] transition"
                    >
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      Lida
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition"
                    title="Excluir notificação"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </CardGlass>
            );
          })}
        </div>
      )}
    </div>
  );
}
