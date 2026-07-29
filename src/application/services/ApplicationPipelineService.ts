import type { Application } from '../../domain/models/types';

export type PipelineColumnId = 
  | 'found' 
  | 'saved' 
  | 'applied' 
  | 'hr' 
  | 'interview' 
  | 'offer' 
  | 'hired'
  | 'rejected';

export interface PipelineColumn {
  id: PipelineColumnId;
  title: string;
  apps: Application[];
  color: string;
  defaultStatus: Application['status'];
  baseStageScore: number;
}

export class ApplicationPipelineService {
  static getCleanStatus(statusStr?: string): PipelineColumnId {
    const status = String(statusStr || 'found').toLowerCase();
    if (status === 'found' || status.includes('encontrad') || status.includes('ajustar')) return 'found';
    if (status === 'saved' || status.includes('salv') || status.includes('interesse') || status.includes('prioridade')) return 'saved';
    if (status === 'applied' || status.includes('aplicad') || status.includes('candidatei') || status.includes('candidatar')) return 'applied';
    if (status === 'hr' || status.includes('rh') || status.includes('recrutador') || status.includes('retorno')) return 'hr';
    if (status === 'interview' || status.includes('gestor') || status.includes('case') || status.includes('cultural')) return 'interview';
    if (status === 'offer' || status.includes('oferta')) return 'offer';
    if (status === 'hired' || status.includes('contratad') || status.includes('aceita')) return 'hired';
    if (status === 'rejected' || status.includes('rejeitad') || status.includes('recusad') || status.includes('fora') || status.includes('arquiv')) return 'rejected';
    return 'found';
  }

  static getColumnMap(apps: Application[]): Record<PipelineColumnId, PipelineColumn> {
    const columns: Record<PipelineColumnId, PipelineColumn> = {
      found: {
        id: 'found',
        title: '🔎 Encontradas',
        apps: [],
        color: 'border-slate-800 bg-slate-900/10',
        defaultStatus: 'found' as any,
        baseStageScore: 30
      },
      saved: {
        id: 'saved',
        title: '⭐ Salvas',
        apps: [],
        color: 'border-blue-500/20 bg-blue-500/5',
        defaultStatus: 'saved' as any,
        baseStageScore: 45
      },
      applied: {
        id: 'applied',
        title: '📨 Aplicadas',
        apps: [],
        color: 'border-cyan-500/20 bg-cyan-500/5',
        defaultStatus: 'applied' as any,
        baseStageScore: 60
      },
      hr: {
        id: 'hr',
        title: '👥 Entrevista RH',
        apps: [],
        color: 'border-purple-500/20 bg-purple-500/5',
        defaultStatus: 'hr' as any,
        baseStageScore: 75
      },
      interview: {
        id: 'interview',
        title: '🎯 Entrevista Gestor',
        apps: [],
        color: 'border-amber-500/20 bg-amber-500/5',
        defaultStatus: 'interview' as any,
        baseStageScore: 85
      },
      offer: {
        id: 'offer',
        title: '🏆 Oferta',
        apps: [],
        color: 'border-pink-500/20 bg-pink-500/5',
        defaultStatus: 'offer' as any,
        baseStageScore: 95
      },
      hired: {
        id: 'hired',
        title: '✅ Contratado',
        apps: [],
        color: 'border-emerald-500/25 bg-emerald-500/5',
        defaultStatus: 'hired' as any,
        baseStageScore: 100
      },
      rejected: {
        id: 'rejected',
        title: '❌ Arquivadas / Rejeitadas',
        apps: [],
        color: 'border-red-500/20 bg-red-500/5',
        defaultStatus: 'rejected' as any,
        baseStageScore: 0
      }
    };

    apps.forEach(app => {
      const colId = ApplicationPipelineService.getCleanStatus(app.status);
      columns[colId].apps.push(app);
    });

    return columns;
  }
}
