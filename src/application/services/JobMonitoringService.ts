import { localDB } from '../../infrastructure/storage/localDatabase';
import type { Notification } from '../../domain/models/types';

export class JobMonitoringService {
  /**
   * Simula rotina diária de verificação e dispara alertas automáticos
   */
  static runDailyVerification(userId: string): Notification[] {
    const list: Notification[] = [
      {
        id: `notif-1-${Date.now()}`,
        userId,
        title: 'Vaga Crítica Encontrada (96% Fit)',
        message: 'A empresa Pipefy abriu uma nova oportunidade de CSM Manager compatível com suas pretensões.',
        isRead: false,
        type: 'job_alert',
        createdAt: new Date().toISOString()
      },
      {
        id: `notif-2-${Date.now()}`,
        userId,
        title: 'Alerta de Inatividade',
        message: 'Você está há 7 dias sem registrar novas candidaturas na plataforma. Dê uma olhada nas vagas recomendadas de hoje!',
        isRead: false,
        type: 'inactivity',
        createdAt: new Date().toISOString()
      }
    ];

    list.forEach(n => localDB.saveNotification(n));
    return list;
  }
}
export const jobMonitoringService = new JobMonitoringService();
